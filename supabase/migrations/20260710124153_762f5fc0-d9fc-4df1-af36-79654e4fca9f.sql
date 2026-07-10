
-- Staff table
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  mobile text,
  email text,
  designation text,
  department text,
  joining_date date,
  salary numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
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

CREATE POLICY "Admins manage staff"
ON public.staff FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own record"
ON public.staff FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Auto-sync: when user_id assigned to a staff row, grant 'staff' role.
-- When user_id removed or staff deleted, revoke 'staff' role (only if not referenced by another staff row).
CREATE OR REPLACE FUNCTION public.tg_staff_sync_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'staff')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      IF OLD.user_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM public.staff WHERE user_id = OLD.user_id AND id <> OLD.id) THEN
        DELETE FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'staff';
      END IF;
      IF NEW.user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'staff')
        ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.staff WHERE user_id = OLD.user_id AND id <> OLD.id) THEN
      DELETE FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'staff';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER staff_sync_role
AFTER INSERT OR UPDATE OF user_id OR DELETE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.tg_staff_sync_role();
