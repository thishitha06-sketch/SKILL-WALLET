/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Clock, Trash2, ArrowRight, Download, FileText, Share2, HelpCircle } from "lucide-react";
import { HistoryItem } from "../types.js";

interface HistorySectionProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export function HistorySection({ history, onSelect, onDelete, isLoading }: HistorySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.eventDescription.toLowerCase().includes(q) ||
      (item.interests && item.interests.toLowerCase().includes(q)) ||
      item.extractedTopics.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleExportText = (item: HistoryItem) => {
    let output = `==================================================\n`;
    output += `NETWORKING PLAYBOOK: ${item.eventType || "Conference"}\n`;
    output += `DATE GENERATED: ${new Date(item.timestamp).toLocaleString()}\n`;
    output += `EVENT DETAILS: ${item.eventDescription}\n`;
    output += `MY INTERESTS: ${item.interests}\n`;
    output += `Calculated Readiness Score: ${item.networkingScore || 75}%\n`;
    output += `==================================================\n\n`;

    if (item.conversationStarters?.categories) {
      const cats = item.conversationStarters.categories;
      Object.entries(cats).forEach(([catKey, list]: any) => {
        output += `>>> CATEGORY: ${catKey.replace(/_/g, " ").toUpperCase()}\n`;
        list.forEach((s: any, idx: number) => {
          output += `   [Option #${idx + 1}] "${s.text}"\n`;
          output += `   [Scenario Context] ${s.scenario}\n\n`;
        });
      });
    }

    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `networking-playbook-${item.id}.txt`;
    link.click();
  };

  const handleExportCSV = (item: HistoryItem) => {
    let csv = `"Category","Option ID","Suggestion / Opener","Context Scenario"\n`;
    
    if (item.conversationStarters?.categories) {
      const cats = item.conversationStarters.categories;
      Object.entries(cats).forEach(([catKey, list]: any) => {
        list.forEach((s: any, idx: number) => {
          const cat = catKey.replace(/_/g, " ").toUpperCase();
          const cleanText = s.text.replace(/"/g, '""');
          const cleanScenario = s.scenario.replace(/"/g, '""');
          csv += `"${cat}","${idx + 1}","${cleanText}","${cleanScenario}"\n`;
        });
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `networking-playbook-${item.id}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-neutral-500 font-mono">Querying history database...</span>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.015] border border-white/5 rounded-3xl p-6 shadow-2xl animate-fadeIn spotlight-card" id="history-section-panel">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-5">
        <div className="flex items-center gap-2">
          <Clock className="text-accent w-5 h-5" />
          <div>
            <h3 className="text-base font-display font-bold text-white">Playbook Archive History</h3>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Retrieved from secure SQLite persistence</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-600 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roadmaps..."
            className="w-full bg-neutral-950/60 border border-white/10 hover:border-accent/20 text-xs text-neutral-200 placeholder-neutral-600 rounded-xl pl-8.5 pr-3.5 py-2.5 focus:outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500 italic font-light">
          {searchQuery ? "No matching historic playbooks found." : "Your generated playbooks and event roadmaps will be stored here."}
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-950/40 border border-white/5 hover:border-accent/15 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] text-accent font-mono font-semibold uppercase tracking-wider bg-accent/10 border border-accent/10 px-2 py-0.5 rounded-full">
                    {item.eventType || "Conference"}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-accent-secondary font-mono font-semibold">
                    Readiness: {item.networkingScore || item.conversationStarters.networking_score || 70}%
                  </span>
                </div>
                
                <h4 className="text-xs font-semibold text-white truncate pr-4 font-display">
                  {item.eventDescription}
                </h4>
                
                {item.interests && (
                  <p className="text-[10px] text-neutral-400 truncate font-light">
                    Focus: {item.interests}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Export TXT */}
                <button
                  onClick={() => handleExportText(item)}
                  className="p-2 bg-white/[0.01] border border-white/5 hover:border-accent/20 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Export Playbook as TXT File"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                {/* Export CSV */}
                <button
                  onClick={() => handleExportCSV(item)}
                  className="p-2 bg-white/[0.01] border border-white/5 hover:border-accent/20 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Export Playbook as CSV File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this event playbook from history?")) {
                      onDelete(item.id);
                    }
                  }}
                  className="p-2 bg-white/[0.01] border border-white/5 hover:border-accent-secondary/30 text-neutral-500 hover:text-accent-secondary rounded-lg transition-all cursor-pointer"
                  title="Delete event playbook"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* View/Restore */}
                <button
                  onClick={() => onSelect(item)}
                  className="px-3 py-1.5 bg-accent hover:bg-white text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-300 cursor-pointer"
                >
                  <span className="font-mono text-[10px] uppercase">Load</span>
                  <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
