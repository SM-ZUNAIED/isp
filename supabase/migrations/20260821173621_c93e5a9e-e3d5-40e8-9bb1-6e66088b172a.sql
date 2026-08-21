
-- ============ HR MANAGEMENT ============
CREATE TABLE public.attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  work_date date not null default current_date,
  status text not null default 'present',
  check_in time,
  check_out time,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance staff manage" ON public.attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type text not null default 'casual',
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave staff manage" ON public.leave_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.advance_salary (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  amount numeric not null default 0,
  request_date date not null default current_date,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advance_salary TO authenticated;
GRANT ALL ON public.advance_salary TO service_role;
ALTER TABLE public.advance_salary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advance staff manage" ON public.advance_salary FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER advance_salary_updated_at BEFORE UPDATE ON public.advance_salary FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.payroll (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  pay_month date not null,
  basic_salary numeric not null default 0,
  allowance numeric not null default 0,
  deduction numeric not null default 0,
  advance_deduction numeric not null default 0,
  net_salary numeric not null default 0,
  status text not null default 'unpaid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, pay_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll TO authenticated;
GRANT ALL ON public.payroll TO service_role;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll staff manage" ON public.payroll FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER payroll_updated_at BEFORE UPDATE ON public.payroll FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.salary_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  policy_type text not null default 'allowance',
  amount numeric not null default 0,
  is_percentage boolean not null default false,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_policies TO authenticated;
GRANT ALL ON public.salary_policies TO service_role;
ALTER TABLE public.salary_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary policies staff manage" ON public.salary_policies FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER salary_policies_updated_at BEFORE UPDATE ON public.salary_policies FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- ============ SMART CALL CENTER ============
CREATE TABLE public.ip_phone_configs (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  extension text,
  sip_server text,
  sip_port integer not null default 5060,
  username text,
  password text,
  assigned_staff_id uuid references public.staff(id) on delete set null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ip_phone_configs TO authenticated;
GRANT ALL ON public.ip_phone_configs TO service_role;
ALTER TABLE public.ip_phone_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipphone staff manage" ON public.ip_phone_configs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER ip_phone_configs_updated_at BEFORE UPDATE ON public.ip_phone_configs FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.sip_numbers (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  provider text,
  ip_address text,
  assigned_staff_id uuid references public.staff(id) on delete set null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sip_numbers TO authenticated;
GRANT ALL ON public.sip_numbers TO service_role;
ALTER TABLE public.sip_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sipnumbers staff manage" ON public.sip_numbers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER sip_numbers_updated_at BEFORE UPDATE ON public.sip_numbers FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  contact_name text,
  phone text not null,
  subject text,
  scheduled_at timestamptz not null default now(),
  priority text not null default 'normal',
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followups staff manage" ON public.follow_ups FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.call_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  phone text not null,
  direction text not null default 'outgoing',
  duration_sec integer not null default 0,
  outcome text not null default 'answered',
  called_at timestamptz not null default now(),
  handled_by uuid references public.staff(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calllogs staff manage" ON public.call_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

CREATE TABLE public.voice_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'bn',
  body text not null default '',
  audio_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_templates TO authenticated;
GRANT ALL ON public.voice_templates TO service_role;
ALTER TABLE public.voice_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voicetpl staff manage" ON public.voice_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER voice_templates_updated_at BEFORE UPDATE ON public.voice_templates FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.auto_voice_sms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_id uuid references public.voice_templates(id) on delete set null,
  target text not null default 'all',
  scheduled_at timestamptz,
  status text not null default 'draft',
  sent_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_voice_sms TO authenticated;
GRANT ALL ON public.auto_voice_sms TO service_role;
ALTER TABLE public.auto_voice_sms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autovoice staff manage" ON public.auto_voice_sms FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER auto_voice_sms_updated_at BEFORE UPDATE ON public.auto_voice_sms FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
