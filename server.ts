/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

export async function startServer() {
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
  // ADMIN DB VIEWERS REMOVED FOR SECURITY
  // ==========================================

  // Serve static UI / assets
  if (process.env.NODE_ENV !== "production") {
    LoggerService.info(TAG, "Starting server in DEVELOPMENT mode with Vite Middleware");
    const { createServer: createViteServer } = await import("vite");
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
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      LoggerService.info(TAG, `Application running at http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

if (!process.env.VERCEL) {
  startServer();
}
