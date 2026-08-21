import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, CalendarClock, Mic, Megaphone, Loader2, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatGrid } from "@/components/crud-manager";
import { callStats } from "@/lib/ops.functions";
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/call-center/")({
  head: () => ({ meta: [{ title: "Call Center Dashboard — Net Bill Pro" }] }),
  component: Page,
});

const LINKS = [
  { to: "/admin/call-center/ip-phones", bn: "আইপি ফোন কনফিগ", en: "IP Phone Config" },
  { to: "/admin/call-center/sip-numbers", bn: "ডাইরেক্ট SIP নাম্বার", en: "Direct SIP IP Numbers" },
  { to: "/admin/call-center/follow-ups", bn: "ফলো-আপ", en: "Follow-ups" },
  { to: "/admin/call-center/call-logs", bn: "কল লগ", en: "Call Logs" },
  { to: "/admin/call-center/voice-templates", bn: "ভয়েস টেমপ্লেট", en: "Voice Templates" },
  { to: "/admin/call-center/auto-voice-sms", bn: "অটো ভয়েস এসএমএস", en: "Auto Voice SMS" },
  { to: "/admin/call-center/reports", bn: "রিপোর্ট", en: "Reports" },
] as const;

function Page() {
  const { lang } = useI18n();
  const fetchStats = useServerFn(callStats);
  const q = useQuery({ queryKey: ["call-stats"], queryFn: () => fetchStats() });
  const nf = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US");

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;
  const s = q.data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {lang === "en" ? "Smart Call Center" : "স্মার্ট কল সেন্টার"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "en" ? "Calls, follow-ups and voice campaigns at a glance" : "কল, ফলো-আপ ও ভয়েস ক্যাম্পেইনের সারসংক্ষেপ"}
        </p>
      </div>

      <StatGrid items={[
        { label: { bn: "মোট কল", en: "Total Calls" }, value: nf.format(s.totalCalls), icon: Phone },
        { label: { bn: "আজকের কল", en: "Calls Today" }, value: nf.format(s.callsToday), icon: Clock, tone: "from-sky-500 to-sky-600" },
        { label: { bn: "ইনকামিং", en: "Incoming" }, value: nf.format(s.incoming), icon: PhoneIncoming, tone: "from-emerald-500 to-emerald-600" },
        { label: { bn: "আউটগোয়িং", en: "Outgoing" }, value: nf.format(s.outgoing), icon: PhoneOutgoing, tone: "from-indigo-500 to-indigo-600" },
        { label: { bn: "মিসড কল", en: "Missed Calls" }, value: nf.format(s.missed), icon: PhoneMissed, tone: "from-rose-500 to-rose-600" },
        { label: { bn: "মোট মিনিট", en: "Total Minutes" }, value: nf.format(s.totalMinutes), icon: Clock, tone: "from-amber-500 to-orange-500" },
        { label: { bn: "অপেক্ষমাণ ফলো-আপ", en: "Pending Follow-ups" }, value: nf.format(s.pendingFollowUps), icon: CalendarClock, tone: "from-amber-500 to-orange-500" },
        { label: { bn: "ভয়েস পাঠানো হয়েছে", en: "Voice Sent" }, value: nf.format(s.voiceSent), icon: Megaphone, tone: "from-emerald-500 to-emerald-600" },
        { label: { bn: "সক্রিয় আইপি ফোন", en: "Active IP Phones" }, value: nf.format(s.activePhones), icon: Phone, tone: "from-indigo-500 to-indigo-600" },
        { label: { bn: "সক্রিয় SIP নাম্বার", en: "Active SIP Numbers" }, value: nf.format(s.activeNumbers), icon: Phone, tone: "from-sky-500 to-sky-600" },
        { label: { bn: "ভয়েস টেমপ্লেট", en: "Voice Templates" }, value: nf.format(s.templates), icon: Mic },
        { label: { bn: "ক্যাম্পেইন", en: "Campaigns" }, value: nf.format(s.campaigns), icon: Megaphone },
      ]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">{lang === "en" ? l.en : l.bn}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
