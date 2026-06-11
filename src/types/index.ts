export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
  created_at: string;
}

export interface Connection {
  id: number;
  requester: User;
  receiver: User;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: number;
  user: User;
  role: "admin" | "member";
  joined_at: string;
}

export interface Room {
  id: number;
  name: string | null;
  is_direct: boolean;
  creator_id: number;
  created_at: string;
  members: RoomMember[];
}

export interface RoomListItem {
  id: number;
  name: string | null;
  is_direct: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender: User;
  content: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
}

export interface CallLog {
  id: number;
  room_id: number;
  initiated_by: number;
  call_type: "audio" | "video";
  started_at: string;
  ended_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Notification {
  id: string;
  type: "connection_request" | "connection_accepted" | "connection_rejected";
  message: string;
  fromUser: {
    id: number;
    username: string;
    display_name: string | null;
  };
  connectionId?: number;
  timestamp: string;
  read: boolean;
}

export interface WSMessage {
  type:
    | "chat_message"
    | "typing"
    | "webrtc_offer"
    | "webrtc_answer"
    | "webrtc_ice_candidate"
    | "call_initiate"
    | "call_accept"
    | "call_reject"
    | "call_end"
    | "presence"
    | "connection_request"
    | "connection_accepted"
    | "connection_rejected"
    | "message_status"
    | "messages_delivered"
    | "messages_read"
    | "room_created"
    | "room_deleted"
    | "room_member_left"
    | "room_role_changed";
  payload: Record<string, unknown>;
}
