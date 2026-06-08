"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

// --- Types ---
interface ClassBlock {
  day: number; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
  hour: number; // 8–15
  label: string;
  color: "blue" | "amber" | "green";
}

interface FreeWindow {
  day: number;
  hour: number;
}

// --- Config ---
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
const DAYS = [
  { short: "Mon", date: "02" },
  { short: "Tue", date: "03" },
  { short: "Wed", date: "04" },
  { short: "Thu", date: "05" },
  { short: "Fri", date: "06" },
];

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
};

const INITIAL_CLASSES: ClassBlock[] = [
  { day: 0, hour: 8, label: "Math 101", color: "blue" },
  { day: 2, hour: 8, label: "Math 101", color: "blue" },
  { day: 1, hour: 9, label: "Eng Lit", color: "amber" },
  { day: 3, hour: 9, label: "Eng Lit", color: "amber" },
  { day: 0, hour: 15, label: "PE", color: "green" },
  { day: 4, hour: 15, label: "PE", color: "green" },
];

const FREE_WINDOWS: FreeWindow[] = [
  { day: 3, hour: 14 },
  { day: 3, hour: 15 },
];

// --- Schedule Cell ---
function ScheduleCell({
  classBlock,
  isFree,
}: {
  classBlock?: ClassBlock;
  isFree?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
  };

  if (classBlock) {
    const colors = COLOR_MAP[classBlock.color];
    return (
      <div className="border-r border-b border-[#c2c6d6]/10 relative p-1">
        <div
          onClick={handleClick}
          className={`absolute inset-1 ${colors.bg} border-l-4 ${colors.border} rounded-md flex flex-col items-start justify-center px-2 z-10 overflow-hidden cursor-pointer transition-transform`}
          style={{ transform: pressed ? "scale(0.95)" : "scale(1)" }}
        >
          <span className={`text-[10px] font-medium ${colors.text} truncate`}>
            {classBlock.label}
          </span>
        </div>
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="border-r border-b border-[#c2c6d6]/10 relative p-1">
        <div className="absolute inset-1 bg-[#10B981]/10 flex items-center justify-center border-2 border-dashed border-[#10B981]/30 rounded-lg">
          <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-tighter">
            FREE
          </span>
        </div>
      </div>
    );
  }

  return <div className="border-r border-b border-[#c2c6d6]/10" />;
}

// --- Main Page ---
export default function SchedulePage() {
  const [weekLabel] = useState("Jun 2 – Jun 7");

  const getClassBlock = (day: number, hour: number) =>
    INITIAL_CLASSES.find((c) => c.day === day && c.hour === hour);

  const isFreeWindow = (day: number, hour: number) =>
    FREE_WINDOWS.some((fw) => fw.day === day && fw.hour === hour);

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-24 font-sans">
      {/* Header */}
      <header className="bg-[#f8f9fa] sticky top-0 z-40">
        <div className="flex justify-between items-center px-4 py-4 w-full">
          <div className="flex items-center gap-3">
            <img
              alt="User Profile Picture"
              className="w-10 h-10 rounded-full border-2 border-[#0058be]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZIniZqns3LfBww-2EcflhPq3Hj7WMwnMoz7WViy5UzWR7JI457SdssPZMxT9tnWtNyarzaNDi0MHCmlpmOOehBVV3-40WZy_xBsr6gO0xJ1nTBHV7J7uYLGoMb8ZPCi1NU9WtmNQ4mWW_1myLNu_e82ANbJQdoaU5yYCggKVHUtPUIZPAZ0EIWt2x4ctgyQQb5jRrFP_lCkFbK4USM4EvCnhR5VKFt3_r6XsA0AOA5YOR61YUIwdmUwcWf1VaLsrDWc4_GbhpZc8"
            />
            <span className="text-2xl font-bold text-[#0058be]">Hi, Alex</span>
          </div>
          <button className="text-[#3B82F6] hover:opacity-80 transition-opacity p-2">
            <Icon name="notifications" />
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 mt-4 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-[28px] leading-[34px] font-bold text-[#191c1d]">
            Schedule
          </h1>

          {/* Date Navigator */}
          <div className="flex items-center justify-between bg-[#f3f4f5] rounded-xl p-3 shadow-sm border border-[#c2c6d6]/30">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#edeeef] transition-colors">
              <Icon name="arrow_back" className="text-[#3B82F6]" />
            </button>
            <span className="text-sm font-semibold text-[#424754]">
              {weekLabel}
            </span>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#edeeef] transition-colors">
              <Icon name="arrow_forward" className="text-[#3B82F6]" />
            </button>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-[#c2c6d6]/50 overflow-hidden">
          <div
            className="text-center"
            style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(5, 1fr)",
              gridTemplateRows: "auto repeat(9, 60px)",
            }}
          >
            {/* Header Row */}
            <div className="h-12 flex items-center justify-center border-b border-r border-[#c2c6d6]/20" />
            {DAYS.map((day, i) => (
              <div
                key={i}
                className={`h-12 flex flex-col items-center justify-center border-b border-[#c2c6d6]/20 bg-white ${
                  i < DAYS.length - 1 ? "border-r" : ""
                }`}
              >
                <span className="text-[10px] font-medium text-[#6B7280] uppercase">
                  {day.short}
                </span>
                <span className="text-sm font-semibold">{day.date}</span>
              </div>
            ))}

            {/* Time Rows */}
            {HOURS.map((hour, hi) => {
              const isLastRow = hi === HOURS.length - 1;
              return (
                <>
                  {/* Time label */}
                  <div
                    key={`time-${hour}`}
                    className={`flex items-start justify-center pt-2 border-r border-[#c2c6d6]/10 ${
                      !isLastRow ? "border-b" : ""
                    } text-[10px] font-medium text-[#6B7280]`}
                  >
                    {`${String(hour).padStart(2, "0")}:00`}
                  </div>

                  {/* Day cells */}
                  {DAYS.map((_, di) => {
                    const classBlock = getClassBlock(di, hour);
                    const free = isFreeWindow(di, hour);
                    const isLastCol = di === DAYS.length - 1;

                    if (isLastRow) {
                      // Last row: no bottom border
                      return (
                        <div
                          key={`cell-${hour}-${di}`}
                          className={`relative p-1 border-[#c2c6d6]/10 ${
                            !isLastCol ? "border-r" : ""
                          }`}
                        >
                          {classBlock && <ClassBlockInner block={classBlock} />}
                          {free && <FreeWindowInner />}
                        </div>
                      );
                    }

                    return (
                      <ScheduleCell
                        key={`cell-${hour}-${di}`}
                        classBlock={classBlock}
                        isFree={free}
                      />
                    );
                  })}
                </>
              );
            })}
          </div>
        </div>

        {/* Add Class Button */}
        <div className="mt-8 flex justify-center">
          <button className="bg-[#3B82F6] text-white text-sm font-semibold px-6 py-4 rounded-full shadow-lg shadow-[#3B82F6]/20 flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            <Icon name="" filled className="text-sm" />
            Add Class
          </button>
        </div>

        {/* AI Insight Card */}
        <div
          className="mt-12 p-5 rounded-xl border border-[#c2c6d6]/20 shadow-xl overflow-hidden relative group"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#10B981]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0">
              <Icon name="auto_awesome" className="text-[#10B981]" filled />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#191c1d]">
                AI Study Insight
              </h3>
              <p className="text-base text-[#424754] mt-1">
                Your Thursday afternoon is 100% free. Based on your upcoming
                Math exam, I recommend a 2-hour deep work session at 14:30.
              </p>
              <button className="mt-3 text-[#10B981] text-xs font-semibold flex items-center gap-1 hover:underline">
                Schedule study session{" "}
                <Icon name="arrow_forward" className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

// --- Sub-components used inside the last row (no bottom border) ---
function ClassBlockInner({ block }: { block: ClassBlock }) {
  const [pressed, setPressed] = useState(false);
  const colors = COLOR_MAP[block.color];
  return (
    <div
      onClick={() => {
        setPressed(true);
        setTimeout(() => setPressed(false), 150);
      }}
      className={`absolute inset-1 ${colors.bg} border-l-4 ${colors.border} rounded-md flex flex-col items-start justify-center px-2 z-10 overflow-hidden cursor-pointer transition-transform`}
      style={{ transform: pressed ? "scale(0.95)" : "scale(1)" }}
    >
      <span className={`text-[10px] font-medium ${colors.text} truncate`}>
        {block.label}
      </span>
    </div>
  );
}

function FreeWindowInner() {
  return (
    <div className="absolute inset-1 bg-[#10B981]/10 flex items-center justify-center border-2 border-dashed border-[#10B981]/30 rounded-lg">
      <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-tighter">
        FREE
      </span>
    </div>
  );
}
