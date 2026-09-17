# Revyo — deployment guide

This is a real Next.js app. It needs three free accounts: **Supabase** (database),
**Vercel** (hosting), and your **Anthropic API key** (for the AI review writing).
Total setup time: about 30–45 minutes.

## 1. Create the database (Supabase)

1. Go to https://supabase.com → sign up → "New project".
2. Pick any name and a database password (save it somewhere, you won't need it again for this app).
3. Once the project is ready, go to **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, paste its full contents in, and click **Run**.
   This creates the `clients`, `outlets`, `reviews`, and `leads` tables.
5. Go to **Project Settings → API**. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **service_role key** (NOT the `anon` key — keep this one secret) → this is your `SUPABASE_SERVICE_ROLE_KEY`

## 2. Get an Anthropic API key

1. Go to https://console.anthropic.com/settings/keys → create a key.
2. You'll need to add billing details there — this is what pays for each AI-generated review (a few paisa each, very cheap at this scale).
3. Copy the key → this is your `ANTHROPIC_API_KEY`.

## 3. Push this code to GitHub

1. Create a new empty repository on GitHub.
2. From this project folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## 4. Deploy on Vercel

1. Go to https://vercel.com → sign up with GitHub → **Add New → Project** → pick this repo.
2. Before clicking Deploy, open **Environment Variables** and add all of these
   (see `.env.example` for the full list and where each value comes from):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` — any long random string (generate one at https://generate-secret.vercel.app/32)
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` — for the first deploy, just put your Vercel URL guess, e.g. `https://revyo.vercel.app` — you'll fix this in step 5.
3. Click **Deploy**. Wait ~1-2 minutes.

## 5. Fix the site URL (important for QR codes)

1. Once deployed, copy your real live URL from Vercel (or set up a custom domain under **Project → Settings → Domains** first).
2. Go to **Project → Settings → Environment Variables**, edit `NEXT_PUBLIC_SITE_URL` to your real URL (no trailing slash).
3. Go to **Deployments** → click the latest one → **Redeploy** (env var changes need a redeploy to take effect).

## 6. Test it end to end

1. Visit your site → **Admin login** → sign in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set.
2. Click **New business** → create a test business, note the passcode shown.
3. Sign out → **Business login** → sign in with that business name + passcode.
4. Add an outlet, paste in a real Google review link, expand it to see the QR code.
5. Scan that QR code with your phone (it should open your real site now) → try both a low rating (goes to "All reviews" in the dashboard, never to Google) and a high rating (generates an AI review, offers "Continue to Google").

## Updating the app later

Any time you want to change something, edit the code, then:
```
git add .
git commit -m "describe your change"
git push
```
Vercel redeploys automatically on every push to `main`.

## Costs at this scale

- Supabase: free tier covers this comfortably for a long time.
- Vercel: free tier is enough unless you get very high traffic.
- Anthropic: pay-as-you-go, a few paisa per generated review — the only real ongoing cost.
