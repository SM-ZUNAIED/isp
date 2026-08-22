import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/deactivated")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"নিষ্ক্রিয় কাস্টমার","en":"Deactivated Customers"}}
      subtitle={{"bn":"সাসপেন্ড করা সংযোগ","en":"Suspended connections"}}
      status="suspended"
    />
  ),
});
