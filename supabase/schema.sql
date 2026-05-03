-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  hostel TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TYPE listing_category AS ENUM (
  'Electronics', 'Books', 'Clothing', 'Furniture', 'Sports',
  'Stationery', 'Food', 'Vehicles', 'Musical Instruments', 'Other'
);

CREATE TYPE duration_type AS ENUM ('fixed', 'open');

-- Listings table
CREATE TABLE listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  starting_price NUMERIC(10,2) NOT NULL,
  category listing_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  duration_type duration_type NOT NULL DEFAULT 'fixed',
  ends_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  hostel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids table
CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  is_offer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views for convenience
CREATE OR REPLACE VIEW listings_with_bids AS
SELECT
  l.*,
  p.name AS seller_name,
  p.contact AS seller_contact,
  p.hostel AS seller_hostel,
  COALESCE(MAX(b.amount), 0) AS highest_bid,
  COUNT(b.id) AS bid_count
FROM listings l
JOIN profiles p ON l.seller_id = p.id
LEFT JOIN bids b ON l.id = b.listing_id
GROUP BY l.id, p.name, p.contact, p.hostel;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "Listings are viewable by everyone." ON listings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create listings." ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings." ON listings FOR UPDATE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Sellers and admins can delete listings." ON listings FOR DELETE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Bids
CREATE POLICY "Bids are viewable by everyone." ON bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can place bids." ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Reports
CREATE POLICY "Users can insert reports." ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view reports." ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Storage bucket for listing images
-- Run in Supabase dashboard: Storage > New Bucket > "listing-images" (public)
