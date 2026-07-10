/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User as UserIcon, Briefcase, Mail, Landmark, Compass, Award, Target, Save, Check, Shield } from "lucide-react";
import { User } from "../types.js";

interface ProfileSettingsProps {
  user: User;
  token: string;
  onUpdateSuccess: (updatedUser: User) => void;
}

export function ProfileSettings({ user, token, onUpdateSuccess }: ProfileSettingsProps) {
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company || "");
  const [profession, setProfession] = useState(user.profession || "");
  const [role, setRole] = useState(user.role || "");
  const [industry, setIndustry] = useState(user.industry || "");
  const [interests, setInterests] = useState(user.interests || "");
  const [experienceLevel, setExperienceLevel] = useState(user.experience_level || "Senior");
  const [careerGoals, setCareerGoals] = useState(user.career_goals || "");
  const [networkingGoals, setNetworkingGoals] = useState(user.networking_goals || "");

  // Preferences
  const [theme, setTheme] = useState("dark");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/preferences", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setTheme(result.data.theme || "dark");
          setNotificationsEnabled(result.data.notifications_enabled === 1);
        }
      }
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // 1. Save profile details
      const profRes = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          company,
          profession,
          role,
          industry,
          interests,
          experience_level: experienceLevel,
          career_goals: careerGoals,
          networking_goals: networkingGoals
        })
      });

      const profData = await profRes.json();
      if (!profRes.ok) throw new Error(profData.error || "Failed to update profile.");

      // 2. Save preferences
      await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ theme, notificationsEnabled })
      });

      onUpdateSuccess(profData.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn" id="profile-settings-tab">
      
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
        <UserIcon className="text-emerald-400 w-5 h-5" />
        <h2 className="text-xl font-display font-semibold text-slate-100 tracking-tight">Profile & Preferences Settings</h2>
      </div>

      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2 justify-center">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Profile configuration saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-slate-800/60">
            <Shield className="w-3.5 h-3.5 text-emerald-400/80" />
            Core Account Credentials
          </h3>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-slate-950 border border-slate-850 text-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Account Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Company/Employer</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Landmark className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ACME Corp"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors cursor-pointer"
              >
                <option value="Student">Student</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Executive">Executive</option>
                <option value="Founder">Founder</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Profession</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Briefcase className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Designer / Lead"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Specific Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Product Architect"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Targets & Alignment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-slate-800/60">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              Networking Interests & Alignment
            </h3>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Preferred Target Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Artificial Intelligence, FinTech, Design System..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">General Interests Keywords</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Rust language, distributed compiling, seed rounds..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Career Goals</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                    <Target className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={careerGoals}
                    onChange={(e) => setCareerGoals(e.target.value)}
                    placeholder="Find investors / Hire"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Networking Goals</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                    <Award className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={networkingGoals}
                    onChange={(e) => setNetworkingGoals(e.target.value)}
                    placeholder="Build developer advocacy"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-slate-200">System Theme Preference</span>
                <span className="text-[10px] text-slate-500 font-mono">Select client visual display</span>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="dark">Cosmic Slate (Dark)</option>
                <option value="light">High Contrast (Light)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold text-sm rounded-xl py-3.5 shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
