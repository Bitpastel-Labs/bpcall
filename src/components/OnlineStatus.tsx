"use client";

interface OnlineStatusProps {
  isOnline: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function OnlineStatusDot({ isOnline, size = "sm" }: { isOnline: boolean; size?: "sm" | "md" }) {
  const dotSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <span className={`${dotSize} rounded-full block ${isOnline ? "bg-green-400" : "bg-surface-700"}`} />
  );
}

export default function OnlineStatus({ isOnline, size = "sm", showLabel = true }: OnlineStatusProps) {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full shrink-0 ${isOnline ? "bg-green-400" : "bg-surface-200/20"}`} />
      {showLabel && (
        <span className={`text-xs font-medium ${isOnline ? "text-green-400" : "text-surface-200/30"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </span>
  );
}
