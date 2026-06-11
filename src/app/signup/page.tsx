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

function validateEmail(value: string): string {
  if (!value.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
  return "";
}

function validateUsername(value: string): string {
  if (!value.trim()) return "Username is required";
  if (value.trim().length < 3) return "Must be at least 3 characters";
  if (value.trim().length > 20) return "Must be 20 characters or less";
  if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) return "Only letters, numbers, and underscores allowed";
  return "";
}

function validatePassword(value: string): string {
  if (!value) return "Password is required";
  if (value.length < 6) return "Must be at least 6 characters";
  if (value.length > 50) return "Must be 50 characters or less";
  if (!/[A-Z]/.test(value)) return "Must contain at least one uppercase letter";
  if (!/[0-9]/.test(value)) return "Must contain at least one number";
  return "";
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-400" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-green-400" };
  return { score: 5, label: "Very strong", color: "bg-emerald-400" };
}

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<FieldState>({ value: "", touched: false, error: "" });
  const [username, setUsername] = useState<FieldState>({ value: "", touched: false, error: "" });
  const [password, setPassword] = useState<FieldState>({ value: "", touched: false, error: "" });
  const [confirmPassword, setConfirmPassword] = useState<FieldState>({ value: "", touched: false, error: "" });
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

  const validateConfirmPassword = useCallback(
    (value: string): string => {
      if (!value) return "Please confirm your password";
      if (value !== password.value) return "Passwords do not match";
      return "";
    },
    [password.value]
  );

  const isFormValid =
    !validateEmail(email.value) &&
    !validateUsername(username.value) &&
    !validatePassword(password.value) &&
    !validateConfirmPassword(confirmPassword.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmail((prev) => ({ ...prev, touched: true, error: validateEmail(prev.value) }));
    setUsername((prev) => ({ ...prev, touched: true, error: validateUsername(prev.value) }));
    setPassword((prev) => ({ ...prev, touched: true, error: validatePassword(prev.value) }));
    setConfirmPassword((prev) => ({ ...prev, touched: true, error: validateConfirmPassword(prev.value) }));
    if (!isFormValid) return;

    setServerError("");
    setLoading(true);
    try {
      await signup(email.value, username.value, password.value);
      router.push("/dashboard");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: FieldState) =>
    `w-full px-4 py-3 bg-surface-950/80 border rounded-xl text-white placeholder-surface-200/30 focus:outline-none transition-all duration-200 ${
      field.touched && field.error
        ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/60"
        : field.touched && !field.error && field.value
          ? "border-green-500/40 focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40"
          : "border-white/[0.08] focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40"
    }`;

  const strength = getPasswordStrength(password.value);

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-surface-900 to-brand-950" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.1] blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[15%] left-[15%] w-[400px] h-[400px] rounded-full bg-brand-600/[0.08] blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        {/* Animated network visualization */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] relative">
            {/* Outer orbit */}
            <div className="absolute inset-0 animate-orbit">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="170" fill="none" stroke="url(#signupRing1)" strokeWidth="0.5" opacity="0.2" />
                <circle cx="370" cy="200" r="3.5" fill="#a78bfa" opacity="0.7">
                  <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="30" r="2.5" fill="#818cf8" opacity="0.5">
                  <animate attributeName="r" values="2;4;2" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="60" cy="280" r="3" fill="#c4b5fd" opacity="0.4">
                  <animate attributeName="r" values="2;4;2" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="signupRing1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Mid orbit */}
            <div className="absolute animate-orbit-reverse" style={{ top: "12%", left: "12%", width: "76%", height: "76%" }}>
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="150" fill="none" stroke="#a5b4fc" strokeWidth="0.4" strokeDasharray="6 10" opacity="0.2" className="animate-dash-flow" />
                <circle cx="350" cy="200" r="2.5" fill="#c7d2fe" opacity="0.6">
                  <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="110" cy="90" r="2" fill="#a5b4fc" opacity="0.5">
                  <animate attributeName="r" values="1.5;3;1.5" dur="3s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            {/* Inner orbit */}
            <div className="absolute animate-orbit-slow" style={{ top: "28%", left: "28%", width: "44%", height: "44%" }}>
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="100" fill="none" stroke="#6366f1" strokeWidth="0.4" opacity="0.15" />
                <circle cx="300" cy="200" r="2" fill="#818cf8" opacity="0.5">
                  <animate attributeName="r" values="1.5;3;1.5" dur="2.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            {/* Center pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full bg-purple-500/50" />
              <div className="absolute inset-0 w-4 h-4 rounded-full border border-purple-400/40 animate-signal-ring" />
              <div className="absolute inset-0 w-4 h-4 rounded-full border border-purple-400/25 animate-signal-ring" style={{ animationDelay: "0.8s" }} />
              <div className="absolute inset-0 w-4 h-4 rounded-full border border-purple-400/15 animate-signal-ring" style={{ animationDelay: "1.6s" }} />
            </div>
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
              <line x1="200" y1="200" x2="350" y2="100" stroke="#a78bfa" strokeWidth="0.3" opacity="0.12" strokeDasharray="4 6" className="animate-dash-flow" />
              <line x1="200" y1="200" x2="70" y2="300" stroke="#818cf8" strokeWidth="0.3" opacity="0.1" strokeDasharray="4 6" className="animate-dash-flow" />
              <line x1="200" y1="200" x2="340" y2="310" stroke="#6366f1" strokeWidth="0.3" opacity="0.1" strokeDasharray="4 6" className="animate-dash-flow" />
            </svg>
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
            Start your
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-brand-400 to-purple-300 bg-clip-text text-transparent">
              journey today
            </span>
          </h1>
          <p className="text-surface-200/50 text-base leading-relaxed mb-10">
            Set up your account in seconds and connect with your Bitpastel team. Chat, call, and collaborate effortlessly.
          </p>

          {/* Steps */}
          <div className="space-y-4 animate-fade-in-up-delay-2">
            {[
              { step: "1", text: "Create your account with email and username" },
              { step: "2", text: "Search and connect with your teammates" },
              { step: "3", text: "Start chatting and calling instantly" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-600/15 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
                  {item.step}
                </div>
                <p className="text-surface-200/50 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 relative overflow-hidden">
        {/* Mobile background */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[500px] rounded-full bg-brand-600/[0.07] blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
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
          <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-600/[0.04] blur-[100px]" />
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
              <h2 className="text-2xl font-bold text-white mb-1.5">Create your account</h2>
              <p className="text-surface-200/50 text-sm">Join your team on BPCall</p>
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
              {/* Email */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-surface-200/70 mb-2">
                  <span>Email</span>
                  {email.touched && !email.error && email.value && (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
                <input
                  type="email"
                  value={email.value}
                  onChange={(e) => updateField(setEmail, validateEmail)(e.target.value)}
                  onBlur={touchField(setEmail, validateEmail)}
                  className={inputClass(email)}
                  placeholder="you@bitpastel.com"
                />
                {email.touched && email.error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {email.error}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-surface-200/70 mb-2">
                  <span>Username</span>
                  {username.touched && !username.error && username.value && (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/30 text-sm">@</span>
                  <input
                    type="text"
                    value={username.value}
                    onChange={(e) => updateField(setUsername, validateUsername)(e.target.value)}
                    onBlur={touchField(setUsername, validateUsername)}
                    className={`${inputClass(username)} pl-8`}
                    placeholder="username"
                  />
                </div>
                {username.touched && username.error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {username.error}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-surface-200/70 mb-2">
                  <span>Password</span>
                  {password.touched && !password.error && password.value && (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
                <input
                  type="password"
                  value={password.value}
                  onChange={(e) => {
                    updateField(setPassword, validatePassword)(e.target.value);
                    // Re-validate confirm password if it's been touched
                    if (confirmPassword.touched) {
                      const newPw = e.target.value;
                      setConfirmPassword((prev) => ({
                        ...prev,
                        error: !prev.value ? "Please confirm your password" : prev.value !== newPw ? "Passwords do not match" : "",
                      }));
                    }
                  }}
                  onBlur={touchField(setPassword, validatePassword)}
                  className={inputClass(password)}
                  placeholder="Choose a password"
                />
                {password.touched && password.error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {password.error}
                  </p>
                )}
                {password.value && (
                  <div className="mt-3 animate-fade-in-up">
                    <div className="flex gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : "bg-white/[0.06]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      strength.score <= 1 ? "text-red-400" :
                      strength.score <= 2 ? "text-amber-400" :
                      strength.score <= 3 ? "text-yellow-400" :
                      "text-green-400"
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-surface-200/70 mb-2">
                  <span>Confirm Password</span>
                  {confirmPassword.touched && !confirmPassword.error && confirmPassword.value && (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
                <input
                  type="password"
                  value={confirmPassword.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPassword((prev) => ({
                      value,
                      touched: prev.touched,
                      error: prev.touched ? (value !== password.value ? "Passwords do not match" : !value ? "Please confirm your password" : "") : "",
                    }));
                  }}
                  onBlur={() => {
                    setConfirmPassword((prev) => ({
                      ...prev,
                      touched: true,
                      error: validateConfirmPassword(prev.value),
                    }));
                  }}
                  className={inputClass(confirmPassword)}
                  placeholder="Re-enter your password"
                />
                {confirmPassword.touched && confirmPassword.error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {confirmPassword.error}
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
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
              <p className="text-surface-200/40 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Sign in
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
