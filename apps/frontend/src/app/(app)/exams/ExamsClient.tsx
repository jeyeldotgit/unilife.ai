"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createEmptyExamFormState,
  createExamFormStateFromExam,
  ExamFormSheet,
  type ExamFormState,
} from "@/app/(app)/exams/ExamFormSheet";
import { ExamDetailSheet } from "@/app/(app)/exams/ExamDetailSheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExamCard } from "@/components/ui/ExamCard";
import { Icon } from "@/components/ui/Icon";
import { TasksRouteSwitcher } from "@/components/ui/TasksRouteSwitcher";
import { NotificationPermissionButton } from "@/components/notifications/NotificationPermissionButton";
import { useExams } from "@/hooks/use-exams";
import {
  createExamLocal,
  deleteExamLocal,
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
  const [pendingAction, setPendingAction] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId) return;
    const exam = resolvedExams.find((item) => item.id === itemId);
    if (exam && selectedExam?.id !== itemId) {
      // The URL is an external navigation source from the service worker.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedExam(exam);
    }
    const notificationId = searchParams.get("notification");
    if (notificationId) {
      void dismissNotification(notificationId).then(() => router.replace("/exams"));
    }
  }, [resolvedExams, router, searchParams, selectedExam?.id]);

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

    if (formState.title.trim().length === 0 || formState.examAt.trim().length === 0) {
      setErrorMessage("Exam title and date/time are required.");
      return;
    }

    const examTimestamp = new Date(formState.examAt).getTime();
    if (!Number.isFinite(examTimestamp)) {
      setErrorMessage("Please enter a valid exam date and time.");
      return;
    }

    const payload = {
      title: formState.title.trim(),
      examAt: new Date(formState.examAt).toISOString(),
      classId: formState.classId || null,
      location: formState.location,
      description: formState.description,
    };

    setPendingAction(formMode);
    setIsBusy(true);

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
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't save the exam right now.",
        );
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

    void (async () => {
      try {
        const deleted = await deleteExamLocal(exam.id);

        if (!deleted) {
          setErrorMessage("We couldn't delete that exam right now.");
          return;
        }

        setSelectedExam(null);
        setFormOpen(false);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't delete that exam right now.",
        );
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
          <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#825100] shadow-sm">
            We couldn&apos;t load your exams right now. You can still browse
            this page and add new exam deadlines.
          </div>
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
      <PageHeader
        className="sticky top-0 z-40 bg-[rgba(248,249,250,0.92)] backdrop-blur-[12px]"
        contentClassName="flex items-center justify-between p-4"
        title="Hi, Alex"
        subtitle="Keep your deadlines in view"
        leading={
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e2ff] bg-white text-[#3B82F6]">
            <Icon name="school" />
          </div>
        }
        titleClassName="m-0 text-2xl font-bold leading-8 text-[#3B82F6]"
        subtitleClassName="text-xs font-medium text-[#424754]"
        trailing={
          <NotificationPermissionButton />
        }
      />

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
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a] shadow-sm">
            {errorMessage}
          </div>
        ) : null}

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
        pending={isBusy && (pendingAction === "create" || pendingAction === "edit")}
        onClose={() => {
          if (!isBusy) {
            setFormOpen(false);
            setErrorMessage(null);
            if (formMode === "create") {
              resetForm();
            }
          }
        }}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
