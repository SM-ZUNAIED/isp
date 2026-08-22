import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/recent")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"সাম্প্রতিক কাস্টমার","en":"Recent Customers"}}
      subtitle={{"bn":"নতুন যুক্ত হওয়া কাস্টমার","en":"Recently added customers"}}
      filter="recent"
    />
  ),
});
