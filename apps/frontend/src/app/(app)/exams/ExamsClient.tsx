"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createEmptyExamFormState,
  createExamFormStateFromExam,
  ExamFormSheet,
  type ExamFormState,
} from "@/app/(app)/exams/ExamFormSheet";
import { ExamDetailSheet } from "@/app/(app)/exams/ExamDetailSheet";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { useDeleteUndoToast } from "@/components/ui/DeleteUndoToast";
import { DuplicateWarningSheet } from "@/components/ui/DuplicateWarningSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExamCard } from "@/components/ui/ExamCard";
import { Icon } from "@/components/ui/Icon";
import { MutationStatus } from "@/components/ui/MutationStatus";
import { RecoverableError } from "@/components/ui/RecoverableError";
import { TasksRouteSwitcher } from "@/components/ui/TasksRouteSwitcher";
import { useExams } from "@/hooks/use-exams";
import {
  normalizeRecoverableError,
  type DuplicateCandidate,
} from "@/lib/errors/recoverable";
import { findLikelyExamDuplicates } from "@/lib/mutations/duplicates";
import {
  beginDeleteUndoLocal,
  createExamLocal,
  finalizeDeleteUndoLocal,
  undoDeleteUndoLocal,
  updateExamLocal,
} from "@/lib/mutations/local-data";
import type { ClassOption, Exam } from "@/lib/types";
import { dismissNotification } from "@/lib/notifications/runtime";

type FilterTab = "Upcoming" | "Past";

export interface ExamsClientProps {
  exams?: Exam[];
  classOptions?: ClassOption[];
  examsAvailable?: boolean;
  classesAvailable?: boolean;
}

function isUpcomingExam(exam: Exam) {
  return new Date(exam.examAt).getTime() >= Date.now();
}

function sortExams(left: Exam, right: Exam) {
  return new Date(left.examAt).getTime() - new Date(right.examAt).getTime();
}

export default function ExamsClient({
  exams: initialExams = [],
  classOptions = [],
  examsAvailable,
  classesAvailable,
}: ExamsClientProps) {
  const examsState = useExams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedExams = initialExams.length > 0 ? initialExams : examsState.exams;
  const resolvedClassOptions =
    classOptions.length > 0 ? classOptions : examsState.classOptions;
  const resolvedExamsAvailable = examsAvailable ?? examsState.available;
  const resolvedClassesAvailable = classesAvailable ?? examsState.classesAvailable;
  const [activeFilter, setActiveFilter] = useState<FilterTab>("Upcoming");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formState, setFormState] = useState<ExamFormState>(() =>
    createEmptyExamFormState(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [pendingAction, setPendingAction] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [isBusy, setIsBusy] = useState(false);
  const [mutationState, setMutationState] = useState<"idle" | "pending" | "queued" | "failed">(
    "idle",
  );
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [allowDuplicateSave, setAllowDuplicateSave] = useState(false);
  const handledNotificationIdRef = useRef<string | null>(null);
  const { showUndo } = useDeleteUndoToast();

  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId) return;
    const exam = resolvedExams.find((item) => item.id === itemId);
    if (exam && selectedExam?.id !== itemId) {
      // The URL is an external navigation source from the service worker.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedExam(exam);
    }
  }, [resolvedExams, searchParams, selectedExam?.id]);

  useEffect(() => {
    const notificationId = searchParams.get("notification");
    if (!notificationId) {
      handledNotificationIdRef.current = null;
      return;
    }
    if (handledNotificationIdRef.current === notificationId) {
      return;
    }

    handledNotificationIdRef.current = notificationId;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("notification");
    const nextQuery = nextSearchParams.toString();
    void dismissNotification(notificationId)
      .then(() =>
        router.replace(nextQuery ? `/exams?${nextQuery}` : "/exams", {
          scroll: false,
        }),
      )
      .catch(() => {
        handledNotificationIdRef.current = null;
      });
  }, [router, searchParams]);

  const upcomingExams = resolvedExams
    .filter(isUpcomingExam)
    .slice()
    .sort(sortExams);
  const pastExams = resolvedExams
    .filter((exam) => !isUpcomingExam(exam))
    .slice()
    .sort((left, right) => sortExams(right, left));
  const visibleExams =
    activeFilter === "Upcoming" ? upcomingExams : pastExams;
  const displayedSelectedExam = selectedExam
    ? resolvedExams.find((exam) => exam.id === selectedExam.id) ?? selectedExam
    : null;

  const resetForm = () => {
    setFormState(createEmptyExamFormState());
    setFormMode("create");
    setErrorMessage(null);
    setFieldErrors(undefined);
    setAllowDuplicateSave(false);
  };

  const openCreateForm = () => {
    resetForm();
    setSelectedExam(null);
    setFormOpen(true);
  };

  const openEditForm = (exam: Exam) => {
    setFormMode("edit");
    setFormState(createExamFormStateFromExam(exam));
    setSelectedExam(exam);
    setErrorMessage(null);
    setFieldErrors(undefined);
    setAllowDuplicateSave(false);
    setFormOpen(true);
  };

  const handleFormChange = (
    key: keyof ExamFormState,
    value: ExamFormState[keyof ExamFormState],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors(undefined);

    const nextFieldErrors: Record<string, string[]> = {};

    if (formState.title.trim().length === 0) {
      nextFieldErrors.title = ["Exam title is required."];
    }
    if (formState.examAt.trim().length === 0) {
      nextFieldErrors.examAt = ["Exam date and time are required."];
    }

    const examTimestamp = new Date(formState.examAt).getTime();
    if (formState.examAt.trim().length > 0 && !Number.isFinite(examTimestamp)) {
      nextFieldErrors.examAt = ["Please enter a valid exam date and time."];
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setMutationState("failed");
      return;
    }

    const payload = {
      title: formState.title.trim(),
      examAt: new Date(formState.examAt).toISOString(),
      classId: formState.classId || null,
      location: formState.location,
      description: formState.description,
    };

    const duplicates = allowDuplicateSave
      ? []
      : findLikelyExamDuplicates(resolvedExams, {
          classId: payload.classId,
          examAt: payload.examAt,
          title: payload.title,
        }).filter((candidate) => candidate.id !== selectedExam?.id);

    if (duplicates.length > 0) {
      setDuplicateCandidates(duplicates);
      return;
    }

    setPendingAction(formMode);
    setIsBusy(true);
    setMutationState("pending");

    void (async () => {
      try {
        if (formMode === "create") {
          await createExamLocal(payload);
          setSelectedExam(null);
        } else if (selectedExam) {
          const exam = await updateExamLocal(selectedExam.id, payload);
          setSelectedExam(exam);
        } else {
          setErrorMessage("No exam selected.");
          return;
        }

        setFormOpen(false);
        resetForm();
        setMutationState("queued");
        window.setTimeout(() => setMutationState("idle"), 1500);
      } catch (error) {
        const recoverable = normalizeRecoverableError(error);
        setErrorMessage(recoverable.message);
        setFieldErrors(recoverable.fieldErrors);
        setMutationState("failed");
      } finally {
        setPendingAction(null);
        setIsBusy(false);
      }
    })();
  };

  const handleDelete = (exam: Exam) => {
    setErrorMessage(null);
    setPendingAction("delete");
    setIsBusy(true);
    setMutationState("pending");

    void (async () => {
      try {
        const operation = await beginDeleteUndoLocal("exam", exam.id);

        if (!operation) {
          setErrorMessage("We couldn't delete that exam right now.");
          setMutationState("failed");
          return;
        }

        setSelectedExam(null);
        setFormOpen(false);
        setMutationState("queued");
        showUndo({
          id: operation.queueItemId,
          label: "Exam deleted",
          onExpire: async () => {
            await finalizeDeleteUndoLocal(operation);
            setMutationState("idle");
          },
          onUndo: async () => {
            await undoDeleteUndoLocal(operation);
            setMutationState("idle");
          },
        });
      } catch (error) {
        setErrorMessage(normalizeRecoverableError(error).message);
        setMutationState("failed");
      } finally {
        setPendingAction(null);
        setIsBusy(false);
      }
    })();
  };

  const renderExamsContent = () => {
    if (!resolvedExamsAvailable) {
      return (
        <div className="flex flex-col gap-4">
          <RecoverableError
            tone="warning"
            title="Exams unavailable"
            message="We couldn’t load your exams right now. You can still browse this page and add new exam deadlines."
          />
          <EmptyState
            icon="quiz"
            title="Exams unavailable"
            description="Your exam list could not be loaded, but the page is still available."
          />
        </div>
      );
    }

    if (visibleExams.length > 0) {
      return (
        <div className="flex flex-col gap-4">
          {visibleExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onSelect={(selected) => setSelectedExam(selected)}
            />
          ))}
        </div>
      );
    }

    if (resolvedExams.length === 0) {
      return (
        <EmptyState
          icon="quiz"
          title="No exams yet"
          description="Your upcoming tests will appear here once you add them."
          action={
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-full bg-[#2170e4] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2170e4]/20 transition-transform active:scale-95"
            >
              Add your first exam
            </button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon="quiz"
        title={`No ${activeFilter.toLowerCase()} exams`}
        description={
          activeFilter === "Upcoming"
            ? "You're clear for now. New exam deadlines will show here automatically."
            : "Past exams will appear here once their date has passed."
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle="Exams" />

      <main className="mx-auto max-w-2xl px-4 pt-6">
        <section className="mb-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[28px] font-bold leading-[34px] text-[#191c1d]">
                Exams
              </h2>
              <p className="mt-1 text-sm font-medium text-[#424754]">
                Track your next tests and stay ahead of exam week.
              </p>
            </div>
            <div className="rounded-full bg-[#d8e2ff] px-3 py-1 text-xs font-semibold text-[#001a42]">
              {upcomingExams.length} Upcoming
            </div>
          </div>

          <div className="mb-4">
            <TasksRouteSwitcher activeRoute="/exams" />
          </div>

          <div className="flex gap-2">
            {(["Upcoming", "Past"] as FilterTab[]).map((tab) => {
              const active = activeFilter === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? "#2170e4" : "#e7e8e9",
                    color: active ? "#ffffff" : "#424754",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </section>

        {!resolvedClassesAvailable ? (
          <div className="mb-4 rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#825100] shadow-sm">
            Class links are temporarily unavailable. Exams can still be created
            and edited without linking a class.
          </div>
        ) : null}

        {errorMessage ? (
          <RecoverableError
            className="mb-4"
            title="Exam action failed"
            message={errorMessage}
          />
        ) : null}

        <MutationStatus
          state={mutationState}
          label={
            mutationState === "queued"
              ? "Exam change saved locally and queued to sync."
              : undefined
          }
        />

        {renderExamsContent()}
      </main>

      <div className="fixed bottom-24 right-6 z-40">
        <button
          type="button"
          onClick={openCreateForm}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0058be] text-white shadow-[0_8px_24px_rgba(0,88,190,0.35)] transition-transform hover:scale-105 active:scale-95"
        >
          <Icon name="add" className="text-[28px] text-white" />
        </button>
      </div>

      <ExamDetailSheet
        open={displayedSelectedExam !== null && !formOpen}
        exam={displayedSelectedExam}
        pending={isBusy && pendingAction === "delete"}
        onClose={() => {
          if (!isBusy) {
            setSelectedExam(null);
          }
        }}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      <ExamFormSheet
        open={formOpen}
        mode={formMode}
        classOptions={resolvedClassOptions}
        classesAvailable={resolvedClassesAvailable}
        formState={formState}
        error={errorMessage}
        fieldErrors={fieldErrors}
        pending={isBusy && (pendingAction === "create" || pendingAction === "edit")}
        onClose={() => {
          if (!isBusy) {
            setFormOpen(false);
            setErrorMessage(null);
            setFieldErrors(undefined);
            if (formMode === "create") {
              resetForm();
            }
          }
        }}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />

      <DuplicateWarningSheet
        open={duplicateCandidates.length > 0}
        candidates={duplicateCandidates}
        onCancel={() => setDuplicateCandidates([])}
        onConfirm={() => {
          setDuplicateCandidates([]);
          setAllowDuplicateSave(true);
          window.setTimeout(() => {
            document.querySelector<HTMLFormElement>("#exam-form")?.requestSubmit();
          }, 0);
        }}
        onReview={(candidate) => {
          setDuplicateCandidates([]);
          router.push(candidate.href ?? "/exams");
        }}
      />
    </div>
  );
}
