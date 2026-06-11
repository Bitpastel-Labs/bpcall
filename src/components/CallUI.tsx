"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function useRingtone() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    stop(); // clear any existing
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const playRing = () => {
        const now = ctx.currentTime;

        // Melodic three-note ascending chime (C5 → E5 → G5)
        const notes = [
          { freq: 523.25, start: 0, dur: 0.18 },     // C5
          { freq: 659.25, start: 0.15, dur: 0.18 },   // E5
          { freq: 783.99, start: 0.30, dur: 0.35 },   // G5 (held longer)
        ];

        notes.forEach(({ freq, start: s, dur }) => {
          // Main tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          // Smooth envelope
          gain.gain.setValueAtTime(0, now + s);
          gain.gain.linearRampToValueAtTime(0.12, now + s + 0.03);
          gain.gain.setValueAtTime(0.12, now + s + dur - 0.08);
          gain.gain.linearRampToValueAtTime(0, now + s + dur);
          osc.start(now + s);
          osc.stop(now + s + dur + 0.01);

          // Soft harmonic overtone for richness
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = freq * 2; // octave up
          osc2.type = "sine";
          gain2.gain.setValueAtTime(0, now + s);
          gain2.gain.linearRampToValueAtTime(0.03, now + s + 0.03);
          gain2.gain.setValueAtTime(0.03, now + s + dur - 0.08);
          gain2.gain.linearRampToValueAtTime(0, now + s + dur);
          osc2.start(now + s);
          osc2.stop(now + s + dur + 0.01);
        });

        // Repeat the chime after a pause (second ring)
        const secondStart = 0.9;
        notes.forEach(({ freq, start: s, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0, now + secondStart + s);
          gain.gain.linearRampToValueAtTime(0.10, now + secondStart + s + 0.03);
          gain.gain.setValueAtTime(0.10, now + secondStart + s + dur - 0.08);
          gain.gain.linearRampToValueAtTime(0, now + secondStart + s + dur);
          osc.start(now + secondStart + s);
          osc.stop(now + secondStart + s + dur + 0.01);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = freq * 2;
          osc2.type = "sine";
          gain2.gain.setValueAtTime(0, now + secondStart + s);
          gain2.gain.linearRampToValueAtTime(0.025, now + secondStart + s + 0.03);
          gain2.gain.setValueAtTime(0.025, now + secondStart + s + dur - 0.08);
          gain2.gain.linearRampToValueAtTime(0, now + secondStart + s + dur);
          osc2.start(now + secondStart + s);
          osc2.stop(now + secondStart + s + dur + 0.01);
        });
      };

      playRing();
      intervalRef.current = setInterval(playRing, 3000);
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
  remoteNames: Map<number, string>;
  micMuted: boolean;
  camOff: boolean;
  roomName?: string;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
}

function VideoTile({
  stream, muted, label, size = "full",
}: {
  stream: MediaStream | null;
  muted: boolean;
  label: string;
  size?: "full" | "pip";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }

    const checkVideo = () => {
      const tracks = stream?.getVideoTracks() || [];
      const active = tracks.length > 0 && tracks.some(t => t.readyState === "live" && t.enabled && !t.muted);
      setHasVideo(active);
      // Clear srcObject when no video so the last frame doesn't stick
      if (!active && el) {
        el.srcObject = null;
      } else if (active && el && !el.srcObject && stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    };
    checkVideo();

    // Listen on stream for track add/remove
    const trackCleanups: (() => void)[] = [];
    if (stream) {
      stream.addEventListener("addtrack", checkVideo);
      stream.addEventListener("removetrack", checkVideo);

      // Listen on each video track for mute/unmute/ended
      const attachTrackListeners = () => {
        trackCleanups.forEach((c) => c());
        trackCleanups.length = 0;
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener("mute", checkVideo);
          track.addEventListener("unmute", checkVideo);
          track.addEventListener("ended", checkVideo);
          trackCleanups.push(() => {
            track.removeEventListener("mute", checkVideo);
            track.removeEventListener("unmute", checkVideo);
            track.removeEventListener("ended", checkVideo);
          });
        });
      };
      attachTrackListeners();
      stream.addEventListener("addtrack", attachTrackListeners);

      const interval = setInterval(checkVideo, 500);
      return () => {
        stream.removeEventListener("addtrack", checkVideo);
        stream.removeEventListener("removetrack", checkVideo);
        stream.removeEventListener("addtrack", attachTrackListeners);
        trackCleanups.forEach((c) => c());
        clearInterval(interval);
      };
    }
  }, [stream]);

  const isPip = size === "pip";

  return (
    <div className={`relative overflow-hidden ${
      isPip
        ? "w-28 h-40 sm:w-36 sm:h-48 rounded-xl shadow-2xl shadow-black/50 border border-white/[0.1]"
        : "w-full h-full rounded-2xl"
    } bg-surface-800`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${hasVideo ? "block" : "hidden"}`}
      />
      {!hasVideo && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-800 to-surface-900">
          <div className={`rounded-2xl bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold ${
            isPip ? "w-12 h-12 text-xl" : "w-24 h-24 text-4xl"
          }`}>
            {label[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      {stream && !hasVideo && (
        <audio ref={(el) => { if (el) el.srcObject = stream; }} autoPlay muted={muted} className="hidden" />
      )}
      <div className={`absolute bg-black/60 backdrop-blur-sm text-white font-medium ${
        isPip ? "bottom-2 left-2 text-[10px] px-2 py-1 rounded-md" : "bottom-3 left-3 text-xs px-3 py-1.5 rounded-lg"
      }`}>
        {label}
      </div>
    </div>
  );
}

export default function CallUI({
  callState,
  localStream,
  remoteStreams,
  remoteNames,
  micMuted,
  camOff,
  roomName,
  onAccept,
  onReject,
  onEnd,
  onToggleMic,
  onToggleCam,
}: CallUIProps) {
  // For incoming calls: fromUserName is the caller's name (from call_initiate)
  // For outgoing calls: fromUserName is the acceptor's name (from call_accept), fallback to roomName
  const callerName = callState.fromUserName || "Someone";
  const remoteName = callState.incoming
    ? (callState.fromUserName || "Remote")
    : (callState.fromUserName || roomName || "Remote");
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
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 text-center shrink-0">
          <p className="text-xs text-amber-400">{callState.error}</p>
        </div>
      )}

      {/* Video area */}
      {remoteStreams.size <= 1 ? (
        /* 1:1 call — Google Meet style: remote full screen, self as PIP */
        <div className="flex-1 min-h-0 relative">
          {remoteStreams.size === 1 ? (
            <div className="absolute inset-0">
              {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
                const name = remoteNames.get(userId) || remoteName;
                return <VideoTile key={userId} stream={stream} muted={false} label={name} size="full" />;
              })}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-surface-900 to-surface-950">
              <div className="w-24 h-24 rounded-2xl bg-brand-600/20 flex items-center justify-center text-brand-400 text-4xl font-bold mb-4">
                {remoteName[0]?.toUpperCase() || "?"}
              </div>
              <p className="text-white text-lg font-semibold">{remoteName}</p>
              <p className="text-surface-200/40 text-sm mt-1">Connecting...</p>
            </div>
          )}
          {/* Self as picture-in-picture overlay */}
          <div className="absolute top-4 right-4 z-10">
            <VideoTile stream={localStream} muted={true} label="You" size="pip" />
          </div>
        </div>
      ) : (
        /* Group call — responsive grid */
        <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-auto">
          <div className="w-full h-full grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-3">
            {[
              { stream: localStream, muted: true, label: "You", key: "self" },
              ...Array.from(remoteStreams.entries()).map(([userId, s]) => ({
                stream: s,
                muted: false,
                label: remoteNames.get(userId) || remoteName,
                key: String(userId),
              })),
            ].map(({ stream: s, muted: m, label: l, key }) => (
              <div key={key} className="relative aspect-video bg-surface-800 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="absolute inset-0">
                  <VideoTile stream={s} muted={m} label={l} size="full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls — always visible at bottom */}
      <div className="flex items-center justify-center gap-4 p-6 bg-surface-900/50 backdrop-blur-sm shrink-0">
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
