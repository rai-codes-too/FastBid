'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, TrendingUp, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatTimeLeft, isListingActive } from '@/lib/utils'
import type { Listing, Bid, Profile } from '@/lib/types'

interface BidWithListing extends Bid {
  listings: Pick<Listing, 'id' | 'title' | 'starting_price' | 'is_active' | 'duration_type' | 'ends_at'> | null
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myBids, setMyBids] = useState<BidWithListing[]>([])
  const [tab, setTab] = useState<'listings' | 'bids'>('listings')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profileData }, { data: listingsData }, { data: bidsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('listings_with_bids').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bids').select('*, listings(id, title, starting_price, is_active, duration_type, ends_at)')
          .eq('bidder_id', user.id).order('created_at', { ascending: false }),
      ])

      setProfile(profileData)
      setMyListings((listingsData as Listing[]) || [])
      setMyBids((bidsData as BidWithListing[]) || [])
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }} />
          <div className="h-40 rounded-2xl" style={{ backgroundColor: 'var(--bg-subtle)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          {profile && (
            <p className="text-muted text-sm mt-1">
              {profile.name} · {profile.hostel || 'No hostel'} · {profile.contact || 'No contact'}
            </p>
          )}
        </div>
        <Link href="/create" className="btn-primary text-sm">
          <Plus size={15} /> New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'My Listings', value: myListings.length, icon: Package },
          { label: 'Active', value: myListings.filter(l => isListingActive(l)).length, icon: CheckCircle },
          { label: 'My Bids', value: myBids.length, icon: TrendingUp },
          {
            label: 'Highest Offer',
            value: myBids.length > 0
              ? formatCurrency(Math.max(...myBids.map(b => b.amount)))
              : '—',
            icon: TrendingUp
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-3 text-center">
            <Icon size={18} className="text-accent mx-auto mb-1" />
            <p className="font-display text-xl font-bold">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-4 w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {(['listings', 'bids'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-card shadow-sm text-text' : 'text-muted hover:text-text'}`}
            style={{ backgroundColor: tab === t ? 'var(--bg-card)' : '' }}>
            {t === 'listings' ? `My Listings (${myListings.length})` : `My Bids (${myBids.length})`}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {tab === 'listings' && (
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-medium">No listings yet</p>
              <Link href="/create" className="btn-primary mt-4 inline-flex">Create your first listing</Link>
            </div>
          ) : (
            myListings.map(l => {
              const active = isListingActive(l)
              return (
                <div key={l.id} className="card p-4 flex items-center gap-4">
                  {/* Active indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-green-500' : 'bg-gray-400'}`} />

                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${l.id}`} className="font-medium hover:text-accent block truncate">
                      {l.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted mt-1 flex-wrap">
                      <span>{l.category}</span>
                      <span>Start: {formatCurrency(l.starting_price)}</span>
                      {(l.highest_bid ?? 0) > 0 && (
                        <span className="text-green">Highest: {formatCurrency(l.highest_bid ?? 0)}</span>
                      )}
                      <span>{l.bid_count} bid{l.bid_count !== 1 ? 's' : ''}</span>
                      <span>{formatTimeLeft(l.ends_at, l.duration_type)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleToggle(l)}
                      className="btn-secondary px-2 py-1.5 text-xs"
                      title={l.is_active ? 'Deactivate' : 'Activate'}>
                      {l.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                    <button onClick={() => handleDelete(l.id)}
                      className="btn-secondary px-2 py-1.5 text-xs text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Bids tab */}
      {tab === 'bids' && (
        <div className="space-y-3">
          {myBids.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="font-medium">No bids placed yet</p>
              <Link href="/" className="btn-primary mt-4 inline-flex">Browse listings</Link>
            </div>
          ) : (
            myBids.map(bid => (
              <div key={bid.id} className="card p-4 flex items-center gap-4">
                {bid.is_offer && (
                  <span className="badge text-xs flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    Offer
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  {bid.listings ? (
                    <Link href={`/listings/${bid.listings.id}`} className="font-medium hover:text-accent block truncate">
                      {bid.listings.title}
                    </Link>
                  ) : (
                    <span className="text-muted text-sm">Listing deleted</span>
                  )}
                  <p className="text-xs text-muted mt-1">
                    {bid.is_offer ? 'Offer' : 'Bid'} placed · {new Date(bid.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-display font-bold ${bid.is_offer ? 'text-accent' : 'text-text'}`}>
                    {formatCurrency(bid.amount)}
                  </p>
                  {bid.listings && (
                    <p className="text-xs text-muted">
                      Start: {formatCurrency(bid.listings.starting_price)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
