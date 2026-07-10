
## লক্ষ্য

Landing page-এর Features, About stats, Reviews, FAQ — সব admin panel থেকে edit করা যাবে এবং save করলেই সাথে সাথে homepage-এ reflect হবে (bilingual bn/en সহ)। Hero, Contact, About text ইতিমধ্যে editable আছে।

## ডেটা স্টোরেজ

`settings.landing_content` (jsonb) ইতিমধ্যে আছে — নতুন migration লাগবে না। এই কাঠামোয় সব section store হবে:

```json
{
  "features": [{ "icon": "zap", "title_bn": "...", "title_en": "...", "desc_bn": "...", "desc_en": "..." }, ...],
  "about_stats": [{ "value": "10+", "label_bn": "বছরের অভিজ্ঞতা", "label_en": "Years of experience" }, ...],
  "reviews": [{ "name": "...", "loc_bn": "ঢাকা", "loc_en": "Dhaka", "text_bn": "...", "text_en": "..." }, ...],
  "faqs": [{ "q_bn": "...", "q_en": "...", "a_bn": "...", "a_en": "..." }, ...]
}
```

## পরিবর্তন

### 1. `src/lib/support.functions.ts`
- `SettingsInput` schema-তে `landing_content` (nested Zod object with 4 arrays) যোগ।
- `updateSettings` unchanged (already upserts everything)।

### 2. `src/lib/landing.functions.ts`
- `getLandingData` এখনই settings return করে — নিশ্চিত করব যে `landing_content` field-ও যাচ্ছে।

### 3. `src/routes/_authenticated.admin.settings.tsx`
- নতুন Tab: "Landing Content" — ভেতরে 4টি sub-section (Features, About Stats, Reviews, FAQs)।
- প্রতিটি section-এর জন্য repeatable editor: Add row, Remove row, bn/en side-by-side inputs।
- Features-এ ৬টি fixed icon (zap/shield/signal/router/headphones/award) থেকে dropdown।
- Save button একটাই — সব `landing_content` একসাথে upsert।

### 4. `src/routes/index.tsx`
- Features/Reviews/FAQ/About-stats sections হার্ডকোড translation key-এর বদলে `settings.landing_content` থেকে render।
- ভাষা অনুযায়ী `title_bn`/`title_en` pick করা।
- `landing_content` না থাকলে fallback: বর্তমান translation-ভিত্তিক default content (আগের মতোই দেখাবে)।
- Icon name → lucide component map।

### 5. Cache sync
- `updateSettings` mutation success-এ `queryClient.invalidateQueries({ queryKey: ["landing"] })` যোগ, যাতে save করলেই homepage refresh হয়।

## Out of scope
- Contact info (hotline/whatsapp/email/address) ইতিমধ্যে Settings-এ editable।
- Hero title/subtitle ইতিমধ্যে editable (গত fix-এ bn-only override হয়েছে; en-এর জন্যও `hero_title_en` চাইলে পরে যোগ করা যাবে)।
- Packages আলাদা table থেকে আসে — ওটার admin CRUD ইতিমধ্যে আছে।

Approve করলে implement শুরু করছি।
