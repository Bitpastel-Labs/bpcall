"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Connection, RoomListItem, User } from "@/types";
import Avatar, { AVATAR_GRADIENTS } from "./Avatar";
import OnlineStatus, { OnlineStatusDot } from "./OnlineStatus";

interface SidebarProps {
  selectedRoomId: number | null;
  onSelectRoom: (roomId: number, name: string) => void;
  onSelectDirect: (roomId: number, otherUser: User) => void;
  onOpenSearch: () => void;
  onOpenPending: () => void;
  onOpenCreateRoom: () => void;
}

function getAvatarGradient(id: number): string {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

export default function Sidebar({ selectedRoomId, onSelectRoom, onSelectDirect, onOpenSearch, onOpenPending, onOpenCreateRoom }: SidebarProps) {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Map<number, number>>(new Map());

  // Inline search state
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Track which room is selected to know when to increment unread
  const selectedRoomRef = useRef(selectedRoomId);
  useEffect(() => {
    selectedRoomRef.current = selectedRoomId;
    // Clear unread for the selected room
    if (selectedRoomId) {
      setUnreadCounts((prev) => {
        const next = new Map(prev);
        next.delete(selectedRoomId);
        return next;
      });
    }
  }, [selectedRoomId]);

  // Room lifecycle events — reload sidebar
  useEffect(() => {
    const unsubs = [
      subscribe("room_created", () => loadData()),
      subscribe("room_deleted", () => loadData()),
      subscribe("room_member_left", () => loadData()),
      subscribe("room_role_changed", () => loadData()),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  // Increment unread count for rooms not currently open
  useEffect(() => {
    return subscribe("chat_message", (payload) => {
      const msgRoomId = payload.room_id as number;
      const senderId = payload.sender_id as number;
      if (senderId === user?.id) return; // Own messages don't count
      if (msgRoomId === selectedRoomRef.current) return; // Currently viewing
      setUnreadCounts((prev) => {
        const next = new Map(prev);
        next.set(msgRoomId, (next.get(msgRoomId) || 0) + 1);
        return next;
      });
    });
  }, [subscribe, user?.id]);

  useEffect(() => {
    return subscribe("presence", (payload) => {
      const userId = payload.user_id as number;
      const isOnline = payload.is_online as boolean;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });
  }, [subscribe]);

  const loadData = async () => {
    try {
      const [conns, rms, pending, unreads] = await Promise.all([
        api.getConnections(),
        api.getRooms(),
        api.getPendingRequests(),
        api.getUnreadCounts(),
      ]);
      setConnections(conns);
      setRooms(rms);
      setPendingCount(pending.length);
      const online = new Set<number>();
      conns.forEach((c) => {
        const other = c.requester.id === user?.id ? c.receiver : c.requester;
        if (other.is_online) online.add(other.id);
      });
      setOnlineUsers(online);
      const unreadMap = new Map<number, number>();
      unreads.forEach((u) => unreadMap.set(u.room_id, u.count));
      setUnreadCounts(unreadMap);
    } catch {
      // Will retry on reconnect
    }
  };

  useEffect(() => {
    (window as unknown as Record<string, () => void>).__sidebarReload = loadData;
    return () => { delete (window as unknown as Record<string, unknown>).__sidebarReload; };
  }, []);

  // Search
  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const users = await api.searchUsers(searchQuery);
      setSearchResults(users);
    } catch { /* ignore */ }
    finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const sendRequest = async (userId: number) => {
    try {
      await api.sendConnectionRequest(userId);
      setSent((prev) => new Set([...prev, userId]));
    } catch { /* ignore */ }
  };

  const exitSearch = () => {
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearched(false);
    setSent(new Set());
    loadData();
  };

  useEffect(() => {
    if (searchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

  const directRooms = rooms.filter((r) => r.is_direct);
  const groupRooms = rooms.filter((r) => !r.is_direct);

  const getOtherUser = (conn: Connection): User => {
    return conn.requester.id === user?.id ? conn.receiver : conn.requester;
  };

  const getDirectRoomForConnection = (_conn: Connection, index: number): RoomListItem | undefined => {
    return directRooms[index];
  };

  return (
    <div className="w-80 lg:w-[340px] bg-surface-900 border-r border-white/[0.06] flex flex-col h-full">
      {/* Top area — search bar or search mode */}
      <div className="p-4 border-b border-white/[0.06]">
        {!searchMode ? (
          <div className="space-y-3">
            <button
              onClick={() => setSearchMode(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-surface-200/40 hover:bg-white/[0.06] hover:text-surface-200/60 hover:border-white/[0.1] transition-all text-sm"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find &amp; connect people
            </button>

            {pendingCount > 0 && (
              <button
                onClick={onOpenPending}
                className="w-full flex items-center justify-between px-4 py-3 bg-brand-600/8 border border-brand-500/15 rounded-xl text-brand-400 hover:bg-brand-600/15 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-600/20 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Pending Requests</span>
                </div>
                <span className="bg-brand-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {pendingCount}
                </span>
              </button>
            )}
          </div>
        ) : (
          /* Inline search mode */
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={exitSearch}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-200/50 hover:text-white hover:bg-white/[0.06] transition-all shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-base font-semibold text-white">Find People</h3>
            </div>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-200/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                className="w-full pl-11 pr-20 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
                placeholder="Username or email..."
              />
              <button
                onClick={doSearch}
                disabled={searching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
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
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {searchMode ? (
          /* Search results */
          <div className="px-3 py-2">
            {!searched && searchResults.length === 0 && (
              <div className="py-12 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-surface-200/40 text-sm font-medium mb-1">Search for teammates</p>
                <p className="text-surface-200/25 text-xs">Enter a username or email above</p>
              </div>
            )}

            {searchResults.map((u) => {
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors mb-1">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={u.avatar_url}
                      name={u.display_name || u.username}
                      userId={u.id}
                      size="lg"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{u.display_name || u.username}</p>
                      <p className="text-xs text-surface-200/40">@{u.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={sent.has(u.id)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      sent.has(u.id)
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20"
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

            {searched && searchResults.length === 0 && (
              <div className="py-12 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </div>
                <p className="text-surface-200/40 text-sm font-medium mb-1">No results found</p>
                <p className="text-surface-200/25 text-xs">Try a different username or email</p>
              </div>
            )}
          </div>
        ) : (
          /* Conversations list */
          <div className="px-2 py-1">
            {/* Direct Messages */}
            <div className="mb-1">
              <div className="flex items-center justify-between px-3 py-3">
                <h3 className="text-xs font-bold text-surface-200/45 uppercase tracking-widest">
                  Messages
                </h3>
                <span className="text-xs text-surface-200/30 font-semibold bg-white/[0.04] px-2 py-0.5 rounded-md">
                  {connections.length}
                </span>
              </div>
              {connections.map((conn, index) => {
                const other = getOtherUser(conn);
                const isOnline = onlineUsers.has(other.id);
                const directRoom = getDirectRoomForConnection(conn, index);
                const isSelected = directRoom && selectedRoomId === directRoom.id;
                const unread = directRoom ? (unreadCounts.get(directRoom.id) || 0) : 0;

                return (
                  <button
                    key={conn.id}
                    onClick={() => {
                      if (directRoom) onSelectDirect(directRoom.id, other);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-0.5 group ${
                      isSelected
                        ? "bg-brand-600/12 border border-brand-500/15"
                        : "hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={other.avatar_url}
                        name={other.display_name || other.username}
                        userId={other.id}
                        size="lg"
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 border-2 border-surface-900 rounded-full`}>
                        <OnlineStatusDot isOnline={isOnline} size="sm" />
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-[15px] font-semibold truncate transition-colors ${isSelected ? "text-white" : "text-surface-200/80 group-hover:text-white"}`}>
                        {other.display_name || other.username}
                      </p>
                      <OnlineStatus isOnline={isOnline} size="sm" />
                    </div>
                    {unread > 0 && (
                      <span className="bg-brand-600 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </button>
                );
              })}
              {connections.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-surface-200/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-surface-200/40 text-sm font-medium mb-1">No connections yet</p>
                  <p className="text-surface-200/25 text-xs mb-4">Start by finding your teammates</p>
                  <button
                    onClick={() => setSearchMode(true)}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-brand-600/20"
                  >
                    Find People
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-white/[0.05] my-3" />

            {/* Group Rooms */}
            <div className="mb-2">
              <div className="flex items-center justify-between px-3 py-3">
                <h3 className="text-xs font-bold text-surface-200/45 uppercase tracking-widest">
                  Rooms
                </h3>
                <button
                  onClick={onOpenCreateRoom}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-200/35 hover:text-brand-400 hover:bg-white/[0.06] transition-all"
                  title="Create room"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              {groupRooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const unread = unreadCounts.get(room.id) || 0;
                return (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoom(room.id, room.name || "Room")}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-0.5 group ${
                      isSelected
                        ? "bg-brand-600/12 border border-brand-500/15"
                        : "hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-surface-200/50 text-xl font-semibold group-hover:border-white/[0.1] transition-colors">
                      #
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-[15px] font-semibold truncate transition-colors ${isSelected ? "text-white" : "text-surface-200/80 group-hover:text-white"}`}>
                        {room.name}
                      </p>
                      <p className="text-xs text-surface-200/30 truncate">Group room</p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-brand-600 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </button>
                );
              })}
              {groupRooms.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-surface-200/25 text-sm">No rooms yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
