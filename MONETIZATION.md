# Pins monetization stubs

Freemium logging + education with optional Pins Pro. **Primary LTV is the website** (220bioworx.com). Apps never sell peptides.

Publisher on stores: **220 Tech LLC** only. Bioworx is the off-app product brand.

## Feature flags

| Flag | Default | Purpose |
|---|---|---|
| `VITE_PAYWALL_ENABLED` | **false** | Soft paywall UI + soft Pro gates. Keep **off** for TestFlight free ship. |
| `VITE_BILLING_MOCK` | false | DEV/web only: purchase/restore stubs grant local `isPro`. Never on production store builds. |
| `VITE_FOUNDING_LIFETIME` | **false** | Show founding **$39.99** Pins+Pets bundle offer in soft paywall (TestFlight window). |

Set in `.env` / `.env.local` (never commit secrets):

```bash
VITE_PAYWALL_ENABLED=true
VITE_BILLING_MOCK=true   # optional local mock unlock
```

Entitlement `isPro` defaults **false** (localStorage key `pins_pro_entitlement_v1`).

## Product ID stubs (Pins)

Do **not** create these in App Store Connect or Google Play Console until Kevin approves the money gate.

| Period | Product ID | Stub price | Notes |
|---|---|---:|---|
| Monthly | `com.two20tech.pins.pro.monthly` | $4.99/mo | LOCKED 2026-09-05 |
| Annual | `com.two20tech.pins.pro.yearly` | **$49.99/yr** | **Primary** offer |
| Lifetime | `com.two20tech.pins.pro.lifetime` | $99 | |

Cross-app Pins + Pets Pro **bundle** is a Kevin **open question**.

Reserved stub IDs (do **not** create in ASC/Play until Kevin decides + money gate):

| Period | Product ID | Stub display |
|---|---|---|
| Bundle lifetime (founding TF) | `com.two20tech.bundle.pro.lifetime` | $39.99 (UI only; flag `VITE_FOUNDING_LIFETIME`, default off) |
| Bundle monthly/yearly | `com.two20tech.bundle.pro.monthly` / `.yearly` | TBD |

Pins single-app SKUs above are the locked pricing for this app.

## Free vs Pro (soft helpers)

**Free:** log doses, reminders, 1 protocol, basic recon, basic site rotation, local storage.

**Pro:** unlimited protocols, full map history, photos/labs/trends, cloud sync, export/PDF, advanced inventory.

Helpers: `canAccessFeature`, `requirePro`, `filterMapHistoryLogs` in `src/lib/billing/`. Soft only — basic logging is never hard-blocked.

## Soft paywall

- Component: `src/components/SoftPaywall.tsx`
- Shows after first successful dose log (when flag on) or when a Pro-gated action is hit
- **Continue free / Not now** always available
- Restore purchases = stub (native bridge later)
- No hard block of basic logging

## Website commerce (never in-app)

`openResearchCatalog()` → `https://220bioworx.com` (UTM-tagged). Use for “Browse research catalog” / low-inventory CTAs. **No in-app peptide checkout.**

## Billing module

`src/lib/billing/purchase.ts` — StoreKit 2 + Play Billing **interfaces + stubs** that no-op / log when native plugins are absent. Mock path behind `VITE_BILLING_MOCK`.

## Kevin money gate

- Kevin must approve **creating IAP products** in ASC + Play Console.
- No live paid launch without Kevin.
- Creating Paid Apps agreement / billing products = Kevin only.
- This PR ships **stubs + flag-off paywall** only — safe for TestFlight free.

## Do not create live IAP

No App Store Connect / Play Console product creation and no Paid Apps agreement without Kevin.


## Free vs Pro (2026-09-05)
- Free: **2 protocols**, **full map history**, log/reminders/recon/rotation/local storage
- Pro: unlimited protocols, photos/labs/trends, cloud sync, export/PDF, advanced inventory
- Monthly **$4.99**; annual $49.99; lifetime $99; founding TF bundle $39.99
- Bioworx / website catalog CTAs deferred — zero Bioworx mentions in SoftPaywall for now
