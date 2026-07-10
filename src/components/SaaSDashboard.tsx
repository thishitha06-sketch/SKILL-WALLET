/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Sparkles, TrendingUp, Users, Award, Clock, BookOpen, ChevronRight, 
  Target, Briefcase, ThumbsUp, Activity, CheckCircle2, Zap 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";
import { AnalyticsData, User } from "../types.js";

interface SaaSDashboardProps {
  user: User;
  token: string;
  onNavigateToEngine: () => void;
}

export function SaaSDashboard({ user, token, onNavigateToEngine }: SaaSDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAnalytics(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#10b981", "#3b82f6", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm text-slate-500 font-mono">Aggregating platform intelligence...</span>
      </div>
    );
  }

  // Fallback defaults if database has no entries
  const stats = {
    conversations: analytics?.totalConversations || 0,
    feedbacks: analytics?.totalFeedbacks || 0,
    likes: analytics?.likesCount || 0,
    avgRating: analytics?.avgRating || "0.0",
    score: analytics?.networkingScore || 70,
    trends: analytics?.topicTrends && analytics.topicTrends.length > 0 ? analytics.topicTrends : [
      { name: "Artificial Intelligence", value: 4 },
      { name: "SaaS Scaling", value: 3 },
      { name: "Venture Financing", value: 2 },
      { name: "Product Design", value: 2 }
    ],
    weekly: analytics?.weeklyUsage && analytics.weeklyUsage.some(w => w.count > 0) ? analytics.weeklyUsage : [
      { day: "Mon", count: 1 },
      { day: "Tue", count: 2 },
      { day: "Wed", count: 0 },
      { day: "Thu", count: 4 },
      { day: "Fri", count: 3 },
      { day: "Sat", count: 1 },
      { day: "Sun", count: 0 }
    ]
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="saas-dashboard-tab">
      
      {/* Top Banner Greeting */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
            <Zap className="w-3 h-3 fill-emerald-400" />
            <span>Active Enterprise Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-100 tracking-tight">
            Welcome back, <span className="gradient-text">{user.name}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your profile is configured as a <span className="text-emerald-400 font-semibold">{user.experience_level || "Senior"} {user.profession || "Professional"}</span>. We have computed your networking stats across SQLite event records.
          </p>
        </div>
        
        <button
          onClick={onNavigateToEngine}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <span>Deconstruct New Event</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 bg-violet-500/10 text-violet-400 p-2.5 rounded-xl border border-violet-500/20">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Networking Score</span>
          <div className="text-3xl font-display font-bold text-violet-400 mt-1.5 font-mono">
            {stats.score}%
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-sans">
            Overall professional readiness.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Roadmaps Generated</span>
          <div className="text-3xl font-display font-bold text-emerald-400 mt-1.5 font-mono">
            {stats.conversations}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-sans">
            Events parsed via DistilBERT NLP.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Feedback Rating</span>
          <div className="text-3xl font-display font-bold text-sky-400 mt-1.5 font-mono">
            {stats.avgRating} <span className="text-xs text-slate-500">/ 5.0</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-sans">
            Average rating across {stats.feedbacks} reviews.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Positive Signals</span>
          <div className="text-3xl font-display font-bold text-amber-400 mt-1.5 font-mono">
            {stats.likes}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-sans">
            Suggestions marked with Likes.
          </p>
        </div>

      </div>

      {/* Recharts Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Chart: Weekly Activity Area */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-400 w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-200">Weekly Generation Volume</h3>
          </div>
          <div className="h-56 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weekly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#4b5563" />
                <YAxis stroke="#4b5563" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f3f4f6" }}
                  labelClassName="font-bold text-emerald-400"
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Hot Topics Bar */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="text-sky-400 w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-200">Active Industry Themes</h3>
          </div>
          <div className="h-56 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trends} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis type="number" stroke="#4b5563" hide />
                <YAxis dataKey="name" type="category" stroke="#4b5563" width={80} tickFormatter={(val) => val.length > 10 ? `${val.slice(0, 8)}..` : val} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f3f4f6" }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14}>
                  {stats.trends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tactical Playbook Goals & Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Onboarding Box 1 */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">1</div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Perfect Your Elevator Pitch</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Generate an active roadmap. Navigate to Category #12 (Elevator Pitch) to copy your 30-second conversational hook.
          </p>
        </div>

        {/* Onboarding Box 2 */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-mono font-bold text-sm">2</div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Follow Up on LinkedIn</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            After exchanging details, use Category #9 (LinkedIn Follow-up) to send a personalized connection invite within 24 hours.
          </p>
        </div>

        {/* Onboarding Box 3 */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="h-9 w-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-sm">3</div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Verify Technical Terms</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Unsure of an exotic technology discussed during a talk? Use the Fact Checker sidebar utility to fetch real Wikipedia abstracts instantly.
          </p>
        </div>

      </div>

    </div>
  );
}
