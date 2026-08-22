import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";

export const Route = createFileRoute("/_authenticated/reseller/packages/add")({
  component: AddPackagePage,
});

function AddPackagePage() {
  const L = useL();
  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "প্যাকেজ যোগ করুন", en: "Add Package" }}
        subtitle={{ bn: "নতুন প্যাকেজের অনুরোধ", en: "Request a new package" }}
      />
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p>
            {L({
              bn: "প্যাকেজ ও মূল্য অ্যাডমিন নির্ধারণ করেন, তাই রিসেলার প্যানেল থেকে নতুন প্যাকেজ তৈরি করা যায় না। নতুন প্যাকেজ প্রয়োজন হলে অ্যাডমিনকে জানাতে সাপোর্ট টিকিট খুলুন।",
              en: "Packages and pricing are defined by the admin, so new packages cannot be created from the reseller panel. Open a support ticket to request one.",
            })}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild><Link to="/reseller/support">{L({ bn: "সাপোর্ট টিকিট খুলুন", en: "Open support ticket" })}</Link></Button>
            <Button asChild variant="outline"><Link to="/reseller/packages">{L({ bn: "প্যাকেজ তালিকা", en: "Package list" })}</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
