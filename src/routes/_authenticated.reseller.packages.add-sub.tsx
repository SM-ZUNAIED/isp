import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";

export const Route = createFileRoute("/_authenticated/reseller/packages/add-sub")({
  component: AddSubPackagePage,
});

function AddSubPackagePage() {
  const L = useL();
  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "সাব প্যাকেজ যোগ করুন", en: "Add Sub Package" }}
        subtitle={{ bn: "সাব প্যাকেজের অনুরোধ", en: "Request a sub package" }}
      />
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p>
            {L({
              bn: "সাব প্যাকেজ মূল প্যাকেজের অধীনে অ্যাডমিন তৈরি করেন। প্রয়োজন হলে সাপোর্ট টিকিটে প্যাকেজের নাম, স্পিড ও মূল্য লিখে অনুরোধ পাঠান।",
              en: "Sub packages are created by the admin under a main package. Send a support ticket with the desired name, speed and price to request one.",
            })}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild><Link to="/reseller/support">{L({ bn: "সাপোর্ট টিকিট খুলুন", en: "Open support ticket" })}</Link></Button>
            <Button asChild variant="outline"><Link to="/reseller/packages/sub">{L({ bn: "সাব প্যাকেজ তালিকা", en: "Sub package list" })}</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
