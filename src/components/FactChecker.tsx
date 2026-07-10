/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, BookOpen, ExternalLink, AlertCircle, HelpCircle } from "lucide-react";
import { FactCheckResult } from "../types.js";

interface FactCheckerProps {
  onFactCheck: (query: string) => Promise<FactCheckResult>;
}

export function FactChecker({ onFactCheck }: FactCheckerProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await onFactCheck(query);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "An error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6 shadow-2xl spotlight-card" id="fact-checker-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-accent w-5 h-5" />
          <h2 className="text-lg font-display font-bold text-white tracking-tight">Technical Fact Checker</h2>
        </div>
        <span className="text-[9px] text-neutral-400 bg-white/[0.02] px-2.5 py-1 border border-white/5 rounded-full font-mono uppercase tracking-wider scale-90">
          Wikipedia API
        </span>
      </div>

      <p className="text-neutral-400 text-xs leading-relaxed mb-5 font-light">
        Identify and lookup complex terms, technical frameworks, or speakers mentioned in your event description to stay perfectly informed.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. DistilBERT, Rust compiler, VC..."
          className="flex-1 bg-neutral-950/60 border border-white/10 text-neutral-200 placeholder-neutral-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/10 transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-accent hover:bg-white text-black disabled:bg-neutral-900 disabled:text-neutral-500 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span>Search</span>
        </button>
      </form>

      {/* Results panel */}
      {error && (
        <div className="bg-accent-secondary/10 border border-accent-secondary/20 text-neutral-200 text-xs p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-accent-secondary" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-tight text-neutral-200 font-display">
              {result.title || query}
            </h4>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="text-[10px] text-accent hover:text-white flex items-center gap-1 hover:underline transition-all font-mono uppercase tracking-wider"
              >
                <span>Read Wiki</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-neutral-400 text-[11px] font-light leading-relaxed">
            {result.summary}
          </p>
          {!result.found && (
            <div className="flex items-center gap-1 text-[9px] text-neutral-500 italic pt-1 font-mono">
              <HelpCircle className="w-3 h-3 text-accent" />
              <span>Descriptive search helper helper</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
