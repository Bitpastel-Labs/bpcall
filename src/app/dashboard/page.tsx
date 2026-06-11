"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { User, Connection } from "@/types";
import Link from "next/link";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallUI from "@/components/CallUI";
import OfflineBanner from "@/components/OfflineBanner";
import ConnectionSearch from "@/components/ConnectionSearch";
import PendingRequests from "@/components/PendingRequests";
import CreateRoomModal from "@/components/CreateRoomModal";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/api";

function DashboardContent() {
  const { user, logout } = useAuth();
  const { connected } = useWebSocket();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);

  const reloadSidebar = () => {
    const reload = (window as unknown as Record<string, () => void>).__sidebarReload;
    if (reload) reload();
    api.getConnections().then(setConnections).catch(() => {});
  };

  useEffect(() => {
    api.getConnections().then(setConnections).catch(() => {});
  }, []);

  const {
    callState,
    localStream,
    remoteStreams,
    micMuted,
    camOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
  } = useWebRTC();

  const handleStartCall = (type: "audio" | "video") => {
    if (selectedRoomId) startCall(selectedRoomId, type);
  };

  const handleSelectRoom = (roomId: number, name: string) => {
    setSelectedRoomId(roomId);
    setRoomName(name);
    setSelectedUser(null);
    setSidebarOpen(false);
  };

  const handleSelectDirect = (roomId: number, otherUser: User) => {
    setSelectedRoomId(roomId);
    setRoomName(otherUser.display_name || otherUser.username);
    setSelectedUser(otherUser);
    setSidebarOpen(false);
  };

  const handleSelectUserFromNotification = async (userId: number) => {
    // Reload connections and rooms, then find the direct room for this user
    try {
      const [conns, rooms] = await Promise.all([api.getConnections(), api.getRooms()]);
      setConnections(conns);
      const directRooms = rooms.filter((r) => r.is_direct);
      // Find the connection involving this user
      const connIndex = conns.findIndex(
        (c) => c.requester.id === userId || c.receiver.id === userId
      );
      if (connIndex >= 0 && directRooms[connIndex]) {
        const conn = conns[connIndex];
        const otherUser = conn.requester.id === user?.id ? conn.receiver : conn.requester;
        setSelectedRoomId(directRooms[connIndex].id);
        setRoomName(otherUser.display_name || otherUser.username);
        setSelectedUser(otherUser);
      }
      reloadSidebar();
    } catch { /* ignore */ }
  };

  const initials = (user?.display_name || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      <OfflineBanner />

      {/* Header */}
      <header className="h-14 bg-surface-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/[0.06] rounded-lg text-surface-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-brand-600/20">
              BP
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              BP<span className="text-brand-400">Call</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Connection status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] mr-2">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-xs text-surface-200/50 font-medium">
              {connected ? "Connected" : "Reconnecting"}
            </span>
          </div>

          {/* Notification bell */}
          <NotificationBell
            onSidebarReload={reloadSidebar}
            onOpenPending={() => setShowPending(true)}
            onSelectUser={handleSelectUserFromNotification}
          />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-white/[0.06] rounded-xl transition-colors"
            >
              <Avatar
                src={user?.avatar_url}
                name={user?.display_name || user?.username || "U"}
                userId={user?.id || 0}
                size="sm"
              />
              <span className="text-sm text-surface-200/80 font-medium hidden sm:block">
                {user?.display_name || user?.username}
              </span>
              <svg className="w-3.5 h-3.5 text-surface-200/40 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-800/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-fade-in-up">
                  <div className="p-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">{user?.display_name || user?.username}</p>
                    <p className="text-xs text-surface-200/40">@{user?.username}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-200/70 hover:text-white hover:bg-white/[0.06] transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Edit Profile
                    </Link>
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`absolute lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:transform-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <Sidebar
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            onSelectDirect={handleSelectDirect}
            onOpenSearch={() => setShowSearch(true)}
            onOpenPending={() => setShowPending(true)}
            onOpenCreateRoom={() => setShowCreateRoom(true)}
          />
        </div>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <ChatArea
          roomId={selectedRoomId}
          roomName={roomName}
          chatUser={selectedUser}
          onStartCall={handleStartCall}
          hasConnections={connections.length > 0}
          onFindPeople={() => setSidebarOpen(true)}
          onRoomLeft={() => {
            setSelectedRoomId(null);
            setRoomName("");
            setSelectedUser(null);
            reloadSidebar();
          }}
        />
      </div>

      <CallUI
        callState={callState}
        localStream={localStream}
        remoteStreams={remoteStreams}
        micMuted={micMuted}
        camOff={camOff}
        roomName={roomName}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
      />

      {/* Modals rendered at root level (outside transform containers) */}
      {showSearch && (
        <ConnectionSearch onClose={() => { setShowSearch(false); reloadSidebar(); }} />
      )}
      {showPending && (
        <PendingRequests onClose={() => { setShowPending(false); reloadSidebar(); }} />
      )}
      {showCreateRoom && (
        <CreateRoomModal
          connections={connections}
          currentUserId={user?.id || 0}
          onClose={() => { setShowCreateRoom(false); reloadSidebar(); }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold animate-pulse">
            BP
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return <DashboardContent />;
}
