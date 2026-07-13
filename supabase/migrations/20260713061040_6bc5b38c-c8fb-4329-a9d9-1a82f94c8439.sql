
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS site_title text,
  ADD COLUMN IF NOT EXISTS site_description text;

CREATE OR REPLACE FUNCTION public.public_get_landing_settings()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id', id,
    'isp_name', isp_name,
    'logo_url', logo_url,
    'hotline', hotline,
    'whatsapp', whatsapp,
    'address', address,
    'website', website,
    'email', email,
    'hero_title', hero_title,
    'hero_subtitle', hero_subtitle,
    'hero_image_url', hero_image_url,
    'about_text', about_text,
    'landing_content', landing_content,
    'site_title', site_title,
    'site_description', site_description
  )
  FROM public.settings
  ORDER BY id
  LIMIT 1;
$function$;
