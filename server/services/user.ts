/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { DatabaseService, UserRow, SessionRow, FavoriteRow, SavedSuggestionRow, UserPreferenceRow, AnalyticsRow } from "../db.js";
import { LoggerService } from "../logger.js";

const TAG = "UserService";

export class UserService {
  /**
   * Register a new user
   */
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    profession?: string;
    role?: string;
    industry?: string;
    interests?: string;
    experience_level?: string;
    career_goals?: string;
    networking_goals?: string;
  }): Promise<UserRow> {
    LoggerService.info(TAG, `Registering user with email: ${userData.email}`);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const timestamp = new Date().toISOString();

    const sql = `
      INSERT INTO Users (
        name, email, password, company, profession, role, industry, interests, 
        experience_level, career_goals, networking_goals, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await DatabaseService.execute(sql, [
        userData.name,
        userData.email.toLowerCase().trim(),
        hashedPassword,
        userData.company || null,
        userData.profession || null,
        userData.role || null,
        userData.industry || null,
        userData.interests || null,
        userData.experience_level || null,
        userData.career_goals || null,
        userData.networking_goals || null,
        timestamp,
      ]);

      // Initialize preferences
      await DatabaseService.execute(`
        INSERT INTO UserPreferences (user_id, theme, notifications_enabled, created_at)
        VALUES (?, ?, ?, ?)
      `, [result.id, "dark", 1, timestamp]);

      // Track analytics event
      await this.trackEvent(result.id, "user_registered", { email: userData.email });

      const user = await DatabaseService.get<UserRow>("SELECT * FROM Users WHERE id = ?", [result.id]);
      if (!user) throw new Error("User registration failed to verify.");
      return user;
    } catch (err: any) {
      LoggerService.error(TAG, `Failed to register user: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * Authenticate a user and create a session
   */
  static async login(email: string, password: string): Promise<{ user: UserRow; token: string }> {
    const cleanEmail = email.toLowerCase().trim();
    LoggerService.info(TAG, `User login attempt: ${cleanEmail}`);

    const user = await DatabaseService.get<UserRow>("SELECT * FROM Users WHERE email = ?", [cleanEmail]);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    // Generate Session Token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    const timestamp = new Date().toISOString();

    await DatabaseService.execute(`
      INSERT INTO Sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `, [token, user.id, expiresAt, timestamp]);

    await this.trackEvent(user.id, "user_logged_in", { ip: "auth" });

    return { user, token };
  }

  /**
   * Log out and delete session
   */
  static async logout(token: string): Promise<boolean> {
    const session = await DatabaseService.get<SessionRow>("SELECT * FROM Sessions WHERE token = ?", [token]);
    if (!session) return false;

    await DatabaseService.execute("DELETE FROM Sessions WHERE token = ?", [token]);
    await this.trackEvent(session.user_id, "user_logged_out", {});
    return true;
  }

  /**
   * Validate session token and return user row
   */
  static async authenticateSession(token: string): Promise<UserRow | null> {
    if (!token) return null;
    try {
      const session = await DatabaseService.get<SessionRow>("SELECT * FROM Sessions WHERE token = ?", [token]);
      if (!session) return null;

      // Check expiry
      if (new Date(session.expires_at).getTime() < Date.now()) {
        await DatabaseService.execute("DELETE FROM Sessions WHERE token = ?", [token]);
        return null;
      }

      return await DatabaseService.get<UserRow>("SELECT * FROM Users WHERE id = ?", [session.user_id]);
    } catch (err) {
      LoggerService.error(TAG, "Failed to authenticate session", err);
      return null;
    }
  }

  /**
   * Update User Profile Details
   */
  static async updateProfile(userId: number, profileData: Partial<UserRow>): Promise<UserRow> {
    LoggerService.info(TAG, `Updating profile for user ID: ${userId}`);
    
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      "name", "company", "profession", "role", "industry", "interests",
      "experience_level", "career_goals", "networking_goals", "profile_image"
    ];

    for (const key of allowedFields) {
      if (profileData[key as keyof UserRow] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(profileData[key as keyof UserRow]);
      }
    }

    if (fields.length === 0) {
      const u = await DatabaseService.get<UserRow>("SELECT * FROM Users WHERE id = ?", [userId]);
      if (!u) throw new Error("User not found");
      return u;
    }

    params.push(userId);
    const sql = `UPDATE Users SET ${fields.join(", ")} WHERE id = ?`;

    try {
      await DatabaseService.execute(sql, params);
      await this.trackEvent(userId, "profile_updated", {});
      const user = await DatabaseService.get<UserRow>("SELECT * FROM Users WHERE id = ?", [userId]);
      if (!user) throw new Error("User profile update failed verification.");
      return user;
    } catch (err: any) {
      LoggerService.error(TAG, `Failed to update user profile: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * Track an analytics event
   */
  static async trackEvent(userId: number | null, eventType: string, metadata: any): Promise<void> {
    const timestamp = new Date().toISOString();
    try {
      await DatabaseService.execute(`
        INSERT INTO Analytics (user_id, event_type, metadata, created_at)
        VALUES (?, ?, ?, ?)
      `, [userId, eventType, JSON.stringify(metadata), timestamp]);
    } catch (err) {
      LoggerService.error(TAG, "Analytics tracking failed", err);
    }
  }

  /**
   * Manage User Preferences
   */
  static async getPreferences(userId: number): Promise<UserPreferenceRow> {
    const prefs = await DatabaseService.get<UserPreferenceRow>("SELECT * FROM UserPreferences WHERE user_id = ?", [userId]);
    if (!prefs) {
      const timestamp = new Date().toISOString();
      await DatabaseService.execute(`
        INSERT INTO UserPreferences (user_id, theme, notifications_enabled, created_at)
        VALUES (?, ?, ?, ?)
      `, [userId, "dark", 1, timestamp]);
      return { user_id: userId, theme: "dark", notifications_enabled: 1, created_at: timestamp };
    }
    return prefs;
  }

  static async updatePreferences(userId: number, theme: string, notificationsEnabled: boolean): Promise<UserPreferenceRow> {
    await DatabaseService.execute(`
      UPDATE UserPreferences SET theme = ?, notifications_enabled = ? WHERE user_id = ?
    `, [theme, notificationsEnabled ? 1 : 0, userId]);
    return this.getPreferences(userId);
  }

  /**
   * Favorites Management
   */
  static async addFavorite(userId: number, conversationId: number, suggestionText: string, category: string): Promise<FavoriteRow> {
    const timestamp = new Date().toISOString();
    const result = await DatabaseService.execute(`
      INSERT INTO Favorites (user_id, conversation_id, suggestion_text, category, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, conversationId, suggestionText, category, timestamp]);
    
    await this.trackEvent(userId, "added_favorite", { category });
    
    return {
      id: result.id,
      user_id: userId,
      conversation_id: conversationId,
      suggestion_text: suggestionText,
      category,
      created_at: timestamp
    };
  }

  static async removeFavorite(userId: number, favoriteId: number): Promise<boolean> {
    const result = await DatabaseService.execute(`
      DELETE FROM Favorites WHERE id = ? AND user_id = ?
    `, [favoriteId, userId]);
    return result.changes > 0;
  }

  static async getFavorites(userId: number): Promise<FavoriteRow[]> {
    return DatabaseService.query<FavoriteRow>("SELECT * FROM Favorites WHERE user_id = ? ORDER BY id DESC", [userId]);
  }

  /**
   * Saved Suggestions Management
   */
  static async saveSuggestion(userId: number, conversationId: number, category: string, title: string, content: string): Promise<SavedSuggestionRow> {
    const timestamp = new Date().toISOString();
    const result = await DatabaseService.execute(`
      INSERT INTO SavedSuggestions (user_id, conversation_id, category, title, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, conversationId, category, title, content, timestamp]);

    await this.trackEvent(userId, "saved_suggestion", { category, title });

    return {
      id: result.id,
      user_id: userId,
      conversation_id: conversationId,
      category,
      title,
      content,
      created_at: timestamp
    };
  }

  static async getSavedSuggestions(userId: number): Promise<SavedSuggestionRow[]> {
    return DatabaseService.query<SavedSuggestionRow>("SELECT * FROM SavedSuggestions WHERE user_id = ? ORDER BY id DESC", [userId]);
  }

  static async removeSavedSuggestion(userId: number, id: number): Promise<boolean> {
    const result = await DatabaseService.execute(`
      DELETE FROM SavedSuggestions WHERE id = ? AND user_id = ?
    `, [id, userId]);
    return result.changes > 0;
  }
}
