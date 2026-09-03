# Fix Google login (401 invalid_client)

Supabase project `ucijobfqdwkqhdqdffno` is currently sending Google this Client ID:

```
Pins.App
```

That is an **app name**, not a Google OAuth client. Google then returns **401: The OAuth client was not found**.

A real Client ID looks like:

```
123456789-abc.apps.googleusercontent.com
```

Code cannot invent this credential. **Kevin** must create a Google Cloud **Web application** client and paste the Client ID + Secret into Supabase.

Email/password login is unaffected and should stay the primary sign-in path until that paste is done.

Vite dev port is **5173** (`vite.config.ts` default `PORT ?? 5173`; README: `http://localhost:5173`).

## 1. Create the Google Cloud Web client

Open: https://console.cloud.google.com/auth/clients/create

1. Application type: **Web application** (not iOS, not Android, not Desktop)
2. Name: `Pins`
3. **Authorized JavaScript origins**
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - `https://pins-app.vercel.app`
4. **Authorized redirect URIs** (this must be exact — Google talks to Supabase, not to Vercel)
   - `https://ucijobfqdwkqhdqdffno.supabase.co/auth/v1/callback`
5. Create → copy **Client ID** and **Client Secret**

If Google asks you to configure a consent screen first: User type **External**, app name **Pins**, then add yourself as a test user.

## 2. Paste it into Supabase (this is the actual 401 fix)

Open: https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/providers

1. Expand **Google**
2. Enable it
3. **Replace** Client ID (`Pins.App`) with the Google Cloud Web Client ID
4. Paste Client Secret
5. Save

No app redeploy is required after this paste. Reload https://pins-app.vercel.app and **Continue with Google** should leave the disabled/misconfigured state.

## 3. Site URL and redirect URLs (Vercel + local)

Open: https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/url-configuration

- **Site URL:** `https://pins-app.vercel.app`
- **Redirect URLs**, add:
  - `https://pins-app.vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback`
  - `http://127.0.0.1:5173/auth/callback`

Then try **Continue with Google** on https://pins-app.vercel.app and on http://localhost:5173 / http://127.0.0.1:5173.

## Capacitor (native wrappers)

iOS/Android projects already exist (`com.two20tech.pins` in `capacitor.config.ts`). This 401 is a **Supabase Google Client ID** problem; it is the same on web. Native custom-scheme redirects are **not** required to fix Google on Vercel or local Vite.

If you later test Google **inside** the Capacitor shell, also add these Redirect URLs (derived from the existing config: Android `https` scheme, iOS default `capacitor`):

- `https://localhost/auth/callback`
- `capacitor://localhost/auth/callback`
