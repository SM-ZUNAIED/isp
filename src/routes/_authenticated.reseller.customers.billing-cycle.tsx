import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/billing-cycle")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"বিলিং সাইকেল পরিবর্তন","en":"Billing Cycle Change"}}
      subtitle={{"bn":"নির্বাচিত কাস্টমারদের মেয়াদ/বিলিং তারিখ বদলান","en":"Change expiry / billing date for selected customers"}}
      bulk="cycle"
    />
  ),
});
