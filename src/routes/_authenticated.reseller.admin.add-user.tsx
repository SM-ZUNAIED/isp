import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResellerDataTable, ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerAdminData, resellerCreateCustomerUser } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/admin/add-user")({
  component: AddUserPage,
});

function AddUserPage() {
  const L = useL();
  const qc = useQueryClient();
  const listFn = useServerFn(resellerAdminData);
  const createFn = useServerFn(resellerCreateCustomerUser);

  const q = useQuery({ queryKey: ["reseller-admin", "users"], queryFn: () => listFn({ data: { section: "users" } }) });
  const rows = ((q.data as { rows?: Array<Record<string, unknown>> } | undefined)?.rows ?? []);

  const [customerId, setCustomerId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const m = useMutation({
    mutationFn: () => createFn({ data: { customer_id: customerId, email, password } }),
    onSuccess: () => {
      toast.success(L({ bn: "লগইন তৈরি হয়েছে", en: "Login created" }));
      setCustomerId(""); setEmail(""); setPassword("");
      qc.invalidateQueries({ queryKey: ["reseller-admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const withoutLogin = rows.filter((r) => !r.has_login);

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "ইউজার যোগ করুন", en: "Add User" }}
        subtitle={{ bn: "কাস্টমারের জন্য পোর্টাল লগইন তৈরি করুন", en: "Create a customer portal login" }}
      />
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{L({ bn: "কাস্টমার", en: "Customer" })}</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder={L({ bn: "কাস্টমার বাছুন", en: "Select customer" })} /></SelectTrigger>
              <SelectContent>
                {withoutLogin.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {String(c.customer_code)} — {String(c.full_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{L({ bn: "ইমেইল", en: "Email" })}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{L({ bn: "পাসওয়ার্ড", en: "Password" })}</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="sm:col-span-4">
            <Button disabled={!customerId || !email || password.length < 6 || m.isPending} onClick={() => m.mutate()}>
              {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {L({ bn: "লগইন তৈরি করুন", en: "Create login" })}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "কোনো কাস্টমার নেই", en: "No customers" }}
        columns={[
          { key: "customer_code", label: { bn: "ইউজার আইডি", en: "User ID" } },
          { key: "full_name", label: { bn: "নাম", en: "Name" } },
          { key: "email", label: { bn: "ইমেইল", en: "Email" } },
          { key: "mobile", label: { bn: "মোবাইল", en: "Mobile" } },
          { key: "status", label: { bn: "স্ট্যাটাস", en: "Status" }, kind: "badge" },
          { key: "has_login", label: { bn: "লগইন আছে", en: "Has Login" }, kind: "bool" },
        ]}
      />
    </div>
  );
}
