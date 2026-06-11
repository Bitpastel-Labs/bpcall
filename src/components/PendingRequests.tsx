"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Connection } from "@/types";

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

export default function PendingRequests({ onClose }: Props) {
  const [requests, setRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPendingRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const accept = async (id: number) => {
    await api.acceptConnection(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const reject = async (id: number) => {
    await api.rejectConnection(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-surface-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
                <p className="text-xs text-surface-200/40">
                  {requests.length > 0 ? `${requests.length} people want to connect` : "Connection requests you've received"}
                </p>
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

        {/* Content */}
        <div className="border-t border-white/[0.04]">
          <div className="max-h-80 overflow-y-auto px-3 py-2">
            {loading && (
              <div className="flex justify-center py-10">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {!loading && requests.map((req) => {
              const gradient = AVATAR_GRADIENTS[req.requester.id % AVATAR_GRADIENTS.length];
              return (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                      {(req.requester.display_name || req.requester.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {req.requester.display_name || req.requester.username}
                      </p>
                      <p className="text-[11px] text-surface-200/35">@{req.requester.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => accept(req.id)}
                      className="px-4 py-2 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all shadow-md shadow-green-600/20 hover:shadow-green-500/30"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => reject(req.id)}
                      className="px-4 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-surface-200/70 hover:text-white border border-white/[0.06] rounded-lg transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}

            {!loading && requests.length === 0 && (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-surface-200/30 text-sm">All caught up!</p>
                <p className="text-surface-200/20 text-xs mt-1">No pending requests right now</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
