import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/pending")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"পেন্ডিং কাস্টমার","en":"Pending Customers"}}
      subtitle={{"bn":"অনুমোদনের অপেক্ষায়","en":"Awaiting activation"}}
      status="pending"
    />
  ),
});
