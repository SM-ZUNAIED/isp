import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/online")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"অনলাইন কাস্টমার","en":"Online Customers"}}
      subtitle={{"bn":"বর্তমানে সক্রিয় সংযোগ","en":"Currently connected users"}}
      filter="online"
    />
  ),
});
