
-- ADDRESS HIERARCHY
CREATE TABLE IF NOT EXISTS public.divisions (
  id serial PRIMARY KEY,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.divisions TO anon, authenticated;
GRANT ALL ON public.divisions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.divisions_id_seq TO authenticated, service_role;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "divisions read" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "divisions admin write" ON public.divisions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.districts (
  id serial PRIMARY KEY,
  division_id integer NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT ALL ON public.districts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.districts_id_seq TO authenticated, service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "districts read" ON public.districts FOR SELECT USING (true);
CREATE POLICY "districts admin write" ON public.districts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS districts_division_idx ON public.districts(division_id);

CREATE TABLE IF NOT EXISTS public.upazilas (
  id serial PRIMARY KEY,
  district_id integer NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.upazilas TO anon, authenticated;
GRANT ALL ON public.upazilas TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.upazilas_id_seq TO authenticated, service_role;
ALTER TABLE public.upazilas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upazilas read" ON public.upazilas FOR SELECT USING (true);
CREATE POLICY "upazilas admin write" ON public.upazilas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS upazilas_district_idx ON public.upazilas(district_id);

CREATE TABLE IF NOT EXISTS public.unions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upazila_id integer NOT NULL REFERENCES public.upazilas(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.unions TO authenticated;
GRANT SELECT ON public.unions TO anon;
GRANT ALL ON public.unions TO service_role;
ALTER TABLE public.unions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unions read" ON public.unions FOR SELECT USING (true);
CREATE POLICY "unions staff insert" ON public.unions FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) AND length(btrim(name)) BETWEEN 1 AND 100 AND (bn_name IS NULL OR length(bn_name) <= 100));
CREATE POLICY "unions admin write" ON public.unions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "unions admin delete" ON public.unions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS unions_upazila_idx ON public.unions(upazila_id);

CREATE TABLE IF NOT EXISTS public.post_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  union_id uuid NOT NULL REFERENCES public.unions(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  postcode text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.post_offices TO authenticated;
GRANT SELECT ON public.post_offices TO anon;
GRANT ALL ON public.post_offices TO service_role;
ALTER TABLE public.post_offices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_offices read" ON public.post_offices FOR SELECT USING (true);
CREATE POLICY "post_offices staff insert" ON public.post_offices FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) AND length(btrim(name)) BETWEEN 1 AND 100);
CREATE POLICY "post_offices admin write" ON public.post_offices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "post_offices admin delete" ON public.post_offices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS po_union_idx ON public.post_offices(union_id);

CREATE TABLE IF NOT EXISTS public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_office_id uuid NOT NULL REFERENCES public.post_offices(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.villages TO authenticated;
GRANT SELECT ON public.villages TO anon;
GRANT ALL ON public.villages TO service_role;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "villages read" ON public.villages FOR SELECT USING (true);
CREATE POLICY "villages staff insert" ON public.villages FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) AND length(btrim(name)) BETWEEN 1 AND 100);
CREATE POLICY "villages admin write" ON public.villages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "villages admin delete" ON public.villages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS villages_po_idx ON public.villages(post_office_id);

CREATE TABLE IF NOT EXISTS public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id uuid REFERENCES public.villages(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.areas TO authenticated;
GRANT SELECT ON public.areas TO anon;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas read" ON public.areas FOR SELECT USING (true);
CREATE POLICY "areas staff insert" ON public.areas FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) AND length(btrim(name)) BETWEEN 1 AND 100);
CREATE POLICY "areas admin write" ON public.areas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "areas admin delete" ON public.areas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.roads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  name text NOT NULL,
  bn_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.roads TO authenticated;
GRANT SELECT ON public.roads TO anon;
GRANT ALL ON public.roads TO service_role;
ALTER TABLE public.roads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roads read" ON public.roads FOR SELECT USING (true);
CREATE POLICY "roads staff insert" ON public.roads FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) AND length(btrim(name)) BETWEEN 1 AND 100);
CREATE POLICY "roads admin write" ON public.roads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "roads admin delete" ON public.roads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  road_id uuid REFERENCES public.roads(id) ON DELETE CASCADE,
  name text NOT NULL,
  holding_number text,
  house_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.buildings TO authenticated;
GRANT SELECT ON public.buildings TO anon;
GRANT ALL ON public.buildings TO service_role;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buildings read" ON public.buildings FOR SELECT USING (true);
CREATE POLICY "buildings staff insert" ON public.buildings FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) AND length(btrim(name)) BETWEEN 1 AND 100 AND (holding_number IS NULL OR length(holding_number) <= 50) AND (house_number IS NULL OR length(house_number) <= 50));
CREATE POLICY "buildings admin write" ON public.buildings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "buildings admin delete" ON public.buildings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- STAFF
DO $$ BEGIN
  CREATE TYPE public.staff_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  staff_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  mobile text,
  email text,
  designation text,
  department text,
  joining_date date,
  salary numeric(12,2) NOT NULL DEFAULT 0,
  status public.staff_status NOT NULL DEFAULT 'active',
  address text,
  nid text,
  avatar_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read" ON public.staff FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "staff admin write" ON public.staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
