'use client'

import { useState } from 'react'
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
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

export default function BidForm({
  listingId, startingPrice, highestBid, userId, sellerId, isActive
}: BidFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const minValid = Math.max(startingPrice, highestBid > 0 ? highestBid + 1 : startingPrice)
  const parsedAmount = parseFloat(amount)
  const isOffer = parsedAmount > 0 && parsedAmount < startingPrice

  const handleBid = async () => {
    setError('')
    setSuccess('')

    if (!userId) { setError('Please sign in to place a bid.'); return }
    if (userId === sellerId) { setError('You cannot bid on your own listing.'); return }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.'); return
    }

    setLoading(true)

    const { error: bidError } = await supabase.from('bids').insert({
      listing_id: listingId,
      bidder_id: userId,
      amount: parsedAmount,
      is_offer: isOffer,
    })

    setLoading(false)

    if (bidError) {
      setError('Failed to place bid. Please try again.')
    } else {
      setSuccess(isOffer
        ? `Offer of ${formatCurrency(parsedAmount)} sent! The seller will contact you if accepted.`
        : `Bid of ${formatCurrency(parsedAmount)} placed successfully!`
      )
      setAmount('')
    }
  }

  if (!isActive) {
    return (
      <div className="card p-4 text-center text-muted text-sm">
        This auction has ended.
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-display font-semibold">Place a Bid</h3>

      <div className="text-sm text-muted space-y-1">
        <p>Starting price: <strong className="text-text">{formatCurrency(startingPrice)}</strong></p>
        {highestBid > 0 && (
          <p>Highest bid: <strong className="text-green">{formatCurrency(highestBid)}</strong></p>
        )}
      </div>

      {/* Amount input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium text-sm">₹</span>
        <input
          type="number"
          className="input pl-7"
          placeholder={`${minValid}+`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={0}
        />
      </div>

      {/* Offer warning */}
      {isOffer && (
        <div className="flex items-start gap-2 text-xs p-2 rounded-lg"
          style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            This amount is below the starting price — it will be submitted as an <strong>offer</strong>.
            The seller may accept or ignore it.
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green flex items-center gap-1">
          <CheckCircle size={12} /> {success}
        </p>
      )}

      {!userId ? (
        <a href="/login" className="btn-primary w-full justify-center text-sm">
          Sign in to bid
        </a>
      ) : (
        <button
          onClick={handleBid}
          disabled={loading || !amount}
          className="btn-primary w-full justify-center"
        >
          <TrendingUp size={15} />
          {loading ? 'Placing...' : isOffer ? 'Send Offer' : 'Place Bid'}
        </button>
      )}
    </div>
  )
}
