"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Connection, User } from "@/types";

const AVATAR_GRADIENTS = [
  "from-brand-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-indigo-600",
];

interface Props {
  connections: Connection[];
  currentUserId: number;
  onClose: () => void;
}

export default function CreateRoomModal({ connections, currentUserId, onClose }: Props) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const getOther = (conn: Connection): User =>
    conn.requester.id === currentUserId ? conn.receiver : conn.requester;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = async () => {
    if (!name.trim() || selected.size === 0) return;
    setCreating(true);
    try {
      await api.createRoom(name, Array.from(selected));
      onClose();
    } catch {
      // Ignore
    } finally {
      setCreating(false);
    }
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
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Create Room</h3>
                <p className="text-xs text-surface-200/40">Start a group conversation</p>
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

        {/* Room name */}
        <div className="px-6 pb-4">
          <label className="block text-xs font-medium text-surface-200/50 mb-2">Room Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
            placeholder="e.g. Design Team, Project Alpha..."
            autoFocus
          />
        </div>

        {/* Member selection */}
        <div className="border-t border-white/[0.04]">
          <div className="px-6 py-3 flex items-center justify-between">
            <p className="text-xs font-medium text-surface-200/50">
              Select Members
            </p>
            {selected.size > 0 && (
              <span className="text-[10px] text-brand-400 font-semibold bg-brand-600/10 px-2 py-0.5 rounded-full">
                {selected.size} selected
              </span>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto px-3 pb-2">
            {connections.map((conn) => {
              const other = getOther(conn);
              const isSelected = selected.has(other.id);
              const gradient = AVATAR_GRADIENTS[other.id % AVATAR_GRADIENTS.length];
              return (
                <button
                  key={other.id}
                  onClick={() => toggle(other.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-0.5 ${
                    isSelected
                      ? "bg-brand-600/10 border border-brand-500/20"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                    {(other.display_name || other.username)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">{other.display_name || other.username}</p>
                    <p className="text-[11px] text-surface-200/35">@{other.username}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected ? "bg-brand-600 border-brand-500" : "border-white/[0.12]"
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
            {connections.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-surface-200/30 text-sm">No connections to add</p>
                <p className="text-surface-200/20 text-xs mt-1">Connect with people first</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04]">
          <button
            onClick={create}
            disabled={creating || !name.trim() || selected.size === 0}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : (
              `Create Room${selected.size > 0 ? ` with ${selected.size} member${selected.size > 1 ? "s" : ""}` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
