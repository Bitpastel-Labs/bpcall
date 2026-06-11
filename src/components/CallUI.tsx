"use client";

import { useEffect, useRef, useCallback } from "react";

function useRingtone() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    stop(); // clear any existing
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const playTone = () => {
        // Two-tone ring: high then low
        const now = ctx.currentTime;
        [0, 0.2].forEach((offset, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = i === 0 ? 440 : 350;
          osc.type = "sine";
          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.05);
          gain.gain.setValueAtTime(0.15, now + offset + 0.15);
          gain.gain.linearRampToValueAtTime(0, now + offset + 0.2);
          osc.start(now + offset);
          osc.stop(now + offset + 0.25);
        });
      };

      playTone();
      intervalRef.current = setInterval(playTone, 2000);
    } catch {
      // AudioContext not available
    }
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop };
}

interface CallUIProps {
  callState: {
    active: boolean;
    roomId: number | null;
    callType: "audio" | "video" | null;
    incoming: boolean;
    fromUserId: number | null;
    fromUserName: string | null;
    error: string | null;
  };
  localStream: MediaStream | null;
  remoteStreams: Map<number, MediaStream>;
  micMuted: boolean;
  camOff: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
}

function VideoTile({ stream, muted, label }: { stream: MediaStream | null; muted: boolean; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks().some(t => t.enabled);

  return (
    <div className="relative bg-surface-800 rounded-2xl overflow-hidden aspect-video">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-800 to-surface-900">
          <div className="w-20 h-20 rounded-2xl bg-brand-600/20 flex items-center justify-center text-brand-400 text-3xl font-bold">
            {label[0]?.toUpperCase() || "?"}
          </div>
          {/* Still play audio even without video */}
          {stream && (
            <audio ref={(el) => { if (el) el.srcObject = stream; }} autoPlay muted={muted} className="hidden" />
          )}
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg font-medium">
        {label}
      </div>
    </div>
  );
}

export default function CallUI({
  callState,
  localStream,
  remoteStreams,
  micMuted,
  camOff,
  onAccept,
  onReject,
  onEnd,
  onToggleMic,
  onToggleCam,
}: CallUIProps) {
  const callerName = callState.fromUserName || "Someone";
  const ringtone = useRingtone();

  // Play ringtone for incoming calls
  useEffect(() => {
    if (callState.incoming && !callState.active) {
      ringtone.start();
    } else {
      ringtone.stop();
    }
  }, [callState.incoming, callState.active, ringtone]);

  const handleAccept = () => {
    ringtone.stop();
    onAccept();
  };

  const handleReject = () => {
    ringtone.stop();
    onReject();
  };

  // Incoming call modal
  if (callState.incoming && !callState.active) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90]">
        <div className="bg-surface-800/95 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/[0.08] max-w-sm w-full mx-4 shadow-2xl shadow-black/40 animate-fade-in-up">
          {/* Caller avatar */}
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-brand-600/30">
              {callerName[0].toUpperCase()}
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-2xl border-2 border-brand-400/30 animate-ping" />
          </div>

          <p className="text-white text-lg font-bold mb-1">{callerName}</p>
          <p className="text-surface-200/50 text-sm mb-8">
            Incoming {callState.callType} call
          </p>

          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleReject}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg shadow-red-600/30 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
              <span className="text-xs text-surface-200/40">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white transition-all shadow-lg shadow-green-600/30 animate-pulse hover:animate-none hover:scale-105"
              >
                {callState.callType === "video" ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-surface-200/40">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active call overlay
  if (!callState.active) return null;

  return (
    <div className="fixed inset-0 bg-surface-950 z-[90] flex flex-col">
      {/* Error banner */}
      {callState.error && (
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 text-center">
          <p className="text-xs text-amber-400">{callState.error}</p>
        </div>
      )}

      {/* Video grid */}
      <div className="flex-1 p-4 grid gap-4 auto-rows-fr" style={{
        gridTemplateColumns: `repeat(${Math.min(remoteStreams.size + 1, 2)}, 1fr)`,
      }}>
        <VideoTile stream={localStream} muted={true} label="You" />
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <VideoTile key={userId} stream={stream} muted={false} label={callState.fromUserName || `User ${userId}`} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-6 bg-surface-900/50 backdrop-blur-sm">
        <button
          onClick={onToggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            micMuted ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
          }`}
          title={micMuted ? "Unmute" : "Mute"}
        >
          {micMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        {(callState.callType === "video") && (
          <button
            onClick={onToggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              camOff ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
            }`}
            title={camOff ? "Turn on camera" : "Turn off camera"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
        <button
          onClick={onEnd}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg shadow-red-600/30 hover:scale-105"
          title="End call"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
