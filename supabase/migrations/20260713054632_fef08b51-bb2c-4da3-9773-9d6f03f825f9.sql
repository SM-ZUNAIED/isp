
-- Tighten leads INSERT policy (no more WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND length(btrim(name)) BETWEEN 2 AND 100
    AND (message IS NULL OR length(message) <= 2000)
    AND (address IS NULL OR length(address) <= 300)
    AND (phone IS NULL OR length(phone) <= 20)
  );

-- Lock down internal SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.tg_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.leads_validate() FROM PUBLIC, anon, authenticated;
