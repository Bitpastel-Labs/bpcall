"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { api } from "@/lib/api";
import { User } from "@/types";
import Avatar from "./Avatar";
import OnlineStatus from "./OnlineStatus";

const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"],
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💪","🦾"],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫶"],
  },
  {
    name: "Objects",
    icon: "💡",
    emojis: ["💡","🔥","⭐","🌟","✨","⚡","💥","💫","🎉","🎊","🎈","🎁","🏆","🥇","🎯","🚀","💻","📱","⌨️","🖥️","📞","📧","📝","📌","📎","🔗","🔒","🔑","🛠️","⚙️","💰","💎"],
  },
  {
    name: "Reactions",
    icon: "✅",
    emojis: ["✅","❌","⭕","❓","❗","💯","🆗","🆕","🔴","🟢","🔵","🟡","⬆️","⬇️","➡️","⬅️","↩️","🔄","➕","➖","✖️","➗","♾️","💤","🎵","🔔","🔕","📢","💬","💭","🗨️","👁️‍🗨️"],
  },
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-surface-800/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in-up"
    >
      {/* Search */}
      <div className="p-2.5 border-b border-white/[0.06]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-xs placeholder-surface-200/30 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
          placeholder="Search emoji..."
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex px-2 pt-2 gap-0.5">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`flex-1 py-1.5 text-center text-base rounded-lg transition-all ${
                activeCategory === i
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 max-h-52 overflow-y-auto">
        {!search && (
          <p className="text-[10px] text-surface-200/30 uppercase tracking-wider font-semibold px-1 mb-1.5">
            {EMOJI_CATEGORIES[activeCategory].name}
          </p>
        )}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-white/[0.08] transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Room } from "@/types";

const AVATAR_GRADIENTS = [
  "from-brand-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-indigo-600",
];

interface Props {
  roomId: number | null;
  roomName: string;
  chatUser?: User | null;
  onStartCall?: (type: "audio" | "video") => void;
  onFindPeople?: () => void;
  onRoomLeft?: () => void;
  hasConnections?: boolean;
}

export default function ChatArea({ roomId, roomName, chatUser, onStartCall, onFindPeople, onRoomLeft, hasConnections }: Props) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendTyping, sendError, connected } = useChat(roomId);
  const { subscribe } = useWebSocket();
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [showEmoji, setShowEmoji] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [roomDetails, setRoomDetails] = useState<Room | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [addMemberResults, setAddMemberResults] = useState<User[]>([]);
  const [addMemberSelected, setAddMemberSelected] = useState<Set<number>>(new Set());
  const [addingMembers, setAddingMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const loadRoomDetails = useCallback(async () => {
    if (!roomId) return;
    try {
      const room = await api.getRoom(roomId);
      setRoomDetails(room);
    } catch { /* ignore */ }
  }, [roomId]);

  const toggleRoomPanel = () => {
    if (!chatUser && roomId) {
      // Group room — load details and toggle panel
      if (!showRoomPanel) loadRoomDetails();
      setShowRoomPanel(!showRoomPanel);
      setShowProfile(false);
    } else if (chatUser) {
      setShowProfile(!showProfile);
      setShowRoomPanel(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    try {
      await api.leaveRoom(roomId);
      setShowRoomPanel(false);
      onRoomLeft?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to leave room");
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId || !confirm("Are you sure you want to delete this room? All messages will be lost.")) return;
    try {
      await api.deleteRoom(roomId);
      setShowRoomPanel(false);
      onRoomLeft?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete room");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!roomId) return;
    try {
      await api.removeMember(roomId, userId);
      loadRoomDetails();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove member");
    }
  };

  const handleToggleRole = async (userId: number) => {
    if (!roomId) return;
    try {
      await api.changeRole(roomId, userId);
      loadRoomDetails();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to change role");
    }
  };

  const searchUsersToAdd = async () => {
    if (!addMemberQuery.trim()) return;
    try {
      const users = await api.searchUsers(addMemberQuery);
      // Filter out users already in the room
      const existingIds = new Set(roomDetails?.members.map((m) => m.user.id) || []);
      setAddMemberResults(users.filter((u) => !existingIds.has(u.id)));
    } catch { /* ignore */ }
  };

  const handleAddMembers = async () => {
    if (!roomId || addMemberSelected.size === 0) return;
    setAddingMembers(true);
    try {
      await api.addRoomMembers(roomId, Array.from(addMemberSelected));
      setShowAddMembers(false);
      setAddMemberQuery("");
      setAddMemberResults([]);
      setAddMemberSelected(new Set());
      loadRoomDetails();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add members");
    } finally {
      setAddingMembers(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return subscribe("typing", (payload) => {
      const userId = payload.user_id as number;
      const userName = payload.user_name as string || "Someone";
      if (userId === user?.id) return;
      if ((payload.room_id as number) !== roomId) return;

      setTypingUsers((prev) => new Map(prev).set(userId, userName));

      const existing = typingTimeoutRef.current.get(userId);
      if (existing) clearTimeout(existing);
      typingTimeoutRef.current.set(
        userId,
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          });
        }, 3000)
      );
    });
  }, [subscribe, roomId, user?.id]);

  const insertEmoji = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    setShowEmoji(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      sendTyping();
    }
  };

  // Inline search for the welcome screen
  const [welcomeQuery, setWelcomeQuery] = useState("");
  const [welcomeResults, setWelcomeResults] = useState<User[]>([]);
  const [welcomeSearching, setWelcomeSearching] = useState(false);
  const [welcomeSearched, setWelcomeSearched] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState<Set<number>>(new Set());

  const doWelcomeSearch = async () => {
    if (!welcomeQuery.trim()) return;
    setWelcomeSearching(true);
    setWelcomeSearched(false);
    try {
      const users = await api.searchUsers(welcomeQuery);
      setWelcomeResults(users);
    } catch { /* ignore */ }
    finally {
      setWelcomeSearching(false);
      setWelcomeSearched(true);
    }
  };

  const sendWelcomeRequest = async (userId: number) => {
    try {
      await api.sendConnectionRequest(userId);
      setWelcomeSent((prev) => new Set([...prev, userId]));
    } catch { /* ignore */ }
  };

  // Empty state — welcome screen
  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-950 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand-600/[0.04] blur-[120px]" />
          <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-600/[0.03] blur-[100px]" />
        </div>

        <div className="relative w-full max-w-md px-6 animate-fade-in-up">
          {!hasConnections ? (
            /* No connections — onboarding / find people */
            <div className="text-center">
              {/* Logo */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold mx-auto mb-6 shadow-xl shadow-brand-600/20">
                BP
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Welcome to BPCall</h2>
              <p className="text-surface-200/40 text-sm leading-relaxed mb-8">
                Get started by finding your teammates. Search by username or email to send a connection request.
              </p>

              {/* Inline search */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left">
                <div className="relative mb-4">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-200/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={welcomeQuery}
                    onChange={(e) => setWelcomeQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doWelcomeSearch()}
                    className="w-full pl-11 pr-20 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/30 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
                    placeholder="Search username or email..."
                  />
                  <button
                    onClick={doWelcomeSearch}
                    disabled={welcomeSearching || !welcomeQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    {welcomeSearching ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : "Search"}
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {welcomeResults.map((u) => {
                    const gradient = AVATAR_GRADIENTS[u.id % AVATAR_GRADIENTS.length];
                    return (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                            {(u.display_name || u.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{u.display_name || u.username}</p>
                            <p className="text-xs text-surface-200/40">@{u.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => sendWelcomeRequest(u.id)}
                          disabled={welcomeSent.has(u.id)}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                            welcomeSent.has(u.id)
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20"
                          }`}
                        >
                          {welcomeSent.has(u.id) ? (
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

                  {welcomeSearched && welcomeResults.length === 0 && (
                    <div className="py-6 text-center">
                      <p className="text-surface-200/30 text-sm">No users found</p>
                      <p className="text-surface-200/20 text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>

                {!welcomeSearched && welcomeResults.length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-surface-200/20 text-xs">Results will appear here</p>
                  </div>
                )}
              </div>

              {/* Steps hint */}
              <div className="mt-6 flex items-center justify-center gap-6 text-surface-200/20">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-surface-200/15 flex items-center justify-center text-[9px] font-bold">1</div>
                  <span className="text-xs">Search</span>
                </div>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-surface-200/15 flex items-center justify-center text-[9px] font-bold">2</div>
                  <span className="text-xs">Connect</span>
                </div>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-surface-200/15 flex items-center justify-center text-[9px] font-bold">3</div>
                  <span className="text-xs">Chat</span>
                </div>
              </div>
            </div>
          ) : (
            /* Has connections but no chat selected */
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] border border-white/[0.06] rotate-6" />
                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] border border-white/[0.06] -rotate-3" />
                <div className="relative w-full h-full rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <svg className="w-10 h-10 text-brand-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white/80 mb-2">Pick a conversation</h3>
              <p className="text-sm text-surface-200/35 leading-relaxed mb-6">
                Select a chat from the sidebar to start messaging, or find new people to connect with.
              </p>
              <button
                onClick={onFindPeople}
                className="px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-surface-200/70 hover:text-white text-sm font-medium rounded-xl transition-all lg:hidden"
              >
                Open Sidebar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-950">
      {/* Chat Header */}
      <div className="px-5 py-3 border-b border-white/[0.06] bg-surface-900/50 backdrop-blur-sm flex items-center justify-between shrink-0">
        <button
          onClick={toggleRoomPanel}
          className="flex items-center gap-3 hover:bg-white/[0.03] -ml-2 pl-2 pr-4 py-1 rounded-xl transition-all"
        >
          {chatUser ? (
            <Avatar src={chatUser.avatar_url} name={chatUser.display_name || chatUser.username} userId={chatUser.id} size="md" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-surface-200/50 text-lg font-semibold">
              #
            </div>
          )}
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">{roomName}</h3>
            {chatUser ? (
              <OnlineStatus isOnline={chatUser.is_online} size="sm" />
            ) : (
              <p className="text-[11px] text-surface-200/35">Group room</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onStartCall?.("audio")}
            className="p-2.5 hover:bg-white/[0.06] rounded-xl text-surface-200/50 hover:text-green-400 transition-all"
            title="Audio call"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button
            onClick={() => onStartCall?.("video")}
            className="p-2.5 hover:bg-white/[0.06] rounded-xl text-surface-200/50 hover:text-blue-400 transition-all"
            title="Video call"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* User profile panel (slide-down) */}
      {showProfile && chatUser && (
        <div className="border-b border-white/[0.06] bg-surface-900/30 px-5 py-4 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <Avatar src={chatUser.avatar_url} name={chatUser.display_name || chatUser.username} userId={chatUser.id} size="xl" />
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-white">{chatUser.display_name || chatUser.username}</h4>
              <p className="text-sm text-surface-200/40">@{chatUser.username}</p>
              <p className="text-xs text-surface-200/30 mt-0.5">{chatUser.email}</p>
              {chatUser.bio && (
                <p className="text-xs text-surface-200/50 mt-2 leading-relaxed">{chatUser.bio}</p>
              )}
              <div className="mt-2">
                <OnlineStatus isOnline={chatUser.is_online} size="md" />
              </div>
            </div>
            <button
              onClick={() => setShowProfile(false)}
              className="self-start p-1.5 hover:bg-white/[0.06] rounded-lg text-surface-200/30 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Room management panel (group rooms) */}
      {showRoomPanel && roomDetails && !roomDetails.is_direct && (
        <div className="border-b border-white/[0.06] bg-surface-900/30 px-5 py-4 animate-fade-in-up max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">{roomDetails.name}</h4>
              <p className="text-xs text-surface-200/35">{roomDetails.members.length} members</p>
            </div>
            <button
              onClick={() => setShowRoomPanel(false)}
              className="p-1.5 hover:bg-white/[0.06] rounded-lg text-surface-200/30 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Members list */}
          <div className="space-y-1 mb-4">
            {roomDetails.members.map((m) => {
              const isCurrentUser = m.user.id === user?.id;
              const currentUserMember = roomDetails.members.find((rm) => rm.user.id === user?.id);
              const isCurrentUserAdmin = currentUserMember?.role === "admin";

              return (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.user.avatar_url} name={m.user.display_name || m.user.username} userId={m.user.id} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {m.user.display_name || m.user.username}
                          {isCurrentUser && <span className="text-surface-200/30"> (you)</span>}
                        </p>
                        {m.role === "admin" && (
                          <span className="text-[10px] font-semibold text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-200/30">@{m.user.username}</p>
                    </div>
                  </div>

                  {/* Admin actions on other members */}
                  {isCurrentUserAdmin && !isCurrentUser && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleRole(m.user.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-surface-200/50 hover:text-brand-400 hover:bg-brand-600/10 rounded-lg transition-all"
                        title={m.role === "admin" ? "Remove admin" : "Make admin"}
                      >
                        {m.role === "admin" ? "Remove admin" : "Make admin"}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(m.user.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-surface-200/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add members (admin only) */}
          {(() => {
            const currentMember = roomDetails.members.find((m) => m.user.id === user?.id);
            const isAdmin = currentMember?.role === "admin";
            if (!isAdmin) return null;
            return (
              <div className="pt-3 border-t border-white/[0.06] mb-3">
                {!showAddMembers ? (
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-brand-400 bg-brand-600/10 hover:bg-brand-600/15 border border-brand-500/20 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Members
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={addMemberQuery}
                        onChange={(e) => setAddMemberQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchUsersToAdd()}
                        className="w-full pl-10 pr-16 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-xs placeholder-surface-200/30 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                        placeholder="Search people to add..."
                        autoFocus
                      />
                      <button
                        onClick={searchUsersToAdd}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-brand-600 text-white text-[10px] font-semibold rounded-md"
                      >
                        Search
                      </button>
                    </div>

                    {addMemberResults.length > 0 && (
                      <div className="max-h-36 overflow-y-auto space-y-0.5">
                        {addMemberResults.map((u) => {
                          const selected = addMemberSelected.has(u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setAddMemberSelected((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(u.id)) next.delete(u.id);
                                  else next.add(u.id);
                                  return next;
                                });
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-left ${
                                selected ? "bg-brand-600/10 border border-brand-500/20" : "hover:bg-white/[0.03] border border-transparent"
                              }`}
                            >
                              <Avatar src={u.avatar_url} name={u.display_name || u.username} userId={u.id} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{u.display_name || u.username}</p>
                                <p className="text-[10px] text-surface-200/30">@{u.username}</p>
                              </div>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                selected ? "bg-brand-600 border-brand-500" : "border-white/[0.12]"
                              }`}>
                                {selected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAddMembers(false);
                          setAddMemberQuery("");
                          setAddMemberResults([]);
                          setAddMemberSelected(new Set());
                        }}
                        className="flex-1 py-2 text-xs font-semibold bg-white/[0.04] text-surface-200/60 rounded-lg transition-all hover:bg-white/[0.08]"
                      >
                        Cancel
                      </button>
                      {addMemberSelected.size > 0 && (
                        <button
                          onClick={handleAddMembers}
                          disabled={addingMembers}
                          className="flex-1 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                          {addingMembers ? "Adding..." : `Add ${addMemberSelected.size} member${addMemberSelected.size > 1 ? "s" : ""}`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Room actions */}
          <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
            {(() => {
              const currentMember = roomDetails.members.find((m) => m.user.id === user?.id);
              const isAdmin = currentMember?.role === "admin";
              return (
                <>
                  <button
                    onClick={handleLeaveRoom}
                    className="flex-1 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-surface-200/60 hover:text-white border border-white/[0.06] rounded-lg transition-all"
                  >
                    Leave Room
                  </button>
                  {isAdmin && (
                    <button
                      onClick={handleDeleteRoom}
                      className="flex-1 py-2 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all"
                    >
                      Delete Room
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-surface-200/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-surface-200/30 text-sm">No messages yet. Say hello!</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const isSystem = msg.content.startsWith("📞");
            const showAvatar = !isSystem && (index === 0 || messages[index - 1].sender_id !== msg.sender_id || messages[index - 1].content.startsWith("📞"));
            const isLastInGroup = !isSystem && (index === messages.length - 1 || messages[index + 1]?.sender_id !== msg.sender_id || messages[index + 1]?.content.startsWith("📞"));
            // System message (call events)
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-4 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-surface-200/50 flex items-center gap-2">
                    <span>{msg.content}</span>
                    <span className="text-surface-200/25">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? (isMe ? "mr-[42px]" : "ml-[42px]") : ""}`}>
                {showAvatar && (
                  <div className="shrink-0 mt-auto">
                    <Avatar
                      src={msg.sender.avatar_url}
                      name={msg.sender.display_name || msg.sender.username}
                      userId={msg.sender.id}
                      size="sm"
                    />
                  </div>
                )}
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {showAvatar && !isMe && (
                    <p className="text-[11px] text-surface-200/35 mb-1 px-1 font-medium">
                      {msg.sender.display_name || msg.sender.username}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 text-sm leading-relaxed ${
                      isMe
                        ? `bg-brand-600 text-white ${isLastInGroup ? "rounded-2xl rounded-br-md" : "rounded-2xl"}`
                        : `bg-white/[0.05] border border-white/[0.06] text-surface-200/90 ${isLastInGroup ? "rounded-2xl rounded-bl-md" : "rounded-2xl"}`
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                      <span className={`text-[10px] ${isMe ? "text-white/40" : "text-surface-200/25"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && (
                        <span className="flex items-center">
                          {msg.status === "sent" && (
                            <svg className="w-3.5 h-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                          {msg.status === "delivered" && (
                            <svg className="w-4 h-3.5 text-white/40" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12l5 5L17 7" />
                              <path d="M9 12l5 5L24 7" />
                            </svg>
                          )}
                          {msg.status === "read" && (
                            <svg className="w-4 h-3.5 text-blue-400" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12l5 5L17 7" />
                              <path d="M9 12l5 5L24 7" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-5 py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-brand-400/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-1 rounded-full bg-brand-400/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-1 rounded-full bg-brand-400/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-[11px] text-surface-200/30">
              {(() => {
                const names = Array.from(typingUsers.values());
                if (names.length === 1) return `${names[0]} is typing`;
                if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
                return `${names[0]}, ${names[1]} and ${names.length - 2} more are typing`;
              })()}
            </p>
          </div>
        </div>
      )}

      {/* Send error / disconnected banner */}
      {sendError && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            {sendError}
          </p>
        </div>
      )}
      {!connected && !sendError && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20">
          <div className="text-xs text-amber-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            Reconnecting to server...
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            {/* Emoji picker */}
            {showEmoji && (
              <EmojiPicker
                onSelect={insertEmoji}
                onClose={() => setShowEmoji(false)}
              />
            )}
            <div className="relative flex items-center">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className={`absolute left-3 p-0.5 rounded-md transition-all ${
                  showEmoji
                    ? "text-brand-400 bg-brand-600/10"
                    : "text-surface-200/30 hover:text-surface-200/60"
                }`}
                title="Emoji"
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-surface-200/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 transition-all text-sm"
                placeholder={connected ? "Type a message..." : "Waiting for connection..."}
                disabled={!connected}
              />
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-3 bg-brand-600 hover:bg-brand-500 disabled:bg-white/[0.04] disabled:text-surface-200/20 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-600/20 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
