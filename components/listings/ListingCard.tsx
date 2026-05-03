import Link from 'next/link'
import { Clock, Tag, MapPin, TrendingUp, Star } from 'lucide-react'
import { formatCurrency, formatTimeLeft, isListingActive } from '@/lib/utils'
import type { Listing } from '@/lib/types'

const CAT_COLORS: Record<string, string> = {
  'Electronics':         '#3b82f6',
  'Books':               '#8b5cf6',
  'Clothing':            '#ec4899',
  'Furniture':           '#f59e0b',
  'Sports':              '#10b981',
  'Stationery':          '#6366f1',
  'Food':                '#ef4444',
  'Vehicles':            '#f97316',
  'Musical Instruments': '#14b8a6',
  'Other':               '#6b7280',
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const active    = isListingActive(listing)
  const hasImage  = listing.images && listing.images.length > 0
  const catColor  = CAT_COLORS[listing.category] || '#6b7280'
  const supaUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <Link href={`/listings/${listing.id}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
      <div className={`card ${listing.is_featured ? 'featured-card' : ''}`}
        style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer' }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = 'var(--shadow-md)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = ''
          el.style.boxShadow = ''
        }}>

        {/* ── Image area ── */}
        <div style={{
          position: 'relative',
          aspectRatio: '4/3',
          background: 'var(--bg-subtle)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {hasImage ? (
            <img
              src={`${supaUrl}/storage/v1/object/public/listing-images/${listing.images[0]}`}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-light)',
            }}>
              <Tag size={36} strokeWidth={1.5} />
            </div>
          )}

          {/* Top-left badges */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {listing.is_featured && (
              <span className="badge" style={{ background: 'var(--accent)', color: 'white', fontSize: '0.68rem' }}>
                <Star size={9} fill="currentColor" strokeWidth={0} /> Featured
              </span>
            )}
            {!active && (
              <span className="badge" style={{ background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '0.68rem' }}>
                Ended
              </span>
            )}
          </div>

          {/* Category chip */}
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <span className="badge" style={{ background: catColor, color: 'white', fontSize: '0.68rem' }}>
              {listing.category}
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Title */}
          <h3 className="line-clamp-2" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.95rem',
            fontWeight: 700,
            lineHeight: 1.35,
            color: 'var(--text)',
          }}>
            {listing.title}
          </h3>

          {/* Price block */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 500 }}>
                Starting at
              </p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem', fontWeight: 800,
                color: 'var(--text)', lineHeight: 1,
              }}>
                {formatCurrency(listing.starting_price)}
              </p>
            </div>

            {(listing.highest_bid ?? 0) > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '0.7rem', color: 'var(--text-muted)',
                  marginBottom: '2px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end',
                }}>
                  <TrendingUp size={10} /> Highest
                </p>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem', fontWeight: 700,
                  color: 'var(--green)', lineHeight: 1,
                }}>
                  {formatCurrency(listing.highest_bid ?? 0)}
                </p>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem', color: 'var(--text-muted)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} />
              {formatTimeLeft(listing.ends_at, listing.duration_type)}
            </span>
            {listing.hostel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} />
                {listing.hostel}
              </span>
            )}
          </div>

          {/* Bid count */}
          {(listing.bid_count ?? 0) > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '-4px' }}>
              {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''} placed
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
