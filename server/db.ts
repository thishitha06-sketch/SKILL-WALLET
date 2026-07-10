/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import sqlite3Package from "sqlite3";
import { LoggerService } from "./logger.js";

const sqlite3 = sqlite3Package.verbose();

const __filename = typeof import.meta?.url === "string" ? fileURLToPath(import.meta.url) : "";
const __dirname = __filename ? path.dirname(__filename) : "";

const TAG = "DatabaseService";

const isServerless = process.env.VERCEL === "1" || !!process.env.VERCEL;
let DB_FILE = "networking_assistant.db";

if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.startsWith("sqlite://")) {
    DB_FILE = process.env.DATABASE_URL.substring(9);
  } else {
    DB_FILE = process.env.DATABASE_URL;
  }
} else if (isServerless) {
  DB_FILE = path.join(os.tmpdir(), "networking_assistant.db");
}

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

export class DatabaseService {
  private static db: sqlite3Package.Database | null = null;
  private static initPromise: Promise<void> | null = null;

  static init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      LoggerService.info(TAG, `Initializing SQLite database at: ${DB_FILE}`);
      this.db = new sqlite3.Database(DB_FILE, async (err) => {
        if (err) {
          LoggerService.error(TAG, `Failed to open SQLite database: ${err.message}`, err);
          return reject(err);
        }

        try {
          // Enable foreign keys
          await this.runQuery("PRAGMA foreign_keys = ON;");

          // Create tables
          await this.createTables();

          // Seed if empty
          await this.seedIfEmpty();

          LoggerService.info(TAG, "SQLite database initialized successfully.");
          resolve();
        } catch (initErr: any) {
          LoggerService.error(TAG, `SQLite init failed: ${initErr.message}`, initErr);
          reject(initErr);
        }
      });
    });

    return this.initPromise;
  }

  private static runQuery(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async execute(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
    if (!this.db) {
      await this.init();
    }

    const cleanSql = sql.replace(/\s+/g, " ").trim();
    LoggerService.debug(TAG, `EXECUTE SQLITE: ${cleanSql}`, params);

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.run(cleanSql, params, function (err) {
        if (err) {
          LoggerService.error(TAG, `SQLITE execute error for SQL [${cleanSql}]: ${err.message}`, err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  static async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      await this.init();
    }

    const cleanSql = sql.replace(/\s+/g, " ").trim();
    LoggerService.debug(TAG, `QUERY SQLITE: ${cleanSql}`, params);

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.all(cleanSql, params, (err, rows) => {
        if (err) {
          LoggerService.error(TAG, `SQLITE query error for SQL [${cleanSql}]: ${err.message}`, err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  static async get<T>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) {
      await this.init();
    }

    const cleanSql = sql.replace(/\s+/g, " ").trim();
    LoggerService.debug(TAG, `GET SQLITE: ${cleanSql}`, params);

    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.get(cleanSql, params, (err, row) => {
        if (err) {
          LoggerService.error(TAG, `SQLITE get error for SQL [${cleanSql}]: ${err.message}`, err);
          reject(err);
        } else {
          resolve(row ? (row as T) : null);
        }
      });
    });
  }

  private static async createTables(): Promise<void> {
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        company TEXT,
        profession TEXT,
        role TEXT,
        industry TEXT,
        interests TEXT,
        experience_level TEXT,
        career_goals TEXT,
        networking_goals TEXT,
        profile_image TEXT,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS Sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS ConversationHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_description TEXT NOT NULL,
        user_interests TEXT NOT NULL,
        extracted_topics TEXT NOT NULL,
        conversation_starters TEXT NOT NULL,
        event_type TEXT,
        industry TEXT,
        experience_level TEXT,
        career_goals TEXT,
        networking_goals TEXT,
        networking_score INTEGER,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS Feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        user_id INTEGER,
        suggestion TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        feedback_text TEXT,
        rating INTEGER NOT NULL,
        is_favorite INTEGER DEFAULT 0,
        is_poor INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS Favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        conversation_id INTEGER NOT NULL,
        suggestion_text TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS SavedSuggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        conversation_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS UserPreferences (
        user_id INTEGER PRIMARY KEY,
        theme TEXT NOT NULL,
        notifications_enabled INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS Analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }

  private static async seedIfEmpty(): Promise<void> {
    try {
      const userCountRow = await this.get<{ count: number }>("SELECT COUNT(*) as count FROM Users");
      if (userCountRow && userCountRow.count > 0) {
        LoggerService.info(TAG, "Database already has users. Skipping seeding.");
        return;
      }

      LoggerService.info(TAG, "SQLite database is empty. Attempting to seed from networking_assistant.json...");

      // Locate original json file
      const pathsToTry = [
        path.join(process.cwd(), "networking_assistant.json"),
        path.join(__dirname, "..", "networking_assistant.json"),
        path.join(__dirname, "../..", "networking_assistant.json"),
        "networking_assistant.json"
      ];

      let jsonPath = "";
      for (const p of pathsToTry) {
        if (p && fs.existsSync(p)) {
          jsonPath = p;
          break;
        }
      }

      if (jsonPath) {
        const fileContent = fs.readFileSync(jsonPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        LoggerService.info(TAG, `Found seed database at ${jsonPath}. Seeding records...`);

        // Seed Users
        if (Array.isArray(parsed.Users)) {
          for (const u of parsed.Users) {
            await this.execute(`
              INSERT INTO Users (id, name, email, password, company, profession, role, industry, interests, experience_level, career_goals, networking_goals, profile_image, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              u.id, u.name, u.email, u.password, u.company || null, u.profession || null,
              u.role || null, u.industry || null, u.interests || null, u.experience_level || null,
              u.career_goals || null, u.networking_goals || null, u.profile_image || null, u.created_at
            ]);
          }
          LoggerService.info(TAG, `Seeded ${parsed.Users.length} Users.`);
        }

        // Seed Sessions
        if (Array.isArray(parsed.Sessions)) {
          for (const s of parsed.Sessions) {
            await this.execute(`
              INSERT INTO Sessions (token, user_id, expires_at, created_at)
              VALUES (?, ?, ?, ?)
            `, [s.token, s.user_id, s.expires_at, s.created_at]);
          }
        }

        // Seed ConversationHistory
        if (Array.isArray(parsed.ConversationHistory)) {
          for (const h of parsed.ConversationHistory) {
            await this.execute(`
              INSERT INTO ConversationHistory (id, user_id, event_description, user_interests, extracted_topics, conversation_starters, event_type, industry, experience_level, career_goals, networking_goals, networking_score, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              h.id, h.user_id, h.event_description, h.user_interests, h.extracted_topics, h.conversation_starters,
              h.event_type || null, h.industry || null, h.experience_level || null, h.career_goals || null, h.networking_goals || null,
              h.networking_score || null, h.created_at
            ]);
          }
          LoggerService.info(TAG, `Seeded ${parsed.ConversationHistory.length} Conversation History rows.`);
        }

        // Seed Feedback
        if (Array.isArray(parsed.Feedback)) {
          for (const f of parsed.Feedback) {
            await this.execute(`
              INSERT INTO Feedback (id, conversation_id, user_id, suggestion, feedback_type, feedback_text, rating, is_favorite, is_poor, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              f.id, f.conversation_id, f.user_id, f.suggestion, f.feedback_type, f.feedback_text || null,
              f.rating, f.is_favorite || 0, f.is_poor || 0, f.created_at
            ]);
          }
        }

        // Seed Favorites
        if (Array.isArray(parsed.Favorites)) {
          for (const f of parsed.Favorites) {
            await this.execute(`
              INSERT INTO Favorites (id, user_id, conversation_id, suggestion_text, category, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [f.id, f.user_id, f.conversation_id, f.suggestion_text, f.category, f.created_at]);
          }
        }

        // Seed SavedSuggestions
        if (Array.isArray(parsed.SavedSuggestions)) {
          for (const s of parsed.SavedSuggestions) {
            await this.execute(`
              INSERT INTO SavedSuggestions (id, user_id, conversation_id, category, title, content, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [s.id, s.user_id, s.conversation_id, s.category, s.title, s.content, s.created_at]);
          }
        }

        // Seed UserPreferences
        if (Array.isArray(parsed.UserPreferences)) {
          for (const p of parsed.UserPreferences) {
            await this.execute(`
              INSERT OR REPLACE INTO UserPreferences (user_id, theme, notifications_enabled, created_at)
              VALUES (?, ?, ?, ?)
            `, [p.user_id, p.theme, p.notifications_enabled, p.created_at]);
          }
        }

        // Seed Analytics
        if (Array.isArray(parsed.Analytics)) {
          for (const a of parsed.Analytics) {
            await this.execute(`
              INSERT INTO Analytics (id, user_id, event_type, metadata, created_at)
              VALUES (?, ?, ?, ?, ?)
            `, [a.id, a.user_id, a.event_type, a.metadata, a.created_at]);
          }
        }
      } else {
        // Fallback default demo user if JSON file doesn't exist either
        LoggerService.info(TAG, "No JSON database found. Seeding default fallback user.");
        await this.execute(`
          INSERT INTO Users (id, name, email, password, company, profession, role, industry, interests, experience_level, career_goals, networking_goals, profile_image, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          1,
          "Demo Professional",
          "demo@example.com",
          "$2a$10$5FrBo5PVJUHHAoWuxivPNu1pCofiu/6zTYIXcdh4Kd8AvsQoNsySO", //bcrypt hash for "password"
          "Innovate AI Corp",
          "AI Lead Solutions Architect",
          "Professional",
          "Artificial Intelligence",
          "Generative AI, SaaS scaling, Angel investing, Tech strategy",
          "Senior",
          "Partner with early stage startups, expand enterprise SaaS knowledge, discover breakthrough tech",
          "Meet ambitious software engineers, find potential technical co-founders, and connect with angel syndicates",
          null,
          new Date().toISOString()
        ]);
      }
    } catch (seedErr) {
      LoggerService.error(TAG, "Failed to seed SQLite database", seedErr);
    }
  }
}
