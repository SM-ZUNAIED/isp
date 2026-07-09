import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগইন — Net Bill Pro" },
      { name: "description", content: "কাস্টমার ও অ্যাডমিন লগইন পোর্টাল।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elevated">
        <h1 className="text-2xl font-bold text-center">লগইন</h1>
        <p className="mt-2 text-center text-muted-foreground">শীঘ্রই আসছে...</p>
      </div>
    </div>
  );
}
