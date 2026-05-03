'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid } from '@/lib/types'

interface BidHistoryProps {
  listingId: string
  startingPrice: number
}

interface BidWithBidder extends Bid {
  profiles: { name: string } | null
}

export default function BidHistory({ listingId, startingPrice }: BidHistoryProps) {
  const [bids, setBids] = useState<BidWithBidder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, profiles(name)')
      .eq('listing_id', listingId)
      .order('amount', { ascending: false })

    setBids((data as BidWithBidder[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBids()

    // Realtime subscription
    const channel = supabase
      .channel(`bids:${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `listing_id=eq.${listingId}`,
      }, () => {
        fetchBids()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [listingId])

  if (loading) {
    return <div className="text-sm text-muted p-4">Loading bids...</div>
  }

  const validBids = bids.filter(b => !b.is_offer)
  const offers = bids.filter(b => b.is_offer)

  return (
    <div className="card p-4 space-y-4">
      <h3 className="font-display font-semibold flex items-center gap-2">
        <TrendingUp size={16} className="text-accent" />
        Bid History
        {bids.length > 0 && (
          <span className="badge text-xs ml-1"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
            {bids.length}
          </span>
        )}
      </h3>

      {bids.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">No bids yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {/* Valid bids */}
          {validBids.length > 0 && (
            <div className="space-y-2">
              {validBids.map((bid, i) => (
                <div key={bid.id} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: i === 0 ? 'var(--green-subtle)' : 'var(--bg-subtle)',
                        color: i === 0 ? 'var(--green)' : 'var(--text-muted)',
                      }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{bid.profiles?.name ?? 'Anonymous'}</p>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(bid.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className={`font-display font-bold ${i === 0 ? 'text-green' : 'text-text'}`}>
                    {formatCurrency(bid.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Offers section */}
          {offers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle size={11} /> Offers (below starting price)
              </p>
              <div className="space-y-1">
                {offers.map(bid => (
                  <div key={bid.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                    style={{ backgroundColor: 'var(--accent-subtle)' }}>
                    <p className="text-sm">{bid.profiles?.name ?? 'Anonymous'}</p>
                    <p className="text-sm font-semibold text-accent">{formatCurrency(bid.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
