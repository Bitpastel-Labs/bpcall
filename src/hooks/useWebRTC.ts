"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useAuth } from "@/contexts/AuthContext";

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
    const { roomId, callType, fromUserId, callLogId } = callStateRef.current;
    if (!roomId || !callType || !fromUserId) return;

    try {
      const stream = await getMedia(callType);
      setCallState((prev) => ({ ...prev, active: true, incoming: false }));

      send({
        type: "call_accept",
        payload: { room_id: roomId, call_log_id: callLogId },
      });

      // Create peer connection and send offer to the caller
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
    } catch {
      // getMedia already set the error, but don't leave the call hanging
      cleanup();
    }
  }, [getMedia, send, createPeerConnection, cleanup]);

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
    if (videoTracks.length > 0 && videoTracks[0].enabled) {
      // Turn off camera — stop track and remove
      videoTracks.forEach((t) => {
        t.stop();
        stream.removeTrack(t);
      });
      // Notify peers we removed video
      peersRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        senders.forEach((s) => {
          if (s.track?.kind === "video") {
            pc.removeTrack(s);
          }
        });
      });
      setCamOff(true);
    } else {
      // Turn on camera — acquire new video track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = newStream.getVideoTracks()[0];
        stream.addTrack(videoTrack);
        // Add to all peer connections
        peersRef.current.forEach((pc) => {
          pc.addTrack(videoTrack, stream);
        });
        setLocalStream(new MediaStream(stream.getTracks())); // trigger re-render
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
        setCallState({
          active: false,
          roomId: payload.room_id as number,
          callType: payload.call_type as "audio" | "video",
          callLogId: payload.call_log_id as number,
          incoming: true,
          fromUserId: payload.from_user_id as number,
          fromUserName: (payload.from_user_name as string) || null,
          error: null,
        });
      }),

      subscribe("call_accept", (payload) => {
        // Someone accepted our call — they will send us a WebRTC offer
        // We need to have our local stream ready for when the offer arrives
        // The stream should already be set from startCall
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
