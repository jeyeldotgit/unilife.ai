"use client";

import { useState } from "react";
import type { ScheduleClass } from "@/lib/types";

const COLOR_MAP = {
  blue: {
    bg: "bg-[#3B82F6]/10",
    border: "border-[#3B82F6]",
    text: "text-[#0058be]",
  },
  amber: {
    bg: "bg-[#825100]/10",
    border: "border-[#825100]",
    text: "text-[#825100]",
  },
  green: {
    bg: "bg-[#006c49]/10",
    border: "border-[#006c49]",
    text: "text-[#006c49]",
  },
} as const;

type ClassBlockProps = {
  classItem: ScheduleClass;
  onSelect?: (classItem: ScheduleClass) => void;
  className?: string;
};

export function ClassBlock({
  classItem,
  onSelect,
  className = "",
}: ClassBlockProps) {
  const [pressed, setPressed] = useState(false);
  const colors = COLOR_MAP[classItem.color];

  const handleClick = () => {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 150);
    onSelect?.(classItem);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`absolute inset-1 ${colors.bg} ${colors.border} ${colors.text} z-10 flex cursor-pointer flex-col items-start justify-center overflow-hidden rounded-md border-l-4 px-2 text-left transition-transform ${className}`.trim()}
      style={{ transform: pressed ? "scale(0.95)" : "scale(1)" }}
    >
      <span className="truncate text-[10px] font-medium">{classItem.label}</span>
    </button>
  );
}

