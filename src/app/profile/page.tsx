"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user, loading, router]);

  // Reset image error when URL changes
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.updateMe({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="animate-pulse text-brand-400 text-2xl font-bold">BPCall</div>
      </div>
    );
  }

  const initial = (displayName || user.username)[0].toUpperCase();
  const showImage = avatarUrl && !imgError;

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand-600/[0.05] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-14 bg-surface-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold">
            BP
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            BP<span className="text-brand-400">Call</span>
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-surface-200/70 hover:text-white rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="relative mb-4">
            {showImage ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-2xl object-cover shadow-xl shadow-black/30 border-2 border-white/[0.08]"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-600/20">
                {initial}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-green-500 border-2 border-surface-950 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">{displayName || user.username}</h2>
          <p className="text-surface-200/40 text-sm">@{user.username}</p>
          <p className="text-surface-200/30 text-xs mt-0.5">{user.email}</p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.06] shadow-2xl shadow-black/20 animate-fade-in-up-delay-1">
          <h3 className="text-base font-semibold text-white mb-5">Edit Profile</h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-200/60 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/60 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm resize-none"
                placeholder="Tell your team about yourself"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/60 mb-2">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
                placeholder="https://example.com/avatar.png"
              />
              {avatarUrl && !imgError && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    onError={() => setImgError(true)}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Image loaded
                  </span>
                </div>
              )}
              {avatarUrl && imgError && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                  </svg>
                  Could not load image from this URL
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
