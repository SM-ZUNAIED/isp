ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS division_id integer,
  ADD COLUMN IF NOT EXISTS district_id integer,
  ADD COLUMN IF NOT EXISTS upazila_id integer,
  ADD COLUMN IF NOT EXISTS union_id uuid,
  ADD COLUMN IF NOT EXISTS post_office_id uuid,
  ADD COLUMN IF NOT EXISTS village_id uuid,
  ADD COLUMN IF NOT EXISTS area_id uuid,
  ADD COLUMN IF NOT EXISTS road_id uuid,
  ADD COLUMN IF NOT EXISTS building_id uuid,
  ADD COLUMN IF NOT EXISTS mohalla text,
  ADD COLUMN IF NOT EXISTS road_name text,
  ADD COLUMN IF NOT EXISTS holding_no text;