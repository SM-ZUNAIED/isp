import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Printer, Copy, Share2, Wifi, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPublicReceipt } from "@/lib/pay-bill.functions";

export const Route = createFileRoute("/pay-bill/receipt/$receiptNo")({
  head: ({ params }) => ({
    meta: [
      { title: `Receipt ${params.receiptNo} — Net Bill Pro` },
      { name: "description", content: "Payment receipt for your internet bill." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReceiptPage,
});

type Receipt = Awaited<ReturnType<typeof getPublicReceipt>>;

function ReceiptPage() {
  const { receiptNo } = Route.useParams();
  const router = useRouter();
  const fetchReceipt = useServerFn(getPublicReceipt);
  const [data, setData] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReceipt({ data: { receipt_number: receiptNo } })
      .then((r) => setData(r))
      .catch((e: any) => setError(String(e?.message ?? e).includes("NOT_FOUND") ? "not_found" : "error"))
      .finally(() => setLoading(false));
  }, [receiptNo, fetchReceipt]);

  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Receipt link copied");
    } catch { toast.error("Copy failed"); }
  };

  const shareWhatsApp = () => {
    const msg = `Payment receipt ${receiptNo}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error === "not_found" || !data) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-md text-center rounded-2xl border bg-card p-8 shadow-elevated">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Receipt not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The receipt number <b>{receiptNo}</b> could not be located. Check the link or contact your ISP.
          </p>
          <Link to="/pay-bill" className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Pay Bill</Button>
          </Link>
        </div>
      </div>
    );
  }

  const paidDate = new Date(data.paid_at);
  const methodLabel = (m: string) =>
    ({ bkash: "bKash", nagad: "Nagad", rocket: "Rocket", card: "Card", bank: "Bank Transfer", other: "Other" } as Record<string, string>)[m] ?? m;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Screen-only header (hidden on print) */}
      <header className="print:hidden sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/pay-bill" className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-glow hover:brightness-110 transition-all">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyReceipt}><Copy className="h-4 w-4 mr-2" /> Copy link</Button>
            <Button variant="outline" size="sm" onClick={shareWhatsApp}><Share2 className="h-4 w-4 mr-2" /> WhatsApp</Button>
            <Button size="sm" onClick={() => window.print()} className="bg-gradient-primary text-primary-foreground"><Printer className="h-4 w-4 mr-2" /> Print</Button>
          </div>
        </div>
      </header>

      {/* Receipt */}
      <main className="container mx-auto max-w-2xl px-4 py-8 print:py-0 print:px-0 print:max-w-full">
        <article className="rounded-3xl border bg-card p-8 shadow-elevated print:shadow-none print:border-0 print:rounded-none">
          {/* Brand */}
          <div className="flex items-center justify-between border-b pb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary shadow-glow print:shadow-none">
                <Wifi className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight">{data.isp.name ?? "Net Bill Pro"}</div>
                {data.isp.hotline && <div className="text-xs text-muted-foreground">Hotline: {data.isp.hotline}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> PAID
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Receipt #</div>
              <div className="font-mono text-sm font-bold">{data.receipt_number}</div>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-6 rounded-2xl bg-primary/5 p-6 text-center print:bg-transparent print:border">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Amount Paid</div>
            <div className="mt-1 text-4xl font-extrabold text-primary">৳ {Number(data.amount).toLocaleString("en-BD")}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {paidDate.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* Details */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Row label="Customer Name" value={data.customer.name} />
            <Row label="Customer ID" value={data.customer.code} />
            <Row label="Mobile" value={data.customer.mobile} />
            <Row label="Package" value={data.customer.package ?? "—"} />
            {data.bill && <>
              <Row label="Bill Number" value={data.bill.number} />
              <Row label="Billing Month" value={data.bill.month} />
              <Row label="Bill Amount" value={`৳ ${Number(data.bill.amount).toLocaleString("en-BD")}`} />
              <Row label="Bill Status" value={data.bill.status.toUpperCase()} />
            </>}
            <Row label="Payment Method" value={methodLabel(data.method)} />
            {data.transaction_id && <Row label="Transaction ID" value={data.transaction_id} mono />}
          </dl>

          {/* Footer */}
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p className="mt-1">Thank you for your payment.</p>
          </div>
        </article>
      </main>

      <style>{`
        @media print {
          @page { size: A5; margin: 12mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
    </div>
  );
}
