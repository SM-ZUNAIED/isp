import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ================= MikroTik ================= */

export const listMikrotiks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mikrotiks")
      .select("id, name, ip_address, api_port, username, is_online, cpu_load, ram_usage, last_checked_at, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const MtInput = z.object({
  name: z.string().min(1),
  ip_address: z.string().min(1),
  api_port: z.number().int().positive().default(8728),
  username: z.string().min(1),
  password: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const createMikrotik = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MtInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("mikrotiks").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const pingMikrotik = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    // Simulated health check — real MikroTik API integration will replace this.
    const online = Math.random() > 0.15;
    const { error } = await context.supabase
      .from("mikrotiks")
      .update({
        is_online: online,
        cpu_load: Math.round(20 + Math.random() * 50),
        ram_usage: Math.round(30 + Math.random() * 40),
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { online };
  });

export const deleteMikrotik = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("mikrotiks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================= OLT ================= */

export const listOlts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("olts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const OltInput = z.object({
  name: z.string().min(1),
  ip_address: z.string().min(1),
  brand: z.enum(["vsol", "cdata", "huawei", "bdcom", "zte", "other"]).default("vsol"),
  pon_ports: z.number().int().positive().default(8),
  username: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createOlt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OltInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("olts").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteOlt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("olts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================= ONU ================= */

export const listOnus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("onus")
      .select("id, serial_number, mac_address, pon_port, signal_strength, is_online, is_enabled, last_seen_at, olts(name), customers(full_name, customer_code)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const OnuInput = z.object({
  serial_number: z.string().min(1),
  mac_address: z.string().optional().nullable(),
  pon_port: z.string().optional().nullable(),
  olt_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  signal_strength: z.number().optional().nullable(),
});

export const createOnu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OnuInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("onus").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleOnu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), is_enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("onus").update({ is_enabled: data.is_enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOnu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("onus").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOltsAndCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [ol, cu] = await Promise.all([
      context.supabase.from("olts").select("id, name").order("name"),
      context.supabase.from("customers").select("id, full_name, customer_code").order("full_name").limit(500),
    ]);
    return { olts: ol.data ?? [], customers: cu.data ?? [] };
  });
