
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS bill_generation_day int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bill_due_days int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS overdue_notice_days int[] NOT NULL DEFAULT ARRAY[3,7,15]::int[],
  ADD COLUMN IF NOT EXISTS auto_suspend_after_days int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS auto_billing_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS reference_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS incomes_payment_ref_uidx
  ON public.incomes(reference_id) WHERE source = 'bill_payment';

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS reference_id uuid;

CREATE OR REPLACE FUNCTION public.tg_payment_to_income()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.incomes (category, amount, description, entry_date, created_by, source, reference_id)
    VALUES (
      'Bill Payment',
      NEW.amount,
      COALESCE('Receipt ' || NEW.receipt_number, 'Payment'),
      COALESCE(NEW.paid_at::date, CURRENT_DATE),
      NEW.received_by,
      'bill_payment',
      NEW.id
    )
    ON CONFLICT (reference_id) WHERE source = 'bill_payment' DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.incomes WHERE reference_id = OLD.id AND source = 'bill_payment';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_income_ins ON public.payments;
CREATE TRIGGER trg_payments_income_ins
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.tg_payment_to_income();

DROP TRIGGER IF EXISTS trg_payments_income_del ON public.payments;
CREATE TRIGGER trg_payments_income_del
AFTER DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.tg_payment_to_income();

INSERT INTO public.incomes (category, amount, description, entry_date, created_by, source, reference_id)
SELECT 'Bill Payment', p.amount,
       COALESCE('Receipt ' || p.receipt_number, 'Payment'),
       COALESCE(p.paid_at::date, CURRENT_DATE),
       p.received_by, 'bill_payment', p.id
FROM public.payments p
ON CONFLICT (reference_id) WHERE source = 'bill_payment' DO NOTHING;
