import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ ACCOUNTS ============
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("accounts").select("*").order("code");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AccountInput = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  account_type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  parent_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AccountInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("accounts").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AccountInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("accounts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ JOURNAL ============
export const listJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journal_entries")
      .select("*, lines:journal_lines(id,account_id,debit,credit,memo,account:account_id(code,name))")
      .order("entry_date", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const LineInput = z.object({
  account_id: z.string().uuid(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  memo: z.string().optional().nullable(),
});

const JournalInput = z.object({
  entry_date: z.string(),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  lines: z.array(LineInput).min(2),
});

export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JournalInput.parse(d))
  .handler(async ({ context, data }) => {
    const totalD = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalC = data.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalD - totalC) > 0.01) {
      throw new Error(`Debit (${totalD}) must equal Credit (${totalC})`);
    }
    const entry_no = "JE-" + Date.now().toString(36).toUpperCase();
    const { data: entry, error } = await context.supabase
      .from("journal_entries")
      .insert({
        entry_no,
        entry_date: data.entry_date,
        description: data.description,
        reference: data.reference,
        total_amount: totalD,
        created_by: context.userId,
      })
      .select().single();
    if (error) throw new Error(error.message);
    const rows = data.lines.map((l) => ({ ...l, entry_id: entry!.id }));
    const { error: e2 } = await context.supabase.from("journal_lines").insert(rows);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const deleteJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("journal_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ REPORTS ============
export const getTrialBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: accounts } = await context.supabase.from("accounts").select("id,code,name,account_type").order("code");
    const { data: lines } = await context.supabase.from("journal_lines").select("account_id,debit,credit");
    const totals = new Map<string, { debit: number; credit: number }>();
    (lines ?? []).forEach((l) => {
      const t = totals.get(l.account_id) ?? { debit: 0, credit: 0 };
      t.debit += Number(l.debit ?? 0);
      t.credit += Number(l.credit ?? 0);
      totals.set(l.account_id, t);
    });
    return (accounts ?? []).map((a) => {
      const t = totals.get(a.id) ?? { debit: 0, credit: 0 };
      return { ...a, debit: t.debit, credit: t.credit, balance: t.debit - t.credit };
    });
  });

export const getPnL = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Simple P&L from incomes/expenses tables + journal income/expense accounts
    const [{ data: inc }, { data: exp }] = await Promise.all([
      context.supabase.from("incomes").select("category,amount,entry_date"),
      context.supabase.from("expenses").select("category,amount,entry_date"),
    ]);
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);
    const monthInc = (inc ?? []).filter((r) => String(r.entry_date).startsWith(monthKey)).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const monthExp = (exp ?? []).filter((r) => String(r.entry_date).startsWith(monthKey)).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const totalInc = (inc ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const totalExp = (exp ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const byCatInc: Record<string, number> = {};
    (inc ?? []).forEach((r) => { const k = r.category ?? "Other"; byCatInc[k] = (byCatInc[k] ?? 0) + Number(r.amount ?? 0); });
    const byCatExp: Record<string, number> = {};
    (exp ?? []).forEach((r) => { const k = r.category ?? "Other"; byCatExp[k] = (byCatExp[k] ?? 0) + Number(r.amount ?? 0); });
    return {
      month: monthKey,
      monthIncome: monthInc, monthExpense: monthExp, monthProfit: monthInc - monthExp,
      totalIncome: totalInc, totalExpense: totalExp, totalProfit: totalInc - totalExp,
      byCategoryIncome: byCatInc, byCategoryExpense: byCatExp,
    };
  });
