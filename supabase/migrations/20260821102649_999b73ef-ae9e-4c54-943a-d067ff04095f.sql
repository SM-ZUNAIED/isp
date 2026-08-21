DELETE FROM public.user_roles r
USING auth.users u
WHERE r.user_id = u.id
  AND r.role = 'customer'
  AND u.email IN ('manager@gmail.com','staff@gmail.com');