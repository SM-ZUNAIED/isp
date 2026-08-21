
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.tg_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  mobile text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ ZONES ============
CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones TO authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zones public read" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Zones staff manage" ON public.zones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_zones_updated BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ PACKAGES ============
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  download_speed integer NOT NULL,
  upload_speed integer NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  setup_charge numeric(10,2) DEFAULT 0,
  description text,
  color text DEFAULT '#6366f1',
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packages public read" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Packages staff manage" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ CUSTOMERS ============
CREATE TYPE public.customer_status AS ENUM ('active', 'pending', 'suspended', 'expired');

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  mobile text NOT NULL,
  alt_mobile text,
  email text,
  nid_number text,
  photo_url text,
  nid_url text,
  address text,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  monthly_bill numeric(10,2) NOT NULL DEFAULT 0,
  connection_date date,
  expiry_date date,
  status customer_status NOT NULL DEFAULT 'pending',
  onu_serial text,
  onu_mac text,
  olt_id uuid,
  olt_port text,
  splitter_info text,
  router_info text,
  ip_address text,
  pppoe_username text UNIQUE,
  pppoe_password text,
  mikrotik_id uuid,
  notes text,
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers self read" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers self update" ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Customers staff manage" ON public.customers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_zone ON public.customers(zone_id);

-- ============ MIKROTIKS ============
CREATE TABLE public.mikrotiks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ip_address text NOT NULL,
  api_port integer DEFAULT 8728,
  username text NOT NULL,
  password text NOT NULL,
  is_online boolean DEFAULT false,
  cpu_load integer,
  ram_usage integer,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mikrotiks TO authenticated;
GRANT ALL ON public.mikrotiks TO service_role;
ALTER TABLE public.mikrotiks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mikrotiks staff manage" ON public.mikrotiks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_mikrotiks_updated BEFORE UPDATE ON public.mikrotiks FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ OLTs ============
CREATE TYPE public.olt_brand AS ENUM ('vsol', 'cdata', 'huawei', 'bdcom', 'zte', 'other');

CREATE TABLE public.olts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ip_address text NOT NULL,
  brand olt_brand NOT NULL DEFAULT 'other',
  username text,
  password text,
  pon_ports integer DEFAULT 8,
  is_online boolean DEFAULT false,
  cpu_load integer,
  ram_usage integer,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.olts TO authenticated;
GRANT ALL ON public.olts TO service_role;
ALTER TABLE public.olts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OLTs staff manage" ON public.olts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_olts_updated BEFORE UPDATE ON public.olts FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ ONUs ============
CREATE TABLE public.onus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text UNIQUE NOT NULL,
  mac_address text,
  olt_id uuid REFERENCES public.olts(id) ON DELETE SET NULL,
  pon_port text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  signal_strength numeric(6,2),
  is_online boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  last_seen_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onus TO authenticated;
GRANT ALL ON public.onus TO service_role;
ALTER TABLE public.onus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ONUs staff manage" ON public.onus FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_onus_updated BEFORE UPDATE ON public.onus FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ BILLS ============
CREATE TYPE public.bill_status AS ENUM ('paid', 'unpaid', 'partial', 'overdue');

CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  billing_month date NOT NULL,
  amount numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  late_fee numeric(10,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  due_amount numeric(10,2) GENERATED ALWAYS AS (amount + late_fee - discount - paid_amount) STORED,
  status bill_status NOT NULL DEFAULT 'unpaid',
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bills customer read own" ON public.bills FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()));
CREATE POLICY "Bills staff manage" ON public.bills FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_bills_updated BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE INDEX idx_bills_customer ON public.bills(customer_id);
CREATE INDEX idx_bills_status ON public.bills(status);

-- ============ PAYMENTS ============
CREATE TYPE public.payment_method AS ENUM ('cash', 'bkash', 'nagad', 'rocket', 'bank', 'other');

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bill_id uuid REFERENCES public.bills(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'cash',
  transaction_id text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments customer read own" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()));
CREATE POLICY "Payments staff manage" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- ============ TICKETS ============
CREATE TYPE public.ticket_status AS ENUM ('pending', 'in_progress', 'solved', 'closed');
CREATE TYPE public.ticket_category AS ENUM ('no_internet', 'slow_speed', 'payment_issue', 'router_issue', 'onu_issue', 'other');

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  category ticket_category NOT NULL DEFAULT 'other',
  subject text NOT NULL,
  description text,
  status ticket_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tickets customer own" ON public.tickets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()));
CREATE POLICY "Tickets staff manage" ON public.tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_staff boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_replies TO authenticated;
GRANT ALL ON public.ticket_replies TO service_role;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies via ticket access" ON public.ticket_replies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tickets t LEFT JOIN public.customers c ON c.id = t.customer_id WHERE t.id = ticket_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.tickets t LEFT JOIN public.customers c ON c.id = t.customer_id WHERE t.id = ticket_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')))
);

-- ============ INCOMES / EXPENSES ============
CREATE TABLE public.incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO authenticated;
GRANT ALL ON public.incomes TO service_role;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Incomes staff manage" ON public.incomes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expenses staff manage" ON public.expenses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- ============ NOTICES ============
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notices public read active" ON public.notices FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Notices staff manage" ON public.notices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE TRIGGER trg_notices_updated BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ NOTIFICATIONS LOG ============
CREATE TABLE public.notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  recipient text NOT NULL,
  message text NOT NULL,
  event_type text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  status text DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications_log TO authenticated;
GRANT ALL ON public.notifications_log TO service_role;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notif staff manage" ON public.notifications_log FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  id integer PRIMARY KEY DEFAULT 1,
  isp_name text DEFAULT 'Net Bill Pro',
  logo_url text,
  hotline text DEFAULT '01339562416',
  whatsapp text DEFAULT '01339562416',
  address text,
  website text,
  email text,
  hero_title text DEFAULT 'দ্রুতগতির ইন্টারনেট সেবা',
  hero_subtitle text DEFAULT 'আপনার ঘরে ঘরে ফাইবার ইন্টারনেট',
  hero_image_url text,
  about_text text,
  landing_content jsonb DEFAULT '{}'::jsonb,
  sms_api_config jsonb DEFAULT '{}'::jsonb,
  whatsapp_api_config jsonb DEFAULT '{}'::jsonb,
  notification_toggles jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings admin manage" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============ AUTO-CREATE PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'mobile')
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_updated_at() FROM PUBLIC, anon, authenticated;

-- ============ PUBLIC RPCs ============
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

-- ============ LEADS ============
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (
  length(btrim(name)) BETWEEN 2 AND 100
  AND phone ~ '^01[3-9][0-9]{8}$'
  AND (address IS NULL OR length(address) <= 300)
  AND (message IS NULL OR length(message) <= 1000)
  AND (package_name IS NULL OR length(package_name) <= 100)
  AND status = 'new'
);
CREATE POLICY "Staff/admin can view leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff/admin can update leads" ON public.leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Admin can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

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
  v_isp_name text;
  v_hotline text;
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
  SELECT isp_name, hotline INTO v_isp_name, v_hotline FROM public.settings LIMIT 1;

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
    'isp', jsonb_build_object('name', v_isp_name, 'hotline', v_hotline)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.public_get_receipt(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_get_receipt(text) TO anon, authenticated, service_role;

-- ============ STORAGE AVATAR POLICIES ============
CREATE POLICY "Users can view own avatar" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));
