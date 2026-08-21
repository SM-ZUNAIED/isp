import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CrudManager } from "@/components/crud-manager";
import { generatePayroll } from "@/lib/ops.functions";
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/payroll")({
  head: () => ({ meta: [{ title: "Payroll Generation — HR" }] }),
  component: Page,
});

function Page() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const gen = useServerFn(generatePayroll);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const mut = useMutation({
    mutationFn: () => gen({ data: { month } }),
    onSuccess: (r) => {
      toast.success(
        lang === "en"
          ? `${r.created} payroll rows created`
          : `${r.created} টি পে-রোল তৈরি হয়েছে`,
      );
      qc.invalidateQueries({ queryKey: ["ops", "payroll"] });
      qc.invalidateQueries({ queryKey: ["hr-stats"] });
    },
    onError: (e: Error) => toast.error(lang === "en" ? "Failed" : "ব্যর্থ", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>{lang === "en" ? "Payroll Month" : "পে-রোল মাস"}</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
          </div>
          <Button className="bg-gradient-primary text-white" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {lang === "en" ? "Generate Payroll" : "পে-রোল তৈরি করুন"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {lang === "en"
              ? "Creates unpaid payroll rows for every active employee (existing rows are skipped)."
              : "প্রত্যেক সক্রিয় কর্মচারীর জন্য অপরিশোধিত পে-রোল তৈরি করে (আগে থাকলে বাদ যাবে)।"}
          </p>
        </CardContent>
      </Card>

      <CrudManager
        table="payroll"
        title={{ bn: "পে-রোল জেনারেশন", en: "Payroll Generation" }}
        subtitle={{ bn: "মাসিক বেতন হিসাব ও পরিশোধ", en: "Monthly salary calculation and payment" }}
        orderBy="pay_month"
        ascending={false}
        searchFields={["notes"]}
        fields={[
          { key: "staff_id", label: { bn: "কর্মচারী", en: "Employee" }, type: "ref", required: true,
            ref: { table: "staff", labelField: "full_name" } },
          { key: "pay_month", label: { bn: "মাস", en: "Month" }, type: "date", required: true },
          { key: "basic_salary", label: { bn: "মূল বেতন", en: "Basic" }, type: "number", prefix: "৳ " },
          { key: "allowance", label: { bn: "ভাতা", en: "Allowance" }, type: "number", prefix: "৳ " },
          { key: "deduction", label: { bn: "কর্তন", en: "Deduction" }, type: "number", prefix: "৳ " },
          { key: "advance_deduction", label: { bn: "অগ্রিম কর্তন", en: "Advance Deduction" }, type: "number", prefix: "৳ " },
          { key: "net_salary", label: { bn: "নীট বেতন", en: "Net Salary" }, type: "number", prefix: "৳ " },
          { key: "status", label: { bn: "অবস্থা", en: "Status" }, type: "select", badge: true, defaultValue: "unpaid",
            options: [
              { value: "unpaid", label: { bn: "অপরিশোধিত", en: "Unpaid" } },
              { value: "paid", label: { bn: "পরিশোধিত", en: "Paid" } },
              { value: "hold", label: { bn: "স্থগিত", en: "Hold" } },
            ] },
          { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
        ]}
      />
    </div>
  );
}
