# Accounts + Profiles Scaffold (Supabase + Next.js)

## 1. Create the Supabase project
- Go to supabase.com → New project
- In **Settings → API**, copy the **Project URL** and **anon public key**

## 2. Add environment variables
Copy `.env.local.example` (included here) to your project root, rename it to
`.env.local`, and fill in your real values:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
Make sure `.env*.local` is listed in your `.gitignore` so these never get
committed.

## 3. Install dependencies
```
npm install @supabase/supabase-js @supabase/ssr
```

## 4. Run the database setup
In Supabase → **SQL Editor**, run `supabase-setup.sql` (included here).

## 5. Copy these files into your project (same relative paths)
```
lib/supabase/client.ts
lib/supabase/server.ts
middleware.ts                  <-- goes in the project ROOT, not app/
app/signup/page.tsx
app/login/page.tsx
app/profile/[username]/page.tsx
app/profile/edit/page.tsx
```

## 6. Styling
These pages use plain class names (`auth-page`, `auth-form`, `profile-card`,
etc.) and no inline styles, so you can style them from your existing
`tactical.css` / `theme.ts` to match the rest of the site.

## 7. Test it
```
npm run dev
```
- Visit `/signup` → create an account
- Check Supabase → Table Editor → `profiles` → confirm a row was created
- Visit `/login` → log in
- Visit `/profile/edit` → update bio/avatar
- Visit `/profile/<username>` → see the public profile

## Notes
- Supabase's email confirmation is ON by default. For local testing, you can
  turn it off in **Authentication → Providers → Email → Confirm email**
  (turn it back on before going live).
- The `profiles.username` column is unique — signup will fail with a clear
  error if someone picks a taken name.
- Row Level Security is enabled: anyone can *read* profiles, but only the
  owner can *update* their own — this is enforced at the database level, not
  just in the UI.
- Next step once this is working: hook this into your `Header.tsx` to show
  a login/profile link based on auth state (`supabase.auth.getUser()`).
