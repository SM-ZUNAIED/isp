ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS mohalla text,
  ADD COLUMN IF NOT EXISTS road_name text,
  ADD COLUMN IF NOT EXISTS holding_no text;