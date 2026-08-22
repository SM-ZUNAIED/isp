import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/close")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"ক্লোজ কাস্টমার","en":"Closed Customers"}}
      subtitle={{"bn":"পেমেন্ট না থাকায় বন্ধ","en":"Closed for non-payment"}}
      status="no_payment"
    />
  ),
});
