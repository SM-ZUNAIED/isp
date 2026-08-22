import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reseller/customers/add")({
  beforeLoad: () => {
    throw redirect({ to: "/reseller/customers" });
  },
});
