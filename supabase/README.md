# Supabase demo links

## 1. Create the table

In [SQL Editor](https://supabase.com/dashboard/project/zhscpcfgcctdhkpcmdmg/sql/new), run `schema.sql`.

## 2. API keys

**Never** put the `service_role` key in the frontend. Only the **anon** key belongs in the browser.

| Environment | How |
|-------------|-----|
| **Local** | Copy `assets/js/config.example.js` → `assets/js/config.js` and paste keys from **Settings → API** |
| **GitHub Pages** | Repo **Settings → Secrets and variables → Actions** (see below) |

### GitHub Actions secrets

Add these repository secrets (same values as Supabase **Settings → API**):

| Secret | Value |
|--------|--------|
| `GV_SUPABASE_URL` | `https://zhscpcfgcctdhkpcmdmg.supabase.co` |
| `GV_SUPABASE_ANON_KEY` | anon public key |
| `GV_SUPABASE_SHORT_BASE` | optional; e.g. `https://zhscpcfgcctdhkpcmdmg.supabase.co/functions/v1/go` |

On push to `main`, `.github/workflows/pages.yml` writes `assets/js/config.js` into the deploy artifact. That file is **gitignored** and never committed.

The anon key will still appear in the live site’s JavaScript (normal for Supabase). Protection is **RLS**, not hiding the key.

## 3. Short links

| Type | Example |
|------|---------|
| **App link** (QR-friendly) | `https://moralesmozart.github.io/gastovisionai/#/d/abc1234` |
| **Edge redirect** (optional) | `https://zhscpcfgcctdhkpcmdmg.supabase.co/functions/v1/go/abc1234` |

Deploy redirect function:

```bash
npx supabase login
npx supabase link --project-ref zhscpcfgcctdhkpcmdmg
npx supabase secrets set PUBLIC_SITE_URL=https://moralesmozart.github.io/gastovisionai
npx supabase functions deploy go
```

## 4. Test locally

1. Create `assets/js/config.js` from `config.example.js`
2. `python3 -m http.server 8000`
3. Publish a demo → copy `#/d/…` link
4. Open in another browser / incognito
