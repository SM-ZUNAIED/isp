import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { resellerNetwork } from "@/lib/reseller.functions";

type Bn = { bn: string; en: string };

export function ResellerNetworkTable({
  module,
  title,
  subtitle,
  columns,
}: {
  module: "mikrotik" | "manager" | "pop";
  title: Bn;
  subtitle: Bn;
  columns: Array<{ key: string; label: Bn; kind?: "bool" | "text" }>;
}) {
  const { lang } = useI18n();
  const L = (b: Bn) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerNetwork);
  const q = useQuery({ queryKey: ["reseller-network", module], queryFn: () => fn({ data: { module } }) });
  const rows = (q.data?.rows ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{L(title)}</h1>
        <p className="text-sm text-muted-foreground">{L(subtitle)}</p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="p-6 text-destructive">{(q.error as Error).message}</p>
          ) : (
            <Table>
              <TableHeader><TableRow>{columns.map((c) => <TableHead key={c.key}>{L(c.label)}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                      {L({ bn: "আপনার জন্য কিছু অ্যাসাইন করা হয়নি", en: "Nothing assigned to you" })}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.kind === "bool" ? (
                          <Badge variant={r[c.key] ? "default" : "secondary"}>
                            {r[c.key] ? L({ bn: "অনলাইন", en: "Online" }) : L({ bn: "অফলাইন", en: "Offline" })}
                          </Badge>
                        ) : (
                          String(r[c.key] ?? "—")
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
