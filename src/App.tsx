/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, BookOpen, Clock, Cpu, AlertCircle, HelpCircle, LogOut, User as UserIcon } from "lucide-react";
import { InputForm } from "./components/InputForm.js";
import { StarterList } from "./components/StarterList.js";
import { FactChecker } from "./components/FactChecker.js";
import { HistorySection } from "./components/HistorySection.js";
import { LoginPage } from "./components/LoginPage.js";
import { Logo } from "./components/Logo.js";
import { HistoryItem, ConversationStarter, FactCheckResult } from "./types.js";
import { motion } from "motion/react";

export default function App() {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Sandbox-safe localStorage Accessors
  const getStoredToken = (): string | null => {
    try {
      return localStorage.getItem("net_assist_token");
    } catch (e) {
      console.warn("Storage access blocked by sandbox:", e);
      return null;
    }
  };

  const setStoredToken = (val: string | null) => {
    try {
      if (val) {
        localStorage.setItem("net_assist_token", val);
      } else {
        localStorage.removeItem("net_assist_token");
      }
    } catch (e) {
      console.warn("Storage access blocked by sandbox:", e);
    }
  };

  // Authentication State
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verify and fetch profile on load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const response = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.user) {
            setUser(result.user);
            // Fetch history with the verified token
            fetchHistory(token);
          } else {
            setStoredToken(null);
            setToken(null);
          }
        } else {
          setStoredToken(null);
          setToken(null);
        }
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [token]);

  const fetchHistory = async (authToken?: string) => {
    setIsHistoryLoading(true);
    setGlobalError(null);
    const activeToken = authToken !== undefined ? authToken : token;
    try {
      const response = await fetch("/history", {
        headers: activeToken ? { "Authorization": `Bearer ${activeToken}` } : {}
      });
      if (!response.ok) {
        throw new Error("Failed to load conversation history from server.");
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setHistoryList(result.data);
      }
    } catch (err: any) {
      console.error("History fetch error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleAuthSuccess = (newToken: string, loggedUser: any) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(loggedUser);
    fetchHistory(newToken);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Logout failure:", err);
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setHistoryList([]);
      setActiveItem(null);
    }
  };

  const handleGenerate = async (eventDescription: string, interests: string) => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const response = await fetch("/generate-conversation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ eventDescription, interests }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Generation request failed on backend.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        const newItem: HistoryItem = result.data;
        setActiveItem(newItem);
        
        // Add to local history list instantly
        setHistoryList((prev) => [newItem, ...prev]);
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setGlobalError(
        err.message || "An unexpected error occurred. Please verify your GEMINI_API_KEY."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFactCheck = async (query: string): Promise<FactCheckResult> => {
    const response = await fetch("/fact-check", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Fact-check search failed.");
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error("Unable to parse fact-check result.");
  };

  const handleFeedbackSubmitted = async (suggestion: string, feedbackType: "like" | "dislike") => {
    try {
      const response = await fetch("/feedback", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversationId: activeItem?.id || null,
          suggestion,
          feedback: feedbackType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback to server.");
      }
    } catch (err) {
      console.error("Feedback submission failed:", err);
      throw err;
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      const response = await fetch(`/history/${id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error("Failed to delete history item.");
      }

      // Filter local state
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      
      // Clear active view if matching
      if (activeItem && activeItem.id === id) {
        setActiveItem(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setActiveItem(item);
    // Smooth scroll back to workspace if on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6 relative overflow-hidden" id="loading-screen">
        <div className="grain-overlay" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <Logo size={80} className="animate-pulse drop-shadow-[0_0_25px_rgba(200,255,0,0.3)]" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5 text-neutral-400 font-mono text-xs">
            <svg className="animate-spin h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="tracking-widest uppercase text-[10px]">Authorizing Secure Session...</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-mono tracking-wider">NETLINK.AI CONVERSATION SUITE</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative" id="app-root">
      <div className="grain-overlay" />
      
      {/* Decorative luxury gradient spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/3 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-secondary/3 blur-[150px] pointer-events-none" />

      {/* Premium Navigation Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} className="drop-shadow-[0_0_12px_rgba(200,255,0,0.2)]" />
          <div>
            <h1 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              NETLINK<span className="text-accent">.</span>AI
            </h1>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
              Personalized Networking Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-neutral-400 bg-white/[0.02] border border-white/5 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#c8ff00]"></span>
            <span>Gemini LLM Active</span>
          </span>

          <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 px-3.5 py-1.5 rounded-full shadow-lg">
            <div className="h-5 w-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <UserIcon className="w-3 h-3" />
            </div>
            <div className="flex flex-col text-left max-w-[120px] truncate">
              <span className="text-xs font-semibold text-neutral-200 leading-none truncate">{user.name}</span>
              <span className="text-[9px] text-neutral-500 leading-none font-mono mt-0.5 truncate">{user.profession || "Professional"}</span>
            </div>
          </div>

          <a
            href="/admin/db-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-accent/30 px-3.5 py-1.5 rounded-full shadow-lg transition duration-300 shrink-0"
            title="Open SQLite Database Viewer admin page"
            id="db-viewer-link"
          >
            <Clock className="w-3.5 h-3.5 text-accent animate-spin-slow" />
            <span className="hidden sm:inline">Database Viewer</span>
          </a>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-accent-secondary/30 px-3.5 py-1.5 rounded-full shadow-lg transition duration-300 cursor-pointer shrink-0"
            title="Log out of secure session"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5 text-accent-secondary" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-6 relative z-10">
        
        {/* Global Error Banner */}
        {globalError && (
          <div className="bg-accent-secondary/10 border border-accent-secondary/20 text-neutral-200 text-sm p-4 rounded-2xl flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 mt-0.5 text-accent-secondary shrink-0" />
            <div className="space-y-1">
              <span className="font-semibold font-display">Generation Problem Encountered</span>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {globalError}. Please make sure you have loaded your <span className="font-mono bg-black/40 px-1 rounded text-white">GEMINI_API_KEY</span> in the **Settings &gt; Secrets** panel in AI Studio.
              </p>
            </div>
          </div>
        )}

        {/* Info walkthrough banner */}
        <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 spotlight-card">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-base font-semibold text-neutral-200 flex items-center gap-1.5 font-display">
              <Sparkles className="w-4 h-4 text-accent" />
              Maximize Your Social Reach
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Skip standard clichés. Our engine analyzes professional conferences, workshops, and user-provided interests using customized NLP topic models. We generate natural openers complete with conversational context recommendations.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
            <div className="text-center bg-black/40 px-3.5 py-2 border border-white/5 rounded-xl min-w-[80px]">
              <div className="text-accent font-mono text-sm font-semibold">{historyList.length}</div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Logged</div>
            </div>
            <div className="text-center bg-black/40 px-3.5 py-2 border border-white/5 rounded-xl min-w-[80px]">
              <div className="text-accent font-mono text-sm font-semibold">Gemini</div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Optimizer</div>
            </div>
          </div>
        </div>

        {/* 2 Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Forms and Utilities */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
            <FactChecker onFactCheck={handleFactCheck} />
          </div>

          {/* Right Column: Output Showcase & Logs */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            {/* Active Workspace / Output */}
            <StarterList
              topics={activeItem ? activeItem.extractedTopics : []}
              starters={activeItem ? activeItem.conversationStarters : []}
              conversationId={activeItem ? activeItem.id : null}
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />

            {/* Persistence & History Logs */}
            <HistorySection
              history={historyList}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
              isLoading={isHistoryLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-8 mt-16 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NetLink AI Suite. Crafted with obsession.</p>
          <div className="flex items-center gap-4 text-neutral-600 font-mono text-[10px]">
            <span>POWERED BY GEMINI 3.5 FLASH</span>
            <span>•</span>
            <span>WIKIPEDIA REST GROUNDING</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
