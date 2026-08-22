import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/offline")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"অফলাইন কাস্টমার","en":"Offline Customers"}}
      subtitle={{"bn":"সংযোগ বিচ্ছিন্ন কাস্টমার","en":"Users not currently connected"}}
      filter="offline"
    />
  ),
});
