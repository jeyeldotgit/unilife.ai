import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callGeminiText } from "@unilife-ai/ai-core";
import type {
  StudyCardReview,
  StudyCardReviewState,
  StudyFlashcard,
  StudyKit,
  StudyQuizAnswerOption,
  StudyQuizAttempt,
  StudyQuizQuestion,
} from "@unilife-ai/types";
import { z } from "zod";

import { notFound, validationError } from "../lib/http-errors.js";
import { StudyKitsRepository } from "../repositories/study-kits.repository.js";

const MAX_STUDY_KIT_BYTES = 5 * 1024 * 1024;
const PDF_HEADER = "%PDF";
const DEFAULT_STUDY_KIT_GEMINI_MODEL = "gemini-2.0-flash";
const STUDY_KIT_SOURCE_BUCKET = "study-kit-sources";
const DEFAULT_GENERATION_COUNT = 10;
const require = createRequire(import.meta.url);
const PDFJS_WORKER_PATH = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const generatedOptionSchema = z
  .object({
    text: z.string().trim().min(1),
    isCorrect: z.boolean(),
    rationale: z.string().trim().min(1),
  })
  .strict();
const generatedQuestionSchema = z
  .object({
    questionNumber: z.number().int().positive(),
    question: z.string().trim().min(1),
    answerOptions: z.array(generatedOptionSchema).length(4).refine(
      (options) => options.filter((option) => option.isCorrect).length === 1,
      "Each question must have exactly one correct option.",
    ),
    hint: z.string().trim().min(1).nullable().optional(),
  })
  .strict();
const generatedFlashcardSchema = z
  .object({
    lesson: z.string().trim().min(1),
    front: z.string().trim().min(1),
    back: z.string().trim().min(1),
  })
  .strict();
const generatedStudyKitSchema = z
  .object({
    quiz: z.array(generatedQuestionSchema).min(1),
    flashcards: z.array(generatedFlashcardSchema).min(1),
  })
  .strict();

export type CreateStudyKitInput = {
  class_id?: string | null;
  exam_id?: string | null;
  generation_count?: 5 | 10 | 20 | 30;
  source_name: string;
  source_path: string;
  title?: string | null;
};

export type CreateQuizAttemptInput = {
  answers: Record<string, string>;
  score: number;
  total: number;
};

export type SaveCardReviewInput = {
  flashcard_id: string;
  state: StudyCardReviewState;
};

type GeminiTextCaller = typeof callGeminiText;

function validatePdfBuffer(buffer: Buffer) {
  if (buffer.byteLength === 0) {
    throw validationError("The selected PDF is empty.");
  }
  if (buffer.byteLength > MAX_STUDY_KIT_BYTES) {
    throw validationError("Study reviewer PDFs must be 5 MB or smaller.");
  }
  if (!buffer.subarray(0, 4).toString("utf8").startsWith(PDF_HEADER)) {
    throw validationError("Upload a valid PDF reviewer.");
  }
  return buffer;
}

function normalizeSourcePath(path: string) {
  return path.trim().replace(/^\/+/, "");
}

function isUserOwnedStudyKitSource(path: string, userId: string) {
  return normalizeSourcePath(path).startsWith(`study-kits/${userId}/`);
}

function fingerprintSource(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function deriveTitle(sourceName: string, title?: string | null) {
  if (title?.trim()) return title.trim();
  return sourceName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim() || "Study Reviewer";
}

export function cleanStudyText(rawText: string) {
  const lines = rawText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const frequencies = new Map<string, number>();
  for (const line of lines) {
    frequencies.set(line.toLowerCase(), (frequencies.get(line.toLowerCase()) ?? 0) + 1);
  }

  return lines
    .filter((line) => {
      const normalized = line.toLowerCase();
      if (/^--?\s*\d+\s+of\s+\d+\s*--?$/i.test(line)) return false;
      if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line)) return false;
      if (normalized.includes("reviewer made by:")) return false;
      if (normalized === "orgman - final reviewer") return false;
      if ((frequencies.get(normalized) ?? 0) >= 3 && line.length <= 80) return false;
      return true;
    })
    .join("\n")
    .slice(0, 45_000);
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON object.");
  }
  return candidate.slice(start, end + 1);
}

function parseGeneratedStudyKit(text: string) {
  return generatedStudyKitSchema.parse(JSON.parse(extractJsonObject(text)));
}

async function loadPdfCanvasPolyfills() {
  const canvas = await import("@napi-rs/canvas");
  const target = globalThis as typeof globalThis & {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };
  target.DOMMatrix ??= canvas.DOMMatrix;
  target.ImageData ??= canvas.ImageData;
  target.Path2D ??= canvas.Path2D;
}

async function extractPdfText(buffer: Buffer) {
  await loadPdfCanvasPolyfills();
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(pathToFileURL(PDFJS_WORKER_PATH).href);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText().finally(() => parser.destroy());
  return parsed.text;
}

function getGenerationCount(input: CreateStudyKitInput) {
  return input.generation_count ?? DEFAULT_GENERATION_COUNT;
}

function buildGenerationPrompt(cleanedText: string, generationCount: number) {
  return [
    "You are an expert data extraction assistant specializing in converting educational text and study reviewers into structured JSON data.",
    "Analyze the provided raw reviewer text, identify the core concepts, and transform them into a valid JSON object containing multiple-choice quiz questions and detailed flashcards.",
    "CRITICAL REQUIREMENTS:",
    "DATA CLEANING: Ignore recurring header/footer noise, reviewer bylines, and page markers. Do not let artifact strings bleed into output.",
    "ACCURACY: Base all content strictly on the facts, definitions, hierarchies, and memory aids in the text. Do not invent outside concepts.",
    "OUTPUT FORMAT: Output only valid minified JSON. No Markdown.",
    "SCHEMA: {\"quiz\":[{\"questionNumber\":1,\"question\":\"...\",\"answerOptions\":[{\"text\":\"...\",\"isCorrect\":true,\"rationale\":\"...\"},{\"text\":\"...\",\"isCorrect\":false,\"rationale\":\"...\"},{\"text\":\"...\",\"isCorrect\":false,\"rationale\":\"...\"},{\"text\":\"...\",\"isCorrect\":false,\"rationale\":\"...\"}],\"hint\":\"...\"}],\"flashcards\":[{\"lesson\":\"...\",\"front\":\"...\",\"back\":\"...\"}]}",
    `COUNT: Generate exactly ${generationCount} quiz questions and exactly ${generationCount} flashcards.`,
    "RULES: Create a balanced mix across the most important lessons. Every question has exactly 4 options and exactly 1 correct option. Distractors should be plausible terms from the text.",
    "REVIEWER TEXT:",
    cleanedText,
  ].join("\n\n");
}

function buildRepairPrompt(rawText: string) {
  return [
    "Repair this response into valid minified JSON matching exactly this schema:",
    "{\"quiz\":[{\"questionNumber\":1,\"question\":\"...\",\"answerOptions\":[{\"text\":\"...\",\"isCorrect\":true,\"rationale\":\"...\"},{\"text\":\"...\",\"isCorrect\":false,\"rationale\":\"...\"},{\"text\":\"...\",\"isCorrect\":false,\"rationale\":\"...\"},{\"text\":\"...\",\"isCorrect\":false,\"rationale\":\"...\"}],\"hint\":\"...\"}],\"flashcards\":[{\"lesson\":\"...\",\"front\":\"...\",\"back\":\"...\"}]}",
    "Every quiz question must have exactly 4 answerOptions and exactly 1 isCorrect true. Output only JSON.",
    rawText,
  ].join("\n\n");
}

function getStudyKitGeminiModel() {
  return process.env.STUDY_KIT_GEMINI_MODEL?.trim() || DEFAULT_STUDY_KIT_GEMINI_MODEL;
}

function toStoredContent(studyKitId: string, generated: z.infer<typeof generatedStudyKitSchema>) {
  const timestamp = new Date().toISOString();
  const flashcards: StudyFlashcard[] = generated.flashcards.map((flashcard, index) => ({
    id: randomUUID(),
    study_kit_id: studyKitId,
    lesson: flashcard.lesson,
    front: flashcard.front,
    back: flashcard.back,
    order_index: index,
    created_at: timestamp,
  }));
  const questions: StudyQuizQuestion[] = generated.quiz.map((question, index) => ({
    id: randomUUID(),
    study_kit_id: studyKitId,
    question: question.question,
    hint: question.hint ?? null,
    order_index: index,
    created_at: timestamp,
  }));
  const options: StudyQuizAnswerOption[] = generated.quiz.flatMap((question, questionIndex) =>
    question.answerOptions.map((option, optionIndex) => ({
      id: randomUUID(),
      question_id: questions[questionIndex].id,
      text: option.text,
      is_correct: option.isCorrect,
      rationale: option.rationale,
      order_index: optionIndex,
      created_at: timestamp,
    })),
  );

  return { flashcards, options, questions };
}

function capGeneratedStudyKit(
  generated: z.infer<typeof generatedStudyKitSchema>,
  generationCount: number,
) {
  return {
    quiz: generated.quiz.slice(0, generationCount),
    flashcards: generated.flashcards.slice(0, generationCount),
  };
}

export class StudyKitsService {
  private readonly repository: StudyKitsRepository;
  private readonly geminiCaller: GeminiTextCaller;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string,
    repository = new StudyKitsRepository(supabase),
    geminiCaller: GeminiTextCaller = callGeminiText,
  ) {
    this.repository = repository;
    this.geminiCaller = geminiCaller;
  }

  async create(input: CreateStudyKitInput) {
    if (!isUserOwnedStudyKitSource(input.source_path, this.userId)) {
      throw validationError("Upload the PDF to your study kit source folder before processing.");
    }
    const sourcePath = normalizeSourcePath(input.source_path);
    const buffer = validatePdfBuffer(await this.downloadSourcePdf(sourcePath));
    const sourceFingerprint = fingerprintSource(buffer);
    const existing = await this.repository.findByFingerprintForUser(sourceFingerprint, this.userId);
    if (existing && existing.status !== "failed") {
      return { kit: await this.repository.getDetail(existing), idempotent: true };
    }
    await this.validateLinkedEntities(input);

    const timestamp = new Date().toISOString();
    const kitId = existing?.id ?? randomUUID();
    const generationCount = getGenerationCount(input);
    const processingKit: StudyKit = {
      id: kitId,
      user_id: this.userId,
      class_id: input.class_id ?? null,
      exam_id: input.exam_id ?? null,
      title: deriveTitle(input.source_name, input.title),
      source_name: input.source_name,
      source_path: sourcePath,
      source_deleted_at: null,
      source_fingerprint: sourceFingerprint,
      status: "processing",
      flashcard_count: 0,
      quiz_question_count: 0,
      extracted_text_preview: null,
      error: null,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
    };
    await this.repository.upsertKit(processingKit);

    try {
      const cleanedText = cleanStudyText(await extractPdfText(buffer));
      if (cleanedText.length < 200) {
        throw validationError("The PDF does not contain enough readable reviewer text.");
      }

      const generatedText = await this.geminiCaller({
        model: getStudyKitGeminiModel(),
        prompt: buildGenerationPrompt(cleanedText, generationCount),
        maxOutputTokens: 8192,
        temperature: 0.2,
      });
      let generated: z.infer<typeof generatedStudyKitSchema>;
      try {
        generated = parseGeneratedStudyKit(generatedText);
      } catch {
        const repaired = await this.geminiCaller({
          model: getStudyKitGeminiModel(),
          prompt: buildRepairPrompt(generatedText),
          maxOutputTokens: 8192,
          temperature: 0,
        });
        generated = parseGeneratedStudyKit(repaired);
      }

      const content = toStoredContent(kitId, capGeneratedStudyKit(generated, generationCount));
      await this.repository.saveGeneratedContent(content);
      const readyKit = await this.repository.upsertKit({
        ...processingKit,
        status: "ready",
        flashcard_count: content.flashcards.length,
        quiz_question_count: content.questions.length,
        extracted_text_preview: cleanedText.slice(0, 2000),
        source_deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await this.deleteSourceObject(sourcePath);

      return { kit: await this.repository.getDetail(readyKit), idempotent: false };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not generate this study kit.";
      const failedAt = new Date().toISOString();
      const failedKit = await this.repository.upsertKit({
        ...processingKit,
        status: "failed",
        error: message,
        source_deleted_at: failedAt,
        updated_at: failedAt,
      });
      await this.deleteSourceObject(sourcePath);

      return { kit: await this.repository.getDetail(failedKit), idempotent: false };
    }
  }

  async list() {
    return { kits: await this.repository.listForUser(this.userId) };
  }

  async get(id: string) {
    const kit = await this.repository.findByIdForUser(id, this.userId);
    if (!kit) throw notFound("Study kit not found.");
    return { kit: await this.repository.getDetail(kit) };
  }

  async delete(id: string) {
    const kit = await this.repository.findByIdForUser(id, this.userId);
    if (!kit) throw notFound("Study kit not found.");

    if (kit.source_path && !kit.source_deleted_at) {
      await this.deleteSourceObject(kit.source_path);
    }

    await this.repository.deleteKit(id, this.userId);
    return { deleted: true };
  }

  async createQuizAttempt(id: string, input: CreateQuizAttemptInput) {
    const kit = await this.repository.findByIdForUser(id, this.userId);
    if (!kit) throw notFound("Study kit not found.");
    if (input.total < 1 || input.score < 0 || input.score > input.total) {
      throw validationError("Quiz score is invalid.");
    }
    const detail = await this.repository.getDetail(kit);
    if (detail.questions.length === 0) {
      throw validationError("This study kit does not have quiz questions yet.");
    }
    const score = detail.questions.reduce((sum, question) => {
      const selectedOptionId = input.answers[question.id];
      const selected = question.options.find((option) => option.id === selectedOptionId);
      return sum + (selected?.is_correct ? 1 : 0);
    }, 0);

    const attempt: StudyQuizAttempt = {
      id: randomUUID(),
      study_kit_id: id,
      user_id: this.userId,
      score,
      total: detail.questions.length,
      answers: input.answers,
      created_at: new Date().toISOString(),
    };

    return { attempt: await this.repository.createQuizAttempt(attempt) };
  }

  async saveCardReview(id: string, input: SaveCardReviewInput) {
    const kit = await this.repository.findByIdForUser(id, this.userId);
    if (!kit) throw notFound("Study kit not found.");
    const { data, error } = await this.supabase
      .from("study_flashcards")
      .select("id")
      .eq("id", input.flashcard_id)
      .eq("study_kit_id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw validationError("Choose a flashcard from this study kit.");

    const review: StudyCardReview = {
      id: randomUUID(),
      study_kit_id: id,
      flashcard_id: input.flashcard_id,
      user_id: this.userId,
      state: input.state,
      updated_at: new Date().toISOString(),
    };

    return { review: await this.repository.upsertCardReview(review) };
  }

  async export(id: string, format: "csv" | "json") {
    const { kit } = await this.get(id);
    if (format === "json") return JSON.stringify(kit);

    const rows = [
      ["type", "lesson", "front_or_question", "back_or_correct_answer", "hint"],
      ...kit.flashcards.map((card) => ["flashcard", card.lesson, card.front, card.back, ""]),
      ...kit.questions.map((question) => [
        "quiz",
        "",
        question.question,
        question.options.find((option) => option.is_correct)?.text ?? "",
        question.hint ?? "",
      ]),
    ];

    return rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  private async validateLinkedEntities(input: CreateStudyKitInput) {
    if (input.class_id) {
      const { data, error } = await this.supabase
        .from("classes")
        .select("id")
        .eq("id", input.class_id)
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw validationError("Choose one of your saved classes for this study kit.");
    }

    if (input.exam_id) {
      const { data, error } = await this.supabase
        .from("exams")
        .select("id")
        .eq("id", input.exam_id)
        .eq("user_id", this.userId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw validationError("Choose one of your saved exams for this study kit.");
    }
  }

  private async downloadSourcePdf(sourcePath: string) {
    const { data, error } = await this.supabase.storage
      .from(STUDY_KIT_SOURCE_BUCKET)
      .download(sourcePath);
    if (error) {
      throw validationError("The uploaded PDF source could not be found.");
    }
    return Buffer.from(await data.arrayBuffer());
  }

  private async deleteSourceObject(sourcePath: string) {
    try {
      await this.supabase.storage.from(STUDY_KIT_SOURCE_BUCKET).remove([sourcePath]);
    } catch {
      // Source cleanup is best-effort after metadata records deletion intent.
    }
  }
}
