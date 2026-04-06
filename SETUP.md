# Patina — Setup Guide

Follow these steps **in order** before running the app for the first time.

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → give it the name `patina`
3. Choose a strong database password (save it somewhere safe)
4. Select region closest to you (e.g. US East)
5. Wait ~2 minutes for the project to provision

---

## Step 2: Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** → **New Query**
2. Open the file `supabase/migrations/001_initial_schema.sql` from this project
3. Paste the entire contents into the SQL editor
4. Click **Run**

You should see "Success. No rows returned."

---

## Step 3: Get Your Supabase API Keys

1. In Supabase, go to **Settings** (gear icon) → **API**
2. Copy the **Project URL** — it looks like `https://abcdefgh.supabase.co`
3. Copy the **anon / public** key — a long string starting with `eyJ`

---

## Step 4: Set Up Google Vision API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named `patina`
3. In the search bar, search for **"Cloud Vision API"** and enable it
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the key (starts with `AIza`)

**Add this key to Supabase Edge Function secrets:**
1. In Supabase, go to **Edge Functions** → **Manage secrets**
2. Add: `GOOGLE_VISION_API_KEY` = your key

---

## Step 5: Get eBay API Access

1. Go to [developer.ebay.com](https://developer.ebay.com) and create an account
2. Create an application → get your **OAuth token** (production)
3. Apply to the **eBay Partner Network** at [partnernetwork.ebay.com](https://partnernetwork.ebay.com)

**Add to Supabase Edge Function secrets:**
- `EBAY_OAUTH_TOKEN` = your eBay OAuth token
- (optional) `EBAY_CAMPAIGN_ID` = after affiliate approval

---

## Step 6: Get Etsy API Access

1. Go to [etsy.com/developers](https://www.etsy.com/developers) → **Register as a developer**
2. Create an app → get your **API Key** (v3)
3. Apply to **Etsy Affiliates** at [etsy.com/affiliates](https://www.etsy.com/affiliates)

**Add to Supabase Edge Function secrets:**
- `ETSY_API_KEY` = your Etsy API key

---

## Step 7: Add Remaining Supabase Secrets

In Supabase → **Edge Functions** → **Manage secrets**, also add:
- `SUPABASE_URL` = your project URL (same as Step 3)
- `SUPABASE_ANON_KEY` = your anon key (same as Step 3)
- `SUPABASE_SERVICE_ROLE_KEY` = from Settings → API → **service_role** key *(keep this very secret)*

---

## Step 8: Deploy Edge Functions

Install the Supabase CLI:
```
brew install supabase/tap/supabase
```

Log in and link your project:
```
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

Deploy all three functions:
```
supabase functions deploy analyze-image
supabase functions deploy search-platforms
supabase functions deploy run-saved-searches
```

---

## Step 9: Set Up the Cron Job (Daily Search Alerts)

In Supabase → **Database** → **Extensions** → enable **pg_cron**

Then in **SQL Editor**, run:
```sql
SELECT cron.schedule(
  'run-saved-searches-daily',
  '0 8 * * *',   -- 8am UTC every day
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/run-saved-searches',
      headers := json_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      )::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

---

## Step 10: Configure the Mobile App

1. In `mobile/`, copy `.env.example` to `.env`
2. Fill in your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Step 3

---

## Step 11: Run the App

```bash
cd mobile
npm start
```

Then press `i` to open in iOS Simulator, or scan the QR code with the **Expo Go** app on your iPhone.

> **Note:** Camera and push notifications require a real device. Use a real iPhone for full testing.

---

## Step 12: Build for TestFlight (when ready to share)

1. Create an Apple Developer account at [developer.apple.com](https://developer.apple.com) ($99/year)
2. Install EAS CLI: `npm install -g eas-cli`
3. Log in: `eas login`
4. Configure: `eas build:configure`
5. Build: `eas build --platform ios`
6. Submit to TestFlight: `eas submit --platform ios`
