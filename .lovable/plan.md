# Pay Bill CTA — Audit + UX + aamarPay Gateway

## What exists today (audit)

**Flow:** `/pay-bill` → enter Customer Code → server fn `lookupPublicBill` (calls `public_lookup_bill` SQL) → shows invoice → pick method (bKash / Nagad / Rocket / Card / Bank) → enter mobile + TrxID → server fn `submitPublicPayment` (calls `public_submit_payment` SQL) → success card with receipt number.

**Gaps found:**
1. No real gateway — every payment is trusted from the client (customer just types any TrxID and the bill is marked paid). Admin must manually verify.
2. Weak validation — TrxID isn't format-checked; `card`/`bank` skip mobile but still land in `payments.method='other'` with no card processing at all.
3. No printable/downloadable receipt — success screen is a small card that disappears on refresh; nothing to hand a customer.
4. No way to resume — reload after submit loses the receipt.
5. Success/fail states are toast-only for errors (e.g. "Bill already paid").
6. No landing route to return to after an external gateway (`/pay-bill/success`, `/fail`, `/cancel`).

## Plan

### 1. UX / validation / receipt (no gateway dependency — ship first)
- **Zod validation** on the pay form: mobile `^01[3-9]\d{8}$`, TrxID length 6–30 alnum, bank ref non-empty. Inline field errors + red borders.
- **Printable receipt page** at `/pay-bill/receipt/$receiptNo` — server fn `getPublicReceipt(receiptNo)` returns customer name, bill#, amount, method, date, ISP name/logo/hotline. Page has a `Print` button (`window.print()`) with print-optimized CSS (hide header, A5 layout). Shareable link.
- **Success screen upgrade**: after `submitPublicPayment`, redirect to `/pay-bill/receipt/{receipt}` instead of the small inline card.
- **Clearer errors**: dedicated red panel for "Bill already paid", "Customer not found", "Network error" — not just toasts.
- **Copy-to-clipboard** for receipt number + WhatsApp share button pre-filled with receipt link.

### 2. aamarPay gateway integration
aamarPay is Bangladesh's hosted payment page — one integration gives bKash / Nagad / Rocket / Upay / all cards. Flow: we POST to their `jsonpost.php` with amount + return URLs + our `mer_txnid`, they return `payment_url`, we redirect the browser there, customer completes payment on aamarPay's page, aamarPay redirects back and separately calls our IPN.

**Secrets to collect (via `add_secret`):**
- `AAMARPAY_STORE_ID`
- `AAMARPAY_SIGNATURE_KEY`
- `AAMARPAY_MODE` (`sandbox` or `live`)

**New DB columns** on `payments` (migration): `provider text`, `provider_txn_id text`, `provider_status text`, `mer_txn_id text unique`. Existing rows keep `provider = null` (manual). Add `status text default 'pending'` if not present — check schema.

**New server function** `initiateAamarpayPayment({ bill_id })`:
- Loads bill + customer (SECURITY DEFINER RPC, no auth needed — public bill payment).
- Creates a `payments` row with `status='pending'`, `provider='aamarpay'`, unique `mer_txn_id = 'NBP-'+billId8+timestamp`.
- Calls aamarPay sandbox/live `jsonpost.php` with `store_id`, `signature_key`, `tran_id`, `amount`, `currency=BDT`, `cus_name/email/phone`, `desc`, `success_url`, `fail_url`, `cancel_url`, `type=json`.
- Returns `{ payment_url }` on success — client `window.location.href = payment_url`.

**New public server route** `/api/public/aamarpay/ipn` (POST):
- Reads form fields from aamarPay (`pay_status`, `mer_txnid`, `pg_txnid`, `amount`, `store_amount`).
- Verifies by calling aamarPay's `trxcheck/request.php` with our store_id/signature — never trusts POST body alone.
- On verified `Successful`: updates matching `payments` row + calls existing bill-settlement logic (paid_amount, due_amount, status).
- Returns `200 OK` to aamarPay.
- Wraps `supabaseAdmin` inside handler (privileged write after gateway verification).

**Return routes** (public):
- `/pay-bill/success?mer_txnid=...` — polls `getPublicPaymentStatus(mer_txnid)` up to ~10s waiting for IPN, then redirects to `/pay-bill/receipt/{receipt}` or shows "still processing".
- `/pay-bill/fail` — friendly red panel with retry link.
- `/pay-bill/cancel` — neutral panel with back-to-bill link.

**UI change**: replace bKash/Nagad/Rocket/Card tiles with a single big "Pay online (bKash / Nagad / Card)" button that calls `initiateAamarpayPayment` and redirects. Keep **Bank transfer** as a separate manual path (unchanged — admin verifies).

### 3. Order of shipping
1. Ship section 1 (validation + receipt page + better states) — no secrets needed.
2. Ask for aamarPay Store ID / Signature Key via `add_secret` (sandbox first).
3. Migration + server fn + IPN route + return routes.
4. Test end-to-end in sandbox, then flip `AAMARPAY_MODE=live`.

## Technical notes (skip if non-technical)
- IPN endpoint under `/api/public/*` because aamarPay must reach it without auth; safety comes from re-verifying with `trxcheck` before any DB write.
- `mer_txnid` must be unique per attempt so a retry after failure doesn't collide.
- Receipt page is a public route (no auth) but the URL uses the random receipt number, which is only known to whoever completed the payment — same pattern as e-ticket links.
- Existing `public_submit_payment` SQL stays for the bank-transfer manual path.

## Open items to confirm
- **aamarPay credentials** — do you have a merchant account already, or should I point you to sslcommerz.com/aamarpay signup first? For sandbox testing they issue test `store_id` / `signature_key` immediately.
- **Bank transfer** — keep as manual "submit TrxID" or remove entirely once gateway is live?
