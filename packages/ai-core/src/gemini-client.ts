import { GoogleGenerativeAI } from "@google/generative-ai";

import type { GeminiCallRequest, GeminiChatResponse } from "./parsers/response-parser.js";
import { parseGeminiResponse } from "./parsers/response-parser.js";
import { buildAiChatSystemPrompt } from "./prompts/system-prompt.js";

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

export async function callGemini(request: GeminiCallRequest): Promise<GeminiChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
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
