# Changelog

All notable changes to **Pins** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

---

## Unreleased — Apple review auth (build 18)

- Sign in with Apple via the existing Supabase Apple provider and the same native OAuth deep link as Google (`com.two20tech.pins://auth/callback`). No Apple private key in the app.
- Continue without an account for local tracker features (map, schedule, inventory, calculator)
- Settings: permanent account deletion with typed confirmation (`delete_own_account` removes `auth.users`; not a deactivation)
- SoftPaywall OFF always
- Marketing version 1.0.1; iOS `CURRENT_PROJECT_VERSION` 18; Android `versionCode` 18

---

## Unreleased — KLOW recon dose units (build 17)

- Fix KLOW-style blend dose units: inventory now takes **vial peptide amount** + **recon volume (ml)** and derives concentration (amount ÷ ml), matching Recon Calculator
- `doseVolumeMl` prefers `vialAmount` + `reconVolumeMl` over a raw concentration that users confuse with vial totals
- Blend mass components auto-sum into vial amount; `resolveInventoryConcentration` uses sum ÷ volume so wrongly stored conc=80 @ 3ml still draws **15U** for a 4mg dose (not 5U)
- SoftPaywall OFF always
- iOS `CURRENT_PROJECT_VERSION` 17; Android `versionCode` 17

---

## Unreleased — Kevin GO SoftPaywall OFF (build 16)

- Ad-hoc shot compound can be any name: pick from inventory or type free-text (save is not inventory-gated)
- Inventory items are fully editable, including time of day
- Time-of-day helper: `Used for the calendar and shot-due reminders. Not defaulted to 8:00 AM.`
- Calendar and shot-due reminders use the chosen clock time (custom HH:mm, not stuck at 08:00 / 9:00 PM)
- SoftPaywall OFF always
- iOS `CURRENT_PROJECT_VERSION` 16; Android `versionCode` 16

---

## [1.0.1] — 2026-07-09

Current production build (`main` @ `35f6b07`). Deployed at [pins-app.vercel.app](https://pins-app.vercel.app).

### Highlights

- **Body map as home** — visual pin placement is the primary landing screen
- **Multi-vial inventory** — groups, reconstitution, auto-depletion, and next-bottle promotion
- **Quick log** — one-tap logging from the bottom nav and body map
- **Local-first security** — AES-256-GCM storage, optional passphrase, Zod validation
- **Beta auth** — Supabase email/password + Google; minimal profile (age range, gender only)

### Added

#### Body map & logging
- Front/back anatomical body map with pin placement by injection site
- Pin recency colors (recent / caution / older)
- Compound filter tabs on the body map
- Prefill injection logger from selected compound tab + site
- Injection dates on mobile pins and in the quick-log popup
- Quick log flow from bottom nav (+) and map taps
- Tuned site coordinates (shoulders, abs tiers, flanks, wrists, glutes, quads, back knees/ankles)

#### Inventory
- Multi-vial groups per compound
- Reconstitution dates and reconstitute controls
- Vial collapse for extra bottles on a compound card
- FIFO active-vial selection for volume deduction
- Auto-remove depleted vials and promote the next bottle on the card
- Delete compound with confirmation and cascade schedule cleanup
- Bottom nav label: **Inventory** (formerly “Vials”)

#### Schedule & calculator
- Weekly dose schedule / calendar
- Schedule shot locations
- ICS and text schedule export
- Peptide reconstitution calculator
- Swipeable calculator slide on the bottom navigation

#### Security & privacy
- AES-256-GCM encrypted local storage (`pins_secure_v1`)
- Device-bound encryption by default; optional passphrase lock
- PBKDF2 key derivation
- Zod schemas on store mutations
- Automatic migration from legacy plaintext `pins_data`
- Sync envelope scaffolding for future E2E encrypted sync (stub adapter only — no cloud backup yet)

#### Auth & onboarding (beta)
- Supabase Auth (email/password + Google)
- Onboarding profile: age range + gender only (aggregate stats)
- Auth callback with PKCE code exchange for email confirmation
- Profiles table + hardened RLS (`supabase/schema.sql`)

#### App shell & PWA
- Routes: Map (home), Schedule, Inventory, Calculator, Dashboard (still available at `/dashboard`)
- Bottom nav: Quick Log · Map · Schedule · Inventory · swipe for Calculator
- PWA manifest and app icons (installable home-screen app)
- Dashboard: streak, today’s protocol, low-inventory alerts, recent pins, security settings

#### Deploy & tooling
- Vercel SPA config (`vercel.json`: `dist` output, rewrites, cache headers)
- Build pipeline verifies public assets and `dist` before success
- Verbose build logs for deploy debugging
- README with setup, privacy, and security documentation

### Fixed

- Email confirmation callback: exchange PKCE code and redirect home
- Profile save errors and Supabase RLS policy hardening
- Broken Vercel builds after BodyMap / nav changes (restore + redeploy)
- Vercel `dist` / output-directory detection
- Supabase client setup and auth page config checks

### Known limitations

- **No formal GitHub Release tags** prior to this changelog; package version is `1.0.1`
- **E2E cloud sync / backup** is not enabled (local-first only)
- **Dashboard** remains in the app at `/dashboard` but is not on the primary bottom nav
- Health data stays on-device; servers only receive minimal beta profile fields at signup

### Upgrade notes

- Existing local data encrypted with `pins_secure_v1` continues to load as-is
- Legacy `pins_data` plaintext (if any) migrates on first load after security bootstrap
- Supabase projects need `supabase/schema.sql` applied and auth redirect URLs set for `/auth/callback`

---

## [1.0.0] — 2026-07 (initial)

Initial beta import and foundation (collapsed for history):

- Local-first Pins beta from Replit export
- Core pages: body map, inventory, schedule, calculator, dashboard
- Security foundation (crypto, storage, security gate)
- Supabase auth scaffold and PWA support
- First README and security documentation

[1.0.1]: https://github.com/Kdpomaski/Pins-App/compare/06a8a39...35f6b07
[1.0.0]: https://github.com/Kdpomaski/Pins-App/commit/06a8a39
