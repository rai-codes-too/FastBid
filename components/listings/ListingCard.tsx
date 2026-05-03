import Link from 'next/link'
import { Clock, Tag, MapPin, TrendingUp, Star, AlertCircle } from 'lucide-react'
import { formatCurrency, formatTimeLeft, isListingActive } from '@/lib/utils'
import type { Listing } from '@/lib/types'

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  const active = isListingActive(listing)
  const hasImage = listing.images && listing.images.length > 0
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const categoryColors: Record<string, string> = {
    'Electronics': '#3b82f6',
    'Books': '#8b5cf6',
    'Clothing': '#ec4899',
    'Furniture': '#f59e0b',
    'Sports': '#10b981',
    'Stationery': '#6366f1',
    'Food': '#ef4444',
    'Vehicles': '#f97316',
    'Musical Instruments': '#14b8a6',
    'Other': '#6b7280',
  }

  const catColor = categoryColors[listing.category] || '#6b7280'

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className={`card overflow-hidden h-full flex flex-col ${listing.is_featured ? 'featured-card' : ''}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden"
          style={{ backgroundColor: 'var(--bg-subtle)' }}>
          {hasImage ? (
            <img
              src={`${supabaseUrl}/storage/v1/object/public/listing-images/${listing.images[0]}`}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.is_featured && (
              <span className="badge text-white" style={{ backgroundColor: 'var(--accent)', fontSize: '0.68rem' }}>
                <Star size={10} fill="currentColor" /> Featured
              </span>
            )}
            {!active && (
              <span className="badge" style={{ backgroundColor: '#6b7280', color: '#fff', fontSize: '0.68rem' }}>
                Ended
              </span>
            )}
          </div>

          {/* Category */}
          <div className="absolute top-2 right-2">
            <span className="badge text-white text-xs" style={{ backgroundColor: catColor, fontSize: '0.68rem' }}>
              {listing.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-display font-semibold text-base leading-snug line-clamp-2">
            {listing.title}
          </h3>

          {/* Price info */}
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-xs text-muted">Starting at</p>
              <p className="font-display font-bold text-lg">{formatCurrency(listing.starting_price)}</p>
            </div>
            {(listing.highest_bid ?? 0) > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted flex items-center gap-1 justify-end">
                  <TrendingUp size={11} /> Highest bid
                </p>
                <p className="font-semibold text-green text-base">
                  {formatCurrency(listing.highest_bid ?? 0)}
                </p>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t"
            style={{ borderColor: 'var(--border)' }}>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTimeLeft(listing.ends_at, listing.duration_type)}
            </span>
            {listing.hostel && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {listing.hostel}
              </span>
            )}
          </div>

          {/* Bid count */}
          {(listing.bid_count ?? 0) > 0 && (
            <p className="text-xs text-muted">
              {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
