export type AIProcessingLayer = "local" | "gemini";

export type AILog = {
  id: string;
  user_id: string;
  raw_input: string;
  detected_intent: string | null;
  confidence: number | null; // 0.0 to 1.0
  processing_layer: AIProcessingLayer;
  structured_output: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
};
