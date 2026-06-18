"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import { useStudyKits } from "@/hooks/use-study-kits";

export function StudyPrepWidget() {
  const router = useRouter();
  const { kits, loaded } = useStudyKits();
  const featured = useMemo(
    () =>
      kits.find((kit) => kit.status === "processing") ??
      kits.find((kit) => kit.status === "ready") ??
      kits.find((kit) => kit.status === "failed") ??
      null,
    [kits],
  );
  const latestAttemptLabel = "Ready when you are";

  return (
    <section
      className="academic-shadow"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #c2c6d6",
        borderRadius: "12px",
        gridColumn: "1 / -1",
        padding: "20px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            alignItems: "center",
            color: "#424754",
            display: "flex",
            fontSize: "14px",
            fontWeight: 600,
            gap: "8px",
            margin: 0,
          }}
        >
          <Icon name="school" style={{ color: "#0058be" }} />
          STUDY PREP
        </h3>
        <button
          type="button"
          onClick={() => router.push("/study")}
          style={{
            backgroundColor: "#0058be",
            border: "none",
            borderRadius: "8px",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            padding: "8px 12px",
          }}
        >
          Generate from PDF
        </button>
      </div>

      {!loaded && !featured ? (
        <p style={{ color: "#424754", fontSize: "14px", margin: 0 }}>
          Loading your study kits...
        </p>
      ) : featured ? (
        <button
          type="button"
          onClick={() => router.push(`/study/${featured.id}`)}
          style={{
            alignItems: "center",
            backgroundColor: "#f8fbff",
            border: "1px solid #d8e2ff",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            gap: "16px",
            padding: "16px",
            textAlign: "left",
            width: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              backgroundColor:
                featured.status === "failed" ? "#ffdad6" : "#d8e2ff",
              borderRadius: "9999px",
              color: featured.status === "failed" ? "#ba1a1a" : "#0058be",
              display: "flex",
              flexShrink: 0,
              height: "44px",
              justifyContent: "center",
              width: "44px",
            }}
          >
            <Icon
              name={
                featured.status === "ready"
                  ? "quiz"
                  : featured.status === "failed"
                    ? "error"
                    : "hourglass_top"
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
              {featured.title}
            </h4>
            <p style={{ color: "#424754", fontSize: "13px", margin: "4px 0 0" }}>
              {featured.status === "processing"
                ? "Generating flashcards and quiz questions"
                : featured.status === "failed"
                  ? featured.error ?? "Generation needs another try"
                  : `${featured.flashcard_count} cards • ${featured.quiz_question_count} questions • ${latestAttemptLabel}`}
            </p>
          </div>
          <Icon name="chevron_right" style={{ color: "#424754" }} />
        </button>
      ) : (
        <div
          style={{
            alignItems: "flex-start",
            backgroundColor: "#f8f9fa",
            border: "1px dashed rgba(194, 198, 214, 0.8)",
            borderRadius: "12px",
            display: "flex",
            gap: "12px",
            padding: "16px",
          }}
        >
          <Icon name="upload_file" style={{ color: "#0058be" }} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
              No reviewer generated yet
            </p>
            <p style={{ color: "#424754", fontSize: "12px", margin: "4px 0 0" }}>
              Upload a PDF reviewer to create flashcards and a quiz.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
