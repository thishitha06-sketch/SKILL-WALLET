/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeminiService } from "./gemini.js";
import { LoggerService } from "../logger.js";

const TAG = "ConversationService";

export interface SuggestionItem {
  id: number;
  text: string;
  scenario: string;
}

export interface RichSuggestions {
  networking_score: number;
  ai_insights?: {
    event_analysis: string;
    key_opportunities: string[];
    strategic_focus: string;
  };
  categories: {
    ice_breakers: SuggestionItem[];
    professional_introduction: SuggestionItem[];
    follow_up_questions: SuggestionItem[];
    common_interests: SuggestionItem[];
    networking_strategy: SuggestionItem[];
    speaker_questions: SuggestionItem[];
    panel_discussion_questions: SuggestionItem[];
    collaboration_opportunities: SuggestionItem[];
    linkedin_follow_up: SuggestionItem[];
    coffee_break: SuggestionItem[];
    business_card: SuggestionItem[];
    elevator_pitch: SuggestionItem[];
    session_specific: SuggestionItem[];
    closing_conversation: SuggestionItem[];
    recruiter_questions?: SuggestionItem[];
    founder_questions?: SuggestionItem[];
    investor_questions?: SuggestionItem[];
    technical_discussion?: SuggestionItem[];
    business_discussion?: SuggestionItem[];
    common_challenges?: SuggestionItem[];
    future_trends?: SuggestionItem[];
    success_tips?: SuggestionItem[];
  };
}

export interface RichSuggestionsOptions {
  eventDescription: string;
  extractedTopics: string[];
  userInterests?: string;
  eventType?: string;
  industry?: string;
  userProfession?: string;
  userRole?: string;
  company?: string;
  experienceLevel?: string;
  careerGoals?: string;
  networkingGoals?: string;
  previousHistory?: string[];
  previousFeedback?: string[];
}

export class ConversationService {
  /**
   * Generates highly custom, rich professional networking suggestions across 14 categories
   */
  static async generateRichSuggestions(options: RichSuggestionsOptions): Promise<RichSuggestions> {
    LoggerService.info(TAG, "Executing advanced multi-stage AI reasoning pipeline for personalized networking suggestions");

    const interestsText = options.userInterests && options.userInterests.trim() !== "" 
      ? options.userInterests.trim() 
      : "General professional networking & industry curiosity";

    const professionText = options.userProfession ? `${options.userProfession} (Role: ${options.userRole || "N/A"})` : "Professional attendee";
    const companyText = options.company ? `working at ${options.company}` : "";
    const experienceText = options.experienceLevel ? `Experience Level: ${options.experienceLevel}` : "";
    const careerText = options.careerGoals ? `Career Goals: ${options.careerGoals}` : "";
    const networkGoalsText = options.networkingGoals ? `Networking Goals: ${options.networkingGoals}` : "";

    const avoidStarters = options.previousHistory && options.previousHistory.length > 0
      ? `PROHIBITED PHRASES/IDEAS (Do NOT reuse or repeat anything similar to these previous suggestions):\n${options.previousHistory.map(h => `- "${h}"`).join("\n")}`
      : "";

    const avoidFeedback = options.previousFeedback && options.previousFeedback.length > 0
      ? `DISLIKED/POOR SUGGESTIONS (Avoid style/phrasing like these, as user did not like them):\n${options.previousFeedback.map(f => `- "${f}"`).join("\n")}`
      : "";

    // Stage 1 & 2 Unified Multi-Stage Reasoning Prompt
    const prompt = `
You are an elite, world-class executive communication coach, professional networking strategist, and principal full-stack architect.
Your mission is to formulate an incredibly powerful, high-conversion strategic networking roadmap for an attendee at a professional event.

You must follow this internal MULTI-STAGE REASONING PIPELINE before generating suggestions:
- STAGE 1: Event Context Analysis. Deconstruct the event's industry vertical, medium, and extracted topics. Identify the key industry buzzwords, specific paradigm shifts, and active conversational trends.
- STAGE 2: User Profile Synthesis. Align the user's role, experience, career goals, and networking objectives with the event's key dynamics.
- STAGE 3: Opportunity Mapping. Pinpoint specific high-value targets (e.g., investors, recruiters, technical leaders) and collaboration triggers.
- STAGE 4: Formulation. Construct a powerful strategic networking brief.
- STAGE 5: Tactical Phrasing. Generate highly authentic, sophisticated, polite, and completely natural human-like talking points.

-----------------
EVENT CONTEXT:
1. Event Description:
"${options.eventDescription}"

2. Event Type:
"${options.eventType || "General Professional Event"}"

3. Event Industry/Niche:
"${options.industry || "General Industry"}"

4. Extracted Key Topics:
${options.extractedTopics.map(t => `- ${t}`).join("\n")}

-----------------
USER PROFILE & CONTEXT:
1. Profession & Role:
${professionText} ${companyText}

2. ${experienceText}

3. User's Personal & Professional Interests:
"${interestsText}"

4. ${careerText}

5. ${networkGoalsText}

-----------------
MEMORY & REPETITION CONSTRAINTS:
${avoidStarters}
${avoidFeedback}

-----------------
CATEGORIES TO GENERATE (Generate 2 to 3 highly unique suggestions for each category. Text must sound exactly like natural human dialogue, not textbook formulas):
1. ice_breakers: Warm, short, organic opening lines for lobbies, coffee queues, or session entries.
2. professional_introduction: Fluid, contextual ways to introduce oneself based on the user's profile and current event themes.
3. follow_up_questions: Engaging open-ended questions that transition the talk from casual to highly professional topics.
4. common_interests: Creative hooks linking the event topics directly to the user's specific interests (${interestsText}).
5. networking_strategy: High-level tactical rules or advice on how the user should navigate the physical or virtual room.
6. speaker_questions: Intelligent, forward-thinking questions the user can ask speakers post-session to stand out.
7. panel_discussion_questions: Provocative talking points or questions to discuss with fellow attendees.
8. collaboration_opportunities: Natural proposals for co-authoring, technical pilots, startup partnerships, or brief follow-up talks.
9. linkedin_follow_up: Ready-to-send, high-conversion LinkedIn connection messages.
10. coffee_break: Lighthearted, relaxed conversation starters designed specifically for refreshment areas.
11. business_card: Follow-up email subject lines and templates after receiving a contact card.
12. elevator_pitch: Customized, impactful 15-30 second oral self-introduction tailored to key goals.
13. session_specific: Discussion prompts dealing directly with specific panels or presentation themes.
14. closing_conversation: Polite, memorable, and polished ways to close a discussion and exchange contact info gracefully.
15. recruiter_questions: Sophisticated, highly prepared questions that showcase competence to talent acquisition teams and recruiters.
16. founder_questions: Respectful, insightful questions to ask startup founders about product market fit, bottlenecks, and creation story.
17. investor_questions: Polished, professional questions designed to initiate dialogue with angel investors, VCs, or syndicates.
18. technical_discussion: Deep technical questions or debate points tailored for developers and technical managers.
19. business_discussion: High-level business questions covering revenue models, scaling strategies, and monetization shifts.
20. common_challenges: Witty opening prompts focusing on shared industry bottlenecks, tool fatigue, or implementation pains.
21. future_trends: Conversation starters touching on upcoming industry paradigm shifts, future outlooks, and disruptions.
22. success_tips: Professional communication master tips and guidelines to guarantee networking success.

Your response MUST be a valid JSON object ONLY. Do NOT wrap it in markdown block fences or any introductory text. The output JSON schema must be structured exactly like this:
{
  "networking_score": 85,
  "ai_insights": {
    "event_analysis": "A high-density strategic summary of the event's cultural and technical landscape.",
    "key_opportunities": [
      "Specific targeted opportunity based on user profile and goals.",
      "Another tailored opportunity."
    ],
    "strategic_focus": "A 1-2 sentence recommendation on where the user should focus their social and professional energy."
  },
  "categories": {
    "ice_breakers": [{"id": 1, "text": "...", "scenario": "..."}],
    "professional_introduction": [{"id": 1, "text": "...", "scenario": "..."}],
    "follow_up_questions": [{"id": 1, "text": "...", "scenario": "..."}],
    "common_interests": [{"id": 1, "text": "...", "scenario": "..."}],
    "networking_strategy": [{"id": 1, "text": "...", "scenario": "..."}],
    "speaker_questions": [{"id": 1, "text": "...", "scenario": "..."}],
    "panel_discussion_questions": [{"id": 1, "text": "...", "scenario": "..."}],
    "collaboration_opportunities": [{"id": 1, "text": "...", "scenario": "..."}],
    "linkedin_follow_up": [{"id": 1, "text": "...", "scenario": "..."}],
    "coffee_break": [{"id": 1, "text": "...", "scenario": "..."}],
    "business_card": [{"id": 1, "text": "...", "scenario": "..."}],
    "elevator_pitch": [{"id": 1, "text": "...", "scenario": "..."}],
    "session_specific": [{"id": 1, "text": "...", "scenario": "..."}],
    "closing_conversation": [{"id": 1, "text": "...", "scenario": "..."}],
    "recruiter_questions": [{"id": 1, "text": "...", "scenario": "..."}],
    "founder_questions": [{"id": 1, "text": "...", "scenario": "..."}],
    "investor_questions": [{"id": 1, "text": "...", "scenario": "..."}],
    "technical_discussion": [{"id": 1, "text": "...", "scenario": "..."}],
    "business_discussion": [{"id": 1, "text": "...", "scenario": "..."}],
    "common_challenges": [{"id": 1, "text": "...", "scenario": "..."}],
    "future_trends": [{"id": 1, "text": "...", "scenario": "..."}],
    "success_tips": [{"id": 1, "text": "...", "scenario": "..."}]
  }
}
`;

    try {
      const responseText = await GeminiService.generateText(prompt, "You are a world-class executive communication advisor. Always return pure valid JSON matching the exact schema specified.");
      const parsed = this.parseJsonFromResponse(responseText);

      // Validate and clean up
      const categories = parsed.categories || {};
      const resultCategories: any = {};
      
      const keys = [
        "ice_breakers", "professional_introduction", "follow_up_questions", "common_interests", 
        "networking_strategy", "speaker_questions", "panel_discussion_questions", "collaboration_opportunities", 
        "linkedin_follow_up", "coffee_break", "business_card", "elevator_pitch", 
        "session_specific", "closing_conversation",
        "recruiter_questions", "founder_questions", "investor_questions", "technical_discussion",
        "business_discussion", "common_challenges", "future_trends", "success_tips"
      ];

      for (const key of keys) {
        const items = categories[key] || [];
        resultCategories[key] = Array.isArray(items) ? items.map((item: any, idx: number) => ({
          id: idx + 1,
          text: String(item.text || item.starter || "").trim(),
          scenario: String(item.scenario || item.context || "During appropriate event moments").trim(),
        })).filter((item: any) => item.text.length > 0) : [];
      }

      // Check if ai_insights exists or generate fallback insights based on extractedTopics
      const rawInsights = parsed.ai_insights || {};
      const aiInsights = {
        event_analysis: String(rawInsights.event_analysis || `Strategic analysis of the event focusing on ${options.industry || "key trends"}.`).trim(),
        key_opportunities: Array.isArray(rawInsights.key_opportunities) 
          ? rawInsights.key_opportunities.map((o: any) => String(o).trim())
          : [`Connect with experts in ${options.extractedTopics[0] || "industry subjects"}`],
        strategic_focus: String(rawInsights.strategic_focus || `Maximize interactions around ${options.extractedTopics[0] || "core topics"}.`).trim()
      };

      return {
        networking_score: typeof parsed.networking_score === "number" ? parsed.networking_score : 80,
        categories: resultCategories as any,
        ai_insights: aiInsights as any
      };
    } catch (err) {
      LoggerService.error(TAG, "Failed to generate rich suggestions via multi-stage AI reasoning, running local fallback", err);
      return this.localFallbackRichSuggestions(options);
    }
  }

  private static parseJsonFromResponse(text: string): any {
    try {
      let cleanText = text.trim();
      if (cleanText.includes("```")) {
        const matches = cleanText.match(/```(?:json)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          cleanText = matches[1].trim();
        }
      }
      return JSON.parse(cleanText);
    } catch (err) {
      LoggerService.warn(TAG, "Failed to parse JSON directly, trying regex matcher", err);
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (relaxedErr) {
        LoggerService.error(TAG, "Regex JSON parse also failed");
      }
      throw new Error("Invalid JSON structure returned from Gemini model");
    }
  }

  private static localFallbackRichSuggestions(options: RichSuggestionsOptions): RichSuggestions {
    LoggerService.info(TAG, "Running high-quality local fallback for rich suggestions");
    
    const firstTopic = options.extractedTopics[0] || "upcoming tech and innovations";
    const secondTopic = options.extractedTopics[1] || "industry growth opportunities";
    const userRole = options.userRole || "professional";
    
    return {
      networking_score: 75,
      categories: {
        ice_breakers: [
          { id: 1, text: `Hey! Have you caught any of the talks about ${firstTopic} yet? The energy here is amazing!`, scenario: "At the coffee bar or entry lobby during a break" },
          { id: 2, text: `Hi there, are you mainly following the keynotes today or focusing on the technical workshop tracks?`, scenario: "Sitting down in the main amphitheater waiting for a panel" }
        ],
        professional_introduction: [
          { id: 1, text: `Hi, I'm with a background in ${options.userInterests || "networking"}. I've been focusing on connecting with peers around ${firstTopic} recently. What brings you to the event?`, scenario: "Standing near high-top tables in the exhibition hall" }
        ],
        follow_up_questions: [
          { id: 1, text: `That's really interesting! How has your company been navigating the shifts in ${secondTopic} lately?`, scenario: "Once they explain their role or company business" }
        ],
        common_interests: [
          { id: 1, text: `Since you mentioned working in this field, do you see ${firstTopic} impacting your team's day-to-day workflow anytime soon?`, scenario: "When discussing common tech or operational overlaps" }
        ],
        networking_strategy: [
          { id: 1, text: "Focus on connecting with 3 key professionals. Instead of pitching, ask about their top 2 current bottlenecks and listen intently.", scenario: "Self-coaching mindset guideline" }
        ],
        speaker_questions: [
          { id: 1, text: `During your presentation on ${firstTopic}, you mentioned scalability. What do you see as the primary barrier for mid-sized teams adopting this strategy?`, scenario: "Q&A session or speaking with a presenter off-stage" }
        ],
        panel_discussion_questions: [
          { id: 1, text: "Do you feel that the recent regulatory shifts or technical hurdles in our space will slow down adoption, or accelerate the need for custom builds?", scenario: "During panel Q&A or discussion at lunch tables" }
        ],
        collaboration_opportunities: [
          { id: 1, text: `We are actually exploring some interesting open-source or small team pilots in ${firstTopic}. I'd love to exchange details to share what we find, or maybe co-author a brief post!`, scenario: "Finding common ground to collaborate" }
        ],
        linkedin_follow_up: [
          { id: 1, text: `Hi [Name], great chatting with you at the event today! I really enjoyed our discussion on ${firstTopic}. Let's stay connected here to track our progress. Best, [Your Name]`, scenario: "Send within 24 hours of meeting" }
        ],
        coffee_break: [
          { id: 1, text: `Mind if I join you here? Honestly, after that intense session on ${firstTopic}, I think I need a moment to process. How did you find it?`, scenario: "Joining someone at a coffee standing table" }
        ],
        business_card: [
          { id: 1, text: `Subject: Great meeting you at the summit! / Hi [Name], it was a pleasure meeting you today. I wanted to follow up on your point about ${secondTopic}. Let's schedule a brief virtual coffee next week if you're open to it!`, scenario: "Email follow up template" }
        ],
        elevator_pitch: [
          { id: 1, text: `I am a ${userRole} specializing in ${options.userInterests || "industry solutions"}. Currently, my focus is helping teams leverage ${firstTopic} to accelerate their growth.`, scenario: "When someone asks 'What do you do?'" }
        ],
        session_specific: [
          { id: 1, text: `Are you planning to check out the session on ${firstTopic} next? I'm hoping they'll dive deep into actual real-world implementations.`, scenario: "During session transitions" }
        ],
        closing_conversation: [
          { id: 1, text: `It was absolutely great speaking with you! I want to make sure I catch the next presentation, but let's definitely exchange LinkedIn details before we head over.`, scenario: "Polite exit when a session is about to start" }
        ],
        recruiter_questions: [],
        founder_questions: [],
        investor_questions: [],
        technical_discussion: [],
        business_discussion: [],
        common_challenges: [],
        future_trends: [],
        success_tips: []
      }
    };
  }
}
