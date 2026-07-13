## Bulk Customer Import feature

Admin > Customers পেজে একটি **"Bulk Import"** বাটন যোগ করব। বাটনে click করলে একটি dialog খুলবে যেখানে আপনি customer list plain text হিসেবে paste করতে পারবেন। System সেটি parse করে database-এ automatically add করবে।

### Input format

প্রতিটি customer এক লাইনে, comma বা tab দিয়ে separated:

```
User ID, Name, Package Name
C001, Rahim Uddin, 10 Mbps
C002, Karim Ali, 20 Mbps
C003, Jamal Hossain, 5 Mbps
```

- **User ID** (customer_code) — required
- **Name** (full_name) — required
- **Package Name** — required, existing package-এর নামের সাথে match করতে হবে (case-insensitive)

Header row (`User ID, Name, Package`) থাকলে auto-detect করে skip হবে।

### Behavior

- প্রতিটি row-এর package name দেখে matching `package_id` এবং সেই package-এর `monthly_price` লোড করবে → `monthly_bill` হিসেবে auto-set হবে (আগের feature অনুযায়ী)।
- **Mobile** field required না — bulk import-এ empty placeholder দিয়ে insert হবে, পরে edit করে দেওয়া যাবে।
- Status default `pending`।

### Duplicate handling (skip)

Import করার আগে existing `customer_code` list এর সাথে match করে duplicate rows skip হবে।

### Result summary

Import শেষে toast/summary দেখাবে:
- ✅ Added: N
- ⏭️ Skipped (duplicate): N
- ⚠️ Failed (invalid package / missing field): N — সাথে line number ও error reason

### Technical details

1. **New server function** `bulkImportCustomers` in `src/lib/customers.functions.ts`:
   - Input: `{ rows: Array<{ customer_code, full_name, package_name }> }`
   - Fetches all packages + existing customer_codes once
   - Maps package names → id + monthly_price
   - Filters duplicates
   - Bulk inserts via single `supabase.from("customers").insert([...])`
   - Returns `{ added, skipped, failed: [{ line, reason }] }`

2. **UI component** — new "Bulk Import" dialog in `src/routes/_authenticated.admin.customers.tsx`:
   - Textarea for pasting list
   - Preview parsed rows before submitting
   - Submit → call server fn → show result summary
   - On success invalidate customers query

3. Customer_code এ unique constraint না থাকলে duplicate check শুধু pre-import filter দিয়েই হবে (schema change লাগবে না)।

### Files to change

- `src/lib/customers.functions.ts` — add `bulkImportCustomers` server fn
- `src/routes/_authenticated.admin.customers.tsx` — add Bulk Import button + dialog UI

কোনো database schema change লাগবে না।