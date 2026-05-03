# FastBid – NISER Marketplace

A lightweight, auction-based marketplace for NISER students.

## Tech Stack
- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS with CSS variables (light/dark mode)
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Deployment**: Vercel

---

## Setup Guide

### 1. Supabase Project
Create a project at [supabase.com](https://supabase.com).

### 2. Run Schema
In Supabase SQL Editor, run `supabase/schema.sql`.

### 3. Create Storage Bucket
Storage → New Bucket → name: `listing-images` → Public: ✅

### 4. Environment Variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key from Settings → API
```

### 5. Install & Run
```bash
npm install
npm run dev
```

---

## Deploy to Vercel
1. Push to GitHub
2. Import in vercel.com
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## Make a User Admin
```sql
UPDATE profiles SET is_admin = true WHERE id = 'user-uuid';
```

---

## Features
| Feature | Details |
|---|---|
| Auth | Email/password via Supabase |
| Listings | Title, images, price, category, tags, duration |
| Bidding | Valid bids + Offers (below starting price) |
| Realtime | Live bid updates |
| Search | By title + tags |
| Filters | Category, price range, hostel |
| Admin | Feature listings, delete, manage users |
| Reports | Flag listings for admin review |
| Dark mode | Persistent toggle |
| Images | Up to 5 per listing via Supabase Storage |
| WhatsApp | Direct link to seller |
