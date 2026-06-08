"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { ClassBlock } from "@/components/ui/ClassBlock";
import { ClassDetailSheet } from "@/components/ui/ClassDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildScheduleWeekSnapshot } from "@/lib/api/schedule";
import type { ScheduleClassDetail } from "@/lib/types";

function FreeWindowInner() {
  return (
    <div className="absolute inset-1 flex items-center justify-center rounded-lg border-2 border-dashed border-[#10B981]/30 bg-[#10B981]/10">
      <span className="text-[10px] font-bold uppercase tracking-tighter text-[#10B981]">
        FREE
      </span>
    </div>
  );
}

export default function SchedulePage() {
  const [scheduleWeek] = useState(() => buildScheduleWeekSnapshot());
  const [selectedDetail, setSelectedDetail] =
    useState<ScheduleClassDetail | null>(null);

  const getClassBlock = (day: number, hour: number) =>
    scheduleWeek.classes.find(
      (classItem) => classItem.dayIndex === day && classItem.gridHour === hour,
    );

  const isFreeWindow = (day: number, hour: number) =>
    scheduleWeek.freeWindows.some(
      (freeWindow) =>
        freeWindow.dayIndex === day &&
        hour >= freeWindow.startHour &&
        hour < freeWindow.endHour,
    );

  const handleSelectClass = (classId: string) => {
    setSelectedDetail(scheduleWeek.classDetails[classId] ?? null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 font-sans text-[#191c1d]">
      <PageHeader
        className="sticky top-0 z-40 bg-[#f8f9fa]"
        title="Hi, Alex"
        leading={
          <img
            alt="User Profile Picture"
            className="h-10 w-10 rounded-full border-2 border-[#0058be]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZIniZqns3LfBww-2EcflhPq3Hj7WMwnMoz7WViy5UzWR7JI457SdssPZMxT9tnWtNyarzaNDi0MHCmlpmOOehBVV3-40WZy_xBsr6gO0xJ1nTBHV7J7uYLGoMb8ZPCi1NU9WtmNQ4mWW_1myLNu_e82ANbJQdoaU5yYCggKVHUtPUIZPAZ0EIWt2x4ctgyQQb5jRrFP_lCkFbK4USM4EvCnhR5VKFt3_r6XsA0AOA5YOR61YUIwdmUwcWf1VaLsrDWc4_GbhpZc8"
          />
        }
        trailing={
          <button
            type="button"
            className="p-2 text-[#3B82F6] transition-opacity hover:opacity-80"
          >
            <Icon name="notifications" />
          </button>
        }
      />

      <main className="mx-auto mt-4 max-w-7xl px-4 md:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <h1 className="text-[28px] font-bold leading-[34px] text-[#191c1d]">
            Schedule
          </h1>

          <div className="flex items-center justify-between rounded-xl border border-[#c2c6d6]/30 bg-[#f3f4f5] p-3 shadow-sm">
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#edeeef]">
              <Icon name="arrow_back" className="text-[#3B82F6]" />
            </button>
            <span className="text-sm font-semibold text-[#424754]">
              {scheduleWeek.weekLabel}
            </span>
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#edeeef]">
              <Icon name="arrow_forward" className="text-[#3B82F6]" />
            </button>
          </div>
        </div>

        {scheduleWeek.classes.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#c2c6d6]/50 bg-white shadow-sm">
            <div
              className="text-center"
              style={{
                display: "grid",
                gridTemplateColumns: "60px repeat(5, 1fr)",
                gridTemplateRows: "auto repeat(9, 60px)",
              }}
            >
              <div className="flex h-12 items-center justify-center border-b border-r border-[#c2c6d6]/20" />
              {scheduleWeek.days.map((day, index) => (
                <div
                  key={day.dayOfWeek}
                  className={`h-12 flex flex-col items-center justify-center border-b border-[#c2c6d6]/20 bg-white ${
                    index < scheduleWeek.days.length - 1 ? "border-r" : ""
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase text-[#6B7280]">
                    {day.shortLabel}
                  </span>
                  <span className="text-sm font-semibold">{day.dateLabel}</span>
                </div>
              ))}

              {scheduleWeek.hours.map((hour, hourIndex) => {
                const isLastRow = hourIndex === scheduleWeek.hours.length - 1;

                return (
                  <div key={hour} className="contents">
                    <div
                      className={`flex items-start justify-center border-r border-[#c2c6d6]/10 pt-2 text-[10px] font-medium text-[#6B7280] ${
                        !isLastRow ? "border-b" : ""
                      }`}
                    >
                      {`${String(hour).padStart(2, "0")}:00`}
                    </div>

                    {scheduleWeek.days.map((day, dayIndex) => {
                      const classBlock = getClassBlock(dayIndex, hour);
                      const free = isFreeWindow(dayIndex, hour);
                      const isLastCol =
                        dayIndex === scheduleWeek.days.length - 1;

                      if (isLastRow) {
                        return (
                          <div
                            key={`cell-${hour}-${day.dayOfWeek}`}
                            className={`relative border-[#c2c6d6]/10 p-1 ${
                              !isLastCol ? "border-r" : ""
                            }`}
                          >
                            {classBlock ? (
                              <ClassBlock
                                classItem={classBlock}
                                onSelect={(item) => handleSelectClass(item.id)}
                              />
                            ) : null}
                            {free ? <FreeWindowInner /> : null}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`cell-${hour}-${day.dayOfWeek}`}
                          className="relative border-b border-r border-[#c2c6d6]/10 p-1"
                        >
                          {classBlock ? (
                            <ClassBlock
                              classItem={classBlock}
                              onSelect={(item) => handleSelectClass(item.id)}
                            />
                          ) : null}
                          {free ? <FreeWindowInner /> : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            icon="calendar_month"
            title="No classes scheduled yet"
            description="Your weekly grid will appear here once classes are added."
          />
        )}

        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 rounded-full bg-[#3B82F6] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:opacity-90 active:scale-95">
            <Icon name="add" filled className="text-sm" />
            Add Class
          </button>
        </div>

        <div
          className="group relative mt-12 overflow-hidden rounded-xl border border-[#c2c6d6]/20 p-5 shadow-xl"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#10B981]/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#10B981]/20">
              <Icon
                name="auto_awesome"
                className="text-[#10B981]"
                filled
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#191c1d]">
                AI Study Insight
              </h3>
              <p className="mt-1 text-base text-[#424754]">
                Your Thursday afternoon is 100% free. Based on your upcoming
                Math exam, I recommend a 2-hour deep work session at 14:30.
              </p>
              <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:underline">
                Schedule study session
                <Icon name="arrow_forward" className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ClassDetailSheet
        open={selectedDetail !== null}
        detail={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </div>
  );
}
