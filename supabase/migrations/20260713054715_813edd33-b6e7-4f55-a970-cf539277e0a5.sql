
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['unions','post_offices','villages','areas','roads','buildings'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' insert auth', t);
    EXECUTE format($f$
      CREATE POLICY "%s insert staff" ON public.%I
      FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
    $f$, t, t);
  END LOOP;
END $$;
