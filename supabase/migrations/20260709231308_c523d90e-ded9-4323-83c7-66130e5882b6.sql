
-- Add avatar path to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_path text;

-- Storage policies: users can manage their own avatar (path prefix = auth.uid())
CREATE POLICY "Users can view own avatar"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all avatars
CREATE POLICY "Admins can view all avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));
