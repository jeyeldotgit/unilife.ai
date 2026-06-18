"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { Icon } from "@/components/ui/Icon";
import { removeCachedStudyKit, useStudyKit } from "@/hooks/use-study-kits";
import {
  deleteStudyKit,
  downloadStudyKitExport,
  saveCardReview,
  saveQuizAttempt,
} from "@/lib/api/study-kits";
import { db } from "@/lib/db/dexie";

type Tab = "flashcards" | "quiz" | "download";

export default function StudyKitDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const study = useStudyKit(id);
  const kit = study.kit;
  const [tab, setTab] = useState<Tab>("flashcards");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const reviewByCard = useMemo(
    () => new Map(kit?.card_reviews.map((review) => [review.flashcard_id, review]) ?? []),
    [kit?.card_reviews],
  );

  const score = kit
    ? kit.questions.reduce((sum, question) => {
        const selectedOptionId = answers[question.id];
        const selected = question.options.find((option) => option.id === selectedOptionId);
        return sum + (selected?.is_correct ? 1 : 0);
      }, 0)
    : 0;

  const handleCardReview = async (flashcardId: string, state: "known" | "needs_review") => {
    if (!kit) return;
    const response = await saveCardReview(kit.id, { flashcardId, state });
    await db.study_card_reviews.put(response.review);
  };

  const handleQuizSubmit = async () => {
    if (!kit) return;
    const response = await saveQuizAttempt(kit.id, {
      answers,
      score,
      total: kit.questions.length,
    });
    await db.study_quiz_attempts.put(response.attempt);
    setSubmitMessage(`Saved ${score}/${kit.questions.length}.`);
  };

  const handleDelete = async () => {
    if (!kit || deleting) return;
    if (!window.confirm(`Delete "${kit.title}"? This removes its flashcards, quiz, and attempts.`)) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteStudyKit(kit.id);
      await removeCachedStudyKit(kit.id);
      router.push("/study");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "This study kit could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  if (!kit && study.loaded) {
    return (
      <div className="min-h-dvh bg-[#f8f9fa] pb-28">
        <AuthenticatedPageHeader className="sticky top-0 z-50 bg-[#f8f9fa]" pageTitle="Study Kit" />
        <main className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-sm text-[#ba1a1a]">{study.error ?? "Study kit not found."}</p>
          <Link className="text-sm font-semibold text-[#0058be]" href="/study">
            Back to Study
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f8f9fa] pb-28 text-[#191c1d]">
      <AuthenticatedPageHeader className="sticky top-0 z-50 bg-[#f8f9fa]" pageTitle="Study Kit" />
      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-4">
        <Link className="text-sm font-semibold text-[#0058be]" href="/study">
          Back to Study
        </Link>
        {!kit ? (
          <p className="text-sm text-[#424754]">Loading study kit...</p>
        ) : (
          <>
            <section className="rounded-xl border border-[#c2c6d6] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="m-0 text-2xl font-semibold">{kit.title}</h1>
                  <p className="mt-2 text-sm text-[#424754]">
                    {kit.flashcard_count} flashcards • {kit.quiz_question_count} quiz questions
                  </p>
                </div>
                <span className="rounded-full bg-[#d8e2ff] px-3 py-1 text-xs font-semibold text-[#0058be]">
                  {kit.status}
                </span>
              </div>
              {kit.error ? <p className="mt-3 text-sm text-[#ba1a1a]">{kit.error}</p> : null}
              {deleteError ? <p className="mt-3 text-sm text-[#ba1a1a]">{deleteError}</p> : null}
              <div className="mt-4 flex justify-end">
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ffdad6] bg-[#fff8f7] px-3 py-2 text-sm font-semibold text-[#ba1a1a] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleting}
                  type="button"
                  onClick={() => {
                    void handleDelete();
                  }}
                >
                  <Icon name={deleting ? "hourglass_top" : "delete"} size={18} />
                  {deleting ? "Deleting" : "Delete study kit"}
                </button>
              </div>
            </section>

            <div className="flex gap-2 rounded-xl border border-[#c2c6d6] bg-white p-1">
              {(["flashcards", "quiz", "download"] as const).map((item) => (
                <button
                  key={item}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                    tab === item ? "bg-[#0058be] text-white" : "text-[#424754]"
                  }`}
                  type="button"
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {tab === "flashcards" ? (
              <section className="grid gap-3 md:grid-cols-2">
                {kit.flashcards.map((card) => {
                  const flipped = flippedCardId === card.id;
                  const review = reviewByCard.get(card.id);
                  return (
                    <article
                      key={card.id}
                      className="rounded-xl border border-[#c2c6d6] bg-white p-4 shadow-sm"
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#424754]">
                        {card.lesson}
                      </p>
                      <button
                        className="min-h-32 w-full rounded-lg border border-[#d8e2ff] bg-[#f8fbff] p-4 text-left"
                        type="button"
                        onClick={() => setFlippedCardId(flipped ? null : card.id)}
                      >
                        <p className="m-0 text-base font-semibold">
                          {flipped ? card.back : card.front}
                        </p>
                      </button>
                      <div className="mt-3 flex gap-2">
                        <button
                          className="flex-1 rounded-lg border border-[#c2c6d6] px-3 py-2 text-sm font-semibold text-[#424754]"
                          type="button"
                          onClick={() => {
                            void handleCardReview(card.id, "needs_review");
                          }}
                        >
                          Review again
                        </button>
                        <button
                          className="flex-1 rounded-lg bg-[#0058be] px-3 py-2 text-sm font-semibold text-white"
                          type="button"
                          onClick={() => {
                            void handleCardReview(card.id, "known");
                          }}
                        >
                          Known
                        </button>
                      </div>
                      {review ? (
                        <p className="mt-2 text-xs text-[#424754]">Marked {review.state}.</p>
                      ) : null}
                    </article>
                  );
                })}
              </section>
            ) : null}

            {tab === "quiz" ? (
              <section className="flex flex-col gap-4">
                {kit.questions.map((question, index) => (
                  <article
                    key={question.id}
                    className="rounded-xl border border-[#c2c6d6] bg-white p-4 shadow-sm"
                  >
                    <h2 className="m-0 text-base font-semibold">
                      {index + 1}. {question.question}
                    </h2>
                    {question.hint ? (
                      <p className="mt-2 text-sm text-[#424754]">Hint: {question.hint}</p>
                    ) : null}
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#c2c6d6] p-3 text-sm"
                        >
                          <input
                            checked={answers[question.id] === option.id}
                            name={question.id}
                            type="radio"
                            onChange={() =>
                              setAnswers((current) => ({ ...current, [question.id]: option.id }))
                            }
                          />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
                <button
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0058be] px-4 py-3 text-sm font-semibold text-white"
                  type="button"
                  onClick={() => {
                    void handleQuizSubmit();
                  }}
                >
                  <Icon name="task_alt" size={18} />
                  Submit Quiz
                </button>
                {submitMessage ? <p className="text-sm font-semibold">{submitMessage}</p> : null}
              </section>
            ) : null}

            {tab === "download" ? (
              <section className="rounded-xl border border-[#c2c6d6] bg-white p-5 shadow-sm">
                <h2 className="m-0 text-base font-semibold">Download</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["json", "csv"] as const).map((format) => (
                    <button
                      key={format}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#0058be] px-4 py-3 text-sm font-semibold text-[#0058be]"
                      type="button"
                      onClick={() => {
                        void downloadStudyKitExport(kit.id, format);
                      }}
                    >
                      <Icon name="download" size={18} />
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
