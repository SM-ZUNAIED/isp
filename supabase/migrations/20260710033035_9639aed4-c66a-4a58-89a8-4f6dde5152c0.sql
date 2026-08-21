
DO $$
DECLARE
  new_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    'admintnex@gmail.com', crypt('Admintnex2019', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin"}'::jsonb, now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', 'admintnex@gmail.com', 'email_verified', true),
    'email', now(), now(), now());
  INSERT INTO public.user_roles (user_id, role) VALUES (new_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;
