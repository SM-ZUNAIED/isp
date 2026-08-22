import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";

export type Bn = { bn: string; en: string };
export type Col = { key: string; label: Bn; kind?: "text" | "money" | "bool" | "badge" };

export function useL() {
  const { lang } = useI18n();
  return (b: Bn) => (lang === "en" ? b.en : b.bn);
}

export function ResellerPageHeader({ title, subtitle, actions }: { title: Bn; subtitle?: Bn; actions?: ReactNode }) {
  const L = useL();
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{L(title)}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{L(subtitle)}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ResellerDataTable({
  columns,
  rows,
  loading,
  error,
  empty,
}: {
  columns: Col[];
  rows: Array<Record<string, unknown>>;
  loading?: boolean;
  error?: unknown;
  empty?: Bn;
}) {
  const L = useL();
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        {loading ? (
          <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : error ? (
          <p className="p-6 text-destructive">{(error as Error).message}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>{columns.map((c) => <TableHead key={c.key}>{L(c.label)}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                    {L(empty ?? { bn: "কোনো তথ্য নেই", en: "No data" })}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r, i) => (
                <TableRow key={String(r.id ?? i)}>
                  {columns.map((c) => {
                    const v = r[c.key];
                    return (
                      <TableCell key={c.key} className={c.kind === "money" ? "tabular-nums" : undefined}>
                        {c.kind === "money" ? (
                          `৳${Number(v ?? 0).toLocaleString()}`
                        ) : c.kind === "bool" ? (
                          <Badge variant={v ? "default" : "secondary"}>{v ? L({ bn: "হ্যাঁ", en: "Yes" }) : L({ bn: "না", en: "No" })}</Badge>
                        ) : c.kind === "badge" ? (
                          <Badge variant="secondary">{String(v ?? "—")}</Badge>
                        ) : (
                          String(v ?? "—")
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
