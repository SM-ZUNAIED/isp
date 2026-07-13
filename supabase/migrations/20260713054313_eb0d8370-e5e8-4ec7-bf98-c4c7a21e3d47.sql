
ALTER TABLE public.stock_movements ALTER COLUMN movement_type DROP NOT NULL;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS bill_generation_day int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bill_due_days int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS overdue_notice_days int[] NOT NULL DEFAULT ARRAY[3,7,15],
  ADD COLUMN IF NOT EXISTS auto_suspend_after_days int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS auto_billing_enabled boolean NOT NULL DEFAULT true;
