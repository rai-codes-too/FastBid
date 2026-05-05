# FastBid – NISER Marketplace: Reconstruction Prompt

Build **"FastBid – NISER Marketplace"**: a full-stack auction platform for NISER students.

---

## Stack

- **Frontend:** Next.js 16 (App Router, TypeScript)
- **Backend:** Supabase (auth, Postgres, storage, realtime)
- **Styling:** Tailwind CSS v4 — used minimally; prefer inline styles for layout/spacing/media queries
- **Deploy:** Vercel
- **Fonts:** Inter (body) + Fraunces (display/headings) via Google Fonts `<link>` in layout

---

## Supabase Setup

### Tables

```sql
-- Auto-create profile on signup via trigger reading raw_user_meta_data
CREATE TABLE profiles (id UUID REFERENCES auth.users PRIMARY KEY, name TEXT NOT NULL, contact TEXT, hostel TEXT, is_admin BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE listings (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, seller_id UUID REFERENCES profiles ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, images TEXT[] DEFAULT '{}', starting_price NUMERIC(10,2), category listing_category NOT NULL, tags TEXT[] DEFAULT '{}', duration_type duration_type NOT NULL DEFAULT 'fixed', ends_at TIMESTAMPTZ, is_featured BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, hostel TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE bids (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, listing_id UUID REFERENCES listings ON DELETE CASCADE, bidder_id UUID REFERENCES profiles ON DELETE CASCADE, amount NUMERIC(10,2), is_offer BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE reports (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, listing_id UUID REFERENCES listings ON DELETE CASCADE, reporter_id UUID REFERENCES profiles ON DELETE CASCADE, reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
```

### View

```sql
CREATE VIEW listings_with_bids AS
SELECT l.*, p.name AS seller_name, p.contact AS seller_contact, p.hostel AS seller_hostel,
  COALESCE(MAX(b.amount), 0) AS highest_bid, COUNT(b.id) AS bid_count
FROM listings l JOIN profiles p ON l.seller_id = p.id LEFT JOIN bids b ON l.id = b.listing_id
GROUP BY l.id, p.name, p.contact, p.hostel;
```

### Trigger (auto-create profile)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, contact, hostel, is_admin)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'contact', NEW.raw_user_meta_data->>'hostel', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### RLS + Storage Policies

```sql
-- Full RLS on all tables. Key policies:
CREATE POLICY "read listings" ON listings FOR SELECT USING (true);
CREATE POLICY "insert listing" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "update listing" ON listings FOR UPDATE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));
CREATE POLICY "delete listing" ON listings FOR DELETE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));
CREATE POLICY "read bids" ON bids FOR SELECT USING (true);
CREATE POLICY "insert bid" ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "insert profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin read reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));
CREATE POLICY "insert report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Storage bucket: "listing-images" (public)
CREATE POLICY "upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images');
CREATE POLICY "read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'listing-images');
CREATE POLICY "delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Disable email confirmation** in Supabase Auth settings.

---

## Design System (`globals.css`)

### CSS Variables

```css
:root {
  --bg: #f5f3ef; --bg-card: #ffffff; --bg-subtle: #eeebe6; --bg-hover: #e8e4de;
  --text: #18181a; --text-muted: #6e6d72; --text-light: #a09fa6;
  --border: #dedad4; --border-strong: #ccc8c0;
  --accent: #e8571f; --accent-hover: #cf4915; --accent-subtle: #fef0ea; --accent-text: #b83d10;
  --green: #16a35a; --green-subtle: #e8f7ef;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06); --shadow-md: 0 4px 16px rgba(0,0,0,0.08); --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
  --font-display: 'Fraunces', Georgia, serif; --font-body: 'Inter', system-ui, sans-serif;
}
.dark {
  --bg: #111112; --bg-card: #1a1a1c; --bg-subtle: #222225;
  --text: #f0eeea; --text-muted: #8a8890; --text-light: #5a5860;
  --border: #2e2e33; --border-strong: #3a3a40;
  --accent: #f06030; --accent-subtle: #271610; --accent-text: #f5804a;
  --green: #22c064; --green-subtle: #0d2318;
}
```

### Reusable Classes

```css
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-sm); transition: box-shadow 0.18s, transform 0.18s; }
.input { display: block; width: 100%; padding: 10px 14px; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 10px; color: var(--text); font-family: var(--font-body); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); }
.input-icon-wrap { position: relative; display: flex; align-items: center; }
.input-icon-wrap .icon { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; }
.input-icon-wrap .input { padding-left: 38px; }
select.input { background-image: url("chevron-down svg as data URI"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; background: var(--accent); color: #fff; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; text-decoration: none; transition: background 0.15s, transform 0.1s; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-secondary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; background: var(--bg-card); color: var(--text); border: 1.5px solid var(--border); border-radius: 10px; cursor: pointer; transition: background 0.15s; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
.page-container { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.animate-pulse { animation: pulse 1.8s ease-in-out infinite; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.fade-in { animation: fadeIn 0.25s ease forwards; }
```

### Page Centering Pattern (all pages)

```tsx
// Outer wrapper
style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 80px' }}
// Inner content div
style={{ width: '100%', maxWidth: '760px' }}  // adjust maxWidth per page
```

---

## File Structure

```
app/
  layout.tsx              # Google Fonts link, ThemeProvider, Navbar, footer
  globals.css             # Full design system
  page.tsx                # Home
  login/page.tsx
  signup/page.tsx
  profile/page.tsx        # Edit profile (maxWidth 480px)
  create/page.tsx         # Create listing (maxWidth 680px)
  dashboard/page.tsx      # User dashboard (maxWidth 760px)
  admin/page.tsx          # Admin panel (maxWidth 860px)
  listings/[id]/page.tsx  # Listing detail (maxWidth 1040px)
components/
  ui/Navbar.tsx
  ui/ThemeProvider.tsx
  listings/ListingCard.tsx
  listings/FilterBar.tsx
  bids/BidForm.tsx
  bids/BidHistory.tsx
lib/
  types.ts                # Profile, Listing, Bid, Report, CATEGORIES, HOSTELS
  utils.ts                # formatCurrency (INR), formatTimeLeft, formatDate, isListingActive
  supabase/client.ts      # createBrowserClient
  supabase/server.ts      # createServerClient with cookies
proxy.ts                  # Auth protection (Next.js 16 — NOT middleware.ts)
```

---

## Pages

### `app/page.tsx` (Home)
- Client component, fetches `listings_with_bids` on mount, realtime subscription
- Hero: full-width accent gradient banner with tagline + two CTAs
- Featured section: listings where `is_featured=true` and active
- Recent listings grid: `repeat(auto-fill, minmax(220px, 1fr))`
- Client-side filtering via `FilterBar` (search title+tags, category, price range, hostel)

### `app/login/page.tsx`
- Centered card, maxWidth 400px
- Email + password inputs with icon-wrap pattern
- `supabase.auth.signInWithPassword` → redirect to `/` on success

### `app/signup/page.tsx`
- Centered card, maxWidth 420px
- Fields: name, email, password, contact, hostel
- `supabase.auth.signUp({ email, password, options: { data: { name, contact, hostel } } })`
- On success: `router.push('/')` immediately — no email confirmation screen

### `app/listings/[id]/page.tsx`
- Responsive two-column via `<style>` tag inside component (never globals.css for this):
```tsx
<style>{`
  .listing-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
  .listing-grid-sidebar { position: sticky; top: 72px; display: flex; flex-direction: column; gap: 16px; }
  @media (max-width: 768px) {
    .listing-grid { grid-template-columns: 1fr; }
    .listing-grid-sidebar { position: static; }
  }
`}</style>
```
- Left col: image viewer (16/9, thumbnail strip), details card (title, category badge, price row, description, tags, meta)
- Right col: `<BidForm>`, seller card (avatar initial, name, hostel, phone + WhatsApp buttons), `<BidHistory>`
- Seller/admin sees: feature toggle, activate/deactivate, delete buttons
- Pass `isSeller={user?.id === listing.seller_id || user?.is_admin}` to BidHistory

### `app/create/page.tsx`
- Section cards: Basic Info, Pricing & Duration, Photos, Tags
- Duration: fixed (1/2/3/5/7 days) or open-until-sold toggle
- Image upload: preview thumbnails, max 5 files, 5MB each
- **Compress before upload:**
```ts
const compressImage = (file: File): Promise<File> => new Promise(resolve => {
  const img = new Image(); const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const MAX = 1200; let { width, height } = img
    if (width > MAX || height > MAX) {
      if (width > height) { height = Math.round(height * MAX / width); width = MAX }
      else { width = Math.round(width * MAX / height); height = MAX }
    }
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
    canvas.toBlob(blob => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', 0.80)
  }
  img.onerror = () => resolve(file); img.src = url
})
// In upload loop:
const compressed = await compressImage(file)
await supabase.storage.from('listing-images').upload(path, compressed, { contentType: 'image/jpeg' })
```

### `app/dashboard/page.tsx`
- 4 stat cards: My Listings, Active, Bids Placed, Highest Offer
- Tab switcher: My Listings / My Bids (same pill-style switcher used in admin)
- Listings rows: status dot + title link + meta + activate/delete buttons
- Bids rows: listing title link + date + amount + offer badge

### `app/admin/page.tsx`
- Guard: fetch profile on mount, redirect to `/` if not `is_admin`
- 3 stat cards, 3 tabs: Listings / Reports / Users
- Listings: feature (Star/StarOff), activate (CheckCircle/XCircle), view, delete per row
- Reports: reason block + delete listing button
- Users: avatar initial, name + admin badge, Make/Remove Admin button

### `app/profile/page.tsx`
- Edit name, contact, hostel — `supabase.from('profiles').update(...)`

---

## Components

### `Navbar`
```
Logo (Zap icon + "FastBid · NISER") | theme toggle | List Item btn | profile dropdown
```
Dropdown contents (when signed in):
- Header: 36px avatar (accent square, initial), full name, hostel
- Menu items with 30px icon box: Edit Profile, Dashboard, Admin Panel (if admin), List an Item (mobile only), divider, Sign out
- Chevron rotates 180° when open; fixed backdrop div closes on outside click
- `onAuthStateChange` listener refreshes profile in navbar

### `ThemeProvider`
- Context: `{ theme: 'light'|'dark', toggle }`
- On mount: read `localStorage.theme` → fallback `prefers-color-scheme`
- Toggle: flip state, write localStorage, toggle `.dark` on `document.documentElement`

### `ListingCard`
- Full-height flex card, hover lift (`transform: translateY(-3px)`)
- Image: 4:3 aspect, `object-fit: cover`; placeholder Tag icon if no image
- Top-left badges: Featured (accent), Ended (dark)
- Top-right: category badge (colour-coded per category)
- Content: title (font-display, line-clamp-2), starting price + highest bid, meta row (time left, hostel), bid count

### `FilterBar`
- Search input with `.input-icon-wrap` Search icon
- Filters button with active-count bubble badge
- Collapsible panel (`.fade-in`): category select, min/max price inputs, hostel select, Apply + Clear buttons

### `BidForm`
- Price summary chips: starting price chip + highest bid chip (green tinted)
- ₹ symbol: `position: absolute, background: transparent` overlay; input has `paddingLeft: 52px` inline
- `isOffer = parsedAmount > 0 && parsedAmount < startingPrice` — shows amber warning
- Success: green tinted banner. Error: red inline text
- Not logged in: "Sign in to bid →" full-width button

### `BidHistory`
- Fetches `bids` with `profiles(name, contact)` join, sorted by amount desc
- Realtime `postgres_changes` INSERT subscription
- Valid bids: ranked list (#1 green). Offers: separate section, accent-subtle bg
- When `isSeller=true`: show phone button + WhatsApp button under each bid/offer row
- "Seller view" badge in header when isSeller

---

## Routing & Auth (`proxy.ts`)

```ts
// proxy.ts — Next.js 16 uses "proxy" not "middleware"
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
// Protected paths: /create /dashboard /admin /profile → redirect to /login if no session
```

---

## `lib/types.ts`

```ts
export const CATEGORIES = ['Electronics','Books','Clothing','Furniture','Sports','Stationery','Food','Vehicles','Musical Instruments','Other']
export const HOSTELS = ['BH-1','BH-2','BH-3','BH-4','BH-5','BH-6','BH-7','GH-1','GH-2','Faculty Quarters','Off-Campus']
// Interfaces: Profile, Listing (with seller_name/contact/hostel/highest_bid/bid_count from view), Bid, Report
```

---

## Key Rules

- **Never** use Tailwind for layout, spacing, or anything needing dynamic values — inline styles only
- **Never** put responsive grid CSS in `globals.css` — use `<style>` tags inside the component
- **Always** use `.input-icon-wrap` + `.icon` pattern for icon inputs, never `padding-left` utility classes
- **Always** use `listings_with_bids` view when fetching listings — never manual joins
- `HOSTELS` and `CATEGORIES` in `lib/types.ts` are the single source of truth for all dropdowns
- Grant admin: `UPDATE profiles SET is_admin=true WHERE id='uuid';` in Supabase SQL Editor
- Image uploads: always compress client-side first (canvas, max 1200px, JPEG 80%) before Supabase storage upload
