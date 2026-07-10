/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Compass, Lightbulb, Briefcase } from "lucide-react";
import { motion } from "motion/react";

interface InputFormProps {
  onSubmit: (eventDescription: string, interests: string) => void;
  isLoading: boolean;
}

const SAMPLE_EVENTS = [
  {
    title: "Global Tech Innovation Summit",
    desc: "A conference focusing on AI scalability, hybrid cloud architectures, and machine learning developer workflows in enterprise systems.",
    interests: "Distributed databases, LLMs in production, green energy"
  },
  {
    title: "FinTech Leadership Meetup",
    desc: "Networking event for fintech leaders discussing blockchain integrations, algorithmic trading microservices, and regulatory compliance.",
    interests: "Data privacy, rust web frameworks, decentralized finance"
  },
  {
    title: "UX Design & Product Strategy Conference",
    desc: "Focusing on human-centered design systems, spatial computing interactions, design-to-development handoffs, and user testing metrics.",
    interests: "Interactive animations, design systems, Figma API"
  }
];

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [eventDescription, setEventDescription] = useState("");
  const [interests, setInterests] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDescription.trim()) return;
    onSubmit(eventDescription, interests);
  };

  const loadSample = (sample: typeof SAMPLE_EVENTS[0]) => {
    setEventDescription(sample.desc);
    setInterests(sample.interests);
  };

  return (
    <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6 shadow-2xl spotlight-card" id="input-form-card">
      <div className="flex items-center gap-2 mb-6">
        <Compass className="text-accent w-5 h-5" />
        <h2 className="text-lg font-display font-bold text-white tracking-tight">Event Context & Goals</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="event-desc-input" className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 font-mono mb-2">
            Event Description *
          </label>
          <textarea
            id="event-desc-input"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Describe the professional event, keynote topics, panels, or industry vertical..."
            rows={4}
            required
            className="w-full bg-neutral-950/60 border border-white/10 text-neutral-200 placeholder-neutral-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/10 transition-all resize-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="interests-input" className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">
              Your Professional Interests
            </label>
            <span className="text-[10px] text-neutral-500 italic">Highly Recommended</span>
          </div>
          <input
            id="interests-input"
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. Serverless computing, VC, developer advocacy..."
            className="w-full bg-neutral-950/60 border border-white/10 text-neutral-200 placeholder-neutral-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !eventDescription.trim()}
          className="w-full bg-accent hover:bg-white disabled:bg-neutral-900 disabled:text-neutral-600 text-black font-semibold text-sm rounded-xl py-3 shadow-lg hover:shadow-[0_0_25px_rgba(200,255,0,0.25)] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          id="generate-button"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing Event & Devising Starters...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black" />
              <span>Generate Handcrafted Starters</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestions / Pre-sets */}
      <div className="mt-6 border-t border-white/5 pt-6">
        <div className="flex items-center gap-1.5 mb-3">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest font-mono">Quick Test Templates</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {SAMPLE_EVENTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(sample)}
              className="text-left bg-white/[0.01] border border-white/5 hover:border-accent/20 p-3.5 rounded-xl hover:bg-white/[0.03] group transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-neutral-500 group-hover:text-accent transition-colors" />
                <span className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors font-display">
                  {sample.title}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-light line-clamp-1">{sample.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
