# Auto-sync Plan — MikroTik, OLT/ONU, Accounts, Bills+Notices

## গুরুত্বপূর্ণ বাস্তবতা (আগে পড়ুন)

আপনার সিস্টেম Cloudflare Worker (edge) এ চলে — এটা browser-এর মতো, শুধু **HTTPS/HTTP outbound** করতে পারে। এর মানে:

- **MikroTik RouterOS v7+** এর **REST API (HTTPS)** থাকলে edge থেকে সরাসরি কানেক্ট করা যাবে (router-এর **public IP + port forward** লাগবে)।
- **RouterOS v6 বা পুরনো API (port 8728 TCP socket)** — edge থেকে সরাসরি call করা **সম্ভব না**। এক্ষেত্রে একটা ছোট **on-premise agent** (আপনার অফিসের PC/VPS-এ) লাগবে যেটা router-এর সাথে কথা বলে আর Supabase-এ status push করে।
- **OLT (ZTE/Huawei/VSOL)** — সাধারণত SSH/Telnet/SNMP লাগে, edge থেকে করা যায় না। এটার জন্যও **on-premise agent** লাগবে, অথবা OLT যদি HTTP API expose করে সেটা ব্যবহার হবে।
- **SMS পাঠানো** — GatewayAPI connector আছে (already available), সেটা ব্যবহার করা হবে।

নিচের plan এই বাস্তবতা মেনে করা।

---

## Phase 1 — Bills Auto-generate + Notices (edge-only, কোনো device লাগবে না)

### Database
- `settings` table-এ ইতিমধ্যে billing config আছে; নতুন কলাম যোগ:
  - `bill_generation_day` (int, default 1) — মাসের কত তারিখে auto bill তৈরি হবে
  - `bill_due_days` (int, default 10) — bill তৈরির কত দিন পর due
  - `overdue_notice_days` (int[]) — কত দিন পর SMS reminder যাবে (e.g. `[3, 7, 15]`)
  - `auto_suspend_after_days` (int, default 30) — কত দিন overdue হলে auto suspend

### Cron endpoint (pg_cron → HTTPS)
- **`GET /api/public/cron/generate-bills`** — প্রতি রাত 00:30-এ চলবে
  - active customers-দের এই মাসের bill তৈরি করবে (duplicate check via `billing_month`)
  - `settings.monthly_bill` বা customer.package থেকে amount নেবে
- **`GET /api/public/cron/send-reminders`** — প্রতি রাত 09:00
  - unpaid/overdue bills দেখে `overdue_notice_days` অনুযায়ী SMS পাঠাবে GatewayAPI দিয়ে
  - পাঠানো log `notifications_log` টেবিলে যাবে (duplicate prevention)
- **`GET /api/public/cron/auto-suspend`** — প্রতি রাত 09:30
  - `auto_suspend_after_days` পার হওয়া customers-দের `status='suspended'` করবে
  - suspended হলে MikroTik agent সেটা পিক করবে (Phase 2)

উভয় endpoint HMAC signature দিয়ে verified হবে (`CRON_SECRET`)। pg_cron থেকে call করা হবে।

### Admin UI
- `Notices` page — manual broadcast SMS পাঠানোর form (all customers / zone-wise / individual)
- `Bills` page-এ "Generate this month's bills now" button
- `Settings` page-এ billing schedule config

---

## Phase 2 — MikroTik Auto-sync

দুইটা option:

### Option A: RouterOS v7 REST API (recommended, edge থেকে সরাসরি)
- Router-এ WebFig + REST API enable করতে হবে + public IP/DDNS + HTTPS port
- `mikrotiks` table-এ ইতিমধ্যে fields আছে (host, port, username, password)
- Server function: `syncMikrotikCustomers` — customer suspend/active status অনুযায়ী PPPoE secret enable/disable
- Cron: প্রতি 5 মিনিটে online PPPoE users fetch করে `is_online` update
- Trigger: `customers.status` UPDATE হলে database trigger + edge function call দিয়ে instant sync

### Option B: On-premise agent (যদি router public না থাকে)
- ছোট Node.js script যেটা আপনার অফিসের PC/VPS-এ চলবে
- প্রতি 30s Supabase থেকে "pending commands" fetch করবে (`mikrotik_commands` new table)
- Router-এ apply করে result Supabase-এ লিখবে
- Edge শুধু command queue-এ push করবে

**আপনি কোনটা চান সেটা confirm করতে হবে** — Router public থেকে reachable কিনা।

---

## Phase 3 — OLT/ONU Auto-sync

- OLT vendor জানতে হবে (ZTE C320/C300, Huawei MA5800, VSOL, BDCOM ইত্যাদি) — প্রতিটার আলাদা command set
- সাধারণত SSH/Telnet, edge থেকে করা যায় না → **on-premise agent বাধ্যতামূলক** (Phase 2 Option B-এর মতোই)
- Agent প্রতি 5 মিনিটে ONU list, RX signal, status fetch করে `onus` টেবিলে upsert করবে
- UI-তে signal color-coded দেখাবে (green > -25dBm, yellow -25~-27, red < -27)

---

## Phase 4 — Accounts Auto-sync

শুধু database + code, কোনো external device না:

- **Trigger `payments_after_insert`** — payment insert হলে automatic `incomes` table-এ row বসাবে (`source='bill_payment', reference_id=payment.id`)
- **Trigger `payments_after_delete`** — payment delete/refund হলে corresponding income row remove
- Admin UI Accounts page:
  - Monthly income/expense summary chart
  - Manual income/expense entry
  - Category-wise breakdown
  - Profit & loss report

---

## Recommended Execution Order (এই টার্নে যেটা করব)

সবগুলো একসাথে ~২৫০০+ লাইনের কাজ, একটা টার্নে stable-ভাবে দেওয়া কঠিন। প্রস্তাব:

**Turn 1 (এখন):** Phase 1 (Bills auto-generate + SMS reminders + auto-suspend) + Phase 4 (Accounts auto-sync trigger)
— এদুটো device ছাড়া কাজ করে, সরাসরি production-ready হবে।

**Turn 2:** Phase 2 MikroTik — আপনি router option (A বা B) confirm করার পর।

**Turn 3:** Phase 3 OLT — vendor + agent setup confirm করার পর।

---

## Decision needed

1. **Phase 1 + Phase 4 এখন শুরু করি?** (SMS-এর জন্য GatewayAPI connector already linked আছে ধরে নিচ্ছি — না থাকলে আমি link করার জন্য বলব)
2. **MikroTik router public IP আছে? RouterOS v6 না v7?** (Phase 2-এর option ঠিক করার জন্য)
3. **OLT-এর brand/model কী?**

উত্তর দিলে সেই অনুযায়ী শুরু করছি।
