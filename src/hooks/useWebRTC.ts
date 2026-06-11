"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface CallState {
  active: boolean;
  roomId: number | null;
  callType: "audio" | "video" | null;
  callLogId: number | null;
  incoming: boolean;
  fromUserId: number | null;
  fromUserName: string | null;
  error: string | null;
}

export function useWebRTC() {
  const { user } = useAuth();
  const { send, subscribe } = useWebSocket();
  const [callState, setCallState] = useState<CallState>({
    active: false,
    roomId: null,
    callType: null,
    callLogId: null,
    incoming: false,
    fromUserId: null,
    fromUserName: null,
    error: null,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map());
  const [remoteNames, setRemoteNames] = useState<Map<number, string>>(new Map());
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStateRef = useRef(callState);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());
    setRemoteNames(new Map());
    setCallState({
      active: false,
      roomId: null,
      callType: null,
      callLogId: null,
      incoming: false,
      fromUserId: null,
      fromUserName: null,
      error: null,
    });
    setMicMuted(false);
    setCamOff(false);
  }, []);

  const getMedia = useCallback(async (type: "audio" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      // If video fails (camera in use by another tab), fall back to audio only
      if (type === "video") {
        console.warn("[WebRTC] Video failed, falling back to audio:", err);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setCallState((prev) => ({
            ...prev,
            callType: "audio",
            error: "Camera unavailable — joined with audio only",
          }));
          return stream;
        } catch (audioErr) {
          setCallState((prev) => ({ ...prev, error: "Could not access microphone" }));
          throw audioErr;
        }
      }
      setCallState((prev) => ({ ...prev, error: "Could not access microphone" }));
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(
    (targetUserId: number, stream: MediaStream) => {
      // Close existing connection to this user if any
      const existing = peersRef.current.get(targetUserId);
      if (existing) {
        existing.close();
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send({
            type: "webrtc_ice_candidate",
            payload: {
              target_user_id: targetUserId,
              candidate: event.candidate.toJSON(),
              room_id: callStateRef.current.roomId,
            },
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(targetUserId, event.streams[0]);
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setCallState((prev) => ({ ...prev, error: "Connection failed — check your network" }));
        }
      };

      peersRef.current.set(targetUserId, pc);
      return pc;
    },
    [send]
  );

  const startCall = useCallback(
    async (roomId: number, callType: "audio" | "video") => {
      try {
        const stream = await getMedia(callType);
        setCallState({
          active: true,
          roomId,
          callType,
          callLogId: null,
          incoming: false,
          fromUserId: null,
          fromUserName: null,
          error: null,
        });
        send({
          type: "call_initiate",
          payload: { room_id: roomId, call_type: callType },
        });
      } catch {
        // getMedia already set the error
      }
    },
    [getMedia, send]
  );

  const acceptCall = useCallback(async () => {
    const { roomId, callType, callLogId } = callStateRef.current;
    if (!roomId || !callType) return;

    try {
      const stream = await getMedia(callType);
      setCallState((prev) => ({ ...prev, active: true, incoming: false }));

      send({
        type: "call_accept",
        payload: { room_id: roomId, call_log_id: callLogId },
      });

      // Fetch room members and send offers to ALL other members
      // This handles both 1:1 (offer to caller) and group (offer to everyone)
      try {
        const room = await api.getRoom(roomId);
        for (const member of room.members) {
          if (member.user.id === user?.id) continue; // skip self
          const pc = createPeerConnection(member.user.id, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({
            type: "webrtc_offer",
            payload: {
              target_user_id: member.user.id,
              sdp: offer.sdp,
              type: offer.type,
              room_id: roomId,
            },
          });
          // Store their name
          setRemoteNames((prev) => new Map(prev).set(
            member.user.id,
            member.user.display_name || member.user.username
          ));
        }
      } catch {
        // Fallback: if room fetch fails, just offer to the caller
        const fromUserId = callStateRef.current.fromUserId;
        if (fromUserId) {
          const pc = createPeerConnection(fromUserId, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({
            type: "webrtc_offer",
            payload: {
              target_user_id: fromUserId,
              sdp: offer.sdp,
              type: offer.type,
              room_id: roomId,
            },
          });
        }
      }
    } catch {
      cleanup();
    }
  }, [getMedia, send, createPeerConnection, cleanup, user?.id]);

  const rejectCall = useCallback(() => {
    const { roomId, callLogId } = callStateRef.current;
    send({
      type: "call_reject",
      payload: { room_id: roomId, call_log_id: callLogId },
    });
    cleanup();
  }, [send, cleanup]);

  const endCall = useCallback(() => {
    const { roomId, callLogId } = callStateRef.current;
    send({
      type: "call_end",
      payload: { room_id: roomId, call_log_id: callLogId },
    });
    cleanup();
  }, [send, cleanup]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicMuted((prev) => !prev);
  }, []);

  const toggleCam = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();

    if (videoTracks.length > 0 && videoTracks[0].readyState === "live") {
      // Turn off camera — stop the track, replace with null on peers
      videoTracks.forEach((t) => t.stop());
      peersRef.current.forEach((pc) => {
        pc.getSenders().forEach((s) => {
          if (s.track?.kind === "video") {
            s.replaceTrack(null);
          }
        });
      });
      setCamOff(true);
      setLocalStream(new MediaStream(stream.getAudioTracks()));
    } else {
      // Turn on camera — get new track, replace on peers
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];

        // Add to local stream
        stream.getVideoTracks().forEach((t) => stream.removeTrack(t));
        stream.addTrack(newTrack);

        // Replace on all peer connections
        peersRef.current.forEach((pc) => {
          const videoSender = pc.getSenders().find((s) => s.track === null || s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(newTrack);
          } else {
            pc.addTrack(newTrack, stream);
          }
        });

        localStreamRef.current = stream;
        setLocalStream(new MediaStream(stream.getTracks()));
        setCamOff(false);
      } catch {
        setCallState((prev) => ({ ...prev, error: "Camera unavailable" }));
      }
    }
  }, []);

  useEffect(() => {
    const unsubs = [
      subscribe("call_initiate", (payload) => {
        if (callStateRef.current.active) return;
        const callerId = payload.from_user_id as number;
        const callerName = (payload.from_user_name as string) || null;
        setCallState({
          active: false,
          roomId: payload.room_id as number,
          callType: payload.call_type as "audio" | "video",
          callLogId: payload.call_log_id as number,
          incoming: true,
          fromUserId: callerId,
          fromUserName: callerName,
          error: null,
        });
        if (callerId && callerName) {
          setRemoteNames((prev) => new Map(prev).set(callerId, callerName));
        }
      }),

      subscribe("call_accept", async (payload) => {
        const acceptorName = payload.from_user_name as string | undefined;
        const acceptorId = payload.from_user_id as number | undefined;
        if (acceptorName) {
          setCallState((prev) => ({ ...prev, fromUserName: acceptorName }));
        }
        if (acceptorId && acceptorName) {
          setRemoteNames((prev) => new Map(prev).set(acceptorId, acceptorName));
        }

        // The joiner (acceptCall) sends offers to all existing participants.
        // So existing participants just wait — no action needed here.
      }),

      subscribe("call_reject", () => {
        cleanup();
      }),

      subscribe("call_end", () => {
        cleanup();
      }),

      subscribe("webrtc_offer", async (payload) => {
        const fromUserId = payload.from_user_id as number;
        const stream = localStreamRef.current;
        if (!stream) {
          console.warn("[WebRTC] Received offer but no local stream available");
          return;
        }

        // If we already have a working connection to this user, skip
        const existingPc = peersRef.current.get(fromUserId);
        if (existingPc && (existingPc.connectionState === "connected" || existingPc.connectionState === "connecting")) {
          console.log("[WebRTC] Already connected/connecting to", fromUserId, "— skipping offer");
          return;
        }

        try {
          const pc = createPeerConnection(fromUserId, stream);
          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: payload.type as RTCSdpType,
              sdp: payload.sdp as string,
            })
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({
            type: "webrtc_answer",
            payload: {
              target_user_id: fromUserId,
              sdp: answer.sdp,
              type: answer.type,
              room_id: callStateRef.current.roomId,
            },
          });
        } catch (e) {
          console.error("[WebRTC] Error handling offer:", e);
        }
      }),

      subscribe("webrtc_answer", async (payload) => {
        const fromUserId = payload.from_user_id as number;
        const pc = peersRef.current.get(fromUserId);
        if (!pc) return;
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: payload.type as RTCSdpType,
              sdp: payload.sdp as string,
            })
          );
        } catch (e) {
          console.error("[WebRTC] Error handling answer:", e);
        }
      }),

      subscribe("webrtc_ice_candidate", async (payload) => {
        const fromUserId = payload.from_user_id as number;
        const pc = peersRef.current.get(fromUserId);
        if (!pc) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate as RTCIceCandidateInit));
        } catch (e) {
          console.error("[WebRTC] Error adding ICE candidate:", e);
        }
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [subscribe, send, createPeerConnection, cleanup]);

  return {
    callState,
    localStream,
    remoteStreams,
    remoteNames,
    micMuted,
    camOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
  };
}
