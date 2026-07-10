import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches a signed URL for a logo stored in the "logos" storage bucket.
 * Accepts a storage path (preferred) or a full https URL (returned as-is).
 */
export function useLogoUrl(pathOrUrl: string | null | undefined) {
  return useQuery({
    queryKey: ["logo-url", pathOrUrl],
    queryFn: async () => {
      if (!pathOrUrl) return null;
      if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
      const { data, error } = await supabase.storage
        .from("logos")
        .createSignedUrl(pathOrUrl, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
    enabled: !!pathOrUrl,
    staleTime: 50 * 60 * 1000,
  });
}
