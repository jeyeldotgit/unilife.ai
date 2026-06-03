CREATE TABLE public.expenses (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  budget_id   UUID,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL CHECK (
    category IN (
      'food','transportation','school',
      'entertainment','miscellaneous'
    )
  ),
  description TEXT,
  spent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_spent_at ON public.expenses(spent_at);
CREATE INDEX idx_expenses_category ON public.expenses(category);