/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseService, ConversationHistoryRow } from "../db.js";
import { LoggerService } from "../logger.js";
import { RichSuggestions } from "./conversation.js";

const TAG = "HistoryService";

export interface HistoryItem {
  id: number;
  userId: number | null;
  eventDescription: string;
  interests: string;
  extractedTopics: string[];
  conversationStarters: RichSuggestions; // Full rich suggestions including categories
  eventType: string | null;
  industry: string | null;
  experienceLevel: string | null;
  careerGoals: string | null;
  networkingGoals: string | null;
  networkingScore: number | null;
  timestamp: string;
}

export class HistoryService {
  /**
   * Save a newly generated conversation flow to history
   */
  static async addEntry(
    userId: number | null,
    eventDescription: string,
    interests: string,
    extractedTopics: string[],
    conversationStarters: RichSuggestions,
    meta?: {
      eventType?: string;
      industry?: string;
      experienceLevel?: string;
      careerGoals?: string;
      networkingGoals?: string;
      networkingScore?: number;
    }
  ): Promise<HistoryItem> {
    LoggerService.info(TAG, `Adding new entry to history database for user ID: ${userId}`);
    
    const timestamp = new Date().toISOString();
    const topicsJson = JSON.stringify(extractedTopics);
    const startersJson = JSON.stringify(conversationStarters);

    const sql = `
      INSERT INTO ConversationHistory (
        user_id, event_description, user_interests, extracted_topics, conversation_starters, 
        event_type, industry, experience_level, career_goals, networking_goals, networking_score, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await DatabaseService.execute(sql, [
        userId,
        eventDescription,
        interests,
        topicsJson,
        startersJson,
        meta?.eventType || null,
        meta?.industry || null,
        meta?.experienceLevel || null,
        meta?.careerGoals || null,
        meta?.networkingGoals || null,
        meta?.networkingScore !== undefined ? meta.networkingScore : (conversationStarters.networking_score || null),
        timestamp,
      ]);

      LoggerService.info(TAG, `Successfully added history entry with ID: ${result.id}`);

      return {
        id: result.id,
        userId,
        eventDescription,
        interests,
        extractedTopics,
        conversationStarters,
        eventType: meta?.eventType || null,
        industry: meta?.industry || null,
        experienceLevel: meta?.experienceLevel || null,
        careerGoals: meta?.careerGoals || null,
        networkingGoals: meta?.networkingGoals || null,
        networkingScore: meta?.networkingScore !== undefined ? meta.networkingScore : (conversationStarters.networking_score || null),
        timestamp,
      };
    } catch (err) {
      LoggerService.error(TAG, "Failed to save entry to database history", err);
      throw err;
    }
  }

  /**
   * Fetch all saved conversations for a specific user, sorted newest first
   */
  static async getAll(userId: number | null): Promise<HistoryItem[]> {
    LoggerService.info(TAG, `Retrieving all conversation history records for user ID: ${userId}`);
    
    let sql = "";
    let params: any[] = [];

    if (userId === null) {
      // General or unassigned history
      sql = `
        SELECT * FROM ConversationHistory
        WHERE user_id IS NULL
        ORDER BY datetime(created_at) DESC
      `;
    } else {
      sql = `
        SELECT * FROM ConversationHistory
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
      `;
      params = [userId];
    }

    try {
      const rows = await DatabaseService.query<ConversationHistoryRow>(sql, params);
      return rows.map((row) => this.mapRowToItem(row));
    } catch (err) {
      LoggerService.error(TAG, "Failed to fetch conversation history", err);
      throw err;
    }
  }

  /**
   * Fetch recent conversation items with a limit
   */
  static async getRecent(userId: number | null, limit: number): Promise<HistoryItem[]> {
    LoggerService.info(TAG, `Retrieving recent ${limit} conversation records for user ID: ${userId}`);
    
    let sql = "";
    let params: any[] = [];

    if (userId === null) {
      sql = `
        SELECT * FROM ConversationHistory
        WHERE user_id IS NULL
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `;
      params = [limit];
    } else {
      sql = `
        SELECT * FROM ConversationHistory
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `;
      params = [userId, limit];
    }

    try {
      const rows = await DatabaseService.query<ConversationHistoryRow>(sql, params);
      return rows.map((row) => this.mapRowToItem(row));
    } catch (err) {
      LoggerService.error(TAG, "Failed to fetch recent history", err);
      throw err;
    }
  }

  /**
   * Delete a conversation from history
   */
  static async deleteEntry(userId: number | null, id: number): Promise<boolean> {
    LoggerService.info(TAG, `Deleting history entry with ID: ${id} for user ID: ${userId}`);
    
    let sql = "";
    let params: any[] = [];

    if (userId === null) {
      sql = `
        DELETE FROM ConversationHistory
        WHERE id = ? AND user_id IS NULL
      `;
      params = [id];
    } else {
      sql = `
        DELETE FROM ConversationHistory
        WHERE id = ? AND user_id = ?
      `;
      params = [id, userId];
    }

    try {
      const result = await DatabaseService.execute(sql, params);
      const success = result.changes > 0;
      LoggerService.info(TAG, `Delete entry ${id} complete. Success: ${success}`);
      return success;
    } catch (err) {
      LoggerService.error(TAG, `Failed to delete history entry with ID: ${id}`, err);
      throw err;
    }
  }

  /**
   * Map row to strongly typed item
   */
  static mapRowToItem(row: ConversationHistoryRow): HistoryItem {
    let extractedTopics: string[] = [];
    let conversationStarters: any = { networking_score: 75, categories: {} };

    try {
      extractedTopics = JSON.parse(row.extracted_topics);
    } catch (e) {
      LoggerService.error(TAG, `Failed to parse extracted_topics JSON for row ${row.id}`, e);
    }

    try {
      conversationStarters = JSON.parse(row.conversation_starters);
    } catch (e) {
      LoggerService.error(TAG, `Failed to parse conversation_starters JSON for row ${row.id}`, e);
    }

    return {
      id: row.id,
      userId: row.user_id,
      eventDescription: row.event_description,
      interests: row.user_interests,
      extractedTopics,
      conversationStarters,
      eventType: row.event_type,
      industry: row.industry,
      experienceLevel: row.experience_level,
      careerGoals: row.career_goals,
      networkingGoals: row.networking_goals,
      networkingScore: row.networking_score,
      timestamp: row.created_at,
    };
  }
}
