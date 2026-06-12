"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssignmentDetailSheet } from "@/app/(app)/assignments/AssignmentDetailSheet";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { AssignmentCard } from "@/components/ui/AssignmentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { TasksRouteSwitcher } from "@/components/ui/TasksRouteSwitcher";
import { useAssignments } from "@/hooks/use-assignments";
import type { Assignment } from "@/lib/types";
import { dismissNotification } from "@/lib/notifications/runtime";

type FilterTab = "All" | "Pending" | "Done";

export interface AssignmentsClientProps {
  assignments?: Assignment[];
  assignmentsAvailable?: boolean;
}

export default function AssignmentsClient({
  assignments: initialAssignments = [],
  assignmentsAvailable,
}: AssignmentsClientProps) {
  const assignmentsState = useAssignments();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignments =
    initialAssignments.length > 0 ? initialAssignments : assignmentsState.assignments;
  const resolvedAssignmentsAvailable =
    assignmentsAvailable ?? assignmentsState.available;
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    null,
  );
  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null;

  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId) return;
    const assignment = assignments.find((item) => item.id === itemId);
    if (assignment && selectedAssignmentId !== itemId) {
      // The URL is an external navigation source from the service worker.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAssignmentId(itemId);
    }
    const notificationId = searchParams.get("notification");
    if (notificationId) {
      void dismissNotification(notificationId).then(() => router.replace("/assignments"));
    }
  }, [assignments, router, searchParams, selectedAssignmentId]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const filtered = assignments.filter((assignment) => {
    if (activeFilter === "All") {
      return true;
    }

    if (activeFilter === "Pending") {
      return assignment.status === "pending";
    }

    if (activeFilter === "Done") {
      return assignment.status === "completed";
    }

    return true;
  });

  const renderAssignmentsContent = () => {
    if (!resolvedAssignmentsAvailable) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#825100] shadow-sm">
            We couldn&apos;t load your assignments right now. You can still browse
            this page and try again once the data is available.
          </div>
          <EmptyState
            icon="assignment"
            title="Assignments unavailable"
            description="Your task list could not be loaded, but the page is still available."
          />
        </div>
      );
    }

    if (filtered.length > 0) {
      return (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {filtered.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              variant="list"
              assignment={assignment}
              checked={checkedIds.has(assignment.id)}
              onToggleChecked={toggleCheck}
              onSelect={(assignment) => setSelectedAssignmentId(assignment.id)}
            />
          ))}
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <EmptyState
          icon="assignment"
          title="No assignments yet"
          description="Your assignments will appear here once tasks are added."
        />
      );
    }

    return (
      <EmptyState
        icon="assignment"
        title="No assignments in this view"
        description="Try another filter or add a new task to see it here."
      />
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .filter-tabs::-webkit-scrollbar { display: none; }
        .filter-tabs { scrollbar-width: none; }
        .focus-card-blob {
          transition: transform 0.7s ease;
        }
        .focus-card:hover .focus-card-blob {
          transform: scale(1.5);
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "#f8f9fa",
          color: "#191c1d",
          minHeight: "100dvh",
          paddingBottom: "96px",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <AuthenticatedPageHeader pageTitle="Assignments" />

        <main
          style={{
            padding: "24px 16px 0",
            maxWidth: "672px",
            margin: "0 auto",
          }}
        >
          <section style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  lineHeight: "34px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Assignments
              </h2>
              <div
                style={{
                  backgroundColor: "#d8e2ff",
                  color: "#001a42",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {assignments.length} Active
              </div>
            </div>

            <div
              className="filter-tabs"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "8px",
              }}
            >
              <TasksRouteSwitcher activeRoute="/assignments" />

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                }}
              >
              {(["All", "Pending", "Done"] as FilterTab[]).map((tab) => {
                const isActive = activeFilter === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilter(tab)}
                    style={{
                      backgroundColor: isActive ? "#2170e4" : "#e7e8e9",
                      color: isActive ? "#fefcff" : "#424754",
                      padding: "8px 24px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    >
                      {tab}
                    </button>
                );
              })}
              </div>
            </div>
          </section>

          {renderAssignmentsContent()}

          <div
            style={{
              marginTop: "32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              className="focus-card"
              style={{
                backgroundColor: "#0058be",
                color: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "160px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <Icon name="bolt" className="mb-2 block text-[32px]" />
                <h4
                  style={{
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Focus Session Recommended
                </h4>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    marginTop: "8px",
                    opacity: 0.9,
                  }}
                >
                  Start a 45min deep work for Math 101 paper.
                </p>
              </div>
              <button
                type="button"
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: "16px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  backdropFilter: "blur(8px)",
                  transition: "background-color 0.2s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseOver={(event) => {
                  event.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.3)";
                }}
                onMouseOut={(event) => {
                  event.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.2)";
                }}
              >
                Start Now
              </button>

              <div
                className="focus-card-blob"
                style={{
                  position: "absolute",
                  right: "-16px",
                  bottom: "-16px",
                  width: "96px",
                  height: "96px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "9999px",
                  filter: "blur(16px)",
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #c2c6d6",
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#191c1d",
                    margin: "0 0 8px 0",
                    letterSpacing: "0.01em",
                  }}
                >
                  Completion Rate
                </h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "40px",
                      lineHeight: "48px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "#3B82F6",
                    }}
                  >
                    68%
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#10B981",
                      paddingBottom: "8px",
                    }}
                  >
                    +12% this week
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#edeeef",
                  height: "8px",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#10B981",
                    height: "100%",
                    width: "68%",
                    borderRadius: "9999px",
                  }}
                />
              </div>
            </div>
          </div>
        </main>

        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            zIndex: 50,
          }}
        >
          <button
            type="button"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#0058be",
              color: "#ffffff",
              borderRadius: "9999px",
              boxShadow: "0 4px 16px rgba(0,88,190,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.transform = "scale(1)";
            }}
            onMouseDown={(event) => {
              event.currentTarget.style.transform = "scale(0.9)";
            }}
            onMouseUp={(event) => {
              event.currentTarget.style.transform = "scale(1.05)";
            }}
          >
            <Icon name="add" className="text-[28px] text-white" />
          </button>
        </div>
      </div>
      <AssignmentDetailSheet
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignmentId(null)}
      />
    </>
  );
}
