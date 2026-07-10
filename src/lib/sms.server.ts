// Server-only SMS helper. Only import from server handlers (route handlers,
// server function .handler bodies). Never import at module scope of a
// .functions.ts or component file.

export type SmsConfig = {
  provider?: string;
  url: string;
  method?: "GET" | "POST";
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body_type?: "json" | "form";
  success_contains?: string;
};

export async function sendSms(
  cfg: SmsConfig | null,
  mobile: string,
  message: string,
): Promise<{ ok: boolean; error?: string; response?: string }> {
  if (!cfg || !cfg.url) return { ok: false, error: "SMS not configured" };
  const fill = (v: string) =>
    v.replaceAll("{mobile}", mobile)
      .replaceAll("{message}", encodeURIComponent(message))
      .replaceAll("{message_raw}", message);
  const method = (cfg.method ?? "GET").toUpperCase();

  try {
    let url = fill(cfg.url);
    const init: RequestInit = { method, headers: cfg.headers ?? {} };

    if (method === "GET") {
      const qs = new URLSearchParams();
      Object.entries(cfg.params ?? {}).forEach(([k, v]) => qs.append(k, fill(v)));
      const sep = url.includes("?") ? "&" : "?";
      if (qs.toString()) url = `${url}${sep}${qs.toString()}`;
    } else {
      const filled: Record<string, string> = {};
      Object.entries(cfg.params ?? {}).forEach(([k, v]) => (filled[k] = fill(v)));
      if ((cfg.body_type ?? "json") === "form") {
        init.body = new URLSearchParams(filled).toString();
        init.headers = { "content-type": "application/x-www-form-urlencoded", ...(cfg.headers ?? {}) };
      } else {
        init.body = JSON.stringify(filled);
        init.headers = { "content-type": "application/json", ...(cfg.headers ?? {}) };
      }
    }

    const res = await fetch(url, init);
    const text = await res.text();
    const ok = res.ok && (!cfg.success_contains || text.includes(cfg.success_contains));
    return { ok, error: ok ? undefined : `http ${res.status}: ${text.slice(0, 120)}`, response: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
