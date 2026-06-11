"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Message } from "@/types";

export function useChat(roomId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const { send, subscribe, connected } = useWebSocket();
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Load message history and mark room as read
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    api.getMessages(roomId)
      .then((msgs) => {
        setMessages(msgs);
        // Mark as read when opening a room
        api.markRoomRead(roomId).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  // Subscribe to incoming messages
  useEffect(() => {
    return subscribe("chat_message", (payload) => {
      const msgRoomId = payload.room_id as number;
      if (msgRoomId === roomIdRef.current) {
        const msg: Message = {
          id: payload.id as number,
          room_id: msgRoomId,
          sender_id: payload.sender_id as number,
          sender: {
            id: payload.sender_id as number,
            username: payload.sender_username as string,
            display_name: payload.sender_display_name as string,
            email: "",
            avatar_url: (payload.sender_avatar_url as string) || null,
            bio: null,
            is_online: true,
            created_at: "",
          },
          content: payload.content as string,
          status: (payload.status as Message["status"]) || "sent",
          created_at: payload.created_at as string,
        };
        setMessages((prev) => [...prev, msg]);

        // Auto-send read receipt if we're viewing this room and the message is from someone else
        if (payload.sender_id !== undefined) {
          api.markRoomRead(msgRoomId).catch(() => {});
        }
      }
    });
  }, [subscribe]);

  // Subscribe to message status updates (delivered, read)
  useEffect(() => {
    // Single message delivery (real-time when both online)
    const unsub1 = subscribe("message_status", (payload) => {
      const messageId = payload.message_id as number;
      const status = payload.status as Message["status"];
      if ((payload.room_id as number) === roomIdRef.current) {
        setMessages((prev) =>
          prev.map((m) => m.id === messageId ? { ...m, status } : m)
        );
      }
    });

    // Batch delivery (when recipient comes online, all "sent" → "delivered")
    const unsub2 = subscribe("messages_delivered", (payload) => {
      const deliveredRoomId = payload.room_id as number;
      const messageIds = payload.message_ids as number[];
      if (deliveredRoomId === roomIdRef.current) {
        const idSet = new Set(messageIds);
        setMessages((prev) =>
          prev.map((m) => idSet.has(m.id) && m.status === "sent" ? { ...m, status: "delivered" } : m)
        );
      }
    });

    // Read receipts (when recipient opens the chat)
    const unsub3 = subscribe("messages_read", (payload) => {
      const readRoomId = payload.room_id as number;
      if (readRoomId === roomIdRef.current) {
        setMessages((prev) =>
          prev.map((m) => m.status !== "read" ? { ...m, status: "read" } : m)
        );
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [subscribe]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId || !content.trim()) return;
      setSendError(null);
      const ok = send({
        type: "chat_message",
        payload: { room_id: roomId, content: content.trim() },
      });
      if (!ok) {
        setSendError("Message failed to send. Connection lost.");
      }
    },
    [roomId, send]
  );

  const sendTyping = useCallback(() => {
    if (!roomId) return;
    send({ type: "typing", payload: { room_id: roomId } });
  }, [roomId, send]);

  return { messages, loading, sendMessage, sendTyping, sendError, connected };
}
