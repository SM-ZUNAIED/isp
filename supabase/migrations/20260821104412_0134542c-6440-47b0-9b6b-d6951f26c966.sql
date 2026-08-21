CREATE TABLE IF NOT EXISTS public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bn_name text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS job_roles_name_key ON public.job_roles (lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;

ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_roles_read" ON public.job_roles;
CREATE POLICY "job_roles_read" ON public.job_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "job_roles_write" ON public.job_roles;
CREATE POLICY "job_roles_write" ON public.job_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_job_roles_updated ON public.job_roles;
CREATE TRIGGER trg_job_roles_updated BEFORE UPDATE ON public.job_roles
FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

INSERT INTO public.job_roles (name, bn_name)
VALUES
  ('Manager','ম্যানেজার'),
  ('Technician','টেকনিশিয়ান'),
  ('Accountant','হিসাবরক্ষক'),
  ('Collector','বিল কলেক্টর'),
  ('Support Agent','সাপোর্ট এজেন্ট')
ON CONFLICT DO NOTHING;