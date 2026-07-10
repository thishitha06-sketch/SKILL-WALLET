/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import { LoggerService } from "./logger.js";

const TAG = "DatabaseService";
const DB_FILE = "networking_assistant.json";

export interface ConversationHistoryRow {
  id: number;
  user_id: number | null;
  event_description: string;
  user_interests: string;
  extracted_topics: string; // JSON string
  conversation_starters: string; // JSON string containing all rich categories
  event_type: string | null;
  industry: string | null;
  experience_level: string | null;
  career_goals: string | null;
  networking_goals: string | null;
  networking_score: number | null;
  created_at: string;
}

export interface FeedbackRow {
  id: number;
  conversation_id: number | null;
  user_id: number | null;
  suggestion: string;
  feedback_type: "like" | "dislike";
  feedback_text: string | null;
  rating: number; // 1-5 rating
  is_favorite: number; // 0 or 1
  is_poor: number; // 0 or 1 (reported poor)
  created_at: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string; // bcrypt hash
  company: string | null;
  profession: string | null;
  role: string | null;
  industry: string | null;
  interests: string | null;
  experience_level: string | null;
  career_goals: string | null;
  networking_goals: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface SessionRow {
  token: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface FavoriteRow {
  id: number;
  user_id: number;
  conversation_id: number;
  suggestion_text: string;
  category: string;
  created_at: string;
}

export interface SavedSuggestionRow {
  id: number;
  user_id: number;
  conversation_id: number;
  category: string;
  title: string;
  content: string;
  created_at: string;
}

export interface UserPreferenceRow {
  user_id: number;
  theme: string;
  notifications_enabled: number;
  created_at: string;
}

export interface AnalyticsRow {
  id: number;
  user_id: number | null;
  event_type: string;
  metadata: string | null; // JSON string
  created_at: string;
}

interface DatabaseData {
  Users: UserRow[];
  Sessions: SessionRow[];
  ConversationHistory: ConversationHistoryRow[];
  Feedback: FeedbackRow[];
  Favorites: FavoriteRow[];
  SavedSuggestions: SavedSuggestionRow[];
  UserPreferences: UserPreferenceRow[];
  Analytics: AnalyticsRow[];
}

export class DatabaseService {
  private static data: DatabaseData = {
    Users: [],
    Sessions: [],
    ConversationHistory: [],
    Feedback: [],
    Favorites: [],
    SavedSuggestions: [],
    UserPreferences: [],
    Analytics: [],
  };

  private static loaded = false;

  static async init(): Promise<void> {
    if (this.loaded) return;

    LoggerService.info(TAG, `Initializing simulated JSON database at: ${DB_FILE}`);

    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.data = {
          Users: parsed.Users || [],
          Sessions: parsed.Sessions || [],
          ConversationHistory: parsed.ConversationHistory || [],
          Feedback: parsed.Feedback || [],
          Favorites: parsed.Favorites || [],
          SavedSuggestions: parsed.SavedSuggestions || [],
          UserPreferences: parsed.UserPreferences || [],
          Analytics: parsed.Analytics || [],
        };
        LoggerService.info(TAG, `Loaded JSON database with ${this.data.Users.length} users, ${this.data.ConversationHistory.length} histories`);
      } else {
        this.save();
        LoggerService.info(TAG, `Created fresh JSON database at ${DB_FILE}`);
      }
    } catch (err) {
      LoggerService.error(TAG, "Failed to load JSON database, starting with empty tables", err);
    }

    this.loaded = true;
  }

  private static save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      LoggerService.error(TAG, "Failed to save JSON database to disk", err);
    }
  }

  private static getTable(tableName: string): any[] {
    const name = tableName.trim();
    if (name.toLowerCase() === "users") return this.data.Users;
    if (name.toLowerCase() === "sessions") return this.data.Sessions;
    if (name.toLowerCase() === "conversationhistory") return this.data.ConversationHistory;
    if (name.toLowerCase() === "feedback") return this.data.Feedback;
    if (name.toLowerCase() === "favorites") return this.data.Favorites;
    if (name.toLowerCase() === "savedsuggestions") return this.data.SavedSuggestions;
    if (name.toLowerCase() === "userpreferences") return this.data.UserPreferences;
    if (name.toLowerCase() === "analytics") return this.data.Analytics;
    
    // Fallback/dynamically create table if unrecognized
    const key = Object.keys(this.data).find(k => k.toLowerCase() === name.toLowerCase());
    if (key) {
      return (this.data as any)[key];
    }
    
    // Add dynamically
    const newKey = name.charAt(0).toUpperCase() + name.slice(1);
    (this.data as any)[newKey] = [];
    return (this.data as any)[newKey];
  }

  static async execute(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
    if (!this.loaded) {
      await this.init();
    }

    const cleanSql = sql.replace(/\s+/g, " ").trim();
    LoggerService.debug(TAG, `EXECUTE SIM: ${cleanSql}`, params);

    // 1. INSERT INTO
    if (cleanSql.toUpperCase().startsWith("INSERT INTO")) {
      const match = cleanSql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (!match) {
        throw new Error(`Unsupported INSERT syntax in simulator: ${cleanSql}`);
      }

      const tableName = match[1];
      const cols = match[2].split(",").map(c => c.trim());
      const table = this.getTable(tableName);

      // Setup ID or utilize provided token/user_id
      let newId = 1;
      const isSessionTable = tableName.toLowerCase() === "sessions";
      const isPreferenceTable = tableName.toLowerCase() === "userpreferences";

      if (!isSessionTable && !isPreferenceTable) {
        newId = table.length > 0 ? Math.max(...table.map((r: any) => r.id || 0)) + 1 : 1;
      }

      const newRow: any = {};
      if (!isSessionTable && !isPreferenceTable) {
        newRow.id = newId;
      }

      cols.forEach((col, idx) => {
        const val = params[idx];
        newRow[col] = val !== undefined ? val : null;
      });

      table.push(newRow);
      this.save();

      return { id: isSessionTable || isPreferenceTable ? 1 : newId, changes: 1 };
    }

    // 2. DELETE FROM
    if (cleanSql.toUpperCase().startsWith("DELETE FROM")) {
      const match = cleanSql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
      if (!match) {
        throw new Error(`Unsupported DELETE syntax in simulator: ${cleanSql}`);
      }

      const tableName = match[1];
      const whereClause = match[2];
      const table = this.getTable(tableName);
      const originalLength = table.length;

      if (!whereClause) {
        // Clear all
        table.length = 0;
        this.save();
        return { id: 0, changes: originalLength };
      }

      // Handle simple where clauses
      let filterFn = (row: any) => true;
      if (whereClause.replace(/\s+/g, "").toLowerCase() === "token=?") {
        filterFn = (row: any) => row.token !== params[0];
      } else if (whereClause.replace(/\s+/g, "").toLowerCase() === "id=?anduser_id=?") {
        filterFn = (row: any) => !(row.id === Number(params[0]) && row.user_id === Number(params[1]));
      } else if (whereClause.replace(/\s+/g, "").toLowerCase() === "id=?") {
        filterFn = (row: any) => row.id !== Number(params[0]);
      } else if (whereClause.replace(/\s+/g, "").toLowerCase() === "id=?anduser_idisnull") {
        filterFn = (row: any) => !(row.id === Number(params[0]) && row.user_id === null);
      }

      const filteredTable = table.filter(filterFn);
      const changes = originalLength - filteredTable.length;

      // In-place update
      table.length = 0;
      filteredTable.forEach(r => table.push(r));

      // Cascade delete manually for ConversationHistory -> Feedback, Favorites, SavedSuggestions
      if (tableName.toLowerCase() === "conversationhistory" && changes > 0) {
        const deletedId = Number(params[0]);
        this.data.Feedback = this.data.Feedback.filter(f => f.conversation_id !== deletedId);
        this.data.Favorites = this.data.Favorites.filter(f => f.conversation_id !== deletedId);
        this.data.SavedSuggestions = this.data.SavedSuggestions.filter(f => f.conversation_id !== deletedId);
      }

      this.save();
      return { id: 0, changes };
    }

    // 3. UPDATE
    if (cleanSql.toUpperCase().startsWith("UPDATE")) {
      const match = cleanSql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
      if (!match) {
        throw new Error(`Unsupported UPDATE syntax in simulator: ${cleanSql}`);
      }

      const tableName = match[1];
      const setClause = match[2];
      const whereClause = match[3];
      const table = this.getTable(tableName);

      // Find targets
      let targetRow: any = null;
      if (whereClause.replace(/\s+/g, "").toLowerCase() === "id=?") {
        const id = Number(params[params.length - 1]);
        targetRow = table.find((r: any) => r.id === id);
      } else if (whereClause.replace(/\s+/g, "").toLowerCase() === "user_id=?") {
        const userId = Number(params[params.length - 1]);
        targetRow = table.find((r: any) => r.user_id === userId);
      }

      if (targetRow) {
        // Parse setter fields
        const fields = setClause.split(",").map(f => f.trim().split("=")[0].trim());
        fields.forEach((field, index) => {
          targetRow[field] = params[index];
        });
        this.save();
        return { id: targetRow.id || 1, changes: 1 };
      }

      return { id: 0, changes: 0 };
    }

    // ALTER or other statements (migrations, etc.)
    LoggerService.info(TAG, `Ignored/Executed command in simulator: ${cleanSql}`);
    return { id: 0, changes: 0 };
  }

  static async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.loaded) {
      await this.init();
    }

    const cleanSql = sql.replace(/\s+/g, " ").trim();
    LoggerService.debug(TAG, `QUERY SIM: ${cleanSql}`, params);

    // 1. PRAGMA
    if (cleanSql.toUpperCase().startsWith("PRAGMA TABLE_INFO")) {
      const match = cleanSql.match(/PRAGMA\s+table_info\((\w+)\)/i);
      const tableName = match ? match[1].toLowerCase() : "";
      if (tableName === "conversationhistory") {
        return [
          { name: "id" }, { name: "user_id" }, { name: "event_description" }, { name: "user_interests" },
          { name: "extracted_topics" }, { name: "conversation_starters" }, { name: "event_type" },
          { name: "industry" }, { name: "experience_level" }, { name: "career_goals" },
          { name: "networking_goals" }, { name: "networking_score" }, { name: "created_at" }
        ] as unknown as T[];
      }
      if (tableName === "feedback") {
        return [
          { name: "id" }, { name: "conversation_id" }, { name: "user_id" }, { name: "suggestion" },
          { name: "feedback_type" }, { name: "feedback_text" }, { name: "rating" },
          { name: "is_favorite" }, { name: "is_poor" }, { name: "created_at" }
        ] as unknown as T[];
      }
      return [] as T[];
    }

    // 2. SELECT
    if (cleanSql.toUpperCase().startsWith("SELECT")) {
      // Is it a SELECT COUNT(*) or aggregation query?
      if (cleanSql.toUpperCase().includes("COUNT(*)")) {
        // Feedback stats
        if (cleanSql.toUpperCase().includes("FEEDBACK") && cleanSql.toUpperCase().includes("AVG(RATING)")) {
          const userId = params[0];
          const matches = this.data.Feedback.filter(f => f.user_id === userId);
          const total = matches.length;
          const likes = matches.filter(f => f.feedback_type === "like").length;
          const dislikes = matches.filter(f => f.feedback_type === "dislike").length;
          const sumRatings = matches.reduce((acc, curr) => acc + (curr.rating || 0), 0);
          const avg_rating = total > 0 ? sumRatings / total : 0;
          return [{ total, likes, dislikes, avg_rating }] as unknown as T[];
        }

        // Conversation history count
        if (cleanSql.toUpperCase().includes("CONVERSATIONHISTORY")) {
          const userId = params[0];
          const count = this.data.ConversationHistory.filter(h => h.user_id === userId).length;
          return [{ total: count }] as unknown as T[];
        }
      }

      // Standard queries
      const fromMatch = cleanSql.match(/FROM\s+(\w+)/i);
      if (!fromMatch) {
        throw new Error(`Cannot parse table in SELECT query: ${cleanSql}`);
      }

      const tableName = fromMatch[1];
      let results = [...this.getTable(tableName)];

      // Evaluate WHERE clauses simply
      const whereMatch = cleanSql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1].replace(/\s+/g, " ").trim();
        const whereLower = whereClause.toLowerCase();

        if (whereLower === "email = ?") {
          results = results.filter((r: any) => r.email === params[0].toLowerCase().trim());
        } else if (whereLower === "id = ?") {
          results = results.filter((r: any) => r.id === Number(params[0]));
        } else if (whereLower === "token = ?") {
          results = results.filter((r: any) => r.token === params[0]);
        } else if (whereLower === "user_id = ?") {
          results = results.filter((r: any) => r.user_id === Number(params[0]));
        } else if (whereLower === "user_id is null") {
          results = results.filter((r: any) => r.user_id === null);
        } else if (whereLower === "user_id = ? and feedback_type = 'dislike'") {
          results = results.filter((r: any) => r.user_id === Number(params[0]) && r.feedback_type === "dislike");
        } else if (whereLower === "user_id = ? and networking_score is not null") {
          results = results.filter((r: any) => r.user_id === Number(params[0]) && r.networking_score !== null);
        }
      }

      // Evaluate ORDER BY
      if (cleanSql.toUpperCase().includes("ORDER BY")) {
        const orderMatch = cleanSql.match(/ORDER\s+BY\s+(\w+|\w+\(\w+\))\s+(ASC|DESC)/i);
        if (orderMatch) {
          const field = orderMatch[1].toLowerCase();
          const desc = orderMatch[2].toUpperCase() === "DESC";

          results.sort((a: any, b: any) => {
            let valA = a.id;
            let valB = b.id;

            if (field.includes("created_at")) {
              valA = new Date(a.created_at).getTime();
              valB = new Date(b.created_at).getTime();
            }

            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            return 0;
          });
        } else if (cleanSql.toUpperCase().includes("ORDER BY ID DESC")) {
          results.sort((a: any, b: any) => b.id - a.id);
        }
      }

      // Evaluate LIMIT
      const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = Number(limitMatch[1]);
        results = results.slice(0, limit);
      }

      // Handle custom projection columns
      if (cleanSql.toUpperCase().startsWith("SELECT ID FROM")) {
        return results.map((r: any) => ({ id: r.id })) as unknown as T[];
      }
      if (cleanSql.toUpperCase().startsWith("SELECT SUGGESTION FROM")) {
        return results.map((r: any) => ({ suggestion: r.suggestion })) as unknown as T[];
      }
      if (cleanSql.toUpperCase().startsWith("SELECT EXTRACTED_TOPICS FROM")) {
        return results.map((r: any) => ({ extracted_topics: r.extracted_topics })) as unknown as T[];
      }
      if (cleanSql.toUpperCase().startsWith("SELECT CREATED_AT FROM")) {
        return results.map((r: any) => ({ created_at: r.created_at })) as unknown as T[];
      }
      if (cleanSql.toUpperCase().startsWith("SELECT NETWORKING_SCORE FROM")) {
        return results.map((r: any) => ({ networking_score: r.networking_score })) as unknown as T[];
      }

      return results as unknown as T[];
    }

    return [] as T[];
  }

  static async get<T>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    if (results.length > 0) {
      return results[0];
    }
    return null;
  }
}
