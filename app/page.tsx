'use client'

import { useEffect, useState } from 'react'
import { Zap, Star, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ListingCard from '@/components/listings/ListingCard'
import FilterBar from '@/components/listings/FilterBar'
import type { Listing, Category } from '@/lib/types'
import { isListingActive } from '@/lib/utils'

console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

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
    <div className="page-container py-8" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* ── Hero ── */}
      {!isFiltering && (
        <section style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #b83510 100%)',
          borderRadius: '20px',
          padding: '48px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', right: '-40px', top: '-60px',
            width: '280px', height: '280px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            position: 'absolute', right: '80px', bottom: '-80px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                padding: '4px 12px', borderRadius: '999px',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
              }}>
                ⚡ NISER STUDENT MARKETPLACE
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '16px',
            }}>
              Buy &amp; sell anything<br />on campus
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '28px' }}>
              Auction-based marketplace for NISER students. List items, place bids, and close deals with your hostel neighbours.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/create" className="btn-primary" style={{
                background: 'white', color: 'var(--accent)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                fontSize: '0.95rem', padding: '12px 24px',
              }}>
                <Zap size={16} /> List an Item
              </Link>
              <a href="#listings" className="btn-secondary" style={{
                background: 'rgba(255,255,255,0.12)', color: 'white',
                border: '1.5px solid rgba(255,255,255,0.25)',
                fontSize: '0.95rem', padding: '12px 24px',
              }}>
                Browse Listings
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {!isFiltering && featured.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Star size={16} color="var(--accent)" fill="var(--accent)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                Featured Listings
              </h2>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {featured.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* ── All listings ── */}
      <section id="listings">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isFiltering
                ? <TrendingUp size={16} color="var(--accent)" />
                : <Clock size={16} color="var(--text-muted)" />}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
              {isFiltering ? 'Search Results' : 'Recent Listings'}
            </h2>
          </div>
          {isFiltering && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <FilterBar
          onSearch={setSearchQ}
          onCategory={setCategory}
          onPriceRange={(min, max) => { setMinPrice(min); setMaxPrice(max) }}
          onHostel={setHostel}
        />

        <div style={{ marginTop: '20px' }}>
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse"
                  style={{ height: '300px', background: 'var(--bg-subtle)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏷️</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                No listings found
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '24px' }}>
                Try different search terms or filters
              </p>
              <Link href="/create" className="btn-primary">List the first item</Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
