import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/package-change")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"প্যাকেজ পরিবর্তন","en":"Package Change"}}
      subtitle={{"bn":"নির্বাচিত কাস্টমারদের প্যাকেজ বদলান","en":"Change package for selected customers"}}
      bulk="package"
    />
  ),
});
