'use client'

import { useEffect, useState } from 'react'
import { Zap, Star, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ListingCard from '@/components/listings/ListingCard'
import FilterBar from '@/components/listings/FilterBar'
import type { Listing, Category } from '@/lib/types'
import { isListingActive } from '@/lib/utils'

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [featured, setFeatured] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [hostel, setHostel] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from('listings_with_bids')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const all = (data as Listing[]) || []
      setFeatured(all.filter(l => l.is_featured && isListingActive(l)).slice(0, 4))
      setListings(all)
      setLoading(false)
    }
    fetchListings()

    const channel = supabase
      .channel('listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchListings)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = listings.filter(l => {
    if (!isListingActive(l)) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      const inTitle = l.title.toLowerCase().includes(q)
      const inTags = (l.tags || []).some(t => t.toLowerCase().includes(q))
      if (!inTitle && !inTags) return false
    }
    if (category && l.category !== category) return false
    if (minPrice !== null && l.starting_price < minPrice) return false
    if (maxPrice !== null && l.starting_price > maxPrice) return false
    if (hostel && l.hostel !== hostel) return false
    return true
  })

  const isFiltering = searchQ || category || minPrice !== null || maxPrice !== null || hostel

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {!isFiltering && (
        <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #c94020 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} fill="white" className="text-white opacity-80" />
              <span className="text-white/80 text-sm font-medium tracking-wide">NISER Student Marketplace</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-3 leading-tight">
              Buy &amp; sell at NISER
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-md mb-6">
              Auction-based marketplace for NISER students. List items, place bids, and connect with your campus community.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/create" className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--accent)' }}>
                <Zap size={15} />
                List an Item
              </Link>
              <a href="#listings" className="btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                Browse All
              </a>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
        </div>
      )}

      {!isFiltering && featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Star size={18} className="text-accent" />
              Featured Listings
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      <section id="listings">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            {isFiltering ? 'Search Results' : 'Recent Listings'}
          </h2>
          {isFiltering && (
            <span className="text-sm text-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <FilterBar
          onSearch={setSearchQ}
          onCategory={setCategory}
          onPriceRange={(min, max) => { setMinPrice(min); setMaxPrice(max) }}
          onHostel={setHostel}
        />

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card aspect-[3/4] animate-pulse" style={{ backgroundColor: 'var(--bg-subtle)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="font-medium">No listings found</p>
              <p className="text-sm mt-1">Try different search terms or filters</p>
              <Link href="/create" className="btn-primary mt-4 inline-flex">
                List the first item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
