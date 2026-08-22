import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/expired")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"মেয়াদোত্তীর্ণ কাস্টমার","en":"Expired Customers"}}
      subtitle={{"bn":"মেয়াদ শেষ হয়েছে","en":"Subscription expired"}}
      status="expired"
    />
  ),
});
