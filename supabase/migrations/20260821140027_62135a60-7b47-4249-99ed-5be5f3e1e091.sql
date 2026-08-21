ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.post_offices ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS google_map_url text;

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

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','zones','packages','customers','mikrotiks','olts','onus','bills','payments','tickets','ticket_replies','incomes','expenses','notices','notifications_log','leads','staff','villages','unions','post_offices','areas','roads','buildings','job_roles']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' manager manage', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''manager'')) WITH CHECK (public.has_role(auth.uid(), ''manager''))', t || ' manager manage', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

DO $$
DECLARE
  table_record record;
  sequence_record record;
BEGIN
  FOR table_record IN
    SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I.%I TO authenticated', table_record.schemaname, table_record.tablename);
    EXECUTE format('GRANT ALL ON TABLE %I.%I TO service_role', table_record.schemaname, table_record.tablename);
  END LOOP;

  FOR sequence_record IN
    SELECT sequence_schema, sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I.%I TO authenticated', sequence_record.sequence_schema, sequence_record.sequence_name);
    EXECUTE format('GRANT ALL ON SEQUENCE %I.%I TO service_role', sequence_record.sequence_schema, sequence_record.sequence_name);
  END LOOP;
END
$$;

REVOKE ALL ON FUNCTION public.admin_verify_payment(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, boolean) TO authenticated, service_role;