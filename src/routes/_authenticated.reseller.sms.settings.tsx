import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";

export const Route = createFileRoute("/_authenticated/reseller/sms/settings")({
  component: SmsSettingsPage,
});

function SmsSettingsPage() {
  const L = useL();
  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "এসএমএস সেটিংস", en: "SMS Settings" }}
        subtitle={{ bn: "এসএমএস সংক্রান্ত নিয়মাবলি", en: "How SMS works for your account" }}
      />
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p>{L({ bn: "• গেটওয়ে ও এপিআই কনফিগারেশন অ্যাডমিন নিয়ন্ত্রণ করেন।", en: "• The gateway and API configuration are controlled by the admin." })}</p>
          <p>{L({ bn: "• আপনি শুধু আপনার নিজের কাস্টমারদের এসএমএস পাঠাতে পারবেন।", en: "• You can only send SMS to your own customers." })}</p>
          <p>{L({ bn: "• বার্তায় {name} লিখলে কাস্টমারের নাম স্বয়ংক্রিয়ভাবে বসে যাবে।", en: "• Use {name} in a message to auto-insert the customer's name." })}</p>
          <p>{L({ bn: "• প্রতিটি পাঠানো বার্তা এসএমএস লগে সংরক্ষিত থাকে।", en: "• Every message sent is stored in the SMS log." })}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline"><Link to="/reseller/sms/send">{L({ bn: "এসএমএস পাঠান", en: "Send SMS" })}</Link></Button>
            <Button asChild variant="outline"><Link to="/reseller/sms/log">{L({ bn: "এসএমএস লগ", en: "SMS Log" })}</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
