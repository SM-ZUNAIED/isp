import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut, Receipt, Wifi, User, Wallet, Ticket as TicketIcon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCustomerPortal } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => ({ meta: [{ title: "কাস্টমার পোর্টাল — Net Bill Pro" }] }),
  component: CustomerPortal,
});

const bn = new Intl.NumberFormat("bn-BD");
const bdt = (n: number) => `৳ ${bn.format(Math.round(n))}`;

const BILL_STATUS: Record<string, { label: string; tone: string }> = {
  paid: { label: "পরিশোধিত", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  unpaid: { label: "অপরিশোধিত", tone: "bg-rose-100 text-rose-700 border-rose-200" },
  partial: { label: "আংশিক", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  overdue: { label: "মেয়াদোত্তীর্ণ", tone: "bg-slate-200 text-slate-700 border-slate-300" },
};

function CustomerPortal() {
  const { user, signOut } = useAuth();
  const get = useServerFn(getCustomerPortal);
  const q = useQuery({ queryKey: ["customer-portal"], queryFn: () => get() });

  if (q.isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!q.data?.customer) {
    return (
      <div className="min-h-screen bg-gradient-hero grid place-items-center p-4">
        <Card className="max-w-lg text-center">
          <CardContent className="p-8 space-y-4">
            <User className="h-14 w-14 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">আপনার অ্যাকাউন্ট এখনো লিঙ্ক করা হয়নি</h2>
            <p className="text-sm text-muted-foreground">
              এই ইমেইল ({user?.email}) কোনো কাস্টমারের সাথে যুক্ত নয়। অনুগ্রহ করে ISP অফিসে যোগাযোগ করুন।
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />হোম</Link></Button>
              <Button onClick={signOut}><LogOut className="mr-2 h-4 w-4" />লগআউট</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const c = q.data.customer;
  const dueTotal = q.data.bills.reduce((s, b) => s + Number(b.due_amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-primary text-white">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-lg">{c.full_name}</div>
              <div className="text-sm opacity-90">কোড: {c.customer_code} • {c.mobile}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" asChild><Link to="/">হোম</Link></Button>
            <Button variant="secondary" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="বর্তমান প্যাকেজ" value={c.packages?.name ?? "—"}
            sub={c.packages ? `${c.packages.download_speed}/${c.packages.upload_speed} Mbps` : ""} icon={Wifi} />
          <StatCard label="মাসিক বিল" value={bdt(Number(c.monthly_bill))} icon={Wallet} />
          <StatCard label="মোট বকেয়া" value={bdt(dueTotal)} icon={Receipt}
            tone={dueTotal > 0 ? "rose" : "emerald"} />
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />বিলসমূহ</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {q.data.bills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">কোনো বিল নেই।</p>
            ) : q.data.bills.map((b) => {
              const st = BILL_STATUS[b.status];
              return (
                <div key={b.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{b.bill_number}</div>
                    <div className="font-medium">{b.billing_month?.slice(0, 7)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{bdt(Number(b.amount))}</div>
                    {Number(b.due_amount ?? 0) > 0 && (
                      <div className="text-xs text-rose-600">বকেয়া: {bdt(Number(b.due_amount))}</div>
                    )}
                  </div>
                  <Badge variant="outline" className={st.tone}>{st.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />পেমেন্ট ইতিহাস</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {q.data.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">কোনো পেমেন্ট নেই।</p>
              ) : q.data.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="font-mono text-xs">{p.receipt_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.paid_at).toLocaleDateString("bn-BD")} • {p.method}
                    </div>
                  </div>
                  <div className="font-bold">{bdt(Number(p.amount))}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TicketIcon className="h-5 w-5" />সাপোর্ট টিকেট</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {q.data.tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">কোনো টিকেট নেই।</p>
              ) : q.data.tickets.map((t) => (
                <div key={t.id} className="rounded-xl border p-3">
                  <div className="font-mono text-xs text-muted-foreground">#{t.ticket_number}</div>
                  <div className="font-medium">{t.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(t.created_at).toLocaleString("bn-BD")}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, tone,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "emerald" | "rose";
}) {
  const toneClass = tone === "rose" ? "text-rose-600" : tone === "emerald" ? "text-emerald-600" : "";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-white">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
