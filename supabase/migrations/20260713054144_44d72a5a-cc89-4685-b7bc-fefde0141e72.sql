
-- 1) Restrict settings public read
DROP POLICY IF EXISTS "Settings public read" ON public.settings;

-- Safe landing settings function (only non-sensitive fields)
CREATE OR REPLACE FUNCTION public.public_get_landing_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'isp_name', isp_name,
    'logo_url', logo_url,
    'hotline', hotline,
    'whatsapp', whatsapp,
    'address', address,
    'website', website,
    'email', email,
    'hero_title', hero_title,
    'hero_subtitle', hero_subtitle,
    'hero_image_url', hero_image_url,
    'about_text', about_text,
    'landing_content', landing_content
  )
  FROM public.settings
  ORDER BY id
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.public_get_landing_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_get_landing_settings() TO anon, authenticated;

-- 2) Remove public avatar read
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

-- 3) Payments verification workflow
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS submission_ref text,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS payments_verification_status_idx ON public.payments(verification_status);
CREATE UNIQUE INDEX IF NOT EXISTS payments_submission_ref_key ON public.payments(submission_ref) WHERE submission_ref IS NOT NULL;

-- 4) Rewrite public_submit_payment: pending only, random reference, no bill update
CREATE OR REPLACE FUNCTION public.public_submit_payment(_bill_id uuid, _method text, _transaction_id text, _msisdn text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b record;
  amt numeric;
  db_method text;
  ref text;
  notes text;
  tx text;
  msi text;
BEGIN
  tx := NULLIF(btrim(COALESCE(_transaction_id,'')), '');
  msi := NULLIF(btrim(COALESCE(_msisdn,'')), '');

  IF _method NOT IN ('bkash','nagad','rocket','card','bank') THEN
    RAISE EXCEPTION 'Invalid method';
  END IF;
  IF msi IS NOT NULL AND msi !~ '^01[3-9][0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid mobile';
  END IF;
  IF tx IS NOT NULL AND length(tx) > 64 THEN
    RAISE EXCEPTION 'Invalid transaction id';
  END IF;

  SELECT id, customer_id, amount, paid_amount, due_amount, status
    INTO b FROM public.bills WHERE id = _bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found'; END IF;
  IF b.status = 'paid' THEN RAISE EXCEPTION 'Bill already paid'; END IF;

  amt := COALESCE(b.due_amount, b.amount);
  IF amt <= 0 THEN RAISE EXCEPTION 'Nothing to pay'; END IF;

  db_method := CASE WHEN _method IN ('card','bank') THEN 'other' ELSE _method END;
  ref := 'PND-' || upper(encode(gen_random_bytes(12), 'hex'));
  notes := 'channel:' || _method || CASE WHEN msi IS NOT NULL THEN ' | msisdn:'||msi ELSE '' END;

  INSERT INTO public.payments (
    bill_id, customer_id, amount, method, transaction_id, notes,
    receipt_number, received_by, verification_status, submission_ref
  ) VALUES (
    b.id, b.customer_id, amt, db_method::payment_method, tx, notes,
    NULL, NULL, 'pending', ref
  );

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'pending',
    'reference', ref,
    'amount', amt
  );
END;
$$;

-- 5) Random receipt numbers via admin verification
CREATE OR REPLACE FUNCTION public.admin_verify_payment(_payment_id uuid, _approve boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  b record;
  new_paid numeric;
  new_due numeric;
  new_status text;
  receipt text;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF p.verification_status <> 'pending' THEN
    RAISE EXCEPTION 'Payment already %', p.verification_status;
  END IF;

  IF NOT _approve THEN
    UPDATE public.payments
       SET verification_status = 'rejected',
           verified_by = auth.uid(),
           verified_at = now()
     WHERE id = p.id;
    RETURN jsonb_build_object('ok', true, 'status', 'rejected');
  END IF;

  SELECT * INTO b FROM public.bills WHERE id = p.bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found'; END IF;

  receipt := 'RCP-' || upper(encode(gen_random_bytes(16), 'hex'));

  new_paid := COALESCE(b.paid_amount,0) + p.amount;
  new_due := b.amount - new_paid;
  new_status := CASE WHEN new_due <= 0 THEN 'paid' WHEN new_paid > 0 THEN 'partial' ELSE 'unpaid' END;

  UPDATE public.bills
     SET paid_amount = new_paid,
         due_amount = GREATEST(0, new_due),
         status = new_status::bill_status
   WHERE id = b.id;

  UPDATE public.payments
     SET verification_status = 'verified',
         receipt_number = receipt,
         verified_by = auth.uid(),
         verified_at = now()
   WHERE id = p.id;

  RETURN jsonb_build_object('ok', true, 'status', 'verified', 'receipt', receipt);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_verify_payment(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, boolean) TO authenticated;

-- 6) leads validation trigger (length limits, no PII spam)
CREATE OR REPLACE FUNCTION public.leads_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS NULL OR length(btrim(NEW.name)) < 2 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Invalid name length';
  END IF;
  IF NEW.phone IS NOT NULL AND (length(NEW.phone) > 20 OR NEW.phone !~ '^[0-9+\-\s()]{6,20}$') THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF NEW.address IS NOT NULL AND length(NEW.address) > 300 THEN
    RAISE EXCEPTION 'Address too long';
  END IF;
  IF NEW.message IS NOT NULL AND length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message too long';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS leads_validate_trg ON public.leads;
CREATE TRIGGER leads_validate_trg
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_validate();
