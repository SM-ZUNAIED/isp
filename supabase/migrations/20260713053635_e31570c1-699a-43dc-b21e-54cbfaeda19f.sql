
-- inventory_items extra columns
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric(12,2) NOT NULL DEFAULT 0;

-- stock_movements extra columns
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS warehouse_id uuid,
  ADD COLUMN IF NOT EXISTS move_type text,
  ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moved_by uuid;

-- warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh read" ON public.warehouses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "wh write" ON public.warehouses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_warehouse_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_person text;

-- purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS order_date date,
  ADD COLUMN IF NOT EXISTS expected_date date,
  ADD COLUMN IF NOT EXISTS subtotal numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- incomes / expenses
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS party_name text;

-- post_offices code, buildings map url
ALTER TABLE public.post_offices ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS google_map_url text;
