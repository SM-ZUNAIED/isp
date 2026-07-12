-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.attendance_status AS ENUM ('present','absent','leave','half_day','late'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.leave_type AS ENUM ('casual','sick','annual','unpaid','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payroll_status AS ENUM ('draft','finalized','paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.stock_move_type AS ENUM ('in','out','transfer','adjust'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.po_status AS ENUM ('draft','ordered','received','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.vendor_bill_status AS ENUM ('unpaid','partial','paid','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.account_type AS ENUM ('asset','liability','equity','income','expense'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: privileged (admin OR staff)
CREATE OR REPLACE FUNCTION public.is_privileged(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR public.has_role(_user_id,'staff')
$$;

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  check_in timestamptz,
  check_out timestamptz,
  remarks text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, date)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ LEAVES ============
CREATE TABLE public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL DEFAULT 'casual',
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text,
  status public.leave_status NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.leaves TO authenticated;
GRANT ALL ON public.leaves TO service_role;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage leaves" ON public.leaves FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER leaves_updated_at BEFORE UPDATE ON public.leaves FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ SALARY STRUCTURES ============
CREATE TABLE public.salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  basic numeric NOT NULL DEFAULT 0,
  house_rent numeric NOT NULL DEFAULT 0,
  medical numeric NOT NULL DEFAULT 0,
  transport numeric NOT NULL DEFAULT 0,
  other_allowance numeric NOT NULL DEFAULT 0,
  tax_deduction numeric NOT NULL DEFAULT 0,
  other_deduction numeric NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.salary_structures TO authenticated;
GRANT ALL ON public.salary_structures TO service_role;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage salary" ON public.salary_structures FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER salary_structures_updated_at BEFORE UPDATE ON public.salary_structures FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ PAYROLL ============
CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month date NOT NULL,
  status public.payroll_status NOT NULL DEFAULT 'draft',
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  generated_by uuid,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period_month)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage payroll runs" ON public.payroll_runs FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  basic numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_id, staff_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.payroll_items TO authenticated;
GRANT ALL ON public.payroll_items TO service_role;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage payroll items" ON public.payroll_items FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER payroll_items_updated_at BEFORE UPDATE ON public.payroll_items FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ WAREHOUSES ============
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage warehouses" ON public.warehouses FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ INVENTORY ITEMS ============
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE,
  category text,
  unit text NOT NULL DEFAULT 'pcs',
  reorder_level numeric NOT NULL DEFAULT 0,
  current_stock numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage items" ON public.inventory_items FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ STOCK MOVEMENTS ============
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  move_type public.stock_move_type NOT NULL,
  quantity numeric NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  reference_type text,
  reference_id uuid,
  notes text,
  moved_by uuid,
  moved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage stock" ON public.stock_movements FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER stock_movements_updated_at BEFORE UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Auto-update current_stock on movement
CREATE OR REPLACE FUNCTION public.tg_stock_apply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  delta numeric := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := CASE WHEN NEW.move_type = 'in' THEN NEW.quantity
                  WHEN NEW.move_type = 'out' THEN -NEW.quantity
                  WHEN NEW.move_type = 'adjust' THEN NEW.quantity
                  ELSE 0 END;
    UPDATE public.inventory_items SET current_stock = current_stock + delta WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    delta := CASE WHEN OLD.move_type = 'in' THEN -OLD.quantity
                  WHEN OLD.move_type = 'out' THEN OLD.quantity
                  WHEN OLD.move_type = 'adjust' THEN -OLD.quantity
                  ELSE 0 END;
    UPDATE public.inventory_items SET current_stock = current_stock + delta WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER stock_apply AFTER INSERT OR DELETE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.tg_stock_apply();

-- ============ VENDORS ============
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  mobile text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage vendors" ON public.vendors FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ PURCHASE ORDERS ============
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  status public.po_status NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage POs" ON public.purchase_orders FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage PO items" ON public.purchase_order_items FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER purchase_order_items_updated_at BEFORE UPDATE ON public.purchase_order_items FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.vendor_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  bill_number text NOT NULL,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status public.vendor_bill_status NOT NULL DEFAULT 'unpaid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vendor_bills TO authenticated;
GRANT ALL ON public.vendor_bills TO service_role;
ALTER TABLE public.vendor_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage vendor bills" ON public.vendor_bills FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER vendor_bills_updated_at BEFORE UPDATE ON public.vendor_bills FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ ACCOUNTING ============
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  account_type public.account_type NOT NULL,
  parent_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage accounts" ON public.accounts FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no text UNIQUE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  reference text,
  source text,
  source_id uuid,
  total_amount numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage journals" ON public.journal_entries FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff/admin manage journal lines" ON public.journal_lines FOR ALL TO authenticated USING (public.is_privileged(auth.uid())) WITH CHECK (public.is_privileged(auth.uid()));
CREATE TRIGGER journal_lines_updated_at BEFORE UPDATE ON public.journal_lines FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ SEED ============
INSERT INTO public.warehouses (name, location, is_default) VALUES ('Main Warehouse', 'Head Office', true) ON CONFLICT DO NOTHING;

INSERT INTO public.accounts (code, name, account_type) VALUES
  ('1000','Assets','asset'),
  ('1100','Cash','asset'),
  ('1200','Bank','asset'),
  ('1300','Accounts Receivable','asset'),
  ('1400','Inventory','asset'),
  ('1500','Fixed Assets','asset'),
  ('2000','Liabilities','liability'),
  ('2100','Accounts Payable','liability'),
  ('2200','Salary Payable','liability'),
  ('2300','Tax Payable','liability'),
  ('3000','Equity','equity'),
  ('3100','Owner Capital','equity'),
  ('3200','Retained Earnings','equity'),
  ('4000','Income','income'),
  ('4100','Internet Subscription','income'),
  ('4200','Installation Fee','income'),
  ('4300','Other Income','income'),
  ('5000','Expenses','expense'),
  ('5100','Salary Expense','expense'),
  ('5200','Bandwidth Cost','expense'),
  ('5300','Rent','expense'),
  ('5400','Utilities','expense'),
  ('5500','Maintenance','expense'),
  ('5600','Marketing','expense'),
  ('5700','Other Expense','expense')
ON CONFLICT (code) DO NOTHING;