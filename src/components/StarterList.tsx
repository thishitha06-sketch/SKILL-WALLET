/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Copy, Check, Hash, TrendingUp, MessageSquare, AlertCircle } from "lucide-react";
import { ConversationStarter } from "../types.js";
import { motion, AnimatePresence } from "motion/react";

interface StarterListProps {
  topics: string[];
  starters: any;
  conversationId: number | null;
  onFeedbackSubmitted: (suggestion: string, feedbackType: "like" | "dislike") => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  ice_breakers: "Ice Breakers",
  professional_introduction: "Professional Intro",
  follow_up_questions: "Follow-up",
  common_interests: "Common Interests",
  networking_strategy: "Strategy",
  speaker_questions: "For Speakers",
  panel_discussion_questions: "For Panelists",
  collaboration_opportunities: "Collaboration",
  linkedin_follow_up: "LinkedIn Connect",
  coffee_break: "Coffee Break",
  business_card: "Email Follow-up",
  elevator_pitch: "Elevator Pitch",
  session_specific: "Session Chat",
  closing_conversation: "Graceful Exit",
};

export function StarterList({ topics, starters, conversationId, onFeedbackSubmitted }: StarterListProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<number, "like" | "dislike">>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>("");

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handleFeedback = async (id: number, text: string, type: "like" | "dislike") => {
    if (loadingFeedback[id]) return;

    setLoadingFeedback((prev) => ({ ...prev, [id]: true }));
    try {
      await onFeedbackSubmitted(text, type);
      setFeedbackState((prev) => ({ ...prev, [id]: type }));
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setLoadingFeedback((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Determine format of starters
  const isRich = starters && typeof starters === "object" && !Array.isArray(starters);
  const categoriesObj = isRich ? (starters.categories || {}) : null;
  const score = isRich ? (starters.networking_score || null) : null;

  // Extract categories that actually have elements
  const availableCategories = categoriesObj
    ? Object.keys(categoriesObj).filter((key) => Array.isArray(categoriesObj[key]) && categoriesObj[key].length > 0)
    : [];

  const currentCategory = activeCategory && availableCategories.includes(activeCategory)
    ? activeCategory
    : (availableCategories[0] || "");

  const displayedStarters = categoriesObj
    ? (categoriesObj[currentCategory] || [])
    : (Array.isArray(starters) ? starters : []);

  const hasNoStarters = displayedStarters.length === 0 && (!categoriesObj || availableCategories.length === 0);

  if (hasNoStarters) {
    return (
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[350px] spotlight-card">
        <div className="bg-neutral-950 p-4.5 rounded-full border border-white/10 mb-4 text-accent animate-pulse">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-white font-display font-bold text-base mb-1">Waiting for Context</h3>
        <p className="text-neutral-500 text-xs max-w-xs font-light">
          Provide an event description and hit the generate button to craft professional icebreakers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Readiness Score Banner */}
      {score !== null && (
        <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 shadow-2xl spotlight-card flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-accent font-mono">
              NetLink Prep Rating
            </span>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Your overall readiness level computed for this specific conference context.
            </p>
          </div>
          <div className="relative flex items-center justify-center h-14 w-14 shrink-0 bg-neutral-900 border border-white/10 rounded-full">
            <span className="text-sm font-mono font-bold text-accent">
              {score}%
            </span>
          </div>
        </div>
      )}

      {/* Extracted Topics */}
      {topics.length > 0 && (
        <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 shadow-2xl spotlight-card" id="extracted-topics-panel">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-accent w-4 h-4" />
            <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest font-mono">
              DistilBERT Topic Extraction
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <span
                key={index}
                className="bg-white/[0.01] border border-white/5 text-neutral-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 hover:border-accent/40 transition-colors"
              >
                <Hash className="w-3 h-3 text-accent/70" />
                <span>{topic}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills (Horizontal Scrollable) */}
      {availableCategories.length > 0 && (
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 font-mono px-1">
            Tactical Strategy Playbooks
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {availableCategories.map((catKey) => {
              const isActive = catKey === currentCategory;
              const count = categoriesObj[catKey]?.length || 0;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setActiveCategory(catKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium tracking-tight whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-accent border-accent text-black font-semibold shadow-[0_0_12px_rgba(200,255,0,0.15)]"
                      : "bg-white/[0.01] border-white/5 text-neutral-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  <span>{CATEGORY_LABELS[catKey] || catKey.replace(/_/g, " ")}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                    isActive ? "bg-black/10 text-black" : "bg-white/[0.03] text-neutral-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Starters List */}
      <div className="space-y-4" id="starters-list">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest font-mono">
            {categoriesObj ? `${CATEGORY_LABELS[currentCategory] || "Selected Category"} Options` : "Curated Conversation Starters"}
          </h3>
          <span className="text-neutral-400 text-[10px] uppercase font-mono tracking-wider bg-white/[0.02] px-2.5 py-1 border border-white/5 rounded-full scale-90">
            {displayedStarters.length} Options
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {displayedStarters.map((starter: any, index: number) => {
            const hasLiked = feedbackState[starter.id] === "like";
            const hasDisliked = feedbackState[starter.id] === "dislike";
            const isCopying = copiedId === starter.id;

            return (
              <motion.div
                key={starter.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 hover:border-accent/30 transition-all duration-300 shadow-xl relative overflow-hidden group"
              >
                {/* Starter Text */}
                <p className="text-white text-[15px] leading-relaxed pr-8 select-all selection:bg-accent/20 mb-4 font-light">
                  "{starter.text}"
                </p>

                {/* Scenario & Controls Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent bg-accent/5 border border-accent/15 px-3 py-1 rounded-full max-w-full sm:max-w-[70%] truncate" title={starter.scenario}>
                    Scenario: {starter.scenario}
                  </span>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {/* Like button */}
                    <button
                      onClick={() => handleFeedback(starter.id, starter.text, "like")}
                      disabled={hasLiked || hasDisliked || loadingFeedback[starter.id]}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        hasLiked
                          ? "bg-accent/10 border-accent text-accent"
                          : "border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      title="Like this starter"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Dislike button */}
                    <button
                      onClick={() => handleFeedback(starter.id, starter.text, "dislike")}
                      disabled={hasLiked || hasDisliked || loadingFeedback[starter.id]}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        hasDisliked
                          ? "bg-accent-secondary/10 border-accent-secondary text-accent-secondary"
                          : "border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      title="Dislike this starter"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(starter.id, starter.text)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                        isCopying
                          ? "bg-accent/10 border-accent text-accent"
                          : "border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      title="Copy to clipboard"
                    >
                      {isCopying ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-accent animate-pulse" />
                          <span className="text-[10px] font-mono">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden group-hover:inline font-mono">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
