import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerImportCustomers } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/customers/import")({
  component: ImportPage,
});

function ImportPage() {
  const L = useL();
  const qc = useQueryClient();
  const fn = useServerFn(resellerImportCustomers);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number; skipped_codes: string[] } | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { text } }),
    onSuccess: (r) => {
      setResult(r);
      toast.success(L({ bn: `${r.created} জন যুক্ত হয়েছে, ${r.skipped} জন বাদ`, en: `${r.created} imported, ${r.skipped} skipped` }));
      qc.invalidateQueries({ queryKey: ["reseller-customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "কাস্টমার ইমপোর্ট", en: "Import Customers" }}
        subtitle={{ bn: "তালিকা পেস্ট করে একসাথে অনেক কাস্টমার যোগ করুন", en: "Paste a list to add many customers at once" }}
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>{L({ bn: "ফরম্যাট: ইউজার আইডি, নাম, প্যাকেজ, মোবাইল (প্রতি লাইনে একজন)", en: "Format: User ID, Name, Package, Mobile (one per line)" })}</Label>
            <Textarea
              rows={12}
              className="font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"ne_raju, Raju, 15Mbps, 01700000000\nne_karim, Karim, 20Mbps, 01800000000"}
            />
            <p className="text-xs text-muted-foreground">
              {L({ bn: "একই ইউজার আইডি থাকলে সেটি বাদ দেওয়া হবে। নতুন কাস্টমার একটিভ হিসেবে যুক্ত হবে।", en: "Duplicate user IDs are skipped. New customers are added as active." })}
            </p>
          </div>
          <Button disabled={!text.trim() || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {L({ bn: "ইমপোর্ট করুন", en: "Import" })}
          </Button>
          {result && (
            <div className="rounded-md border p-3 text-sm">
              <p>{L({ bn: "যুক্ত হয়েছে", en: "Imported" })}: <strong>{result.created}</strong></p>
              <p>{L({ bn: "বাদ পড়েছে", en: "Skipped" })}: <strong>{result.skipped}</strong></p>
              {result.skipped_codes.length > 0 && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">{result.skipped_codes.join(", ")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
