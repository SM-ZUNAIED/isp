CREATE TABLE IF NOT EXISTS public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  business_name text,
  username text NOT NULL UNIQUE,
  email text,
  phone text,
  address text,
  status text NOT NULL DEFAULT 'active',
  opening_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 0,
  manager_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  mikrotik_id uuid REFERENCES public.mikrotiks(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  notes text,
  created_by uuid,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reseller_id, permission_key)
);

CREATE TABLE IF NOT EXISTS public.reseller_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  reseller_id uuid,
  action text NOT NULL,
  resource text,
  resource_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_reseller ON public.customers(reseller_id);
CREATE INDEX IF NOT EXISTS idx_bills_reseller ON public.bills(reseller_id);
CREATE INDEX IF NOT EXISTS idx_payments_reseller ON public.payments(reseller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reseller ON public.tickets(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_perms_reseller ON public.reseller_permissions(reseller_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resellers TO authenticated;
GRANT ALL ON public.resellers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_permissions TO authenticated;
GRANT ALL ON public.reseller_permissions TO service_role;
GRANT SELECT ON public.reseller_audit_log TO authenticated;
GRANT ALL ON public.reseller_audit_log TO service_role;

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_reseller_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.resellers WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_reseller_id() FROM anon;

CREATE POLICY "Admins manage resellers" ON public.resellers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Reseller reads own row" ON public.resellers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage reseller permissions" ON public.reseller_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Reseller reads own permissions" ON public.reseller_permissions
  FOR SELECT TO authenticated
  USING (reseller_id = public.current_reseller_id());

CREATE POLICY "Admins read audit log" ON public.reseller_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Reseller manages own customers" ON public.customers
  FOR ALL TO authenticated
  USING (reseller_id IS NOT NULL AND reseller_id = public.current_reseller_id())
  WITH CHECK (reseller_id IS NOT NULL AND reseller_id = public.current_reseller_id());

CREATE POLICY "Reseller reads own bills" ON public.bills
  FOR SELECT TO authenticated
  USING (reseller_id IS NOT NULL AND reseller_id = public.current_reseller_id());

CREATE POLICY "Reseller reads own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (reseller_id IS NOT NULL AND reseller_id = public.current_reseller_id());

CREATE POLICY "Reseller manages own tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (reseller_id IS NOT NULL AND reseller_id = public.current_reseller_id())
  WITH CHECK (reseller_id IS NOT NULL AND reseller_id = public.current_reseller_id());

CREATE TRIGGER resellers_updated_at BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER reseller_permissions_updated_at BEFORE UPDATE ON public.reseller_permissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
