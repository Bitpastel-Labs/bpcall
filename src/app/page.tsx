"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className={`group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-brand-500/20 transition-all duration-500 ${delay}`}
    >
      <div className="animate-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center mb-4 group-hover:bg-brand-600/25 transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-white font-semibold mb-1.5">{title}</h3>
        <p className="text-sm text-surface-200/50 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="animate-pulse text-brand-400 text-2xl font-bold">BPCall</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-brand-600/[0.08] blur-[120px] animate-pulse-glow" />
        {/* Secondary accent glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.06] blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[-5%] w-[300px] h-[300px] rounded-full bg-blue-600/[0.04] blur-[80px] animate-pulse-glow" style={{ animationDelay: "4s" }} />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto animate-fade-in-up">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-600/20">
            BP
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            BP<span className="text-brand-400">Call</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-sm text-surface-200/80 hover:text-white transition-colors font-medium"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 pt-16 sm:pt-24 pb-20 text-center">
        {/* Animated network constellation behind hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px]">
            {/* Orbiting rings */}
            <div className="absolute inset-0 animate-orbit">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="160" fill="none" stroke="url(#ring1)" strokeWidth="0.5" opacity="0.3" />
                {/* Nodes on ring */}
                <circle cx="360" cy="200" r="3" fill="#818cf8" opacity="0.7">
                  <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="40" r="2.5" fill="#a5b4fc" opacity="0.5">
                  <animate attributeName="r" values="2;3.5;2" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="80" cy="290" r="2" fill="#818cf8" opacity="0.4">
                  <animate attributeName="r" values="1.5;3;1.5" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="absolute inset-[15%] animate-orbit-reverse">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="140" fill="none" stroke="#a5b4fc" strokeWidth="0.4" strokeDasharray="8 12" opacity="0.2" className="animate-dash-flow" />
                <circle cx="340" cy="200" r="2.5" fill="#c7d2fe" opacity="0.6">
                  <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="130" cy="80" r="2" fill="#a5b4fc" opacity="0.5">
                  <animate attributeName="r" values="1.5;3;1.5" dur="3s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            <div className="absolute inset-[30%] animate-orbit-slow">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="120" fill="none" stroke="#6366f1" strokeWidth="0.3" opacity="0.15" />
                <circle cx="320" cy="200" r="2" fill="#818cf8" opacity="0.5">
                  <animate attributeName="r" values="1.5;3;1.5" dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Center signal pulse rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 rounded-full bg-brand-500/60" />
              <div className="absolute inset-0 w-3 h-3 rounded-full border border-brand-400/40 animate-signal-ring" />
              <div className="absolute inset-0 w-3 h-3 rounded-full border border-brand-400/30 animate-signal-ring" style={{ animationDelay: "0.8s" }} />
              <div className="absolute inset-0 w-3 h-3 rounded-full border border-brand-400/20 animate-signal-ring" style={{ animationDelay: "1.6s" }} />
            </div>

            {/* Connecting lines between nodes */}
            <svg className="absolute inset-0 w-full h-full animate-orbit-slow" viewBox="0 0 400 400" style={{ animationDuration: "50s" }}>
              <line x1="200" y1="200" x2="360" y2="130" stroke="#818cf8" strokeWidth="0.3" opacity="0.15" strokeDasharray="4 6" className="animate-dash-flow" />
              <line x1="200" y1="200" x2="80" y2="280" stroke="#a5b4fc" strokeWidth="0.3" opacity="0.1" strokeDasharray="4 6" className="animate-dash-flow" />
              <line x1="200" y1="200" x2="310" y2="320" stroke="#6366f1" strokeWidth="0.3" opacity="0.12" strokeDasharray="4 6" className="animate-dash-flow" />
            </svg>
          </div>
        </div>

        {/* Badge */}
        <div className="animate-fade-in-up-delay-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-600/10 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-brand-300 tracking-wide uppercase">
            Built for Bitpastel
          </span>
        </div>

        {/* Heading */}
        <h1 className="animate-fade-in-up-delay-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
          Communication
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
            without friction
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-3 text-base sm:text-lg text-surface-200/60 max-w-xl mx-auto mb-10 leading-relaxed">
          One place to chat, call, and connect with your team.
          Real-time messaging, crystal-clear audio and video calls,
          all wrapped in a simple interface.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up-delay-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="group relative px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-xl shadow-brand-600/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            <span className="relative z-10">Start Connecting</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 ml-2">&rarr;</span>
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 text-white rounded-xl font-semibold transition-all duration-300 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-0.5 backdrop-blur-sm"
          >
            Sign in to your account
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            delay="animate-fade-in-up-delay-2"
            icon={
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="Real-time Chat"
            description="Instant messaging with typing indicators and message history. Stay in sync with your team."
          />
          <FeatureCard
            delay="animate-fade-in-up-delay-3"
            icon={
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
            title="Video & Audio Calls"
            description="Crystal-clear peer-to-peer calls. No third-party servers touching your conversations."
          />
          <FeatureCard
            delay="animate-fade-in-up-delay-4"
            icon={
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Team Rooms"
            description="Group conversations for projects and teams. Bring everyone together in one space."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 text-center">
        <p className="text-surface-200/25 text-sm tracking-wide">
          Bitpastel &middot; Internal Communication Platform
        </p>
      </footer>

      {/* Floating decorative orbs */}
      <div className="absolute top-32 right-[15%] w-2 h-2 rounded-full bg-brand-400/30 animate-float hidden lg:block" />
      <div className="absolute top-64 left-[12%] w-1.5 h-1.5 rounded-full bg-purple-400/25 animate-float-delayed hidden lg:block" />
      <div className="absolute bottom-48 right-[20%] w-1 h-1 rounded-full bg-blue-400/30 animate-float hidden lg:block" />
    </div>
  );
}
