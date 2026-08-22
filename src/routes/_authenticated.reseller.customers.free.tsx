import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/free")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"ফ্রি কাস্টমার","en":"Free Customers"}}
      subtitle={{"bn":"মাসিক বিল শূন্য","en":"Zero monthly bill"}}
      filter="free"
    />
  ),
});
