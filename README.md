# 🏪 Jinendra Enterprises — Live Website

## Yeh kya hai?
- Customer store website (products, WhatsApp order)
- Admin panel with **Google login** (no password needed!)
- **Real database** — koi bhi change karo, sabko turant dikhega
- Free hosting on Vercel + Free database on Supabase

---

## ⚡ STEP-BY-STEP DEPLOY GUIDE

### STEP 1: GitHub Account + Repository

1. **github.com** pe jaao → Sign up (free)
2. Login ke baad → Green **"New"** button click karo
3. Repository name: `jinendra-live`
4. **"Create repository"** click karo
5. **"uploading an existing file"** click karo
6. Is ZIP ko extract karo aur **saari files** drag karke upload karo
7. **"Commit changes"** click karo

---

### STEP 2: Supabase Setup (Free Database)

1. **supabase.com** → Sign up with GitHub
2. **"New Project"** click karo
   - Name: `jinendra`
   - Password: koi bhi strong password (yaad rakhna)
   - Region: `Southeast Asia (Singapore)` — India ke liye best
3. Project create hone mein ~2 minutes lagenge

4. **SQL Editor** mein jaao (left sidebar)
5. **"New Query"** click karo
6. `supabase-schema.sql` file ka poora content copy-paste karo
7. **"Run"** click karo — tables ban jayenge ✅

8. **Settings → API** mein jaao:
   - **Project URL** copy karo → yeh hai `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key copy karo → yeh hai `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key copy karo → yeh hai `SUPABASE_SERVICE_ROLE_KEY`

9. **Storage** mein jaao → **"New Bucket"** → Name: `product-images` → **Public bucket** ON karo → Create

10. **Authentication → Providers** mein jaao:
    - **Google** enable karo
    - Google Cloud Console pe jaana padega (Step 3)

---

### STEP 3: Google OAuth Setup

1. **console.cloud.google.com** pe jaao → Sign in with Google
2. **"New Project"** → Name: `jinendra-store` → Create
3. Left menu → **"APIs & Services"** → **"OAuth consent screen"**
   - User Type: **External** → Create
   - App name: `Jinendra Enterprises`
   - Support email: apna email
   - Save and Continue (baaki skip kar sakte ho)
4. Left menu → **"Credentials"** → **"Create Credentials"** → **"OAuth Client ID"**
   - Application type: **Web application**
   - Name: `Jinendra Web`
   - Authorized redirect URIs mein add karo:
     ```
     https://[YOUR-SUPABASE-PROJECT].supabase.co/auth/v1/callback
     ```
     (Supabase project URL se copy karo)
   - **Create** → `Client ID` aur `Client Secret` copy karo

5. Wapas **Supabase → Authentication → Providers → Google**:
   - Client ID paste karo
   - Client Secret paste karo
   - **Save** ✅

---

### STEP 4: Vercel Deploy

1. **vercel.com** → Sign up with GitHub
2. **"Add New Project"** → `jinendra-live` repo import karo
3. **"Environment Variables"** section mein yeh 4 variables add karo:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
   | `NEXT_PUBLIC_ADMIN_EMAIL` | **Tumhara Gmail address** |

4. **"Deploy"** click karo → 2-3 minutes mein LIVE! 🎉

---

### STEP 5: Supabase mein Vercel URL add karo

Deploy hone ke baad tumhe ek URL milega jaise `jinendra-live.vercel.app`

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://jinendra-live.vercel.app`
3. **Redirect URLs** mein add karo: `https://jinendra-live.vercel.app/**`
4. Save ✅

---

## 🎉 Ho Gaya!

- **Customer site**: `https://jinendra-live.vercel.app`
- **Admin panel**: `https://jinendra-live.vercel.app/admin`
  - "Google se Login Karo" click karo → tumhara Gmail account select karo → Done!

---

## 💻 Local Test (Optional)

```bash
# 1. .env.example ko copy karo
cp .env.example .env.local

# 2. .env.local mein apni values bharo

# 3. Install & run
npm install
npm run dev

# Open: http://localhost:3000
# Admin: http://localhost:3000/admin
```

---

## ❓ Help chahiye?

Kisi bhi step mein problem aaye toh screenshot bhejo!
