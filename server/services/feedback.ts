/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseService, FeedbackRow } from "../db.js";
import { LoggerService } from "../logger.js";

const TAG = "FeedbackService";

export interface FeedbackItem {
  id: number;
  conversationId: number | null;
  userId: number | null;
  suggestion: string;
  feedback: "like" | "dislike";
  feedbackText: string | null;
  rating: number;
  isFavorite: boolean;
  isPoor: boolean;
  timestamp: string;
}

export class FeedbackService {
  /**
   * Save user feedback (like/dislike/ratings/favorites) for a suggestion
   */
  static async addFeedback(
    userId: number | null,
    conversationId: number | null,
    suggestion: string,
    feedback: "like" | "dislike",
    options?: {
      feedbackText?: string | null;
      rating?: number;
      isFavorite?: boolean;
      isPoor?: boolean;
    }
  ): Promise<FeedbackItem> {
    LoggerService.info(TAG, `Adding feedback (${feedback}) for conversation ID: ${conversationId}, User: ${userId}`);

    if (feedback !== "like" && feedback !== "dislike") {
      throw new Error("Invalid feedback value. Must be 'like' or 'dislike'.");
    }

    const timestamp = new Date().toISOString();
    const ratingVal = options?.rating !== undefined ? options.rating : 0;
    const favVal = options?.isFavorite ? 1 : 0;
    const poorVal = options?.isPoor ? 1 : 0;
    const textVal = options?.feedbackText || null;

    const sql = `
      INSERT INTO Feedback (conversation_id, user_id, suggestion, feedback_type, feedback_text, rating, is_favorite, is_poor, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await DatabaseService.execute(sql, [
        conversationId,
        userId,
        suggestion,
        feedback,
        textVal,
        ratingVal,
        favVal,
        poorVal,
        timestamp,
      ]);

      LoggerService.info(TAG, `Successfully added feedback record with ID: ${result.id}`);

      return {
        id: result.id,
        conversationId,
        userId,
        suggestion,
        feedback,
        feedbackText: textVal,
        rating: ratingVal,
        isFavorite: !!favVal,
        isPoor: !!poorVal,
        timestamp,
      };
    } catch (err) {
      LoggerService.error(TAG, "Failed to submit feedback to database", err);
      throw err;
    }
  }

  /**
   * Fetch all feedback submissions
   */
  static async getAllFeedback(userId: number | null): Promise<FeedbackItem[]> {
    LoggerService.info(TAG, `Retrieving all feedback submissions for user: ${userId}`);

    let sql = "";
    let params: any[] = [];

    if (userId === null) {
      sql = `
        SELECT * FROM Feedback
        WHERE user_id IS NULL
        ORDER BY datetime(created_at) DESC
      `;
    } else {
      sql = `
        SELECT * FROM Feedback
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
      `;
      params = [userId];
    }

    try {
      const rows = await DatabaseService.query<FeedbackRow>(sql, params);
      return rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        userId: row.user_id,
        suggestion: row.suggestion,
        feedback: row.feedback_type,
        feedbackText: row.feedback_text,
        rating: row.rating || 0,
        isFavorite: row.is_favorite === 1,
        isPoor: row.is_poor === 1,
        timestamp: row.created_at,
      }));
    } catch (err) {
      LoggerService.error(TAG, "Failed to retrieve feedback list", err);
      throw err;
    }
  }
}
