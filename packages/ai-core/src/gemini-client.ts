import { GoogleGenerativeAI } from "@google/generative-ai";

import type {
  GeminiCallRequest,
  GeminiChatResponse,
} from "./parsers/response-parser.js";
import { parseGeminiResponse } from "./parsers/response-parser.js";
import { buildAiChatSystemPrompt } from "./prompts/system-prompt.js";

function getGeminiModel(modelOverride?: string) {
  return modelOverride?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";
}

function createPrompt(request: GeminiCallRequest) {
  const contextJson = JSON.stringify(request.context ?? {}, null, 2);

  return [
    buildAiChatSystemPrompt(),
    request.systemPrompt,
    "Frontend context:",
    contextJson,
    "User message:",
    request.message,
  ].join("\n\n");
}

export async function callGemini(
  request: GeminiCallRequest,
): Promise<GeminiChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: getGeminiModel(),
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });

  const result = await model.generateContent(createPrompt(request));
  const response = await result.response;
  const text = response.text();

  return parseGeminiResponse(text);
}

export async function callGeminiText(request: {
  maxOutputTokens?: number;
  model?: string;
  prompt: string;
  temperature?: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: getGeminiModel(request.model),
    generationConfig: {
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: request.maxOutputTokens ?? 8192,
    },
  });

  const result = await model.generateContent(request.prompt);
  const response = await result.response;

  return response.text();
}
