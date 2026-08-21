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