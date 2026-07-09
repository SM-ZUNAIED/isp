
-- Public bill lookup by customer code (SECURITY DEFINER, safe columns only)
CREATE OR REPLACE FUNCTION public.public_lookup_bill(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  b record;
  pkg_name text;
BEGIN
  SELECT id, customer_code, full_name, mobile, monthly_bill, status, package_id
    INTO c
    FROM public.customers
   WHERE upper(customer_code) = upper(_code)
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT name INTO pkg_name FROM public.packages WHERE id = c.package_id;

  SELECT id, bill_number, billing_month, amount, paid_amount, due_amount, due_date, status
    INTO b
    FROM public.bills
   WHERE customer_id = c.id
     AND status IN ('unpaid','partial','overdue')
   ORDER BY due_date ASC NULLS LAST
   LIMIT 1;

  RETURN jsonb_build_object(
    'customer', jsonb_build_object(
      'id', c.id, 'code', c.customer_code, 'name', c.full_name,
      'mobile', c.mobile, 'package', pkg_name
    ),
    'bill', CASE WHEN b.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', b.id, 'number', b.bill_number, 'month', b.billing_month,
      'amount', b.amount, 'paid', COALESCE(b.paid_amount,0),
      'due', COALESCE(b.due_amount, b.amount),
      'due_date', b.due_date, 'status', b.status
    ) END,
    'monthly_bill', COALESCE(c.monthly_bill, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.public_lookup_bill(text) FROM public;
GRANT EXECUTE ON FUNCTION public.public_lookup_bill(text) TO anon, authenticated;

-- Public bill payment submission
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
BEGIN
  IF _method NOT IN ('bkash','nagad','rocket','card','bank') THEN
    RAISE EXCEPTION 'Invalid method';
  END IF;
  IF _msisdn IS NOT NULL AND _msisdn !~ '^01[3-9][0-9]{8}$' THEN
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
  notes := 'channel:' || _method || CASE WHEN _msisdn IS NOT NULL THEN ' | msisdn:'||_msisdn ELSE '' END;

  INSERT INTO public.payments (bill_id, customer_id, amount, method, transaction_id, notes, receipt_number, received_by)
  VALUES (b.id, b.customer_id, amt, db_method::payment_method, _transaction_id, notes, receipt, NULL);

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

REVOKE ALL ON FUNCTION public.public_submit_payment(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.public_submit_payment(uuid, text, text, text) TO anon, authenticated;
