import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, Search, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listUsers, type UserRow } from "@/lib/users.functions";
import {
  getUserPermissions, setUserPermissions,
  PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey,
} from "@/lib/permissions.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/access")({
  head: () => ({ meta: [{ title: "Access Control — Net Bill Pro" }] }),
  component: AccessPage,
});

function AccessPage() {
  const tx = useTx();
  const list = useServerFn(listUsers);
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);

  const users = useMemo(() => {
    // Access Control only applies to staff (and future manager-like roles).
    // Customers must not appear here.
    const all = (q.data ?? []).filter(
      (u) => !u.roles.includes("admin") && !u.roles.includes("customer"),
    );
    if (!search.trim()) return all;
    const s = search.toLowerCase();
    return all.filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s) ||
        (u.mobile ?? "").toLowerCase().includes(s),
    );
  }, [q.data, search]);

  useEffect(() => {
    if (!selected && users.length > 0) setSelected(users[0]);
  }, [users, selected]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" /> {tx("অ্যাক্সেস কন্ট্রোল", "Access Control")}
        </h1>
        <p className="text-muted-foreground">
          {tx(
            "প্রতিটি Staff / Customer এর জন্য পেজ-ভিত্তিক View / Edit permission সেট করুন",
            "Set page-level View / Edit permissions for each Staff / Customer",
          )}
        </p>
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : q.error ? (
        <div className="text-destructive">{(q.error as Error).message}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={tx("সার্চ করুন...", "Search...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[65vh] overflow-y-auto space-y-1">
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {tx("কোনো ইউজার নেই", "No users")}
                  </p>
                )}
                {users.map((u) => {
                  const active = selected?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={
                        "w-full text-left rounded-lg px-3 py-2 transition " +
                        (active
                          ? "bg-gradient-primary text-white shadow-soft"
                          : "hover:bg-muted")
                      }
                    >
                      <div className="font-medium truncate">{u.full_name || u.email}</div>
                      <div className={"text-xs truncate " + (active ? "text-white/80" : "text-muted-foreground")}>
                        {u.email}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant="outline"
                            className={active ? "border-white/30 text-white" : ""}
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              {selected ? (
                <PermissionsEditor user={selected} key={selected.id} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">
                  {tx("বাম দিক থেকে একজন ইউজার নির্বাচন করুন", "Select a user from the left")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PermissionsEditor({ user }: { user: UserRow }) {
  const tx = useTx();
  const qc = useQueryClient();
  const getFn = useServerFn(getUserPermissions);
  const setFn = useServerFn(setUserPermissions);

  const [state, setState] = useState<Record<PermissionKey, { can_view: boolean; can_edit: boolean }>>(
    () => Object.fromEntries(PERMISSION_KEYS.map((k) => [k, { can_view: false, can_edit: false }])) as never,
  );

  const q = useQuery({
    queryKey: ["user-permissions", user.id],
    queryFn: () => getFn({ data: { user_id: user.id } }),
  });

  useEffect(() => {
    if (!q.data) return;
    const next = Object.fromEntries(
      PERMISSION_KEYS.map((k) => [k, { can_view: false, can_edit: false }]),
    ) as Record<PermissionKey, { can_view: boolean; can_edit: boolean }>;
    q.data.forEach((r) => {
      if (PERMISSION_KEYS.includes(r.permission_key)) {
        next[r.permission_key] = { can_view: r.can_view, can_edit: r.can_edit };
      }
    });
    setState(next);
  }, [q.data]);

  const toggle = (k: PermissionKey, field: "can_view" | "can_edit", v: boolean) => {
    setState((s) => {
      const cur = { ...s[k], [field]: v };
      if (field === "can_edit" && v) cur.can_view = true;
      if (field === "can_view" && !v) cur.can_edit = false;
      return { ...s, [k]: cur };
    });
  };

  const setAll = (field: "can_view" | "can_edit", v: boolean) => {
    setState((s) => {
      const next = { ...s };
      PERMISSION_KEYS.forEach((k) => {
        const cur = { ...next[k], [field]: v };
        if (field === "can_edit" && v) cur.can_view = true;
        if (field === "can_view" && !v) cur.can_edit = false;
        next[k] = cur;
      });
      return next;
    });
  };

  const saveMut = useMutation({
    mutationFn: () => setFn({
      data: {
        user_id: user.id,
        permissions: PERMISSION_KEYS.map((k) => ({
          permission_key: k,
          can_view: state[k].can_view,
          can_edit: state[k].can_edit,
        })),
      },
    }),
    onSuccess: () => {
      toast.success(tx("Permissions সেভ হয়েছে", "Permissions saved"));
      qc.invalidateQueries({ queryKey: ["user-permissions", user.id] });
      qc.invalidateQueries({ queryKey: ["my-permissions"] });
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  if (q.isLoading) {
    return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const allView = PERMISSION_KEYS.every((k) => state[k].can_view);
  const allEdit = PERMISSION_KEYS.every((k) => state[k].can_edit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-lg">{user.full_name || user.email}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="bg-gradient-primary text-white"
        >
          {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {tx("সেভ করুন", "Save Changes")}
        </Button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tx("পেজ / সেকশন", "Page / Section")}</TableHead>
              <TableHead className="text-center w-28">
                <div>{tx("দেখা", "View")}</div>
                <button
                  type="button"
                  onClick={() => setAll("can_view", !allView)}
                  className="block mx-auto text-[10px] text-primary hover:underline"
                >{allView ? tx("সব বন্ধ", "Unselect all") : tx("সব", "Select all")}</button>
              </TableHead>
              <TableHead className="text-center w-28">
                <div>{tx("এডিট", "Edit")}</div>
                <button
                  type="button"
                  onClick={() => setAll("can_edit", !allEdit)}
                  className="block mx-auto text-[10px] text-primary hover:underline"
                >{allEdit ? tx("সব বন্ধ", "Unselect all") : tx("সব", "Select all")}</button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_KEYS.map((k) => (
              <TableRow key={k}>
                <TableCell className="font-medium">
                  {PERMISSION_LABELS[k].bn}{" "}
                  <span className="text-xs text-muted-foreground">/ {PERMISSION_LABELS[k].en}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={state[k].can_view}
                    onCheckedChange={(v) => toggle(k, "can_view", !!v)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={state[k].can_edit}
                    onCheckedChange={(v) => toggle(k, "can_edit", !!v)}
                    disabled={!state[k].can_view}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {tx(
          "View permission ছাড়া Edit সম্ভব নয়। পরিবর্তনগুলো সেভ করার পর ইউজার লগইন করলে কার্যকর হবে।",
          "Edit requires View. Changes take effect on the user's next login.",
        )}
      </p>
    </div>
  );
}