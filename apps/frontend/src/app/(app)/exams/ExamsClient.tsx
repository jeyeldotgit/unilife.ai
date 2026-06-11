"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createExamAction,
  deleteExamAction,
  updateExamAction,
} from "@/actions/exams";
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
import type { ClassOption, Exam } from "@/lib/types";

type FilterTab = "Upcoming" | "Past";

export interface ExamsClientProps {
  exams: Exam[];
  classOptions: ClassOption[];
  examsAvailable: boolean;
  classesAvailable: boolean;
}

function isUpcomingExam(exam: Exam) {
  return new Date(exam.examAt).getTime() >= Date.now();
}

function sortExams(left: Exam, right: Exam) {
  return new Date(left.examAt).getTime() - new Date(right.examAt).getTime();
}

export default function ExamsClient({
  exams: initialExams,
  classOptions,
  examsAvailable,
  classesAvailable,
}: ExamsClientProps) {
  const router = useRouter();
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

  const upcomingExams = initialExams
    .filter(isUpcomingExam)
    .slice()
    .sort(sortExams);
  const pastExams = initialExams
    .filter((exam) => !isUpcomingExam(exam))
    .slice()
    .sort((left, right) => sortExams(right, left));
  const visibleExams =
    activeFilter === "Upcoming" ? upcomingExams : pastExams;

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
      const result =
        formMode === "create"
          ? await createExamAction(payload)
          : selectedExam
            ? await updateExamAction(selectedExam.id, payload)
            : { ok: false, error: "No exam selected." };

      setPendingAction(null);
      setIsBusy(false);

      if (!result.ok) {
        setErrorMessage(result.error ?? "We couldn't save the exam right now.");
        return;
      }

      if (result.exam) {
        setSelectedExam(formMode === "edit" ? result.exam : null);
      }

      setFormOpen(false);
      resetForm();
      router.refresh();
    })();
  };

  const handleDelete = (exam: Exam) => {
    setErrorMessage(null);
    setPendingAction("delete");
    setIsBusy(true);

    void (async () => {
      const result = await deleteExamAction(exam.id);

      setPendingAction(null);
      setIsBusy(false);

      if (!result.ok) {
        setErrorMessage(result.error ?? "We couldn't delete that exam right now.");
        return;
      }

      setSelectedExam(null);
      setFormOpen(false);
      router.refresh();
    })();
  };

  const renderExamsContent = () => {
    if (!examsAvailable) {
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

    if (initialExams.length === 0) {
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
          <button
            type="button"
            className="rounded-full p-2 text-[#3B82F6] transition-opacity hover:opacity-80"
          >
            <Icon name="notifications" />
          </button>
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

        {!classesAvailable ? (
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
        open={selectedExam !== null && !formOpen}
        exam={selectedExam}
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
        classOptions={classOptions}
        classesAvailable={classesAvailable}
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
