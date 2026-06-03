CREATE TABLE public.ai_logs (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_input         TEXT NOT NULL,
  detected_intent   TEXT,
  confidence        NUMERIC(4,3),
  processing_layer  TEXT NOT NULL CHECK (processing_layer IN ('local','gemini')),
  structured_output JSONB,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai logs"
  ON public.ai_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_logs_user_id ON public.ai_logs(user_id);