export type Category =
  | 'Electronics'
  | 'Books'
  | 'Furniture'
  | 'Sports'
  | 'Stationery'
  | 'Vehicles'
  | 'Musical Instruments'
  | 'Other'

export const CATEGORIES: Category[] = [
  'Electronics', 'Books', 'Furniture', 'Sports',
  'Stationery', 'Vehicles', 'Musical Instruments', 'Other'
]

// ─── EDIT HOSTELS HERE ───────────────────────────────────────────────────────
export const HOSTELS = [
  'DoH 1 (Krishna)',
  'DoH 2 (Bhagirathi)',
  'DoH 3 (Brahmaputra)',
  'DoH 4 (Ganga)',
  'SoH 1 (Mahanadi)',
  'SoH 2 (Rushikulya)',
  'SoH 3 (Daya)',
  'SoH 4 (Kaveri)',
  'SoH 5 (Yamuna)'
];
// ─────────────────────────────────────────────────────────────────────────────

export type DurationType = 'fixed' | 'open'

export interface Profile {
  id: string
  name: string
  contact: string | null
  hostel: string | null
  is_admin: boolean
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  images: string[]
  starting_price: number
  category: Category
  tags: string[]
  duration_type: DurationType
  ends_at: string | null
  is_featured: boolean
  is_active: boolean
  hostel: string | null
  created_at: string
  seller_name?: string
  seller_contact?: string
  seller_hostel?: string
  highest_bid?: number
  bid_count?: number
}

export interface Bid {
  id: string
  listing_id: string
  bidder_id: string
  amount: number
  is_offer: boolean
  created_at: string
  bidder_name?: string
}

export interface Report {
  id: string
  listing_id: string
  reporter_id: string
  reason: string
  created_at: string
}
