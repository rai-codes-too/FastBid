'use client'

import { useState } from 'react'
import { TrendingUp, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface BidFormProps {
  listingId: string
  startingPrice: number
  highestBid: number
  userId: string | null
  sellerId: string
  isActive: boolean
}

export default function BidForm({ listingId, startingPrice, highestBid, userId, sellerId, isActive }: BidFormProps) {
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const parsedAmount = parseFloat(amount)
  const isOffer      = parsedAmount > 0 && parsedAmount < startingPrice
  const isValid      = parsedAmount > 0 && !isNaN(parsedAmount)
  const minSuggested = highestBid > 0 ? highestBid + 1 : startingPrice

  const handleBid = async () => {
    setError(''); setSuccess('')
    if (!userId)                              { setError('Please sign in to place a bid.'); return }
    if (userId === sellerId)                  { setError('You cannot bid on your own listing.'); return }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Enter a valid amount.'); return }

    setLoading(true)
    const { error: bidError } = await supabase.from('bids').insert({
      listing_id: listingId, bidder_id: userId, amount: parsedAmount, is_offer: isOffer,
    })
    setLoading(false)

    if (bidError) {
      setError('Failed to place bid. Please try again.')
    } else {
      setSuccess(isOffer
        ? `Offer of ${formatCurrency(parsedAmount)} sent!`
        : `Bid of ${formatCurrency(parsedAmount)} placed!`
      )
      setAmount('')
    }
  }

  if (!isActive) return (
    <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      This auction has ended.
    </div>
  )

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '12px' }}>
          Place a Bid
        </h3>

        {/* Price summary chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: '100px',
            padding: '10px 14px', borderRadius: '10px',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Starting
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
              {formatCurrency(startingPrice)}
            </p>
          </div>

          {highestBid > 0 && (
            <div style={{
              flex: 1, minWidth: '100px',
              padding: '10px 14px', borderRadius: '10px',
              background: 'var(--green-subtle)', border: '1px solid var(--green)',
              borderOpacity: 0.3,
            }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Highest Bid
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>
                {formatCurrency(highestBid)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)' }} />

      {/* Amount input */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          Your amount
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* Rupee symbol box */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', borderRadius: '10px 0 0 10px',
            fontWeight: 700, fontSize: '0.95rem',
            pointerEvents: 'none', flexShrink: 0,
            zIndex: 1,
          }}>
            ₹
          </div>
          <input
            type="number"
            className="input"
            placeholder={String(minSuggested)}
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); setSuccess('') }}
            min={0}
            style={{
              paddingLeft: '52px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              // Override left border so it merges with the ₹ box
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
            }}
          />
        </div>

        {/* Hint text */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '6px' }}>
          {highestBid > 0
            ? `Bid above ${formatCurrency(highestBid)} to lead · below ${formatCurrency(startingPrice)} counts as an offer`
            : `Min. ${formatCurrency(startingPrice)} · lower amounts count as offers`}
        </p>
      </div>

      {/* Offer notice */}
      {isOffer && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 14px', borderRadius: '10px',
          background: 'var(--accent-subtle)', border: '1px solid var(--accent)',
          borderOpacity: 0.25,
        }}>
          <AlertCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-text)', lineHeight: 1.6 }}>
            Below starting price — this will be sent as an <strong>offer</strong>. The seller can accept or ignore it.
          </p>
        </div>
      )}

      {/* Error / success */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#ef4444' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 14px', borderRadius: '10px',
          background: 'var(--green-subtle)', fontSize: '0.825rem', color: 'var(--green)',
        }}>
          <CheckCircle size={14} style={{ flexShrink: 0 }} /> {success}
        </div>
      )}

      {/* CTA */}
      {!userId ? (
        <a href="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
          Sign in to bid <ArrowRight size={15} />
        </a>
      ) : (
        <button onClick={handleBid} disabled={loading || !isValid} className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
          <TrendingUp size={16} />
          {loading ? 'Placing…' : isOffer ? 'Send Offer' : 'Place Bid'}
        </button>
      )}
    </div>
  )
}
