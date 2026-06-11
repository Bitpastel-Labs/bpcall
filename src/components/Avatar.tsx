"use client";

import { useState } from "react";

const AVATAR_GRADIENTS = [
  "from-brand-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-indigo-600",
];

interface AvatarProps {
  src?: string | null;
  name: string;
  userId: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-11 h-11 text-sm",
  xl: "w-16 h-16 text-2xl",
};

export default function Avatar({ src, name, userId, size = "md", className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const gradient = AVATAR_GRADIENTS[userId % AVATAR_GRADIENTS.length];
  const initial = (name || "?")[0].toUpperCase();
  const sizeClass = sizeClasses[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-xl object-cover shadow-md ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-md ${className}`}>
      {initial}
    </div>
  );
}

export { AVATAR_GRADIENTS };
