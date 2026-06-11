import type { TokenResponse, User, Connection, RoomListItem, Room, Message, CallLog } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && accessToken) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }

  return res.json();
}

async function refreshToken(): Promise<boolean> {
  const stored = localStorage.getItem("refresh_token");
  if (!stored) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: stored }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.access_token;
    localStorage.setItem("refresh_token", data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  signup: (email: string, username: string, password: string) =>
    request<TokenResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    }),

  login: (identifier: string, password: string) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  getMe: () => request<User>("/api/users/me"),

  updateMe: (data: { display_name?: string; avatar_url?: string; bio?: string }) =>
    request<User>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  searchUsers: (q: string) =>
    request<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`),

  sendConnectionRequest: (userId: number) =>
    request<Connection>("/api/connections/request", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),

  getPendingRequests: () =>
    request<Connection[]>("/api/connections/pending"),

  getSentRequests: () =>
    request<Connection[]>("/api/connections/sent"),

  getConnections: () =>
    request<Connection[]>("/api/connections"),

  acceptConnection: (id: number) =>
    request<Connection>(`/api/connections/${id}/accept`, { method: "PUT" }),

  rejectConnection: (id: number) =>
    request<Connection>(`/api/connections/${id}/reject`, { method: "PUT" }),

  removeConnection: (id: number) =>
    request<void>(`/api/connections/${id}`, { method: "DELETE" }),

  getRooms: () =>
    request<RoomListItem[]>("/api/rooms"),

  createRoom: (name: string, memberIds: number[]) =>
    request<Room>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name, member_ids: memberIds }),
    }),

  getRoom: (id: number) =>
    request<Room>(`/api/rooms/${id}`),

  getMessages: (roomId: number, before?: string) =>
    request<Message[]>(
      `/api/rooms/${roomId}/messages${before ? `?before=${before}` : ""}`
    ),

  getCallHistory: () =>
    request<CallLog[]>("/api/calls/history"),

  getUnreadCounts: () =>
    request<{ room_id: number; count: number }[]>("/api/rooms/unread"),

  markRoomRead: (roomId: number) =>
    request<void>(`/api/rooms/${roomId}/read`, { method: "PUT" }),

  addRoomMembers: (roomId: number, memberIds: number[]) =>
    request<void>(`/api/rooms/${roomId}/members`, {
      method: "POST",
      body: JSON.stringify({ name: "", member_ids: memberIds }),
    }),

  deleteRoom: (roomId: number) =>
    request<void>(`/api/rooms/${roomId}`, { method: "DELETE" }),

  leaveRoom: (roomId: number) =>
    request<void>(`/api/rooms/${roomId}/leave`, { method: "POST" }),

  removeMember: (roomId: number, userId: number) =>
    request<void>(`/api/rooms/${roomId}/members/${userId}`, { method: "DELETE" }),

  changeRole: (roomId: number, userId: number) =>
    request<void>(`/api/rooms/${roomId}/members/${userId}/role`, { method: "PUT" }),
};
