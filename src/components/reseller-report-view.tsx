import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResellerDataTable, ResellerPageHeader, useL, type Bn, type Col } from "@/components/reseller-data-table";
import { resellerReport } from "@/lib/reseller-extra.functions";

type ReportKey =
  | "bill_generate" | "bill_sheet" | "btrc_export" | "due_customers"
  | "manager_balance_log" | "manager_recharge" | "otc" | "payment_history"
  | "permanent_discount" | "s_manager_balance_log" | "s_manager_recharge" | "money_receipt";

export function ResellerReportView({
  reportKey,
  title,
  subtitle,
  columns,
}: {
  reportKey: ReportKey;
  title: Bn;
  subtitle?: Bn;
  columns: Col[];
}) {
  const L = useL();
  const fn = useServerFn(resellerReport);
  const q = useQuery({ queryKey: ["reseller-report", reportKey], queryFn: () => fn({ data: { key: reportKey } }) });
  const [term, setTerm] = useState("");

  const rows = useMemo(() => {
    const all = ((q.data as { rows?: Array<Record<string, unknown>> } | undefined)?.rows ?? []) as Array<Record<string, unknown>>;
    if (!term.trim()) return all;
    const t = term.toLowerCase();
    return all.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(t)));
  }, [q.data, term]);

  const exportCsv = () => {
    const header = columns.map((c) => c.label.en).join(",");
    const body = rows
      .map((r) => columns.map((c) => `"${String(r[c.key] ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-56 pl-8" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={L({ bn: "খুঁজুন", en: "Search" })} />
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
              <Download className="mr-2 h-4 w-4" />{L({ bn: "সিএসভি", en: "CSV" })}
            </Button>
          </>
        }
      />
      <ResellerDataTable columns={columns} rows={rows} loading={q.isLoading} error={q.error} />
    </div>
  );
}
