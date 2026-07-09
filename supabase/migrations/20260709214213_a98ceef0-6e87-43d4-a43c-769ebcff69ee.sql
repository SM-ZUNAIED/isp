
CREATE OR REPLACE FUNCTION public.public_submit_payment(
  _bill_id uuid,
  _method text,
  _transaction_id text,
  _msisdn text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b record;
  amt numeric;
  db_method text;
  receipt text;
  new_paid numeric;
  new_due numeric;
  new_status text;
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

  SELECT id, customer_id, amount, paid_amount, due_amount, status
    INTO b
    FROM public.bills WHERE id = _bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found'; END IF;
  IF b.status = 'paid' THEN RAISE EXCEPTION 'Bill already paid'; END IF;

  amt := COALESCE(b.due_amount, b.amount);
  IF amt <= 0 THEN RAISE EXCEPTION 'Nothing to pay'; END IF;

  db_method := CASE WHEN _method IN ('card','bank') THEN 'other' ELSE _method END;
  receipt := 'RCP-' || upper(to_hex(floor(extract(epoch from now())*1000)::bigint));
  notes := 'channel:' || _method || CASE WHEN msi IS NOT NULL THEN ' | msisdn:'||msi ELSE '' END;

  INSERT INTO public.payments (bill_id, customer_id, amount, method, transaction_id, notes, receipt_number, received_by)
  VALUES (b.id, b.customer_id, amt, db_method::payment_method, tx, notes, receipt, NULL);

  new_paid := COALESCE(b.paid_amount,0) + amt;
  new_due := b.amount - new_paid;
  new_status := CASE WHEN new_due <= 0 THEN 'paid' WHEN new_paid > 0 THEN 'partial' ELSE 'unpaid' END;

  UPDATE public.bills
     SET paid_amount = new_paid,
         due_amount = GREATEST(0, new_due),
         status = new_status::bill_status
   WHERE id = b.id;

  RETURN jsonb_build_object('ok', true, 'receipt', receipt, 'amount', amt, 'status', new_status);
END;
$$;
