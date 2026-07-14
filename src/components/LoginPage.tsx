/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Mail, Lock, User, ArrowRight, Sparkles, Network, 
  Cpu, ShieldAlert, Award, Briefcase, Globe,
  Star, Check, Zap, ShieldCheck, MessageSquare, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "./Logo.js";
import { ThreeDDotsCanvas } from "./ThreeDDotsCanvas.js";

interface LoginPageProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Custom Registration Fields matching the DB
  const [profession, setProfession] = useState("");
  const [role, setRole] = useState("Professional");
  const [industry, setIndustry] = useState("");
  const [interests, setInterests] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Senior");
  const [careerGoals, setCareerGoals] = useState("");
  const [networkingGoals, setNetworkingGoals] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<"basic" | "executive" | "enterprise">("basic");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // States for subscription amount prompts
  const [askAmountFor, setAskAmountFor] = useState<"executive" | "enterprise" | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [executiveAmount, setExecutiveAmount] = useState<string>("49");
  const [enterpriseAmount, setEnterpriseAmount] = useState<string>("Custom");

  // Mouse spotlight state for interactive cards
  const handleSpotlightMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  const scrollToPortal = (mode?: "login" | "register") => {
    if (mode === "login") {
      setIsLogin(true);
    } else if (mode === "register") {
      setIsLogin(false);
    }
    const el = document.getElementById("auth-portal");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectPlan = (plan: "basic" | "executive" | "enterprise") => {
    if (plan === "basic") {
      setSelectedPlan("basic");
      setRole("Professional");
      scrollToPortal("register");
    } else {
      setAskAmountFor(plan);
      setAmountInput(plan === "executive" ? executiveAmount : (enterpriseAmount === "Custom" ? "" : enterpriseAmount));
    }
  };

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
          experience_level: experienceLevel,
          career_goals: careerGoals,
          networking_goals: networkingGoals
        };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMessage = "Authentication failed. Please check your credentials.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
          }
        } catch {
          errorMessage = `Server error (${response.status}): Could not complete authentication.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-neutral-100 font-sans relative overflow-x-hidden selection:bg-accent selection:text-black" id="login-container">
      {/* Solid background layer underneath the 3D dots canvas */}
      <div className="fixed inset-0 bg-neutral-950 z-[-2] pointer-events-none" />

      {/* Visual background layers */}
      <div className="grain-overlay" />
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-secondary/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] left-[30%] w-[400px] h-[400px] rounded-full bg-accent/3 blur-[120px] pointer-events-none animate-pulse" />

      {/* 3D Dots Background Animation */}
      <ThreeDDotsCanvas />

      {/* Header Navigation */}
      <header className="w-full border-b border-white/5 bg-neutral-950/40 backdrop-blur-md sticky top-0 z-50 py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} className="drop-shadow-[0_0_15px_rgba(200,255,0,0.25)]" />
          <div>
            <h1 className="text-lg font-display font-extrabold tracking-tight text-white flex items-center">
              NETLINK<span className="text-accent">.</span>AI
            </h1>
            <p className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">
              Luxury AI Networking Suite
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-mono text-neutral-400">
          <button onClick={() => {
            const el = document.getElementById("advantages-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }} className="hover:text-accent transition-colors cursor-pointer">
            Advantages
          </button>
          <button onClick={() => {
            const el = document.getElementById("reviews-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }} className="hover:text-accent transition-colors cursor-pointer">
            Reviews
          </button>
          <button onClick={() => {
            const el = document.getElementById("pricing-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }} className="hover:text-accent transition-colors cursor-pointer">
            Pricing
          </button>
        </nav>

        <button 
          onClick={() => scrollToPortal("login")}
          className="px-5 py-2.5 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black font-semibold text-xs tracking-wider uppercase font-mono rounded-xl text-accent transition-all duration-300 shadow-[0_0_15px_rgba(200,255,0,0.05)] hover:shadow-[0_0_20px_rgba(200,255,0,0.2)] cursor-pointer"
        >
          Authenticate Gate
        </button>
      </header>

      {/* Hero Welcome / Showcase Segment */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 pb-24 relative z-10 space-y-32">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-accent/5 border border-accent/20 text-accent rounded-full text-xs font-mono uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Next-Generation Cognitive Engineering</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,1)] drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)]"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,1), 0 10px 30px rgba(0,0,0,0.95)" }}
          >
            Master the Art of <span className="text-accent italic underline decoration-accent/30 decoration-offset-4 font-normal animate-pulse">Professional</span> Conversation
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-neutral-100 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-[0_4px_15px_rgba(0,0,0,0.95)] bg-neutral-950/85 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
          >
            Unlock handcrafted openers, intelligent multi-theme target maps, and Wikipedia-backed factual context validation. Designed exclusively for modern leaders, partners, and executive pioneers.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => scrollToPortal("register")}
              className="px-8 py-4 bg-accent hover:bg-white text-black font-semibold rounded-xl text-sm transition-all duration-300 shadow-[0_0_30px_rgba(200,255,0,0.15)] hover:shadow-[0_0_35px_rgba(200,255,0,0.35)] flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>Provision Persona</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button 
              onClick={() => scrollToPortal("login")}
              className="px-8 py-4 bg-white/[0.02] hover:bg-accent hover:text-black border border-white/10 hover:border-accent text-white font-semibold rounded-xl text-sm transition-all duration-300 shadow-[0_0_15px_rgba(200,255,0,0.02)] hover:shadow-[0_0_35px_rgba(200,255,0,0.35)] flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>Authenticate Account</span>
            </button>
          </motion.div>
        </div>

        {/* SECTION 1: Advantages / Key Capabilities */}
        <section id="advantages-section" className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-accent font-semibold font-mono">
              — SYSTEM ADVANTAGES
            </span>
            <h3 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-neutral-100">
              Why Leaders Select Netlink.AI
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light">
              Bypass trivialities with robust conversational intelligence systems architected for instant resonance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Advantage 1 */}
            <div 
              className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg hover:border-accent/40 hover:bg-neutral-950/40 transition-all duration-300 spotlight-card cursor-default flex flex-col justify-between group min-h-[220px] shadow-[0_15px_45px_rgba(0,0,0,0.7)]"
              onMouseMove={handleSpotlightMove}
            >
              <div className="h-12 w-12 rounded-2xl bg-accent/5 border border-accent/15 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-base font-semibold text-neutral-100 font-display">Intellectual Openers</h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-light">
                  Generates micro-targeted conversation starters adapted to specific metadata, industries, and executive roles.
                </p>
              </div>
            </div>

            {/* Advantage 2 */}
            <div 
              className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg hover:border-accent/40 hover:bg-neutral-950/40 transition-all duration-300 spotlight-card cursor-default flex flex-col justify-between group min-h-[220px] shadow-[0_15px_45px_rgba(0,0,0,0.7)]"
              onMouseMove={handleSpotlightMove}
            >
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-base font-semibold text-neutral-100 font-display">Intelligent AI Maps</h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-light">
                  Identifies secondary conversational paths, thematic intersections, and networking goals to sidestep clichés.
                </p>
              </div>
            </div>

            {/* Advantage 3 */}
            <div 
              className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg hover:border-accent/40 hover:bg-neutral-950/40 transition-all duration-300 spotlight-card cursor-default flex flex-col justify-between group min-h-[220px] shadow-[0_15px_45px_rgba(0,0,0,0.7)]"
              onMouseMove={handleSpotlightMove}
            >
              <div className="h-12 w-12 rounded-2xl bg-accent-secondary/5 border border-accent-secondary/15 flex items-center justify-center text-accent-secondary group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-base font-semibold text-neutral-100 font-display">Fact Verification</h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-light">
                  Verifies real-world facts and corporate histories dynamically using intelligent automated Wikipedia queries.
                </p>
              </div>
            </div>

            {/* Advantage 4 */}
            <div 
              className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg hover:border-accent/40 hover:bg-neutral-950/40 transition-all duration-300 spotlight-card cursor-default flex flex-col justify-between group min-h-[220px] shadow-[0_15px_45px_rgba(0,0,0,0.7)]"
              onMouseMove={handleSpotlightMove}
            >
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-base font-semibold text-neutral-100 font-display">Sovereign Encryption</h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-light">
                  Secure local preferences, analytics, and private profiles. Built from scratch with an uncompromising commitment to privacy.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: Customer Reviews */}
        <section id="reviews-section" className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-accent font-semibold font-mono">
              — PIONEER REVIEWS
            </span>
            <h3 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-neutral-100">
              Endorsed by Top Executives
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light">
              See how modern leaders are leveraging tailored semantic open structures to drive valuable corporate relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Review 1 */}
            <div className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg space-y-6 flex flex-col justify-between shadow-[0_15px_45px_rgba(0,0,0,0.7)] hover:border-accent/30 hover:bg-neutral-950/35 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed italic font-light">
                  "Netlink changed the game for our LP summits. Instead of standard corporate small talk, we initiated deep, factually-validated technical prompts that aligned instantly with our objectives."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="h-9 w-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-display text-accent text-xs font-bold">
                  SV
                </div>
                <div>
                  <h5 className="text-xs font-bold text-neutral-100">Sophia Vance</h5>
                  <p className="text-[10px] text-neutral-400">Managing Director • Blue Horizon VC</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg space-y-6 flex flex-col justify-between shadow-[0_15px_45px_rgba(0,0,0,0.7)] hover:border-accent/30 hover:bg-neutral-950/35 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed italic font-light">
                  "The intelligent thematic maps identified overlap in clean tech ventures that I had never considered before. It's like having an elite cognitive advisory council in your pocket."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="h-9 w-9 rounded-full bg-accent-secondary/20 border border-accent-secondary/30 flex items-center justify-center font-display text-accent-secondary text-xs font-bold">
                  MC
                </div>
                <div>
                  <h5 className="text-xs font-bold text-neutral-100">Marcus Chen</h5>
                  <p className="text-[10px] text-neutral-400">Co-Founder & CEO • NeuralGrid Corp</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 rounded-3xl bg-neutral-950/20 border border-white/10 backdrop-blur-lg space-y-6 flex flex-col justify-between shadow-[0_15px_45px_rgba(0,0,0,0.7)] hover:border-accent/30 hover:bg-neutral-950/35 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed italic font-light">
                  "The Wikipedia fact verification engine completely safeguards you against making embarrassing factual claims when discussing complex industry news. Pure brilliance."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-display text-emerald-400 text-xs font-bold">
                  ER
                </div>
                <div>
                  <h5 className="text-xs font-bold text-neutral-100">Elena Rostova</h5>
                  <p className="text-[10px] text-neutral-400">Executive VP • Vanguard FinTech</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: Pricing */}
        <section id="pricing-section" className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-accent font-semibold font-mono">
              — ELITE PRICING
            </span>
            <h3 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-neutral-100">
              Select Your Access Tier
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light">
              Choose the perfect plan tailored to your networking volume and factual depth requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Tier 1 */}
            <div className={`p-8 rounded-[2rem] flex flex-col justify-between relative min-h-[420px] transition-all duration-500 border backdrop-blur-lg shadow-[0_20px_50px_rgba(0,0,0,0.7)] ${
              selectedPlan === "basic"
                ? "bg-accent/[0.06] border-accent/80 shadow-[0_0_40px_rgba(200,255,0,0.3)] scale-[1.02]"
                : "bg-neutral-950/25 border-white/15 hover:border-accent/40 hover:bg-neutral-950/40"
            }`}>
              {selectedPlan === "basic" && (
                <div className="absolute top-4 right-4 bg-accent text-black text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(200,255,0,0.3)]">
                  Selected Tier
                </div>
              )}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Basic Access</span>
                  <h4 className="text-xl font-bold text-neutral-100 font-display">Professional Key</h4>
                  <p className="text-xs text-neutral-200 font-normal leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Perfect for individual pioneers testing personalized icebreaker scripts.</p>
                </div>
                
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-display font-extrabold text-white">$0</span>
                  <span className="text-xs text-neutral-400 font-mono">/ FOREVER</span>
                </div>
                
                <div className="border-t border-white/10 pt-6 space-y-3 text-xs text-neutral-200 font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Seeded Database Profiles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Personalized Context Openers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Local Session Encryption</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleSelectPlan("basic")}
                className={`w-full mt-8 py-3 font-medium rounded-xl text-xs uppercase tracking-wider font-mono border transition-all cursor-pointer ${
                  selectedPlan === "basic"
                    ? "bg-accent text-black border-accent hover:bg-white"
                    : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                }`}
              >
                {selectedPlan === "basic" ? "Selected (Register Below)" : "Acquire Key"}
              </button>
            </div>

            {/* Tier 2 */}
            <div className={`p-8 rounded-[2rem] flex flex-col justify-between relative min-h-[420px] transition-all duration-500 border backdrop-blur-lg shadow-[0_20px_50px_rgba(0,0,0,0.7)] ${
              selectedPlan === "executive"
                ? "bg-accent/[0.08] border-2 border-accent shadow-[0_0_45px_rgba(200,255,0,0.4)] scale-[1.03]"
                : "bg-neutral-950/25 border-white/15 hover:border-accent/40 hover:bg-neutral-950/40"
            }`}>
              <div className="absolute top-4 right-4 bg-accent text-black text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(200,255,0,0.3)]">
                {selectedPlan === "executive" ? "Selected Tier" : "Most Popular"}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-accent font-mono font-bold">Full Suite</span>
                  <h4 className="text-xl font-bold text-neutral-100 font-display">Executive Elite</h4>
                  <p className="text-xs text-neutral-200 font-normal leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Advanced AI mapping and Wikipedia lookup verification for active deal-makers.</p>
                </div>
                
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-display font-extrabold text-white">
                    {executiveAmount.startsWith('$') ? '' : '$'}{executiveAmount}
                  </span>
                  <span className="text-xs text-neutral-300 font-mono">/ MONTH</span>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-3 text-xs text-neutral-200 font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Unlimited AI Theme Mapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Automated Wikipedia Grounding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Premium Star Saving and Favorites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Priority Server Processing Nodes</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleSelectPlan("executive")}
                className={`w-full mt-8 py-3 font-semibold rounded-xl text-xs uppercase tracking-wider font-mono transition-all cursor-pointer ${
                  selectedPlan === "executive"
                    ? "bg-accent text-black hover:bg-white shadow-[0_0_15px_rgba(200,255,0,0.2)]"
                    : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                }`}
              >
                {selectedPlan === "executive" ? "Selected (Register Below)" : "Provision Account"}
              </button>
            </div>

            {/* Tier 3 */}
            <div className={`p-8 rounded-[2rem] flex flex-col justify-between relative min-h-[420px] transition-all duration-500 border backdrop-blur-lg shadow-[0_20px_50px_rgba(0,0,0,0.7)] ${
              selectedPlan === "enterprise"
                ? "bg-amber-500/[0.06] border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-[1.02]"
                : "bg-neutral-950/25 border-white/15 hover:border-amber-400/40 hover:bg-neutral-950/40"
            }`}>
              {selectedPlan === "enterprise" && (
                <div className="absolute top-4 right-4 bg-amber-400 text-black text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  Selected Tier
                </div>
              )}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Corporate Nodes</span>
                  <h4 className="text-xl font-bold text-neutral-100 font-display">Sovereign Enterprise</h4>
                  <p className="text-xs text-neutral-200 font-normal leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Fully dedicated infrastructure nodes for major funds, accelerators, and syndicates.</p>
                </div>
                
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-display font-extrabold text-white">
                    {enterpriseAmount === "Custom" ? "Custom" : `${enterpriseAmount.startsWith('$') ? '' : '$'}${enterpriseAmount}`}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">/ ANNUAL</span>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-3 text-xs text-neutral-200 font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Custom LLM Fine-Tuning Protocols</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Uncensored Sandbox Environments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Dedicated SLA Sovereign Data Nodes</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleSelectPlan("enterprise")}
                className={`w-full mt-8 py-3 font-medium rounded-xl text-xs uppercase tracking-wider font-mono border transition-all cursor-pointer ${
                  selectedPlan === "enterprise"
                    ? "bg-amber-400 text-black border-amber-400 hover:bg-white"
                    : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                }`}
              >
                {selectedPlan === "enterprise" ? "Selected (Register Below)" : "Contact Council"}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: Authentication Gate Panel */}
        <section id="auth-portal" className="pt-8 relative">
          {/* Custom intense ambient glow backdrops specifically highlighting this bottom card to make it pop and make dots outline it */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-accent/15 blur-[150px] rounded-full pointer-events-none z-0" />
          <div className="absolute top-1/3 left-1/4 w-[50%] h-[50%] bg-accent-secondary/15 blur-[120px] rounded-full pointer-events-none z-0" />

          <div className="w-full max-w-6xl bg-neutral-950/20 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative min-h-[650px] lg:min-h-[750px] scroll-mt-24 z-10">
            
            {/* Left Column: Platform Branding / Interactive Showcase */}
            <div className="lg:col-span-6 bg-neutral-950/15 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/15 relative">
              
              {/* Accent dot grid overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Upper Brand Section */}
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <Logo size={56} className="drop-shadow-[0_0_20px_rgba(200,255,0,0.25)] animate-pulse" />
                  <div>
                    <h1 className="text-2xl font-display font-extrabold tracking-tight text-white">
                      NETLINK<span className="text-accent">.</span>AI
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-500">
                      Luxury AI Networking Suite
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-w-md">
                  <span className="text-[10px] uppercase tracking-widest text-accent font-bold font-mono bg-accent/15 border border-accent/20 px-3 py-1 rounded-full inline-block">
                    — DIGITAL CONVERSATION STUDIO
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
                    Master the Art of <span className="text-accent underline decoration-accent/40 underline-offset-4 italic font-normal">Professional</span> Conversation
                  </h2>
                  <p className="text-sm text-neutral-200 leading-relaxed font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Unlock handcrafted icebreakers, intelligent multi-theme maps, and factual context intelligence. Designed with obsession for leaders and pioneers.
                  </p>
                </div>
              </div>

              {/* Central Showcase Widgets */}
              <div className="my-10 lg:my-0 space-y-4 relative z-10 max-w-md">
                
                {/* Capability Item 1 */}
                <div 
                  className="flex gap-4 p-5 rounded-2xl bg-neutral-950/65 border border-white/10 hover:border-accent/30 hover:bg-neutral-950/85 backdrop-blur-[1px] transition-all duration-300 spotlight-card cursor-default"
                  onMouseMove={handleSpotlightMove}
                >
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-accent/5 border border-accent/15 flex items-center justify-center text-accent">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-200 font-display">Personalized Openers</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Generates micro-targeted conversation starters adapted to event metadata & custom objectives.</p>
                  </div>
                </div>

                {/* Capability Item 2 */}
                <div 
                  className="flex gap-4 p-5 rounded-2xl bg-neutral-950/65 border border-white/10 hover:border-accent/30 hover:bg-neutral-950/85 backdrop-blur-[1px] transition-all duration-300 spotlight-card cursor-default"
                  onMouseMove={handleSpotlightMove}
                >
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                    <Network className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-200 font-display">Multi-Theme AI Maps</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Identifies secondary talking paths, event-themes, and conversational triggers to skip clichés.</p>
                  </div>
                </div>

                {/* Capability Item 3 */}
                <div 
                  className="flex gap-4 p-5 rounded-2xl bg-neutral-950/65 border border-white/10 hover:border-accent/30 hover:bg-neutral-950/85 backdrop-blur-[1px] transition-all duration-300 spotlight-card cursor-default"
                  onMouseMove={handleSpotlightMove}
                >
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-accent-secondary/5 border border-accent-secondary/15 flex items-center justify-center text-accent-secondary">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-200 font-display">Wikipedia Verification</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Validates and researches real-world themes dynamically using automated neural querying.</p>
                  </div>
                </div>

              </div>

              {/* Lower Credentials Badge */}
              <div className="text-[11px] text-neutral-400 font-semibold font-mono flex items-center gap-2 mt-6 lg:mt-0 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#c8ff00]" />
                <span>EXPRESS SECURE ENGINE • GEMINI POWERED</span>
              </div>
            </div>

            {/* Right Column: Portal Authentication Cards */}
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-transparent relative z-10">
              <div className="w-full max-w-md mx-auto space-y-6">
                
                {/* Form Header */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-accent font-bold bg-accent/15 border border-accent/20 px-3 py-1 rounded-full">
                    {isLogin ? "Gate Key Required" : "Create Suite Persona"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-white mt-4 tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                    {isLogin ? "Unlock Workspace" : "Provision Suite Account"}
                  </h3>
                  <p className="text-xs text-neutral-200 mt-2 leading-relaxed font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {isLogin 
                      ? "Input your credentials to access saved icebreaker lists, active feedback logs, and customized target events."
                      : "Join pioneers worldwide using tailored cognitive advice to transform networking into a refined skill."
                    }
                  </p>
                </div>

                {/* Error Message */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-accent-secondary/10 border border-accent-secondary/20 text-neutral-200 text-xs p-4 rounded-xl flex items-start gap-3"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-accent-secondary" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick-Fill Demo Account */}
                {isLogin && (
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-neutral-300 flex items-center gap-1.5 font-display">
                        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                        <span>Quick-Entry Profile</span>
                      </div>
                      <p className="text-neutral-500 text-[11px] font-light">Launch workspace with dummy seeded database record.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("demo@example.com");
                        setPassword("password123");
                      }}
                      className="px-3.5 py-1.5 bg-accent/10 hover:bg-accent hover:text-black border border-accent/30 text-accent font-medium rounded-lg text-[11px] transition-all duration-300 cursor-pointer self-start sm:self-auto shrink-0"
                      id="fill-demo-btn"
                    >
                      Fill Demo
                    </button>
                  </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {!isLogin && (
                    <div className="space-y-1.5 pb-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        Selected Access Tier
                      </label>
                      <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-1 border border-white/15 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPlan("basic");
                          }}
                          className={`py-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer border ${
                            selectedPlan === "basic"
                              ? "bg-accent text-black font-bold border-accent shadow-[0_0_10px_rgba(200,255,0,0.2)]"
                              : "border-transparent text-neutral-400 hover:text-white hover:bg-white/5 hover:border-accent/30"
                          }`}
                        >
                          Basic Key
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPlan("executive");
                          }}
                          className={`py-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer border ${
                            selectedPlan === "executive"
                              ? "bg-accent text-black font-bold border-accent shadow-[0_0_10px_rgba(200,255,0,0.2)]"
                              : "border-transparent text-neutral-400 hover:text-white hover:bg-white/5 hover:border-accent/30"
                          }`}
                        >
                          Executive
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPlan("enterprise");
                          }}
                          className={`py-2 text-[11px] font-mono rounded-lg transition-all cursor-pointer border ${
                            selectedPlan === "enterprise"
                              ? "bg-amber-400 text-black font-bold border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                              : "border-transparent text-neutral-400 hover:text-white hover:bg-white/5 hover:border-amber-400/30"
                          }`}
                        >
                          Enterprise
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-300 italic font-mono">
                        {selectedPlan === "basic" && "✓ Plan pre-configured: Professional Access."}
                        {selectedPlan === "executive" && `✓ Plan pre-configured: Executive Elite Access (Custom Amount: $${executiveAmount}).`}
                        {selectedPlan === "enterprise" && `✓ Plan pre-configured: Sovereign Enterprise Access (Custom Amount: $${enterpriseAmount}).`}
                      </p>
                    </div>
                  )}

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1"
                    >
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Full Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all shadow-inner shadow-black/40"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all shadow-inner shadow-black/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all shadow-inner shadow-black/40"
                      />
                    </div>
                  </div>

                  {/* Extended registration fields */}
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 pt-1"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Profession</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                              <Briefcase className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              required
                              value={profession}
                              onChange={(e) => setProfession(e.target.value)}
                              placeholder="e.g. Architect"
                              className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent text-white placeholder-neutral-500 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-all shadow-inner shadow-black/40"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Experience Level</label>
                          <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all shadow-inner shadow-black/40"
                          >
                            <option value="Student">Student</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                            <option value="Executive">Executive</option>
                            <option value="Founder">Founder</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Industry</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                              <Globe className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              required
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              placeholder="e.g. FinTech"
                              className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent text-white placeholder-neutral-500 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-all shadow-inner shadow-black/40"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Core Interests</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                              <Award className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              required
                              value={interests}
                              onChange={(e) => setInterests(e.target.value)}
                              placeholder="e.g. AI, VC"
                              className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent text-white placeholder-neutral-500 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-all shadow-inner shadow-black/40"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Career Goals</label>
                        <input
                          type="text"
                          value={careerGoals}
                          onChange={(e) => setCareerGoals(e.target.value)}
                          placeholder="e.g. Launch AI fund, relocation to tech hubs"
                          className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent text-white placeholder-neutral-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all shadow-inner shadow-black/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-200 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Networking Goals</label>
                        <input
                          type="text"
                          value={networkingGoals}
                          onChange={(e) => setNetworkingGoals(e.target.value)}
                          placeholder="e.g. Discover early-stage startups, find angel syndicates"
                          className="w-full bg-neutral-950/60 backdrop-blur-md border border-white/20 focus:border-accent text-white placeholder-neutral-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all shadow-inner shadow-black/40"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-white text-black font-semibold rounded-xl py-3 text-sm shadow-[0_0_30px_rgba(200,255,0,0.15)] hover:shadow-[0_0_35px_rgba(200,255,0,0.35)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-4"
                    id="submit-auth-btn"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <span>{isLogin ? "Authenticate Key" : "Deploy Suite Persona"}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Selector Footer Toggle */}
                <div className="pt-6 border-t border-white/5 text-center text-xs text-neutral-500">
                  <span>{isLogin ? "New professional pioneer? " : "Already established? "}</span>
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLogin(!isLogin);
                    }}
                    className="text-accent hover:text-white font-semibold underline decoration-accent/25 underline-offset-2 transition-colors focus:outline-none cursor-pointer"
                    id="toggle-auth-mode"
                  >
                    {isLogin ? "Generate Credentials" : "Sign In Securely"}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Dynamic Amount Input Prompt Modal */}
      <AnimatePresence>
        {askAmountFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
            >
              <button
                type="button"
                onClick={() => {
                  setAskAmountFor(null);
                  setSelectedPlan("basic");
                  setRole("Professional");
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <div className="mx-auto w-12 h-12 bg-accent/10 border border-accent/25 rounded-2xl flex items-center justify-center text-accent mb-2 shadow-inner">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-extrabold text-white">
                    {askAmountFor === "executive" ? "Executive Elite" : "Sovereign Enterprise"}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {askAmountFor === "executive" 
                      ? "Specify the monthly amount you would like to contribute for Full Suite access."
                      : "Enter your proposed annual budget for Custom Enterprise resources."
                    }
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                    Proposed Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-accent font-mono font-bold text-lg pointer-events-none">
                      $
                    </span>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder={askAmountFor === "executive" ? "49" : "5000"}
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
                      className="w-full bg-neutral-950 border border-white/10 focus:border-accent text-white font-mono text-lg rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAskAmountFor(null);
                      setSelectedPlan("basic");
                      setRole("Professional");
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-neutral-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const finalAmount = amountInput.trim() || (askAmountFor === "executive" ? "49" : "Custom");
                      if (askAmountFor === "executive") {
                        setExecutiveAmount(finalAmount);
                        setSelectedPlan("executive");
                        setRole("Executive");
                      } else {
                        setEnterpriseAmount(finalAmount);
                        setSelectedPlan("enterprise");
                        setRole("Sovereign Enterprise");
                      }
                      setAskAmountFor(null);
                      scrollToPortal("register");
                    }}
                    className="w-full py-3 bg-accent text-black hover:bg-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="w-full border-t border-white/5 bg-black/40 py-8 px-6 text-center text-xs text-neutral-500 font-mono relative z-10">
        <p>© 2026 NETLINK.AI. COGNITIVE RELATIONSHIP TECHNOLOGY LAB. ALL SOVEREIGN PRIVILEGES RESERVED.</p>
      </footer>
    </div>
  );
}
