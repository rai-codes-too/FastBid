'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, TrendingUp, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatTimeLeft, isListingActive } from '@/lib/utils'
import type { Listing, Bid, Profile } from '@/lib/types'

interface BidWithListing extends Bid {
  listings: Pick<Listing, 'id' | 'title' | 'starting_price' | 'is_active' | 'duration_type' | 'ends_at'> | null
}

const S = {
  page: {
    minHeight: '85vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '48px 24px 80px',
  },
  inner: {
    width: '100%',
    maxWidth: '760px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
  },
}

export default function DashboardPage() {
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myBids, setMyBids]       = useState<BidWithListing[]>([])
  const [tab, setTab]             = useState<'listings' | 'bids'>('listings')
  const [loading, setLoading]     = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: l }, { data: b }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('listings_with_bids').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bids').select('*, listings(id, title, starting_price, is_active, duration_type, ends_at)')
          .eq('bidder_id', user.id).order('created_at', { ascending: false }),
      ])
      setProfile(p)
      setMyListings((l as Listing[]) || [])
      setMyBids((b as BidWithListing[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    setMyListings(l => l.filter(x => x.id !== id))
  }

  const handleToggle = async (listing: Listing) => {
    await supabase.from('listings').update({ is_active: !listing.is_active }).eq('id', listing.id)
    setMyListings(l => l.map(x => x.id === listing.id ? { ...x, is_active: !x.is_active } : x))
  }

  if (loading) return (
    <div style={S.page}>
      <div style={{ ...S.inner, gap: '16px' }}>
        {[1,2,3].map(i => (
          <div key={i} className="animate-pulse card" style={{ height: '72px', background: 'var(--bg-subtle)' }} />
        ))}
      </div>
    </div>
  )

  const statCards = [
    { label: 'My Listings',   value: myListings.length,                                          icon: Package },
    { label: 'Active',        value: myListings.filter(l => isListingActive(l)).length,           icon: CheckCircle },
    { label: 'Bids Placed',   value: myBids.length,                                              icon: TrendingUp },
    { label: 'Highest Offer', value: myBids.length > 0 ? formatCurrency(Math.max(...myBids.map(b => b.amount))) : '—', icon: TrendingUp },
  ]

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
              Dashboard
            </h1>
            {profile && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {profile.name}
                {profile.hostel && <> · {profile.hostel}</>}
                {profile.contact && <> · {profile.contact}</>}
              </p>
            )}
          </div>
          <Link href="/create" className="btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={16} /> New Listing
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
              <Icon size={20} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div>
          <div style={{
            display: 'inline-flex', gap: '4px', padding: '4px',
            background: 'var(--bg-subtle)', borderRadius: '10px', marginBottom: '16px',
          }}>
            {(['listings', 'bids'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
              }}>
                {t === 'listings' ? `My Listings (${myListings.length})` : `My Bids (${myBids.length})`}
              </button>
            ))}
          </div>

          {/* Listings tab */}
          {tab === 'listings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myListings.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</p>
                  <p style={{ fontWeight: 600, marginBottom: '6px' }}>No listings yet</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
                    Start selling to the NISER community
                  </p>
                  <Link href="/create" className="btn-primary">Create your first listing</Link>
                </div>
              ) : myListings.map(l => {
                const active = isListingActive(l)
                return (
                  <div key={l.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Status dot */}
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      background: active ? 'var(--green)' : 'var(--text-light)',
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/listings/${l.id}`} style={{
                        fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                        color: 'var(--text)', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                        {l.title}
                      </Link>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>{l.category}</span>
                        <span>Start: {formatCurrency(l.starting_price)}</span>
                        {(l.highest_bid ?? 0) > 0 && (
                          <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                            Highest: {formatCurrency(l.highest_bid ?? 0)}
                          </span>
                        )}
                        <span>{l.bid_count ?? 0} bid{l.bid_count !== 1 ? 's' : ''}</span>
                        <span>{formatTimeLeft(l.ends_at, l.duration_type)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleToggle(l)} className="btn-secondary"
                        style={{ padding: '7px 10px' }}
                        title={l.is_active ? 'Deactivate' : 'Activate'}>
                        {l.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="btn-secondary"
                        style={{ padding: '7px 10px', color: '#ef4444' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bids tab */}
          {tab === 'bids' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myBids.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏷️</p>
                  <p style={{ fontWeight: 600, marginBottom: '6px' }}>No bids placed yet</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
                    Find something worth bidding on
                  </p>
                  <Link href="/" className="btn-primary">Browse listings</Link>
                </div>
              ) : myBids.map(bid => (
                <div key={bid.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {bid.is_offer && (
                    <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', flexShrink: 0 }}>
                      Offer
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {bid.listings ? (
                      <Link href={`/listings/${bid.listings.id}`} style={{
                        fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                        color: 'var(--text)', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                        {bid.listings.title}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Listing deleted</span>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {bid.is_offer ? 'Offer' : 'Bid'} placed · {new Date(bid.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem',
                      color: bid.is_offer ? 'var(--accent)' : 'var(--text)',
                    }}>
                      {formatCurrency(bid.amount)}
                    </p>
                    {bid.listings && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Start: {formatCurrency(bid.listings.starting_price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
