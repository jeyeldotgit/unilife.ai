CREATE TABLE public.classes (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  room        TEXT,
  instructor  TEXT,
  day_of_week TEXT NOT NULL CHECK (
    day_of_week IN (
      'monday','tuesday','wednesday',
      'thursday','friday','saturday','sunday'
    )
  ),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  color       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own classes"
  ON public.classes FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_classes_user_id ON public.classes(user_id);
CREATE INDEX idx_classes_day ON public.classes(day_of_week);