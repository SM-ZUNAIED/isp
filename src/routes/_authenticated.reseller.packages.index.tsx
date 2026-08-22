import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { resellerPackages } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/packages/")({
  component: ResellerPackagesPage,
});

function ResellerPackagesPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerPackages);
  const q = useQuery({ queryKey: ["reseller-packages"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <p className="text-destructive">{(q.error as Error).message}</p>;

  const rows = (q.data ?? []) as Array<Record<string, unknown>>;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{L({ bn: "প্যাকেজ", en: "Packages" })}</h1>
        <p className="text-sm text-muted-foreground">
          {L({ bn: "অ্যাডমিন-নির্ধারিত প্যাকেজ তালিকা (শুধু ব্যবহারযোগ্য)", en: "Admin-defined packages available to you" })}
        </p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L({ bn: "নাম", en: "Name" })}</TableHead>
                <TableHead>{L({ bn: "স্পিড", en: "Speed" })}</TableHead>
                <TableHead>{L({ bn: "মাসিক মূল্য", en: "Monthly Price" })}</TableHead>
                <TableHead>{L({ bn: "সেটআপ চার্জ", en: "Setup" })}</TableHead>
                <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={String(p.id)}>
                  <TableCell className="font-medium">{String(p.name)}</TableCell>
                  <TableCell>{String(p.download_speed)}/{String(p.upload_speed)} Mbps</TableCell>
                  <TableCell>৳{Number(p.monthly_price ?? 0).toLocaleString()}</TableCell>
                  <TableCell>৳{Number(p.setup_charge ?? 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? L({ bn: "সক্রিয়", en: "Active" }) : L({ bn: "বন্ধ", en: "Inactive" })}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
