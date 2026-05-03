export type Category =
  | 'Electronics'
  | 'Books'
  | 'Clothing'
  | 'Furniture'
  | 'Sports'
  | 'Stationery'
  | 'Food'
  | 'Vehicles'
  | 'Musical Instruments'
  | 'Other'

export const CATEGORIES: Category[] = [
  'Electronics', 'Books', 'Clothing', 'Furniture', 'Sports',
  'Stationery', 'Food', 'Vehicles', 'Musical Instruments', 'Other'
]

export const HOSTELS = [
  'BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'BH-6', 'BH-7',
  'GH-1', 'GH-2', 'Faculty Quarters', 'Off-Campus'
]

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
  // Joined fields from view
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
  // Joined
  bidder_name?: string
}

export interface Report {
  id: string
  listing_id: string
  reporter_id: string
  reason: string
  created_at: string
}
