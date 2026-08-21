ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.post_offices ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS google_map_url text;