/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Lock, Mail, ArrowRight, Sparkles, LogIn, KeyRound } from "lucide-react";
import { motion } from "motion/react";

interface AuthModalProps {
  onAuthSuccess: (token: string, user: any) => void;
  onCancelGuest?: () => void;
}

export function AuthModal({ onAuthSuccess, onCancelGuest }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [role, setRole] = useState("Professional");
  const [industry, setIndustry] = useState("");
  const [interests, setInterests] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Senior");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { email, password }
      : {
          name,
          email,
          password,
          profession,
          role,
          industry,
          interests,
          experience_level: experienceLevel
        };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-400 mb-3.5 shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight">
          {isLogin ? "Welcome Back" : "Create Professional Account"}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {isLogin 
            ? "Sign in to access your custom networking roadmaps, dashboards, and premium templates."
            : "Register to isolate your history, save favorites, and customize AI response contexts."
          }
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Secure Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        {!isLogin && (
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Profession</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Software Engineer"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Role/Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
              >
                <option value="Student">Student</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Executive">Executive</option>
                <option value="Founder">Founder</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-medium rounded-xl py-3 text-sm shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <span>{isLogin ? "Access Platform" : "Register Credentials"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-500">
        <span>{isLogin ? "New to the platform? " : "Already have an account? "}</span>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-emerald-400 hover:text-emerald-300 font-medium underline focus:outline-none"
        >
          {isLogin ? "Create Account" : "Log In"}
        </button>
      </div>

      {onCancelGuest && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 text-center">
          <button
            onClick={onCancelGuest}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Continue in Guest Sandbox Mode
          </button>
        </div>
      )}
    </div>
  );
}
