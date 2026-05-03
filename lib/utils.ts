import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTimeLeft(endsAt: string | null, durationType: string): string {
  if (durationType === 'open') return 'Open until sold'
  if (!endsAt) return 'Unknown'
  if (isPast(new Date(endsAt))) return 'Ended'
  return `Ends ${formatDistanceToNow(new Date(endsAt), { addSuffix: true })}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function isListingActive(listing: { is_active: boolean; duration_type: string; ends_at: string | null }) {
  if (!listing.is_active) return false
  if (listing.duration_type === 'open') return true
  if (!listing.ends_at) return true
  return !isPast(new Date(listing.ends_at))
}

export function getImageUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/listing-images/${path}`
}
