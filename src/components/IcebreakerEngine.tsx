/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, Compass, Lightbulb, Briefcase, ThumbsUp, ThumbsDown, 
  Copy, Check, RefreshCw, Star, Heart, AlertCircle, HelpCircle,
  MessageSquare, UserPlus, Coffee, Mail, Radio, Award, Eye, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryItem, SuggestionItem, User } from "../types.js";

interface IcebreakerEngineProps {
  user: User | null;
  token: string | null;
  onGenerate: (formData: {
    eventDescription: string;
    interests: string;
    eventType: string;
    industry: string;
  }) => Promise<HistoryItem | null>;
  activeItem: HistoryItem | null;
  setActiveItem: (item: HistoryItem | null) => void;
  isLoading: boolean;
}

const EVENT_TYPES = [
  "Conference Summit", "Workshop / Bootcamp", "Panel Discussion", 
  "Networking Reception", "Executive Round Table", "Casual Meetup", 
  "Company Hackathon", "Investor Pitch Dinner"
];

const INDUSTRIES = [
  "Artificial Intelligence / ML", "FinTech / BlockChain", "HealthTech / Biotech",
  "SaaS & Enterprise Cloud", "Cybersecurity", "UX Design & Interactive Systems",
  "Hardware & Robotics", "Green Energy / Sustainability"
];

const CATEGORY_MAP: Record<string, { label: string; desc: string; icon: any }> = {
  ice_breakers: { label: "Ice Breakers", desc: "Short, spontaneous opening lines for common areas.", icon: Coffee },
  professional_introduction: { label: "Professional Intro", desc: "Introduce yourself clearly matching the event theme.", icon: Briefcase },
  follow_up_questions: { label: "Follow-up Questions", desc: "Keep the momentum going after the initial exchange.", icon: MessageSquare },
  common_interests: { label: "Common Interests", desc: "Hooks that connect your background with event topics.", icon: Heart },
  networking_strategy: { label: "Tactical Strategy", desc: "High-level psychological action plan for navigating.", icon: Compass },
  speaker_questions: { label: "Speaker Q&A", desc: "High-caliber questions to ask speakers after panels.", icon: Radio },
  panel_discussion_questions: { label: "Panel Debates", desc: "Witty talking points to discuss with fellow attendees.", icon: HelpCircle },
  collaboration_opportunities: { label: "Collaboration Proposals", desc: "Natural pitches for co-authoring, pilots, or trials.", icon: Sparkles },
  linkedin_follow_up: { label: "LinkedIn Follow-ups", desc: "Pre-written invitation notes to send on LinkedIn.", icon: UserPlus },
  coffee_break: { label: "Coffee Break Talks", desc: "Lighthearted conversations near snacks and espresso bars.", icon: Coffee },
  business_card: { label: "Card Exchanges", desc: "Warm templates for follow-up emails post-meeting.", icon: Mail },
  elevator_pitch: { label: "Elevator Pitch", desc: "Compact 15-30 second self-pitch based on your profile.", icon: Award },
  session_specific: { label: "Session Discussions", desc: "Conversational themes tailored to specific panel agendas.", icon: FileText },
  closing_conversation: { label: "Polite Wrap-ups", desc: "Memorable ways to wrap up and exit without awkwardness.", icon: MessageSquare },
  recruiter_questions: { label: "Recruiter Prompts", desc: "High-value questions to impress hiring teams and recruiters.", icon: Briefcase },
  founder_questions: { label: "Founder Inquiries", desc: "Engaging questions for startup founders and creators.", icon: Sparkles },
  investor_questions: { label: "Investor Pitch Questions", desc: "Sophisticated topics for speaking with angels and VCs.", icon: Award },
  technical_discussion: { label: "Deep Tech Points", desc: "Advanced technical discussion prompts for engineers.", icon: FileText },
  business_discussion: { label: "Business & Strategy", desc: "Strategic points covering revenue, market size, and scaling.", icon: Compass },
  common_challenges: { label: "Common Bottlenecks", desc: "Topics discussing standard industry-wide pain points.", icon: AlertCircle },
  future_trends: { label: "Future Trends", desc: "Forward-looking themes on upcoming industry paradigm shifts.", icon: Compass },
  success_tips: { label: "Success Master Tips", desc: "Elite communication rules to guarantee a successful meetup.", icon: Lightbulb }
};

export function IcebreakerEngine({ user, token, onGenerate, activeItem, setActiveItem, isLoading }: IcebreakerEngineProps) {
  const [eventDescription, setEventDescription] = useState("");
  const [interests, setInterests] = useState("");
  const [eventType, setEventType] = useState("Conference Summit");
  const [industry, setIndustry] = useState("Artificial Intelligence / ML");

  const [selectedCategory, setSelectedCategory] = useState<string>("ice_breakers");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded Feedback State
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});
  const [isFavorited, setIsFavorited] = useState<Record<string, boolean>>({});
  const [isPoorFlag, setIsPoorFlag] = useState<Record<string, boolean>>({});
  
  // Single-item Regeneration state
  const [regeneratingIds, setRegeneratingIds] = useState<Record<string, boolean>>({});
  const [replacements, setReplacements] = useState<Record<string, SuggestionItem>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDescription.trim()) return;
    
    // Clear states
    setRatings({});
    setComments({});
    setCommentOpen({});
    setFeedbackSubmitted({});
    setIsFavorited({});
    setIsPoorFlag({});
    setReplacements({});

    await onGenerate({ eventDescription, interests, eventType, industry });
    setSelectedCategory("ice_breakers");
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (itemId: string, itemText: string) => {
    if (!token || !activeItem) return;
    
    const wasFav = isFavorited[itemId];
    setIsFavorited(prev => ({ ...prev, [itemId]: !wasFav }));

    if (!wasFav) {
      try {
        await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            conversationId: activeItem.id,
            suggestionText: itemText,
            category: selectedCategory
          })
        });
      } catch (err) {
        console.error("Failed to add favorite", err);
      }
    }
  };

  const handleReportPoor = async (itemId: string, itemText: string) => {
    setIsPoorFlag(prev => ({ ...prev, [itemId]: true }));
    try {
      await fetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversationId: activeItem?.id || null,
          suggestion: itemText,
          feedback: "dislike",
          isPoor: true
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRating = (itemId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const submitFeedbackComments = async (itemId: string, itemText: string) => {
    const r = ratings[itemId] || 5;
    const comment = comments[itemId] || "";
    
    setFeedbackSubmitted(prev => ({ ...prev, [itemId]: true }));

    try {
      await fetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversationId: activeItem?.id || null,
          suggestion: itemText,
          feedback: r >= 3 ? "like" : "dislike",
          rating: r,
          feedbackText: comment
        })
      });
      
      setCommentOpen(prev => ({ ...prev, [itemId]: false }));
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  const handleRegenerateItem = async (itemId: string, previousText: string) => {
    if (!activeItem || regeneratingIds[itemId]) return;

    setRegeneratingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const response = await fetch("/api/regenerate-suggestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversationId: activeItem.id,
          category: selectedCategory,
          previousText
        })
      });

      if (!response.ok) throw new Error("Regeneration request failed");
      const result = await response.json();
      if (result.success && result.data) {
        setReplacements(prev => ({ ...prev, [itemId]: result.data }));
      }
    } catch (err) {
      console.error("Failed to regenerate", err);
    } finally {
      setRegeneratingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="space-y-6" id="icebreaker-engine-workspace">
      
      {/* 1. Input Form Card */}
      {!activeItem && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 h-48 w-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800/80 pb-4">
            <Compass className="text-emerald-400 w-5 h-5" />
            <h2 className="text-xl font-display font-semibold text-slate-100 tracking-tight">Event Intelligence Engine</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Event Medium Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Industry Vertical</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="event-description-textarea" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Event Description or Abstract *</label>
              <textarea
                id="event-description-textarea"
                required
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Paste the official event agenda, conference schedule, panel subjects, or key abstract goals here..."
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-700 rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="interests-input-field" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">My Specific Focus Interests</label>
                <span className="text-[10px] text-slate-500 italic">Pre-fills from profile if empty</span>
              </div>
              <input
                id="interests-input-field"
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Distributed backend microservices, angel seed deals, customer acquisition..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-700 rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !eventDescription.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-sm rounded-xl py-3.5 shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Gemini Orchestrating 14 Tactical Categories...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Full Event Playbook</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 2. Full Structured Workspace Screen */}
      {activeItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          
          {/* Left Category Selector Pane */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-xl">
            
            {/* Playbook Header */}
            <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-800/60">
              <div>
                <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest">Active Roadmap</span>
                <h4 className="text-sm font-semibold text-slate-100 font-display">Playbook Categories</h4>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-[10px] text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-950 px-2.5 py-1 rounded"
              >
                Reset Engine
              </button>
            </div>

            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 py-1 lg:py-0 scrollbar-none">
              {Object.entries(CATEGORY_MAP).map(([key, value]) => {
                const Icon = value.icon;
                const itemsList = activeItem.conversationStarters?.categories?.[key as keyof typeof activeItem.conversationStarters.categories] || [];
                const isActive = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all shrink-0 lg:shrink ${
                      isActive 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                        : "hover:bg-slate-950 border border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="truncate flex-1">
                      <div>{value.label}</div>
                    </div>
                    <span className="text-[10px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded font-mono text-slate-500">
                      {itemsList.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Selected Category View Pane */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Active Header Overview */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <h3 className="text-base font-display font-bold text-slate-200">
                  {CATEGORY_MAP[selectedCategory]?.label}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CATEGORY_MAP[selectedCategory]?.desc}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase font-semibold">
                  Event Score: {activeItem.networkingScore || activeItem.conversationStarters.networking_score || 70}%
                </span>
              </div>
            </div>

            {/* AI Strategic Analysis & Briefing Card */}
            {activeItem.conversationStarters?.ai_insights && (
              <div className="bg-slate-900 border border-emerald-500/15 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden animate-fadeIn">
                <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
                  <Sparkles className="text-emerald-400 w-4 h-4" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">Personalized AI Insights Brief</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Event Culture & Jargon Analysis:</h5>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                      {activeItem.conversationStarters.ai_insights.event_analysis}
                    </p>
                  </div>

                  {activeItem.conversationStarters.ai_insights.key_opportunities && activeItem.conversationStarters.ai_insights.key_opportunities.length > 0 && (
                    <div>
                      <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Identified Strategic Opportunities:</h5>
                      <ul className="list-disc list-inside text-xs text-slate-300 mt-1.5 space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                        {activeItem.conversationStarters.ai_insights.key_opportunities.map((opp, idx) => (
                          <li key={idx} className="leading-relaxed pl-1">{opp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Overarching Recommendation:</h5>
                    <div className="mt-1.5 p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-300 font-medium leading-relaxed">
                      {activeItem.conversationStarters.ai_insights.strategic_focus}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Cards Block */}
            <div className="space-y-4">
              {(() => {
                const rawItems = activeItem.conversationStarters?.categories?.[selectedCategory as keyof typeof activeItem.conversationStarters.categories] || [];
                
                if (rawItems.length === 0) {
                  return (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl py-12 text-center text-xs text-slate-500 italic">
                      No suggestions generated for this category.
                    </div>
                  );
                }

                return rawItems.map((rawItem, idx) => {
                  const itemId = `${selectedCategory}_${idx}`;
                  
                  // Handle live replacements and poor flags
                  const isPoor = isPoorFlag[itemId];
                  if (isPoor) return null; // hide

                  const item = replacements[itemId] || rawItem;
                  const itemFav = isFavorited[itemId];
                  const isRegenerating = regeneratingIds[itemId];
                  const activeRating = ratings[itemId] || 0;
                  const openComment = commentOpen[itemId];
                  const hasSubmittedFeedback = feedbackSubmitted[itemId];

                  return (
                    <div 
                      key={itemId}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all"
                    >
                      {/* Suggestion Text */}
                      <div className="relative mb-5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1.5 font-mono">Tactical Phrasing</div>
                        <p className="text-slate-100 text-sm font-sans leading-relaxed italic select-all selection:bg-emerald-500/20 pr-6">
                          "{item.text}"
                        </p>
                      </div>

                      {/* Recommended Context */}
                      <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-[11px] leading-relaxed text-slate-400 font-mono mb-5 flex items-start gap-2">
                        <Compass className="w-3.5 h-3.5 mt-0.5 text-emerald-400/80 shrink-0" />
                        <div>
                          <span className="text-slate-200 font-semibold">Suggested Timing / Space: </span>
                          {item.scenario}
                        </div>
                      </div>

                      {/* Tactical Controls row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/60">
                        
                        {/* Rating block */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mr-1.5">Rating:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => {
                                handleRating(itemId, star);
                                setCommentOpen(prev => ({ ...prev, [itemId]: true }));
                              }}
                              className="text-slate-600 hover:text-amber-400 p-0.5 transition-colors focus:outline-none cursor-pointer"
                            >
                              <Star className={`w-3.5 h-3.5 ${star <= activeRating ? 'text-amber-400 fill-amber-400' : ''}`} />
                            </button>
                          ))}
                          
                          {hasSubmittedFeedback && (
                            <span className="text-[9px] text-emerald-400 font-mono ml-2">✓ Logged</span>
                          )}
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-2">
                          
                          {/* Report poor suggestion */}
                          <button
                            onClick={() => handleReportPoor(itemId, item.text)}
                            className="p-2 border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                            title="Report poor suggestion"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Regenerate better suggestion */}
                          <button
                            onClick={() => handleRegenerateItem(itemId, item.text)}
                            disabled={isRegenerating}
                            className="p-2 border border-slate-800 hover:border-sky-900/50 hover:bg-sky-950/20 text-slate-500 hover:text-sky-400 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                            title="Regenerate single alternative suggestion"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-sky-400' : ''}`} />
                          </button>

                          {/* Favorite suggest */}
                          {token && (
                            <button
                              onClick={() => handleToggleFavorite(itemId, item.text)}
                              className={`p-2 border rounded-xl transition-all cursor-pointer ${
                                itemFav 
                                  ? "bg-pink-500/10 border-pink-500 text-pink-400" 
                                  : "border-slate-800 hover:border-pink-900/30 hover:bg-pink-950/20 text-slate-500 hover:text-pink-400"
                              }`}
                              title="Favorite suggestion"
                            >
                              <Heart className={`w-3.5 h-3.5 ${itemFav ? 'fill-pink-400' : ''}`} />
                            </button>
                          )}

                          {/* Copy clipboard */}
                          <button
                            onClick={() => handleCopy(itemId, item.text)}
                            className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              copiedId === itemId 
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                                : "border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                            }`}
                          >
                            {copiedId === itemId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px]">Copy Phrasing</span>
                              </>
                            )}
                          </button>
                        </div>

                      </div>

                      {/* Interactive Written Comments Review Overlay panel */}
                      <AnimatePresence>
                        {openComment && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4 pt-4 border-t border-slate-800/60"
                          >
                            <div className="space-y-2">
                              <label htmlFor={`comment-textarea-${itemId}`} className="block text-[10px] text-slate-400 uppercase tracking-wider font-mono">Written Comments & Feedback</label>
                              <textarea
                                id={`comment-textarea-${itemId}`}
                                value={comments[itemId] || ""}
                                onChange={(e) => setComments(prev => ({ ...prev, [itemId]: e.target.value }))}
                                placeholder="Explain why this suggestion is great, or why you rated it low..."
                                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-700 resize-none h-14 focus:outline-none"
                              />
                              <div className="flex justify-end gap-2.5">
                                <button
                                  onClick={() => setCommentOpen(prev => ({ ...prev, [itemId]: false }))}
                                  className="px-3 py-1.5 text-[10px] text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => submitFeedbackComments(itemId, item.text)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Save Review
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  );
                });
              })()}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
