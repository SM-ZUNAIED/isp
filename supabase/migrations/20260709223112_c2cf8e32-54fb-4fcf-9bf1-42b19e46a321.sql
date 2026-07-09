
CREATE OR REPLACE FUNCTION public.public_get_receipt(_receipt text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  c record;
  b record;
  pkg_name text;
  isp_name text;
  hotline text;
BEGIN
  SELECT id, bill_id, customer_id, amount, method::text AS method, transaction_id, paid_at, notes
    INTO p
    FROM public.payments
   WHERE receipt_number = _receipt
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT full_name, customer_code, mobile, package_id
    INTO c
    FROM public.customers WHERE id = p.customer_id;

  SELECT bill_number, billing_month, amount AS bill_amount, due_amount, status::text AS status
    INTO b
    FROM public.bills WHERE id = p.bill_id;

  SELECT name INTO pkg_name FROM public.packages WHERE id = c.package_id;
  SELECT isp_name, hotline INTO isp_name, hotline FROM public.settings LIMIT 1;

  RETURN jsonb_build_object(
    'receipt_number', _receipt,
    'paid_at', p.paid_at,
    'amount', p.amount,
    'method', p.method,
    'transaction_id', p.transaction_id,
    'notes', p.notes,
    'customer', jsonb_build_object(
      'name', c.full_name, 'code', c.customer_code,
      'mobile', c.mobile, 'package', pkg_name
    ),
    'bill', CASE WHEN b.bill_number IS NULL THEN NULL ELSE jsonb_build_object(
      'number', b.bill_number, 'month', b.billing_month,
      'amount', b.bill_amount, 'due', b.due_amount, 'status', b.status
    ) END,
    'isp', jsonb_build_object('name', isp_name, 'hotline', hotline)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.public_get_receipt(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_get_receipt(text) TO anon, authenticated, service_role;
