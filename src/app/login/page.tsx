"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FieldState {
  value: string;
  touched: boolean;
  error: string;
}

function validateIdentifier(value: string): string {
  if (!value.trim()) return "Email or username is required";
  if (value.trim().length < 2) return "Must be at least 2 characters";
  return "";
}

function validatePassword(value: string): string {
  if (!value) return "Password is required";
  if (value.length < 6) return "Must be at least 6 characters";
  return "";
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState<FieldState>({ value: "", touched: false, error: "" });
  const [password, setPassword] = useState<FieldState>({ value: "", touched: false, error: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = useCallback(
    (setter: React.Dispatch<React.SetStateAction<FieldState>>, validator: (v: string) => string) =>
      (value: string) => {
        setter((prev) => ({
          value,
          touched: prev.touched,
          error: prev.touched ? validator(value) : "",
        }));
      },
    []
  );

  const touchField = useCallback(
    (setter: React.Dispatch<React.SetStateAction<FieldState>>, validator: (v: string) => string) =>
      () => {
        setter((prev) => ({
          ...prev,
          touched: true,
          error: validator(prev.value),
        }));
      },
    []
  );

  const isFormValid = !validateIdentifier(identifier.value) && !validatePassword(password.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifier((prev) => ({ ...prev, touched: true, error: validateIdentifier(prev.value) }));
    setPassword((prev) => ({ ...prev, touched: true, error: validatePassword(prev.value) }));
    if (!isFormValid) return;

    setServerError("");
    setLoading(true);
    try {
      await login(identifier.value, password.value);
      router.push("/dashboard");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: FieldState) =>
    `w-full px-4 py-3 bg-surface-950/80 border rounded-xl text-white placeholder-surface-200/30 focus:outline-none transition-all duration-200 ${
      field.touched && field.error
        ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/60"
        : "border-white/[0.08] focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40"
    }`;

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-surface-900 to-purple-950/40" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-brand-600/[0.1] blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-600/[0.08] blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        {/* Constellation animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px]">
            <div className="absolute inset-0 animate-orbit" style={{ top: "15%", left: "15%", width: "70%", height: "70%" }}>
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="160" fill="none" stroke="url(#loginRing1)" strokeWidth="0.5" opacity="0.25" />
                <circle cx="360" cy="200" r="3" fill="#818cf8" opacity="0.7">
                  <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="40" r="2.5" fill="#a5b4fc" opacity="0.5">
                  <animate attributeName="r" values="2;3.5;2" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="80" cy="290" r="2" fill="#818cf8" opacity="0.4">
                  <animate attributeName="r" values="1.5;3;1.5" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="loginRing1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute animate-orbit-reverse" style={{ top: "25%", left: "25%", width: "50%", height: "50%" }}>
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="140" fill="none" stroke="#a5b4fc" strokeWidth="0.4" strokeDasharray="8 12" opacity="0.2" className="animate-dash-flow" />
                <circle cx="340" cy="200" r="2.5" fill="#c7d2fe" opacity="0.6">
                  <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            {/* Center signal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 rounded-full bg-brand-500/60" />
              <div className="absolute inset-0 w-3 h-3 rounded-full border border-brand-400/40 animate-signal-ring" />
              <div className="absolute inset-0 w-3 h-3 rounded-full border border-brand-400/30 animate-signal-ring" style={{ animationDelay: "0.8s" }} />
              <div className="absolute inset-0 w-3 h-3 rounded-full border border-brand-400/20 animate-signal-ring" style={{ animationDelay: "1.6s" }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-12 xl:px-20 max-w-xl animate-fade-in-up">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-600/25">
              BP
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              BP<span className="text-brand-400">Call</span>
            </span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-5">
            Your team,
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
              always connected
            </span>
          </h1>
          <p className="text-surface-200/50 text-base leading-relaxed mb-10">
            Real-time messaging, crystal-clear calls, and seamless collaboration — all in one place built for Bitpastel.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 animate-fade-in-up-delay-2">
            {[
              { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Instant Chat" },
              { icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", label: "Video Calls" },
              { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "End-to-End Secure" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/[0.06] bg-white/[0.03]">
                <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-xs text-surface-200/60 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 relative overflow-hidden">
        {/* Mobile background effects */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-brand-600/[0.07] blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        {/* Desktop subtle background */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-brand-600/[0.04] blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-fade-in-up-delay-1">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-600/20">
              BP
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              BP<span className="text-brand-400">Call</span>
            </span>
          </Link>

          {/* Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-white/[0.06] shadow-2xl shadow-black/20">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
              <p className="text-surface-200/50 text-sm">Sign in to continue to BPCall</p>
            </div>

            {serverError && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fade-in-up">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-surface-200/70 mb-2">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={identifier.value}
                  onChange={(e) => updateField(setIdentifier, validateIdentifier)(e.target.value)}
                  onBlur={touchField(setIdentifier, validateIdentifier)}
                  className={inputClass(identifier)}
                  placeholder="Enter email or username"
                />
                {identifier.touched && identifier.error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {identifier.error}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-200/70 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password.value}
                  onChange={(e) => updateField(setPassword, validatePassword)(e.target.value)}
                  onBlur={touchField(setPassword, validatePassword)}
                  className={inputClass(password)}
                  placeholder="Enter password"
                />
                {password.touched && password.error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {password.error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
              <p className="text-surface-200/40 text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-surface-200/20 text-xs mt-8 tracking-wide">
            Bitpastel Internal Platform
          </p>
        </div>
      </div>
    </div>
  );
}
