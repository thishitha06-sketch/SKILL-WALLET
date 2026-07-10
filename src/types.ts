/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  name: string;
  email: string;
  company: string | null;
  profession: string | null;
  role: string | null;
  industry: string | null;
  interests: string | null;
  experience_level: string | null;
  career_goals: string | null;
  networking_goals: string | null;
  profile_image: string | null;
}

export interface SuggestionItem {
  id: number;
  text: string;
  scenario: string;
}

export type ConversationStarter = SuggestionItem;

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

export interface HistoryItem {
  id: number;
  userId: number | null;
  eventDescription: string;
  interests: string;
  extractedTopics: string[];
  conversationStarters: RichSuggestions;
  eventType: string | null;
  industry: string | null;
  experienceLevel: string | null;
  careerGoals: string | null;
  networkingGoals: string | null;
  networkingScore: number | null;
  timestamp: string;
}

export interface FactCheckResult {
  title: string;
  summary: string;
  url: string;
  found: boolean;
}

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

export interface FavoriteItem {
  id: number;
  user_id: number;
  conversation_id: number;
  suggestion_text: string;
  category: string;
  created_at: string;
}

export interface SavedSuggestionItem {
  id: number;
  user_id: number;
  conversation_id: number;
  category: string;
  title: string;
  content: string;
  created_at: string;
}

export interface AnalyticsData {
  totalConversations: number;
  totalFeedbacks: number;
  likesCount: number;
  dislikesCount: number;
  avgRating: string;
  networkingScore: number;
  topicTrends: { name: string; value: number }[];
  weeklyUsage: { day: string; count: number }[];
}
