"use client";

import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { api } from "@/lib/api";
import { Notification } from "@/types";

const AVATAR_GRADIENTS = [
  "from-brand-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-indigo-600",
];

interface Props {
  onSidebarReload: () => void;
  onOpenPending: () => void;
  onSelectUser: (userId: number) => void;
}

export default function NotificationBell({ onSidebarReload, onOpenPending, onSelectUser }: Props) {
  const { subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Subscribe to connection events
  useEffect(() => {
    const unsubs = [
      subscribe("connection_request", (payload) => {
        const notif: Notification = {
          id: `req-${Date.now()}`,
          type: "connection_request",
          message: payload.message as string,
          fromUser: payload.from_user as Notification["fromUser"],
          connectionId: payload.connection_id as number,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
        triggerBellAnimation();
        onSidebarReload();
      }),

      subscribe("connection_accepted", (payload) => {
        const notif: Notification = {
          id: `acc-${Date.now()}`,
          type: "connection_accepted",
          message: payload.message as string,
          fromUser: payload.by_user as Notification["fromUser"],
          connectionId: payload.connection_id as number,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
        triggerBellAnimation();
        onSidebarReload();
      }),

      subscribe("connection_rejected", (payload) => {
        const notif: Notification = {
          id: `rej-${Date.now()}`,
          type: "connection_rejected",
          message: payload.message as string,
          fromUser: payload.by_user as Notification["fromUser"],
          connectionId: payload.connection_id as number,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
        triggerBellAnimation();
      }),

      subscribe("room_created", (payload) => {
        const notif: Notification = {
          id: `room-${Date.now()}`,
          type: "connection_accepted", // reuse green icon style
          message: payload.message as string,
          fromUser: {
            id: 0,
            username: payload.created_by as string,
            display_name: payload.created_by as string,
          },
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
        triggerBellAnimation();
        onSidebarReload();
      }),

      subscribe("room_deleted", (payload) => {
        const notif: Notification = {
          id: `roomdel-${Date.now()}`,
          type: "connection_rejected",
          message: payload.message as string,
          fromUser: { id: 0, username: "", display_name: null },
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
        triggerBellAnimation();
        onSidebarReload();
      }),

      subscribe("room_member_left", (payload) => {
        const notif: Notification = {
          id: `roomleft-${Date.now()}`,
          type: "connection_accepted",
          message: payload.message as string,
          fromUser: { id: 0, username: payload.user_name as string, display_name: payload.user_name as string },
          timestamp: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
        triggerBellAnimation();
        onSidebarReload();
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [subscribe, onSidebarReload]);

  const triggerBellAnimation = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 600);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAccept = async (notif: Notification) => {
    if (!notif.connectionId) return;
    try {
      await api.acceptConnection(notif.connectionId);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, read: true, type: "connection_accepted" as const, message: `You accepted ${notif.fromUser.display_name || notif.fromUser.username}'s request` } : n)
      );
      onSidebarReload();
    } catch { /* ignore */ }
  };

  const handleDecline = async (notif: Notification) => {
    if (!notif.connectionId) return;
    try {
      await api.rejectConnection(notif.connectionId);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, read: true, type: "connection_rejected" as const, message: `You declined ${notif.fromUser.display_name || notif.fromUser.username}'s request` } : n)
      );
      onSidebarReload();
    } catch { /* ignore */ }
  };

  const clearAll = () => {
    setNotifications([]);
    setOpen(false);
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "connection_request":
        return (
          <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case "connection_accepted":
        return (
          <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "connection_rejected":
        return (
          <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className={`relative p-2.5 hover:bg-white/[0.06] rounded-xl text-surface-200/60 hover:text-white transition-all ${animate ? "animate-wiggle" : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface-900 animate-fade-in-up">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-800/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in-up"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-surface-200/40 hover:text-surface-200/70 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </div>
                  <p className="text-surface-200/30 text-sm">No notifications yet</p>
                  <p className="text-surface-200/20 text-xs mt-1">You&apos;ll see updates here</p>
                </div>
              )}

              {notifications.map((notif) => {
                const handleClick = () => {
                  setOpen(false);
                  if (notif.type === "connection_request") {
                    onOpenPending();
                  } else if (notif.type === "connection_accepted") {
                    onSelectUser(notif.fromUser.id);
                  }
                };

                const isClickable = notif.type === "connection_request" || notif.type === "connection_accepted";

                return (
                  <div
                    key={notif.id}
                    onClick={isClickable ? handleClick : undefined}
                    className={`px-4 py-3 border-b border-white/[0.04] transition-colors ${!notif.read ? "bg-brand-600/[0.04]" : ""} ${isClickable ? "cursor-pointer hover:bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
                  >
                    <div className="flex gap-3">
                      {getIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-200/80 leading-snug">{notif.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-surface-200/30">{timeAgo(notif.timestamp)}</p>
                          {isClickable && (
                            <span className="text-[11px] text-brand-400/60 font-medium">
                              {notif.type === "connection_request" ? "View request →" : "Open chat →"}
                            </span>
                          )}
                        </div>

                        {/* Inline action buttons for pending requests */}
                        {notif.type === "connection_request" && !notif.read && (
                          <div className="flex gap-2 mt-2.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleAccept(notif)}
                              className="px-4 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(notif)}
                              className="px-4 py-1.5 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-surface-200/70 hover:text-white border border-white/[0.06] rounded-lg transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
