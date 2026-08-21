GRANT SELECT ON public.areas TO anon, authenticated;
GRANT SELECT ON public.roads TO anon, authenticated;
GRANT SELECT ON public.buildings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.roads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.buildings TO authenticated;
GRANT ALL ON public.areas TO service_role;
GRANT ALL ON public.roads TO service_role;
GRANT ALL ON public.buildings TO service_role;