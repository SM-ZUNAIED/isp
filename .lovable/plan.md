## লক্ষ্য

Admin panel-এ একটি complete ISP ERP module chain যোগ করব — বর্তমান design language (gradient-primary, rounded-2xl cards, shadow-soft, bilingual bn/en, sidebar nav) হুবহু মেনে। ইতিমধ্যে থাকা Customers, Bills, Payments, Packages, Mikrotik, OLT, Tickets, Accounts (income/expense) unchanged থাকবে; ERP layer এদের উপর বসবে।

## নতুন Modules

### 1. HR & Payroll
- **Attendance** — daily check-in/out per staff, status (present/absent/leave/half), remarks
- **Leaves** — leave request, type (casual/sick/annual), from/to, status (pending/approved/rejected)
- **Salary** — monthly salary structure per staff (basic + allowances - deductions), auto-carry from `staff.salary`
- **Payroll runs** — month-wise payroll generation → linked expense entry auto-create

### 2. Inventory / Stock
- **Items** — catalog (router, ONU, cable, connector, etc.) with unit, reorder level
- **Warehouses** — multi-location optional (default: main)
- **Stock movements** — IN (purchase/return), OUT (deploy to customer/damage), transfer
- **Current stock view** — item × warehouse balance

### 3. Purchase & Vendors
- **Vendors** — supplier directory (name, contact, address)
- **Purchase orders** — vendor, items, qty, rate, total, status (draft/received/paid)
- **Vendor bills & payments** — link to expense ledger

### 4. Accounting / Ledger (upgrade)
- **Chart of accounts** — Assets, Liabilities, Equity, Income, Expense (seeded default tree)
- **Journal entries** — double-entry (debit/credit balanced)
- **Auto-journals** — payments, expenses, payroll, purchase bills → journal entries
- **Reports** — Trial balance, Profit & Loss, Balance sheet (basic)

## Database Schema

New tables (all in migration, RLS enabled, admin+staff manage, service_role full):

```
attendance          (staff_id, date, status, check_in, check_out, remarks)
leaves              (staff_id, type, from_date, to_date, status, reason, approved_by)
salary_structures   (staff_id, basic, allowances jsonb, deductions jsonb, effective_from)
payroll_runs        (month, status, total, generated_by)
payroll_items       (run_id, staff_id, basic, allowances, deductions, net, paid)

inventory_items     (name, sku, unit, category, reorder_level, current_stock)
warehouses          (name, location)
stock_movements     (item_id, warehouse_id, type, qty, ref_type, ref_id, notes, moved_by)

vendors             (name, contact, mobile, email, address)
purchase_orders     (vendor_id, po_number, order_date, status, total, notes)
purchase_order_items(po_id, item_id, qty, rate, amount)
vendor_bills        (vendor_id, po_id, bill_number, bill_date, amount, paid, status)

accounts            (code, name, type enum[asset,liability,equity,income,expense], parent_id)
journal_entries     (entry_date, reference, description, total, source, source_id)
journal_lines       (entry_id, account_id, debit, credit, memo)
```

Standard `id`, `created_at`, `updated_at` on all. GRANT to authenticated+service_role. RLS policies use `has_role(auth.uid(),'admin')` OR `has_role(auth.uid(),'staff')` for read/write.

Seed: default chart of accounts + default warehouse.

## Frontend

### Sidebar
বর্তমান `NAV` array-এ ERP section যোগ (grouped visually with separator label):
- HR: Attendance, Leaves, Payroll
- Inventory: Items, Stock Movements
- Purchase: Vendors, Purchase Orders
- Accounting: Chart of Accounts, Journal, Reports

### Routes (সব `_authenticated.admin.*`)
```
_authenticated.admin.hr.attendance.tsx
_authenticated.admin.hr.leaves.tsx
_authenticated.admin.hr.payroll.tsx
_authenticated.admin.inventory.items.tsx
_authenticated.admin.inventory.movements.tsx
_authenticated.admin.purchase.vendors.tsx
_authenticated.admin.purchase.orders.tsx
_authenticated.admin.accounting.chart.tsx
_authenticated.admin.accounting.journal.tsx
_authenticated.admin.accounting.reports.tsx
_authenticated.admin.erp.index.tsx        (ERP overview dashboard)
```

প্রতিটি page-এ CRUD table (search, add dialog, edit dialog, delete confirm) — বর্তমান `customers`/`packages` pattern হুবহু follow করবে (Card + Table + Dialog + toast + TanStack Query invalidate)।

### Server functions
প্রতিটি module-এর জন্য `.functions.ts`:
- `src/lib/hr.functions.ts` — attendance/leaves/salary/payroll CRUD + payroll generation
- `src/lib/inventory.functions.ts` — items/movements CRUD + stock balance
- `src/lib/purchase.functions.ts` — vendors/POs/bills CRUD
- `src/lib/accounting.functions.ts` — accounts/journals CRUD + trial balance/P&L/BS aggregation

সব `requireSupabaseAuth` middleware + role check (admin/staff)।

### i18n
`use-i18n.tsx`-এ নতুন keys (bn+en): sidebar labels, page titles, form labels, status enums, buttons।

### Design
- Existing `bg-gradient-primary`, `shadow-soft`, `rounded-2xl`, `Card`, `Table`, `Dialog`, `Badge` reuse
- ERP overview page: gradient stat cards (like admin dashboard) — total staff on leave today, low-stock items, pending POs, month-to-date P&L
- Consistent color tones: HR=indigo, Inventory=emerald, Purchase=amber, Accounting=rose

## Delivery approach (single turn)

Massive scope — এক turn-এ সব ship করব:
1. Migration (all tables + RLS + seed) — approve দরকার
2. Server functions (4 files)
3. Route files (~11 files)
4. Sidebar update + i18n keys
5. ERP overview dashboard

Approve করলে migration দিয়ে শুরু করব। শেষে typecheck রান করে verify করব।

## Out of scope (আপাতত)
- Barcode/QR scanning
- Multi-currency
- Advanced tax modules (VAT return)
- Fixed asset depreciation
- Bank reconciliation UI (data থাকবে, UI পরে)