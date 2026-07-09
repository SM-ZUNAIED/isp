import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pay-bill")({
  head: () => ({
    meta: [
      { title: "বিল পরিশোধ — Net Bill Pro" },
      { name: "description", content: "অনলাইনে সহজেই বিল পরিশোধ করুন।" },
    ],
  }),
  component: PayBillPage,
});

function PayBillPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elevated">
        <h1 className="text-2xl font-bold text-center">বিল পরিশোধ</h1>
        <p className="mt-2 text-center text-muted-foreground">শীঘ্রই আসছে...</p>
      </div>
    </div>
  );
}
