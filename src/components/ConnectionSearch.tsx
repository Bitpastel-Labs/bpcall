"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

const AVATAR_GRADIENTS = [
  "from-brand-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-indigo-600",
];

interface Props {
  onClose: () => void;
}

export default function ConnectionSearch({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const users = await api.searchUsers(query);
      setResults(users);
    } catch {
      // Ignore
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const sendRequest = async (userId: number) => {
    try {
      await api.sendConnectionRequest(userId);
      setSent((prev) => new Set([...prev, userId]));
    } catch {
      // Already connected or request exists
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-surface-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Find People</h3>
                <p className="text-xs text-surface-200/40">Search by username or email to connect</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-200/40 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="w-full pl-11 pr-24 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
              placeholder="Enter username or email..."
              autoFocus
            />
            <button
              onClick={search}
              disabled={searching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-all"
            >
              {searching ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-white/[0.04]">
          <div className="max-h-72 overflow-y-auto px-3 py-2">
            {!searched && results.length === 0 && (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-surface-200/25 text-sm">Search for teammates to connect with</p>
              </div>
            )}

            {results.map((u) => {
              const gradient = AVATAR_GRADIENTS[u.id % AVATAR_GRADIENTS.length];
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                      {(u.display_name || u.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.display_name || u.username}</p>
                      <p className="text-[11px] text-surface-200/35">@{u.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={sent.has(u.id)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      sent.has(u.id)
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 hover:shadow-brand-500/30"
                    }`}
                  >
                    {sent.has(u.id) ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Sent
                      </span>
                    ) : "Connect"}
                  </button>
                </div>
              );
            })}

            {searched && results.length === 0 && (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </div>
                <p className="text-surface-200/30 text-sm">No users found for &quot;{query}&quot;</p>
                <p className="text-surface-200/20 text-xs mt-1">Try a different username or email</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
