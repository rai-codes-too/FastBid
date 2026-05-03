'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Clock, Tag, Phone, MessageCircle, Flag, Trash2,
  Star, StarOff, ChevronLeft, CheckCircle, XCircle, User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BidForm from '@/components/bids/BidForm'
import BidHistory from '@/components/bids/BidHistory'
import { formatCurrency, formatDate, formatTimeLeft, isListingActive } from '@/lib/utils'
import type { Listing, Profile } from '@/lib/types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const supabase = createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  useEffect(() => {
    const load = async () => {
      const [{ data: listingData }, { data: { user: authUser } }] = await Promise.all([
        supabase.from('listings_with_bids').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])

      setListing(listingData as Listing)

      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(profile)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    router.push('/')
  }

  const handleFeature = async () => {
    await supabase.from('listings').update({ is_featured: !listing!.is_featured }).eq('id', id)
    setListing(l => l ? { ...l, is_featured: !l.is_featured } : l)
  }

  const handleDeactivate = async () => {
    await supabase.from('listings').update({ is_active: !listing!.is_active }).eq('id', id)
    setListing(l => l ? { ...l, is_active: !l.is_active } : l)
  }

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return
    await supabase.from('reports').insert({
      listing_id: id,
      reporter_id: user.id,
      reason: reportReason,
    })
    setReportSent(true)
    setShowReport(false)
  }

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: "48px" }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded-lg w-1/3" style={{ backgroundColor: 'var(--bg-subtle)' }} />
          <div className="h-80 rounded-2xl" style={{ backgroundColor: 'var(--bg-subtle)' }} />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="font-display text-xl font-bold">Listing not found</h2>
        <Link href="/" className="btn-primary mt-4 inline-flex">Back to home</Link>
      </div>
    )
  }

  const active = isListingActive(listing)
  const isSeller = user?.id === listing.seller_id
  const isAdmin = user?.is_admin
  const whatsappUrl = listing.seller_contact
    ? `https://wa.me/${listing.seller_contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on FastBid!`)}`
    : null

  return (
    <div className="page-container" style={{ paddingTop: "40px", paddingBottom: "60px" }}>
      {/* Back */}
      <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-text mb-6">
        <ChevronLeft size={16} /> Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images + details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Images */}
          <div className="card overflow-hidden">
            <div className="aspect-video relative" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={`${supabaseUrl}/storage/v1/object/public/listing-images/${listing.images[activeImg]}`}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <Tag size={48} />
                </div>
              )}

              {/* Status badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {listing.is_featured && (
                  <span className="badge text-white text-xs" style={{ backgroundColor: 'var(--accent)' }}>
                    <Star size={11} fill="currentColor" /> Featured
                  </span>
                )}
                <span className={`badge text-xs ${active ? 'text-green' : 'text-muted'}`}
                  style={{ backgroundColor: active ? 'var(--green-subtle)' : 'var(--bg-subtle)' }}>
                  {active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {active ? 'Active' : 'Ended'}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-accent' : 'border-transparent'}`}>
                    <img src={`${supabaseUrl}/storage/v1/object/public/listing-images/${img}`}
                      className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="badge text-white text-xs mb-2" style={{ backgroundColor: '#6366f1' }}>
                  {listing.category}
                </span>
                <h1 className="font-display text-2xl font-bold leading-snug">{listing.title}</h1>
              </div>
              {(isSeller || isAdmin) && (
                <div className="flex gap-2 shrink-0">
                  {isAdmin && (
                    <button onClick={handleFeature} className="btn-secondary px-2 py-2 text-xs"
                      title={listing.is_featured ? 'Unfeature' : 'Feature'}>
                      {listing.is_featured ? <StarOff size={15} /> : <Star size={15} />}
                    </button>
                  )}
                  {(isSeller || isAdmin) && (
                    <button onClick={handleDeactivate} className="btn-secondary px-2 py-2 text-xs">
                      {listing.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                    </button>
                  )}
                  <button onClick={handleDelete} className="btn-secondary px-2 py-2 text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="flex gap-6 py-3 border-y" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-xs text-muted">Starting Price</p>
                <p className="font-display text-2xl font-bold">{formatCurrency(listing.starting_price)}</p>
              </div>
              {(listing.highest_bid ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-muted">Highest Bid</p>
                  <p className="font-display text-2xl font-bold text-green">
                    {formatCurrency(listing.highest_bid ?? 0)}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Description</h3>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map(tag => (
                  <span key={tag} className="badge text-xs"
                    style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                    # {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <Clock size={14} />
                {formatTimeLeft(listing.ends_at, listing.duration_type)}
              </div>
              {listing.hostel && (
                <div className="flex items-center gap-2 text-muted">
                  <MapPin size={14} />
                  {listing.hostel}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted">
                <Clock size={14} />
                Listed {formatDate(listing.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Bid + Seller */}
        <div className="space-y-4">
          {/* Bid form */}
          <BidForm
            listingId={listing.id}
            startingPrice={listing.starting_price}
            highestBid={listing.highest_bid ?? 0}
            userId={user?.id ?? null}
            sellerId={listing.seller_id}
            isActive={active}
          />

          {/* Seller card */}
          <div className="card p-4 space-y-3">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <User size={15} className="text-accent" />
              Seller
            </h3>
            <div>
              <p className="font-medium">{listing.seller_name}</p>
              {listing.seller_hostel && (
                <p className="text-sm text-muted flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {listing.seller_hostel}
                </p>
              )}
            </div>

            {listing.seller_contact && (
              <div className="space-y-2">
                <a href={`tel:${listing.seller_contact}`}
                  className="btn-secondary w-full justify-center text-sm py-2">
                  <Phone size={14} /> {listing.seller_contact}
                </a>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-primary w-full justify-center text-sm py-2"
                    style={{ backgroundColor: '#25D366' }}>
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            )}

            {user && user.id !== listing.seller_id && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                {reportSent ? (
                  <p className="text-xs text-green flex items-center gap-1">
                    <CheckCircle size={12} /> Report submitted
                  </p>
                ) : showReport ? (
                  <div className="space-y-2">
                    <textarea
                      className="input text-sm resize-none"
                      rows={2}
                      placeholder="Reason for report..."
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowReport(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                      <button onClick={handleReport} className="btn-primary text-xs py-1.5 px-3">Submit</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowReport(true)}
                    className="text-xs text-muted flex items-center gap-1 hover:text-accent">
                    <Flag size={12} /> Report listing
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bid history */}
          <BidHistory listingId={listing.id} startingPrice={listing.starting_price} />
        </div>
      </div>
    </div>
  )
}
