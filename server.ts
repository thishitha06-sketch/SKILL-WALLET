/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Services
import { DatabaseService } from "./server/db.js";
import { LoggerService } from "./server/logger.js";
import { TopicService } from "./server/services/topic.js";
import { ConversationService } from "./server/services/conversation.js";
import { FactCheckService } from "./server/services/factcheck.js";
import { HistoryService } from "./server/services/history.js";
import { FeedbackService } from "./server/services/feedback.js";
import { UserService } from "./server/services/user.js";
import { GeminiService } from "./server/services/gemini.js";

// Load environment variables
dotenv.config();

const __filename = typeof import.meta?.url === "string" ? fileURLToPath(import.meta.url) : "";
const __dirname = __filename ? path.dirname(__filename) : "";

const TAG = "Server";
const PORT = 3000;

async function startServer() {
  // Initialize SQLite database
  try {
    await DatabaseService.init();
    
    // Seed default demo user if Users table is empty
    const existingUser = await DatabaseService.get("SELECT id FROM Users WHERE email = ?", ["demo@example.com"]);
    if (!existingUser) {
      LoggerService.info(TAG, "No default user found. Seeding default demo user account...");
      await UserService.register({
        name: "Demo Professional",
        email: "demo@example.com",
        password: "password123",
        company: "Innovate AI Corp",
        profession: "AI Lead Solutions Architect",
        role: "Professional",
        industry: "Artificial Intelligence",
        interests: "Generative AI, SaaS scaling, Angel investing, Tech strategy",
        experience_level: "Senior",
        career_goals: "Partner with early stage startups, expand enterprise SaaS knowledge, discover breakthrough tech",
        networking_goals: "Meet ambitious software engineers, find potential technical co-founders, and connect with angel syndicates"
      });
      LoggerService.info(TAG, "Default demo user account ('demo@example.com' / 'password123') seeded successfully.");
    }
  } catch (err: any) {
    LoggerService.error(TAG, "Database initialization or seeding failed: " + err.message, { stack: err.stack });
  }

  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logger Middleware
  app.use((req, res, next) => {
    LoggerService.info(TAG, `HTTP REQUEST: ${req.method} ${req.url}`, {
      ip: req.ip,
      body: req.method === "POST" && !req.url.includes("login") && !req.url.includes("register") ? req.body : undefined,
    });

    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      LoggerService.info(TAG, `HTTP RESPONSE: ${req.method} ${req.url} - Status ${res.statusCode} (${duration}ms)`);
    });

    next();
  });

  // Auth Helper Middleware
  async function getLoggedUser(req: express.Request): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace("Bearer ", "").trim();
    return await UserService.authenticateSession(token);
  }

  // REST API Endpoints

  /**
   * GET /health
   */
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      appName: process.env.APP_NAME || "Personalized Networking Assistant",
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  /**
   * POST /api/auth/register
   */
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, company, profession, role, industry, interests, experience_level, career_goals, networking_goals } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    try {
      const existing = await DatabaseService.get("SELECT id FROM Users WHERE email = ?", [email.toLowerCase().trim()]);
      if (existing) {
        return res.status(400).json({ error: "Email already registered." });
      }

      const user = await UserService.register({
        name,
        email,
        password,
        company,
        profession,
        role,
        industry,
        interests,
        experience_level,
        career_goals,
        networking_goals
      });

      const { token } = await UserService.login(email, password);
      res.status(201).json({ success: true, user, token });
    } catch (err: any) {
      LoggerService.error(TAG, `Registration error: ${err.message}`, { stack: err.stack });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/auth/login
   */
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    try {
      const result = await UserService.login(email, password);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      LoggerService.error(TAG, `Login error: ${err.message}`, { stack: err.stack });
      res.status(401).json({ error: err.message });
    }
  });

  /**
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(200).json({ success: true });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      await UserService.logout(token);
      res.status(200).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/auth/me
   */
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized session." });
      }
      res.status(200).json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // PROFILE & PREFERENCES
  // ==========================================

  /**
   * POST /api/profile/update
   */
  app.post("/api/profile/update", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const updated = await UserService.updateProfile(user.id, req.body);
      res.status(200).json({ success: true, user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/preferences
   */
  app.get("/api/preferences", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const prefs = await UserService.getPreferences(user.id);
      res.status(200).json({ success: true, data: prefs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/preferences
   */
  app.post("/api/preferences", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { theme, notificationsEnabled } = req.body;
      const prefs = await UserService.updatePreferences(user.id, theme, notificationsEnabled);
      res.status(200).json({ success: true, data: prefs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // GENERATION ROUTE (DYNAMIZED WITH PROFILES & PREVENT REPETITION)
  // ==========================================

  /**
   * POST /generate-conversation
   * Expects { eventDescription: string; interests?: string; eventType?: string; industry?: string }
   */
  app.post("/generate-conversation", async (req, res) => {
    const { eventDescription, interests, eventType, industry } = req.body;

    if (!eventDescription || String(eventDescription).trim() === "") {
      LoggerService.warn(TAG, "Missing eventDescription in request");
      res.status(400).json({ error: "Event description is required." });
      return;
    }

    try {
      const user = await getLoggedUser(req);
      const userId = user ? user.id : null;

      // Extract NLP topics
      const topicsResult = await TopicService.extractTopics(eventDescription);

      // Assemble full profiles
      const interestsVal = interests || (user ? user.interests : "") || "";
      const eventTypeVal = eventType || "Conference";
      const industryVal = industry || topicsResult.themes[0] || (user ? user.industry : "") || "General Technology";

      // Load previous suggestions & disliked ones to avoid repetitions
      let previousHistory: string[] = [];
      let previousFeedback: string[] = [];

      if (userId) {
        const recentConvs = await HistoryService.getRecent(userId, 3);
        for (const rc of recentConvs) {
          if (rc.conversationStarters?.categories) {
            const cats = rc.conversationStarters.categories;
            for (const key of Object.keys(cats)) {
              const list = cats[key as keyof typeof cats] || [];
              list.forEach((item: any) => {
                if (item?.text) previousHistory.push(item.text);
              });
            }
          }
        }

        const dislikes = await DatabaseService.query<any>(
          "SELECT suggestion FROM Feedback WHERE user_id = ? AND feedback_type = 'dislike' LIMIT 10",
          [userId]
        );
        previousFeedback = dislikes.map(d => d.suggestion);
      }

      // Generate customized categories suggestions via Gemini
      const richResult = await ConversationService.generateRichSuggestions({
        eventDescription,
        extractedTopics: topicsResult.topics,
        userInterests: interestsVal,
        eventType: eventTypeVal,
        industry: industryVal,
        userProfession: user ? user.profession : undefined,
        userRole: user ? user.role : undefined,
        company: user ? user.company : undefined,
        experienceLevel: user ? user.experience_level : undefined,
        careerGoals: user ? user.career_goals : undefined,
        networkingGoals: user ? user.networking_goals : undefined,
        previousHistory: previousHistory.slice(0, 30),
        previousFeedback: previousFeedback.slice(0, 15),
      });

      // Save to Database (with proper user grouping)
      const savedItem = await HistoryService.addEntry(
        userId,
        eventDescription,
        interestsVal,
        topicsResult.topics,
        richResult,
        {
          eventType: eventTypeVal,
          industry: industryVal,
          experienceLevel: user ? user.experience_level : null,
          careerGoals: user ? user.career_goals : null,
          networkingGoals: user ? user.networking_goals : null,
          networkingScore: richResult.networking_score
        }
      );

      // Track analytics
      if (userId) {
        await UserService.trackEvent(userId, "generated_suggestions", {
          event_id: savedItem.id,
          topics_count: topicsResult.topics.length,
          score: richResult.networking_score
        });
      }

      res.status(200).json({
        success: true,
        data: savedItem,
        extractedThemes: topicsResult.themes,
        extractedKeywords: topicsResult.keywords,
      });
    } catch (err: any) {
      LoggerService.error(TAG, "Error in generate-conversation endpoint", err);
      res.status(500).json({ error: "Failed to generate networking roadmap: " + err.message });
    }
  });

  /**
   * POST /api/regenerate-suggestion
   * Regenerates a single block of suggestions
   */
  app.post("/api/regenerate-suggestion", async (req, res) => {
    const { conversationId, category, previousText } = req.body;
    if (!conversationId || !category) {
      return res.status(400).json({ error: "conversationId and category are required." });
    }

    try {
      const user = await getLoggedUser(req);
      const userId = user ? user.id : null;

      const record = await DatabaseService.get<any>("SELECT * FROM ConversationHistory WHERE id = ?", [conversationId]);
      if (!record) {
        return res.status(404).json({ error: "Conversation history record not found." });
      }

      if (userId && record.user_id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const extractedTopics = JSON.parse(record.extracted_topics);

      const prompt = `
Given the professional event description:
"${record.event_description}"
Overarching industry topics: ${extractedTopics.join(", ")}
User profile/interests: "${record.user_interests}"

We want to regenerate the suggestion for the category: "${category}".
The user rejected or wanted an alternative to this previous suggestion: "${previousText || "none"}".

Generate a completely fresh, high-value alternative suggestion specifically for the category: "${category}".
Make it natural, smart, contextual, and witty. Avoid repeating similar phrasings.

Your response MUST be a valid JSON object ONLY matching this schema:
{
  "text": "The fresh, alternative suggestion or starter wording...",
  "scenario": "A brief situation context recommending when to say or do this..."
}
`;

      const responseText = await GeminiService.generateText(prompt, "You are an elite executive coach. Respond only in valid pure JSON matching the schema.");
      
      let parsed;
      try {
        let cleanText = responseText.trim();
        if (cleanText.includes("```")) {
          const matches = cleanText.match(/```(?:json)?([\s\S]*?)```/);
          if (matches && matches[1]) cleanText = matches[1].trim();
        }
        parsed = JSON.parse(cleanText);
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : { text: "What are your thoughts on the shifts in this industry?", scenario: "During transitional networking sessions" };
      }

      // Return regenerated suggestion
      res.status(200).json({
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000) + 10,
          text: String(parsed.text || "").trim(),
          scenario: String(parsed.scenario || "During session transitions").trim()
        }
      });
    } catch (err: any) {
      LoggerService.error(TAG, "Regeneration error", err);
      res.status(500).json({ error: "Failed to regenerate alternative suggestion: " + err.message });
    }
  });

  // ==========================================
  // FEEDBACK ROUTE (EXPANDED)
  // ==========================================

  /**
   * POST /feedback
   */
  app.post("/feedback", async (req, res) => {
    const { conversationId, suggestion, feedback, feedbackText, rating, isFavorite, isPoor } = req.body;

    if (!suggestion || !feedback) {
      res.status(400).json({ error: "Suggestion and feedback value ('like' or 'dislike') are required." });
      return;
    }

    try {
      const user = await getLoggedUser(req);
      const userId = user ? user.id : null;

      const result = await FeedbackService.addFeedback(
        userId,
        conversationId ? parseInt(conversationId, 10) : null,
        suggestion,
        feedback,
        {
          feedbackText,
          rating: rating ? parseInt(rating, 10) : 0,
          isFavorite: !!isFavorite,
          isPoor: !!isPoor
        }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      LoggerService.error(TAG, "Error in feedback endpoint", err);
      res.status(500).json({ error: "Failed to submit feedback: " + err.message });
    }
  });

  // ==========================================
  // HISTORIC RECORDS
  // ==========================================

  /**
   * GET /history
   */
  app.get("/history", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      const userId = user ? user.id : null;

      const history = await HistoryService.getAll(userId);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err: any) {
      LoggerService.error(TAG, "Error in history endpoint", err);
      res.status(500).json({ error: "Failed to fetch history: " + err.message });
    }
  });

  /**
   * DELETE /history/:id
   */
  app.delete("/history/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid history ID." });
      return;
    }

    try {
      const user = await getLoggedUser(req);
      const userId = user ? user.id : null;

      const success = await HistoryService.deleteEntry(userId, id);
      if (!success) {
        res.status(404).json({ error: "History entry not found or access denied." });
        return;
      }
      res.status(200).json({
        success: true,
        message: "History entry deleted successfully.",
      });
    } catch (err: any) {
      LoggerService.error(TAG, `Error in delete history endpoint for ID ${id}`, err);
      res.status(500).json({ error: "Failed to delete entry: " + err.message });
    }
  });

  // ==========================================
  // FAVORITES & SAVED SUGGESTIONS ROUTES
  // ==========================================

  app.get("/api/favorites", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const favs = await UserService.getFavorites(user.id);
      res.json({ success: true, data: favs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    const { conversationId, suggestionText, category } = req.body;
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const fav = await UserService.addFavorite(user.id, conversationId, suggestionText, category);
      res.json({ success: true, data: fav });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/favorites/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const ok = await UserService.removeFavorite(user.id, id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/saved-suggestions", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const saved = await UserService.getSavedSuggestions(user.id);
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/saved-suggestions", async (req, res) => {
    const { conversationId, category, title, content } = req.body;
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const item = await UserService.saveSuggestion(user.id, conversationId, category, title, content);
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/saved-suggestions/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const ok = await UserService.removeSavedSuggestion(user.id, id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // REAL ANALYTICS API
  // ==========================================

  app.get("/api/analytics", async (req, res) => {
    try {
      const user = await getLoggedUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const userId = user.id;

      // 1. Fetch total conversations count
      const convCountRow = await DatabaseService.get<any>(
        "SELECT COUNT(*) as total FROM ConversationHistory WHERE user_id = ?",
        [userId]
      );
      const totalConversations = convCountRow?.total || 0;

      // 2. Fetch feedback statistics
      const fbStatsRow = await DatabaseService.get<any>(
        "SELECT COUNT(*) as total, SUM(CASE WHEN feedback_type = 'like' THEN 1 ELSE 0 END) as likes, SUM(CASE WHEN feedback_type = 'dislike' THEN 1 ELSE 0 END) as dislikes, AVG(rating) as avg_rating FROM Feedback WHERE user_id = ?",
        [userId]
      );
      const totalFeedbacks = fbStatsRow?.total || 0;
      const likesCount = fbStatsRow?.likes || 0;
      const dislikesCount = fbStatsRow?.dislikes || 0;
      const avgRating = parseFloat(fbStatsRow?.avg_rating || 0).toFixed(1);

      // 3. Fetch latest networking score
      const latestScoreRow = await DatabaseService.get<any>(
        "SELECT networking_score FROM ConversationHistory WHERE user_id = ? AND networking_score IS NOT NULL ORDER BY id DESC LIMIT 1",
        [userId]
      );
      const networkingScore = latestScoreRow?.networking_score || 70;

      // 4. Extract common topics & trend distribution
      const allConvs = await DatabaseService.query<any>(
        "SELECT extracted_topics FROM ConversationHistory WHERE user_id = ?",
        [userId]
      );
      const topicCounts: Record<string, number> = {};
      allConvs.forEach((c: any) => {
        try {
          const parsed = JSON.parse(c.extracted_topics);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: string) => {
              topicCounts[t] = (topicCounts[t] || 0) + 1;
            });
          }
        } catch {}
      });
      const topicTrends = Object.entries(topicCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // 5. Weekly usage statistics (activity chart)
      // Group by day of week or last 7 days
      const weeklyUsage = [
        { day: "Mon", count: 0 },
        { day: "Tue", count: 0 },
        { day: "Wed", count: 0 },
        { day: "Thu", count: 0 },
        { day: "Fri", count: 0 },
        { day: "Sat", count: 0 },
        { day: "Sun", count: 0 }
      ];
      
      const historyItems = await DatabaseService.query<any>(
        "SELECT created_at FROM ConversationHistory WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [userId]
      );

      historyItems.forEach((item: any) => {
        try {
          const date = new Date(item.created_at);
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayName = days[date.getDay()];
          const f = weeklyUsage.find(w => w.day === dayName);
          if (f) f.count += 1;
        } catch {}
      });

      res.status(200).json({
        success: true,
        data: {
          totalConversations,
          totalFeedbacks,
          likesCount,
          dislikesCount,
          avgRating,
          networkingScore,
          topicTrends,
          weeklyUsage
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // FACT-CHECK ENDPOINT
  // ==========================================

  /**
   * POST /fact-check
   */
  app.post("/fact-check", async (req, res) => {
    const { query } = req.body;

    if (!query || String(query).trim() === "") {
      LoggerService.warn(TAG, "Missing query in fact-check request");
      res.status(400).json({ error: "Query is required for fact-checking." });
      return;
    }

    try {
      const factResult = await FactCheckService.queryWikipedia(query);
      res.status(200).json({
        success: true,
        data: factResult,
      });
    } catch (err: any) {
      LoggerService.error(TAG, "Error in fact-check endpoint", err);
      res.status(500).json({ error: "Wikipedia lookup failed: " + err.message });
    }
  });

  // ==========================================
  // ADMIN DB VIEWERS
  // ==========================================

  /**
   * GET /api/admin/db
   * Returns all raw tables as JSON for developer queries.
   */
  app.get("/api/admin/db", async (req, res) => {
    try {
      const users = await DatabaseService.query<any>("SELECT * FROM Users ORDER BY id DESC");
      const conversationHistory = await DatabaseService.query<any>("SELECT * FROM ConversationHistory ORDER BY id DESC");
      const feedback = await DatabaseService.query<any>("SELECT * FROM Feedback ORDER BY id DESC");
      res.json({
        success: true,
        data: {
          users,
          conversationHistory,
          feedback
        }
      });
    } catch (err: any) {
      LoggerService.error(TAG, "Error fetching admin database contents", err);
      res.status(500).json({ error: "Failed to query database: " + err.message });
    }
  });

  /**
   * GET /admin/db-viewer
   * Renders a fully standalone, gorgeous HTML page with all records from the SQLite database.
   */
  app.get("/admin/db-viewer", async (req, res) => {
    try {
      const users = await DatabaseService.query<any>("SELECT * FROM Users ORDER BY id DESC");
      const history = await DatabaseService.query<any>("SELECT * FROM ConversationHistory ORDER BY id DESC");
      const feedback = await DatabaseService.query<any>("SELECT * FROM Feedback ORDER BY id DESC");
      const msg = req.query.msg ? String(req.query.msg) : "";

      const totalUsers = users.length;
      const totalConvs = history.length;
      const totalFeedback = feedback.length;
      const likes = feedback.filter((f: any) => f.feedback_type === "like").length;
      const dislikes = feedback.filter((f: any) => f.feedback_type === "dislike").length;

      const formatTopics = (topicsStr: string) => {
        try {
          const parsed = JSON.parse(topicsStr);
          if (Array.isArray(parsed)) {
            return parsed.map((t: string) => `<span class="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-xs font-mono mr-1.5 mb-1.5">${t}</span>`).join("");
          }
          return `<span class="text-slate-400 font-mono text-xs">${topicsStr}</span>`;
        } catch {
          return `<span class="text-slate-400 font-mono text-xs">${topicsStr}</span>`;
        }
      };

      const formatStarters = (startersStr: string) => {
        try {
          const parsed = JSON.parse(startersStr);
          if (parsed.categories) {
            // New structure! Show category summaries
            return Object.entries(parsed.categories)
              .map(([cat, list]: any) => `
                <div class="mb-2 last:mb-0">
                  <div class="text-[10px] text-sky-400 font-bold uppercase">${cat.replace(/_/g, ' ')} (${list.length} items)</div>
                  <div class="text-[11px] text-slate-300 max-h-16 overflow-y-auto italic p-1 bg-slate-900 rounded border border-slate-850">
                    "${list[0]?.text || 'None'}"
                  </div>
                </div>
              `).join("");
          }
          if (Array.isArray(parsed)) {
            return parsed.map((s: any, idx: number) => `
              <div class="p-3 bg-slate-900 border border-slate-800/80 rounded-xl mb-2.5 last:mb-0">
                <div class="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Starter #${idx + 1} (${s.topic || "General"})</div>
                <p class="text-xs text-slate-200 italic font-sans leading-relaxed">"${s.starter || s.opener || ""}"</p>
              </div>
            `).join("");
          }
          return `<span class="text-slate-400 text-xs">${startersStr}</span>`;
        } catch {
          return `<span class="text-slate-400 text-xs">${startersStr}</span>`;
        }
      };

      const historyRows = history.map((row: any) => `
        <tr class="border-b border-slate-800 hover:bg-slate-900/40 transition-colors duration-150" data-searchable-row>
          <td class="px-4 py-3 font-mono text-xs text-slate-400 text-center font-bold">${row.id}</td>
          <td class="px-4 py-3 font-mono text-xs text-slate-400 text-center">${row.user_id || '<span class="text-slate-600 italic">Guest</span>'}</td>
          <td class="px-4 py-3 text-xs text-slate-300 max-w-xs break-words">${row.event_description}</td>
          <td class="px-4 py-3 text-xs text-slate-300 max-w-xs break-words">${row.user_interests || '<span class="text-slate-600 italic">None</span>'}</td>
          <td class="px-4 py-3 max-w-xs">${formatTopics(row.extracted_topics)}</td>
          <td class="px-4 py-3 max-w-md">${formatStarters(row.conversation_starters)}</td>
          <td class="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">${row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}</td>
          <td class="px-4 py-3 text-center">
            <form action="/admin/db-viewer/delete-history/${row.id}" method="POST" onsubmit="return confirm('Are you sure you want to delete ConversationHistory #${row.id}?');" class="inline">
              <button type="submit" class="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition duration-150" title="Delete record">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </form>
          </td>
        </tr>
      `).join("");

      const feedbackRows = feedback.map((row: any) => `
        <tr class="border-b border-slate-800 hover:bg-slate-900/40 transition-colors duration-150" data-searchable-row>
          <td class="px-4 py-3 font-mono text-xs text-slate-400 text-center font-bold">${row.id}</td>
          <td class="px-4 py-3 font-mono text-xs text-slate-400 text-center">${row.conversation_id || '<span class="text-slate-600 italic">N/A</span>'}</td>
          <td class="px-4 py-3 font-mono text-xs text-slate-400 text-center">${row.user_id || '<span class="text-slate-600 italic">Guest</span>'}</td>
          <td class="px-4 py-3 text-xs text-slate-300 italic max-w-md break-words">"${row.suggestion}"</td>
          <td class="px-4 py-3 text-center">
            ${row.feedback_type === 'like' 
              ? `<span class="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">👍 Like</span>` 
              : `<span class="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">👎 Dislike</span>`
            }
          </td>
          <td class="px-4 py-3 text-xs text-slate-300 max-w-xs break-words">
            Rating: ${row.rating || 0}/5 | Poor: ${row.is_poor || 0} | Fav: ${row.is_favorite || 0}<br/>
            ${row.feedback_text || '<span class="text-slate-600 italic">No comment</span>'}
          </td>
          <td class="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">${row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}</td>
          <td class="px-4 py-3 text-center">
            <form action="/admin/db-viewer/delete-feedback/${row.id}" method="POST" onsubmit="return confirm('Are you sure you want to delete Feedback #${row.id}?');" class="inline">
              <button type="submit" class="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition duration-150" title="Delete record">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </form>
          </td>
        </tr>
      `).join("");

      const userRows = users.map((u: any) => `
        <tr class="border-b border-slate-800 hover:bg-slate-900/40" data-searchable-row>
          <td class="px-4 py-3 font-mono text-xs text-slate-400 text-center font-bold">${u.id}</td>
          <td class="px-4 py-3 text-xs text-white font-bold">${u.name}</td>
          <td class="px-4 py-3 text-xs text-slate-300">${u.email}</td>
          <td class="px-4 py-3 text-xs text-slate-300">${u.profession || 'N/A'} (${u.role || 'N/A'})</td>
          <td class="px-4 py-3 text-xs text-slate-400">${u.company || 'N/A'} | ${u.industry || 'N/A'}</td>
          <td class="px-4 py-3 text-xs text-slate-400 max-w-xs break-words">${u.interests || 'None'}</td>
          <td class="px-4 py-3 text-[10px] text-slate-500 font-mono">${u.created_at ? new Date(u.created_at).toLocaleString() : 'N/A'}</td>
        </tr>
      `).join("");

      const flashMessageHtml = msg ? `
        <div id="flash-message" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center justify-between animate-fadeIn mb-6">
            <div class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>${msg}</span>
            </div>
            <button onclick="document.getElementById('flash-message').style.display='none';" class="text-slate-400 hover:text-slate-200">×</button>
        </div>
      ` : "";

      res.setHeader("Content-Type", "text/html");
      res.send(`
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Viewer - Personal Networking Assistant</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
    
    <!-- Top Bar -->
    <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            </div>
            <div>
                <h1 class="text-lg font-semibold tracking-tight text-slate-100">Database Viewer</h1>
                <p class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">SQLite Admin Panel • networking_assistant.db</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <a href="/" class="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition duration-150">
                Back to Assistant
            </a>
            <form action="/admin/db-viewer/clear-all" method="POST" onsubmit="return confirm('CRITICAL WARNING: This will permanently erase ALL records. Do you want to proceed?');">
                <button type="submit" class="text-xs text-rose-400 hover:text-white bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900 px-4 py-2 rounded-xl transition duration-150">
                    Erase Database
                </button>
            </form>
        </div>
    </header>

    <!-- Content Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        <!-- Flash Message Notification -->
        ${flashMessageHtml}

        <!-- Stats Overview Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Users</div>
                <div class="text-2xl font-semibold text-violet-400 font-mono mt-1">${totalUsers}</div>
            </div>
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Roadmaps</div>
                <div class="text-2xl font-semibold text-emerald-400 font-mono mt-1">${totalConvs}</div>
            </div>
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Feedback Rows</div>
                <div class="text-2xl font-semibold text-sky-400 font-mono mt-1">${totalFeedback}</div>
            </div>
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Likes / Dislikes</div>
                <div class="text-2xl font-semibold text-emerald-400 font-mono mt-1">${likes} <span class="text-slate-500 text-sm">/</span> <span class="text-rose-400">${dislikes}</span></div>
            </div>
        </div>

        <!-- Search & Control Panel -->
        <div class="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div class="relative w-full sm:w-72">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input type="text" id="db-search" placeholder="Search records..." class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs placeholder-slate-500 transition duration-150 text-slate-200">
            </div>
            <p class="text-xs text-slate-400 italic">
                * Real-time client-side filter scans across description, user interests, topics, starters, suggestions, and feedback text.
            </p>
        </div>

        <!-- Section 1: Users -->
        <section class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-violet-400 animate-pulse"></span>
                    Users Table
                </h2>
                <span class="text-xs text-slate-500 font-mono">${totalUsers} rows</span>
            </div>
            <div class="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                <th class="px-4 py-3 text-center w-12">ID</th>
                                <th class="px-4 py-3">Name</th>
                                <th class="px-4 py-3">Email</th>
                                <th class="px-4 py-3">Profession & Role</th>
                                <th class="px-4 py-3">Company & Industry</th>
                                <th class="px-4 py-3">Interests</th>
                                <th class="px-4 py-3">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userRows || `
                            <tr><td colspan="7" class="px-6 py-4 text-center text-xs text-slate-500 italic">No registered users</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Section 2: ConversationHistory -->
        <section class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                    ConversationHistory Table
                </h2>
                <span class="text-xs text-slate-500 font-mono">${totalConvs} rows</span>
            </div>
            <div class="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                <th class="px-4 py-3 text-center w-12">ID</th>
                                <th class="px-4 py-3 text-center w-12">User ID</th>
                                <th class="px-4 py-3">Event Description</th>
                                <th class="px-4 py-3">User Interests</th>
                                <th class="px-4 py-3">Extracted Topics</th>
                                <th class="px-4 py-3">Conversation Starters (Structured JSON)</th>
                                <th class="px-4 py-3">Created At</th>
                                <th class="px-4 py-3 text-center w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="history-tbody">
                            ${historyRows || `
                            <tr>
                                <td colspan="8" class="px-6 py-12 text-center text-xs text-slate-500 italic">
                                    No records found in ConversationHistory. Generate a starter on the main page to create records.
                                </td>
                            </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Section 3: Feedback -->
        <section class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-sky-400"></span>
                    Feedback Table
                </h2>
                <span class="text-xs text-slate-500 font-mono">${totalFeedback} rows</span>
            </div>
            <div class="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                <th class="px-4 py-3 text-center w-12">ID</th>
                                <th class="px-4 py-3 text-center w-24">Conversation ID</th>
                                <th class="px-4 py-3 text-center w-12">User ID</th>
                                <th class="px-4 py-3">Target Suggestion</th>
                                <th class="px-4 py-3 text-center w-28">Type</th>
                                <th class="px-4 py-3">Detailed Status / Comment</th>
                                <th class="px-4 py-3">Created At</th>
                                <th class="px-4 py-3 text-center w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="feedback-tbody">
                            ${feedbackRows || `
                            <tr>
                                <td colspan="8" class="px-6 py-12 text-center text-xs text-slate-500 italic">
                                    No records found in Feedback. Use the feedback system on the main dashboard to generate entries.
                                </td>
                            </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        Personalized Networking Assistant • SQLite Viewer • Prepared Offline & Off-Grid
    </footer>

    <!-- Search Filtering Logic -->
    <script>
        document.getElementById('db-search').addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('[data-searchable-row]');
            
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>
      `);
    } catch (err: any) {
      LoggerService.error(TAG, "Error rendering database viewer page", err);
      res.status(500).send(`
        <div style="background-color:#1e1b4b;color:#fecdd3;padding:24px;border-radius:12px;font-family:sans-serif;margin:40px;">
          <h3>Failed to render Database Viewer</h3>
          <p>\${err.message}</p>
          <a href="/" style="color:#38bdf8;">Back to Assistant</a>
        </div>
      `);
    }
  });

  /**
   * POST /admin/db-viewer/delete-history/:id
   */
  app.post("/admin/db-viewer/delete-history/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send("Invalid ID");
    }
    try {
      await DatabaseService.execute("DELETE FROM ConversationHistory WHERE id = ?", [id]);
      res.redirect("/admin/db-viewer?msg=Successfully deleted ConversationHistory row #" + id);
    } catch (err: any) {
      res.status(500).send("Error deleting history row: " + err.message);
    }
  });

  /**
   * POST /admin/db-viewer/delete-feedback/:id
   */
  app.post("/admin/db-viewer/delete-feedback/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send("Invalid ID");
    }
    try {
      await DatabaseService.execute("DELETE FROM Feedback WHERE id = ?", [id]);
      res.redirect("/admin/db-viewer?msg=Successfully deleted Feedback row #" + id);
    } catch (err: any) {
      res.status(500).send("Error deleting feedback row: " + err.message);
    }
  });

  /**
   * POST /admin/db-viewer/clear-all
   */
  app.post("/admin/db-viewer/clear-all", async (req, res) => {
    try {
      await DatabaseService.execute("DELETE FROM Sessions");
      await DatabaseService.execute("DELETE FROM SavedSuggestions");
      await DatabaseService.execute("DELETE FROM Favorites");
      await DatabaseService.execute("DELETE FROM Analytics");
      await DatabaseService.execute("DELETE FROM UserPreferences");
      await DatabaseService.execute("DELETE FROM Feedback");
      await DatabaseService.execute("DELETE FROM ConversationHistory");
      await DatabaseService.execute("DELETE FROM Users");
      res.redirect("/admin/db-viewer?msg=Successfully cleared all database tables.");
    } catch (err: any) {
      res.status(500).send("Error clearing database: " + err.message);
    }
  });

  // Serve static UI / assets
  if (process.env.NODE_ENV !== "production") {
    LoggerService.info(TAG, "Starting server in DEVELOPMENT mode with Vite Middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    LoggerService.info(TAG, "Starting server in PRODUCTION mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to host 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    LoggerService.info(TAG, `Application running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
