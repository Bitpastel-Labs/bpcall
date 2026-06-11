"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { getAccessToken } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { WSMessage } from "@/types";

interface WSState {
  connected: boolean;
  send: (message: WSMessage) => boolean;
  subscribe: (type: string, handler: (payload: Record<string, unknown>) => void) => () => void;
}

const WebSocketContext = createContext<WSState | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<(payload: Record<string, unknown>) => void>>>(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef(user);
  const mountedRef = useRef(true);

  // Keep userRef in sync without triggering re-renders
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      // Remove handlers before closing to prevent onclose from triggering reconnect
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    // Don't connect if unmounted or no user
    if (!mountedRef.current || !userRef.current) return;

    const token = getAccessToken();
    if (!token) return;

    // Clean up any existing connection first
    cleanup();

    // Derive WebSocket URL from API URL (https→wss, http→ws)
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
    const wsBase = apiUrl.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current === ws) {
        setConnected(true);
        console.log("[WS] Connected");
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        const handlers = handlersRef.current.get(msg.type);
        if (handlers) {
          handlers.forEach((h) => h(msg.payload));
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (event) => {
      // Only handle if this is still the active WebSocket
      if (wsRef.current !== ws) return;

      console.log("[WS] Disconnected, code:", event.code);
      wsRef.current = null;
      setConnected(false);

      // Reconnect after 3 seconds if still mounted and logged in
      if (mountedRef.current && userRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      // onerror is always followed by onclose, so just let onclose handle it
    };
  }, [cleanup]);

  // Connect when user logs in, disconnect when they log out
  useEffect(() => {
    mountedRef.current = true;

    if (user) {
      // Small delay to ensure token is set in memory
      const timer = setTimeout(() => connect(), 100);
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
        cleanup();
      };
    } else {
      cleanup();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [user, connect, cleanup]);

  const send = useCallback((message: WSMessage): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (e) {
        console.error("[WS] Send error:", e);
        return false;
      }
    }
    console.warn("[WS] Cannot send — not connected. readyState:", ws?.readyState);
    return false;
  }, []);

  const subscribe = useCallback(
    (type: string, handler: (payload: Record<string, unknown>) => void) => {
      if (!handlersRef.current.has(type)) {
        handlersRef.current.set(type, new Set());
      }
      handlersRef.current.get(type)!.add(handler);
      return () => {
        handlersRef.current.get(type)?.delete(handler);
      };
    },
    []
  );

  return (
    <WebSocketContext.Provider value={{ connected, send, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}

/**
 * Wraps children in WebSocketProvider only when user is authenticated.
 * Used at the root layout level so WebSocket stays connected across page navigations.
 */
export function AuthWebSocketWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return <WebSocketProvider>{children}</WebSocketProvider>;
  }

  return <>{children}</>;
}
