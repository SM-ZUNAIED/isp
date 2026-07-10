
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_count int;
  assigned_role public.app_role;
  v_full_name text;
  v_mobile text;
  v_email text;
  v_linked uuid;
  v_code text;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_mobile := NEW.raw_user_meta_data->>'mobile';
  v_email := NEW.email;

  INSERT INTO public.profiles (id, full_name, mobile)
  VALUES (NEW.id, v_full_name, v_mobile)
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

  -- Auto-link/create customer profile for customer role
  IF assigned_role = 'customer' THEN
    -- Try to link an existing customer row by mobile or email
    IF v_mobile IS NOT NULL AND length(btrim(v_mobile)) > 0 THEN
      UPDATE public.customers
        SET user_id = NEW.id,
            email = COALESCE(email, v_email)
        WHERE user_id IS NULL AND mobile = v_mobile
        RETURNING id INTO v_linked;
    END IF;

    IF v_linked IS NULL AND v_email IS NOT NULL THEN
      UPDATE public.customers
        SET user_id = NEW.id
        WHERE user_id IS NULL AND lower(email) = lower(v_email)
        RETURNING id INTO v_linked;
    END IF;

    -- If no existing customer, create one so the portal isn't empty
    IF v_linked IS NULL THEN
      v_code := 'C' || to_char(now(), 'YYMMDD') || upper(substr(replace(NEW.id::text, '-', ''), 1, 5));
      INSERT INTO public.customers (user_id, customer_code, full_name, mobile, email, status, monthly_bill)
      VALUES (
        NEW.id,
        v_code,
        v_full_name,
        COALESCE(NULLIF(btrim(v_mobile), ''), '01000000000'),
        v_email,
        'pending',
        0
      )
      ON CONFLICT (customer_code) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
