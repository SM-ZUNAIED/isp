import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/active")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"একটিভ কাস্টমার","en":"Active Customers"}}
      subtitle={{"bn":"চালু সংযোগসমূহ","en":"Currently active connections"}}
      status="active"
    />
  ),
});
