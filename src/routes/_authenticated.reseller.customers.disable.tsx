import { createFileRoute } from "@tanstack/react-router";
import { ResellerCustomerView } from "@/components/reseller-customer-view";

export const Route = createFileRoute("/_authenticated/reseller/customers/disable")({
  component: () => (
    <ResellerCustomerView
      title={{"bn":"ডিজেবল করুন","en":"Disable Customers"}}
      subtitle={{"bn":"একসাথে একাধিক কাস্টমার বন্ধ/চালু করুন","en":"Bulk enable or disable customers"}}
      bulk="status"
    />
  ),
});
