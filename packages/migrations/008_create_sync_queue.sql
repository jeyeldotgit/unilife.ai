CREATE TABLE public.sync_queue (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type       TEXT NOT NULL,
  entity_id         UUID NOT NULL,
  operation         TEXT NOT NULL CHECK (operation IN ('create','update','delete')),
  payload           JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','syncing','synced','failed')),
  retry_count       SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempted_at TIMESTAMPTZ
);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync queue"
  ON public.sync_queue FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_sync_queue_user_status ON public.sync_queue(user_id, status);