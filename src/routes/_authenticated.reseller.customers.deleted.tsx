import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/deleted")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"ডিলিট করা কাস্টমার","en":"Deleted Customers"}}
      subtitle={{"bn":"মুছে ফেলা কাস্টমারের তালিকা","en":"Removed customer records"}}
      filter="none"
      note={{"bn":"ডিলিট করা কাস্টমার স্থায়ীভাবে মুছে যায়, তাই এখানে কিছু দেখানো হয় না।","en":"Deleted customers are permanently removed, so nothing is listed here."}}
    />
  ),
});
