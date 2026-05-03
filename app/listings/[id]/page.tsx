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

const CAT_COLORS: Record<string, string> = {
  'Electronics': '#3b82f6', 'Books': '#8b5cf6', 'Clothing': '#ec4899',
  'Furniture': '#f59e0b', 'Sports': '#10b981', 'Stationery': '#6366f1',
  'Food': '#ef4444', 'Vehicles': '#f97316', 'Musical Instruments': '#14b8a6', 'Other': '#6b7280',
}

export default function ListingDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [listing, setListing]         = useState<Listing | null>(null)
  const [user, setUser]               = useState<Profile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [activeImg, setActiveImg]     = useState(0)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent]   = useState(false)
  const [showReport, setShowReport]   = useState(false)
  const supabase    = createClient()
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
    await supabase.from('reports').insert({ listing_id: id, reporter_id: user.id, reason: reportReason })
    setReportSent(true)
    setShowReport(false)
  }

  if (loading) return (
    <div style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[300, 80, 200].map((h, i) => (
          <div key={i} className="animate-pulse card" style={{ height: `${h}px`, background: 'var(--bg-subtle)' }} />
        ))}
      </div>
    </div>
  )

  if (!listing) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <p style={{ fontSize: '3rem' }}>🔍</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>Listing not found</h2>
      <Link href="/" className="btn-primary">Back to home</Link>
    </div>
  )

  const active      = isListingActive(listing)
  const isSeller    = user?.id === listing.seller_id
  const isAdmin     = user?.is_admin
  const catColor    = CAT_COLORS[listing.category] || '#6b7280'
  const whatsappUrl = listing.seller_contact
    ? `https://wa.me/${listing.seller_contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on FastBid!`)}`
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 80px', minHeight: '85vh' }}>
      <div style={{ width: '100%', maxWidth: '1040px' }}>

        {/* Back link */}
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none',
          marginBottom: '24px',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <ChevronLeft size={16} /> Back to listings
        </Link>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* ── LEFT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

            {/* Image */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ aspectRatio: '16/9', background: 'var(--bg-subtle)', position: 'relative' }}>
                {listing.images?.length > 0 ? (
                  <img
                    src={`${supabaseUrl}/storage/v1/object/public/listing-images/${listing.images[activeImg]}`}
                    alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                    <Tag size={56} strokeWidth={1} />
                  </div>
                )}
                {/* Badges */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                  {listing.is_featured && (
                    <span className="badge" style={{ background: 'var(--accent)', color: 'white' }}>
                      <Star size={10} fill="currentColor" strokeWidth={0} /> Featured
                    </span>
                  )}
                  <span className="badge" style={{
                    background: active ? 'var(--green-subtle)' : 'var(--bg-subtle)',
                    color: active ? 'var(--green)' : 'var(--text-muted)',
                  }}>
                    {active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {active ? 'Active' : 'Ended'}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {listing.images?.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
                  {listing.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} style={{
                      flexShrink: 0, width: '64px', height: '64px', borderRadius: '8px',
                      overflow: 'hidden', border: '2px solid',
                      borderColor: i === activeImg ? 'var(--accent)' : 'var(--border)',
                      cursor: 'pointer', padding: 0, background: 'none',
                      transition: 'border-color 0.15s',
                    }}>
                      <img src={`${supabaseUrl}/storage/v1/object/public/listing-images/${img}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details card */}
            <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ minWidth: 0 }}>
                  <span className="badge" style={{ background: catColor, color: 'white', marginBottom: '10px' }}>
                    {listing.category}
                  </span>
                  <h1 style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.75rem',
                    fontWeight: 700, lineHeight: 1.25, color: 'var(--text)',
                  }}>
                    {listing.title}
                  </h1>
                </div>

                {/* Seller/admin controls */}
                {(isSeller || isAdmin) && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {isAdmin && (
                      <button onClick={handleFeature} className="btn-secondary" style={{ padding: '8px 10px' }}
                        title={listing.is_featured ? 'Unfeature' : 'Feature'}>
                        {listing.is_featured ? <StarOff size={15} /> : <Star size={15} />}
                      </button>
                    )}
                    <button onClick={handleDeactivate} className="btn-secondary" style={{ padding: '8px 10px' }}>
                      {listing.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                    </button>
                    <button onClick={handleDelete} className="btn-secondary" style={{ padding: '8px 10px', color: '#ef4444' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Price row */}
              <div style={{
                display: 'flex', gap: '32px', padding: '16px 0',
                borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Starting Price</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
                    {formatCurrency(listing.starting_price)}
                  </p>
                </div>
                {(listing.highest_bid ?? 0) > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>Highest Bid</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--green)' }}>
                      {formatCurrency(listing.highest_bid ?? 0)}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>Description</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {listing.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {listing.tags.map(tag => (
                    <span key={tag} className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> {formatTimeLeft(listing.ends_at, listing.duration_type)}
                </span>
                {listing.hostel && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> {listing.hostel}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Listed {formatDate(listing.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '72px' }}>

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
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={15} style={{ color: 'var(--accent)' }} /> Seller
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--accent-subtle)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem',
                }}>
                  {listing.seller_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{listing.seller_name}</p>
                  {listing.seller_hostel && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <MapPin size={12} /> {listing.seller_hostel}
                    </p>
                  )}
                </div>
              </div>

              {listing.seller_contact && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href={`tel:${listing.seller_contact}`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem', padding: '9px' }}>
                    <Phone size={14} /> {listing.seller_contact}
                  </a>
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem', padding: '9px', background: '#22c55e' }}>
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                </div>
              )}

              {/* Report */}
              {user && user.id !== listing.seller_id && (
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  {reportSent ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={13} /> Report submitted
                    </p>
                  ) : showReport ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea className="input" rows={2} style={{ resize: 'none', fontSize: '0.85rem' }}
                        placeholder="Reason for report…"
                        value={reportReason} onChange={e => setReportReason(e.target.value)} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowReport(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '7px' }}>Cancel</button>
                        <button onClick={handleReport} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '7px' }}>Submit</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowReport(true)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px',
                      fontFamily: 'var(--font-body)',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                      <Flag size={12} /> Report listing
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bid history */}
            <BidHistory
              listingId={listing.id}
              startingPrice={listing.starting_price}
              isSeller={isSeller || (isAdmin ?? false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
