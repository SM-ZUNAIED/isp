import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Public bill lookup by customer code. */
export const lookupPublicBill = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ customer_code: z.string().trim().min(2).max(64) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: res, error } = await supabase.rpc("public_lookup_bill", {
      _code: data.customer_code,
    });
    if (error) throw new Error(error.message);
    if (!res) throw new Error("NOT_FOUND");
    const r = res as {
      customer: { id: string; code: string; name: string; mobile: string; package: string | null };
      bill: null | {
        id: string; number: string; month: string;
        amount: number; paid: number; due: number;
        due_date: string; status: string;
      };
      monthly_bill: number;
    };
    return r;
  });

/** Public payment submission. */
export const submitPublicPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      bill_id: z.string().uuid(),
      method: z.enum(["bkash", "nagad", "rocket", "card", "bank"]),
      transaction_id: z.string().trim().min(3).max(64).optional().nullable(),
      msisdn: z.string().trim().regex(/^01[3-9]\d{8}$/).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: res, error } = await supabase.rpc("public_submit_payment", {
      _bill_id: data.bill_id,
      _method: data.method,
      _transaction_id: data.transaction_id ?? "",
      _msisdn: data.msisdn ?? "",
    });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; receipt: string; amount: number; status: string };
  });

/** Public receipt lookup by receipt number (shareable link). */
export const getPublicReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ receipt_number: z.string().trim().min(4).max(64) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: res, error } = await supabase.rpc("public_get_receipt", {
      _receipt: data.receipt_number,
    });
    if (error) throw new Error(error.message);
    if (!res) throw new Error("NOT_FOUND");
    return res as {
      receipt_number: string;
      paid_at: string;
      amount: number;
      method: string;
      transaction_id: string | null;
      notes: string | null;
      customer: { name: string; code: string; mobile: string; package: string | null };
      bill: null | { number: string; month: string; amount: number; due: number; status: string };
      isp: { name: string | null; hotline: string | null };
    };
  });

