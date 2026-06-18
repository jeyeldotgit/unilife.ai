"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useClasses } from "@/hooks/use-classes";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useExams } from "@/hooks/use-exams";
import { cacheCreatedStudyKit, removeCachedStudyKit, useStudyKits } from "@/hooks/use-study-kits";
import {
  createStudyKit,
  deleteStudyKit,
  uploadStudyKitSource,
  validateStudyKitFile,
} from "@/lib/api/study-kits";

function statusLabel(status: string) {
  if (status === "processing") return "Processing";
  if (status === "failed") return "Needs attention";
  return "Ready";
}

type GenerationStep = "idle" | "uploading" | "extracting" | "generating" | "saving";

const generationSteps: Array<{ id: Exclude<GenerationStep, "idle">; label: string }> = [
  { id: "uploading", label: "Uploading PDF" },
  { id: "extracting", label: "Extracting text" },
  { id: "generating", label: "Generating reviewer" },
  { id: "saving", label: "Saving study kit" },
];

function getStepIndex(step: GenerationStep) {
  return generationSteps.findIndex((item) => item.id === step);
}

function StudyGenerationProgress({ step }: { step: GenerationStep }) {
  if (step === "idle") return null;

  const activeIndex = getStepIndex(step);

  return (
    <div className="mt-4 rounded-xl border border-[#d8e2ff] bg-[#f8fbff] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold text-[#0058be]">
            {generationSteps[activeIndex]?.label ?? "Preparing reviewer"}
          </p>
          <p className="m-0 mt-1 text-xs text-[#424754]">
            Keep this page open while UniLife builds your flashcards and quiz.
          </p>
        </div>
        <Icon name="progress_activity" className="animate-spin text-[#0058be]" />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {generationSteps.map((item, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <div
              key={item.id}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                complete
                  ? "border-[#9be7c3] bg-[#effcf5] text-[#0f7a55]"
                  : active
                    ? "border-[#0058be] bg-white text-[#0058be]"
                    : "border-[#c2c6d6] bg-white text-[#424754]"
              }`}
            >
              <span className="mr-1">{complete ? "Done" : active ? "-" : ""}</span>
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudyClient() {
  const router = useRouter();
  const classes = useClasses();
  const exams = useExams();
  const study = useStudyKits();
  const userId = useCurrentUserId();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [generationCount, setGenerationCount] = useState<5 | 10 | 20 | 30>(10);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const grouped = useMemo(
    () => ({
      processing: study.kits.filter((kit) => kit.status === "processing"),
      ready: study.kits.filter((kit) => kit.status === "ready"),
      failed: study.kits.filter((kit) => kit.status === "failed"),
    }),
    [study.kits],
  );

  const handleSubmit = async () => {
    if (!file || submitting) return;
    const validation = validateStudyKitFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError(null);
    setGenerationStep("uploading");
    try {
      if (!userId) {
        throw new Error("Sign in again before uploading a reviewer.");
      }
      const sourcePath = await uploadStudyKitSource(userId, file);
      setGenerationStep("extracting");
      window.setTimeout(() => {
        setGenerationStep((current) => (current === "extracting" ? "generating" : current));
      }, 900);
      const response = await createStudyKit({
        classId: classId || null,
        examId: examId || null,
        generationCount,
        sourceName: file.name,
        sourcePath,
        title: title || null,
      });
      setGenerationStep("saving");
      await cacheCreatedStudyKit(response.kit);
      router.push(`/study/${response.kit.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "This reviewer could not be generated.",
      );
    } finally {
      setSubmitting(false);
      setGenerationStep("idle");
    }
  };

  const handleDelete = async (kitId: string, kitTitle: string) => {
    if (deletingIds.has(kitId)) return;
    if (!window.confirm(`Delete "${kitTitle}"? This removes its flashcards, quiz, and attempts.`)) {
      return;
    }

    setDeletingIds((current) => new Set(current).add(kitId));
    setError(null);
    try {
      await deleteStudyKit(kitId);
      await removeCachedStudyKit(kitId);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "This study kit could not be deleted.",
      );
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(kitId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-dvh bg-[#f8f9fa] pb-28 text-[#191c1d]">
      <AuthenticatedPageHeader className="sticky top-0 z-50 bg-[#f8f9fa]" pageTitle="Study" />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-4">
        <section className="rounded-xl border border-[#c2c6d6] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <Icon name="upload_file" className="text-[#0058be]" />
              <h2 className="m-0 text-base font-semibold">Generate Reviewer</h2>
            </div>
            <p className="m-0 text-xs text-[#424754] sm:ml-auto">PDF only - 5 MB max</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#424754] md:col-span-2">
              PDF reviewer
              <input
                accept="application/pdf,.pdf"
                className="min-h-12 w-full rounded-lg border border-dashed border-[#9aa2b8] bg-[#f8f9fa] p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#0058be] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                disabled={submitting}
                type="file"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#424754]">
              Title
              <input
                className="min-h-12 w-full rounded-lg border border-[#c2c6d6] bg-white p-3 text-base sm:text-sm"
                disabled={submitting}
                placeholder="OrgMan Final Reviewer"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#424754]">
              Class
              <select
                className="min-h-12 w-full rounded-lg border border-[#c2c6d6] bg-white p-3 text-base sm:text-sm"
                disabled={submitting}
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
              >
                <option value="">No class link</option>
                {classes.classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#424754]">
              Exam
              <select
                className="min-h-12 w-full rounded-lg border border-[#c2c6d6] bg-white p-3 text-base sm:text-sm"
                disabled={submitting}
                value={examId}
                onChange={(event) => setExamId(event.target.value)}
              >
                <option value="">No exam link</option>
                {exams.exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#424754]">
              Reviewer size
              <select
                className="min-h-12 w-full rounded-lg border border-[#c2c6d6] bg-white p-3 text-base sm:text-sm"
                disabled={submitting}
                value={generationCount}
                onChange={(event) =>
                  setGenerationCount(Number(event.target.value) as 5 | 10 | 20 | 30)
                }
              >
                <option value={5}>5 cards + 5 questions</option>
                <option value={10}>10 cards + 10 questions</option>
                <option value={20}>20 cards + 20 questions</option>
                <option value={30}>30 cards + 30 questions</option>
              </select>
            </label>
          </div>
          {error ? <p className="mt-3 text-sm font-medium text-[#ba1a1a]">{error}</p> : null}
          <StudyGenerationProgress step={generationStep} />
          <button
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0058be] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            disabled={!file || submitting}
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
          >
            <Icon name={submitting ? "hourglass_top" : "auto_awesome"} size={18} />
            {submitting ? "Working on it..." : "Generate Study Kit"}
          </button>
        </section>

        {study.error ? <p className="text-sm text-[#ba1a1a]">{study.error}</p> : null}

        {study.kits.length === 0 && study.loaded ? (
          <EmptyState
            icon="school"
            title="No study kits yet"
            description="Upload a PDF reviewer to generate flashcards and quiz questions."
          />
        ) : null}

        {(["processing", "ready", "failed"] as const).map((status) => {
          const kits = grouped[status];
          if (kits.length === 0) return null;
          return (
            <section key={status}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.05em] text-[#424754]">
                {statusLabel(status)}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {kits.map((kit) => (
                  <article
                    key={kit.id}
                    className="rounded-xl border border-[#c2c6d6] bg-white p-4 text-left shadow-sm transition hover:border-[#0058be]"
                  >
                    <Link className="block" href={`/study/${kit.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="m-0 text-base font-semibold text-[#191c1d]">
                            {kit.title}
                          </h4>
                          <p className="mt-1 text-xs text-[#424754]">{kit.source_name}</p>
                        </div>
                        <Icon
                          name={
                            kit.status === "ready"
                              ? "task_alt"
                              : kit.status === "failed"
                                ? "error"
                                : "hourglass_top"
                          }
                          className={
                            kit.status === "failed" ? "text-[#ba1a1a]" : "text-[#0058be]"
                          }
                        />
                      </div>
                      <p className="mt-3 text-sm text-[#424754]">
                        {kit.flashcard_count} flashcards - {kit.quiz_question_count} quiz questions
                      </p>
                      {kit.error ? <p className="mt-2 text-xs text-[#ba1a1a]">{kit.error}</p> : null}
                    </Link>
                    <div className="mt-4 flex justify-end border-t border-[#c2c6d6]/30 pt-3">
                      <button
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ffdad6] bg-[#fff8f7] px-3 py-2 text-sm font-semibold text-[#ba1a1a] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingIds.has(kit.id)}
                        type="button"
                        onClick={() => {
                          void handleDelete(kit.id, kit.title);
                        }}
                      >
                        <Icon name={deletingIds.has(kit.id) ? "hourglass_top" : "delete"} size={18} />
                        {deletingIds.has(kit.id) ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
