import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyPermissions } from "@/lib/permissions.functions";

export function usePermissions() {
  const { user } = useAuth();
  const fn = useServerFn(getMyPermissions);
  const q = useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: () => fn(),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const isAdmin = !!q.data?.isAdmin;
  const perms = q.data?.permissions ?? {};

  const canView = (key: string) => {
    if (isAdmin) return true;
    return !!perms[key]?.can_view;
  };
  const canEdit = (key: string) => {
    if (isAdmin) return true;
    return !!perms[key]?.can_edit;
  };

  return { ready: !q.isLoading, isAdmin, canView, canEdit, permissions: perms };
}