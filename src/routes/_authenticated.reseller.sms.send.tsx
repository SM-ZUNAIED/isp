import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerSendSms } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/sms/send")({
  component: SendSmsPage,
});

const STATUSES = ["active", "pending", "suspended", "expired", "no_payment"] as const;

function SendSmsPage() {
  const L = useL();
  const fn = useServerFn(resellerSendSms);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all" | "status">("all");
  const [status, setStatus] = useState<string>("active");

  const m = useMutation({
    mutationFn: () => fn({ data: { message, target, status: target === "status" ? status : null } }),
    onSuccess: (r) => {
      toast.success(L({ bn: `${r.sent} টি পাঠানো হয়েছে, ${r.failed} টি ব্যর্থ`, en: `${r.sent} sent, ${r.failed} failed` }));
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "এসএমএস পাঠান", en: "Send SMS" }}
        subtitle={{ bn: "আপনার কাস্টমারদের বার্তা পাঠান", en: "Send a message to your customers" }}
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{L({ bn: "প্রাপক", en: "Recipients" })}</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as "all" | "status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{L({ bn: "সব কাস্টমার", en: "All customers" })}</SelectItem>
                  <SelectItem value="status">{L({ bn: "স্ট্যাটাস অনুযায়ী", en: "By status" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {target === "status" && (
              <div className="space-y-1.5">
                <Label>{L({ bn: "স্ট্যাটাস", en: "Status" })}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{L({ bn: "বার্তা", en: "Message" })}</Label>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={L({ bn: "{name} লিখলে কাস্টমারের নাম বসবে", en: "Use {name} to insert the customer name" })} />
            <p className="text-xs text-muted-foreground">{message.length}/600</p>
          </div>
          <Button disabled={!message.trim() || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {L({ bn: "পাঠান", en: "Send" })}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
