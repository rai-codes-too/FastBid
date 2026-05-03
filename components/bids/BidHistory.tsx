'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, AlertCircle, Clock, Phone, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid } from '@/lib/types'

interface BidHistoryProps {
  listingId: string
  startingPrice: number
  isSeller: boolean
}

interface BidWithBidder extends Bid {
  profiles: { name: string; contact: string | null } | null
}

export default function BidHistory({ listingId, startingPrice, isSeller }: BidHistoryProps) {
  const [bids, setBids]     = useState<BidWithBidder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, profiles(name, contact)')
      .eq('listing_id', listingId)
      .order('amount', { ascending: false })

    setBids((data as BidWithBidder[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBids()
    const channel = supabase
      .channel(`bids:${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bids',
        filter: `listing_id=eq.${listingId}`,
      }, fetchBids)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [listingId])

  if (loading) return (
    <div className="card" style={{ padding: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
      Loading bids…
    </div>
  )

  const validBids = bids.filter(b => !b.is_offer)
  const offers    = bids.filter(b => b.is_offer)

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>
          Bid History
        </h3>
        {bids.length > 0 && (
          <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', marginLeft: '2px' }}>
            {bids.length}
          </span>
        )}
        {isSeller && bids.length > 0 && (
          <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', marginLeft: 'auto', fontSize: '0.68rem' }}>
            Seller view
          </span>
        )}
      </div>

      {bids.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          No bids yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Valid bids */}
          {validBids.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {validBids.map((bid, i) => {
                const contact = bid.profiles?.contact
                const waUrl = contact
                  ? `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your bid on FastBid!')}`
                  : null

                return (
                  <div key={bid.id} style={{
                    padding: '12px 0',
                    borderBottom: i < validBids.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      {/* Rank + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700,
                          background: i === 0 ? 'var(--green-subtle)' : 'var(--bg-subtle)',
                          color: i === 0 ? 'var(--green)' : 'var(--text-muted)',
                        }}>
                          #{i + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                            {bid.profiles?.name ?? 'Anonymous'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={10} /> {formatDate(bid.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <p style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0,
                        color: i === 0 ? 'var(--green)' : 'var(--text)',
                      }}>
                        {formatCurrency(bid.amount)}
                      </p>
                    </div>

                    {/* Contact row — only visible to seller */}
                    {isSeller && contact && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginLeft: '38px' }}>
                        <a href={`tel:${contact}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 10px', gap: '5px' }}>
                          <Phone size={12} /> {contact}
                        </a>
                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer"
                            className="btn-primary" style={{ fontSize: '0.75rem', padding: '5px 10px', gap: '5px', background: '#22c55e' }}>
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                    {isSeller && !contact && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '6px', marginLeft: '38px' }}>
                        No contact number on file
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Offers */}
          {offers.length > 0 && (
            <div>
              <p style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px',
              }}>
                <AlertCircle size={11} /> Offers (below starting price)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {offers.map(bid => {
                  const contact = bid.profiles?.contact
                  const waUrl = contact
                    ? `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your offer on FastBid!')}`
                    : null

                  return (
                    <div key={bid.id} style={{ borderRadius: '8px', background: 'var(--accent-subtle)', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                          {bid.profiles?.name ?? 'Anonymous'}
                        </p>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>
                          {formatCurrency(bid.amount)}
                        </p>
                      </div>
                      {isSeller && contact && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <a href={`tel:${contact}`} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 9px', gap: '4px' }}>
                            <Phone size={11} /> {contact}
                          </a>
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer"
                              className="btn-primary" style={{ fontSize: '0.72rem', padding: '4px 9px', gap: '4px', background: '#22c55e' }}>
                              <MessageCircle size={11} /> WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                      {isSeller && !contact && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '5px' }}>No contact on file</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
