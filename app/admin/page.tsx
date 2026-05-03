'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Trash2, Star, StarOff, Flag, Eye, CheckCircle, XCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, isListingActive } from '@/lib/utils'
import type { Listing, Profile, Report } from '@/lib/types'

interface ReportWithDetails extends Report {
  listings: Pick<Listing, 'id' | 'title'> | null
  profiles: Pick<Profile, 'name'> | null
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [reports, setReports] = useState<ReportWithDetails[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [tab, setTab] = useState<'listings' | 'reports' | 'users'>('listings')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }

      setAuthorized(true)

      const [{ data: listingsData }, { data: reportsData }, { data: usersData }] = await Promise.all([
        supabase.from('listings_with_bids').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*, listings(id, title), profiles(name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ])

      setListings((listingsData as Listing[]) || [])
      setReports((reportsData as ReportWithDetails[]) || [])
      setUsers((usersData as Profile[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return
    await supabase.from('listings').delete().eq('id', id)
    setListings(l => l.filter(x => x.id !== id))
  }

  const toggleFeature = async (listing: Listing) => {
    await supabase.from('listings').update({ is_featured: !listing.is_featured }).eq('id', listing.id)
    setListings(l => l.map(x => x.id === listing.id ? { ...x, is_featured: !x.is_featured } : x))
  }

  const toggleActive = async (listing: Listing) => {
    await supabase.from('listings').update({ is_active: !listing.is_active }).eq('id', listing.id)
    setListings(l => l.map(x => x.id === listing.id ? { ...x, is_active: !x.is_active } : x))
  }

  const toggleAdmin = async (profile: Profile) => {
    await supabase.from('profiles').update({ is_admin: !profile.is_admin }).eq('id', profile.id)
    setUsers(u => u.map(x => x.id === profile.id ? { ...x, is_admin: !x.is_admin } : x))
  }

  if (loading || !authorized) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse h-8 w-48 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-subtle)' }}>
          <ShieldCheck size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted">Manage FastBid marketplace</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="font-display text-2xl font-bold">{listings.length}</p>
          <p className="text-xs text-muted">Total Listings</p>
        </div>
        <div className="card p-3 text-center">
          <p className="font-display text-2xl font-bold">{reports.length}</p>
          <p className="text-xs text-muted">Reports</p>
        </div>
        <div className="card p-3 text-center">
          <p className="font-display text-2xl font-bold">{users.length}</p>
          <p className="text-xs text-muted">Users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-4 w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {(['listings', 'reports', 'users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-card shadow-sm text-text' : 'text-muted hover:text-text'}`}
            style={{ backgroundColor: tab === t ? 'var(--bg-card)' : '' }}>
            {t === 'listings' ? `Listings (${listings.length})` :
             t === 'reports' ? `Reports (${reports.length})` :
             `Users (${users.length})`}
          </button>
        ))}
      </div>

      {/* Listings */}
      {tab === 'listings' && (
        <div className="space-y-2">
          {listings.map(l => {
            const active = isListingActive(l)
            return (
              <div key={l.id} className="card p-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/listings/${l.id}`} className="font-medium text-sm hover:text-accent truncate">
                      {l.title}
                    </Link>
                    {l.is_featured && <Star size={12} className="text-accent flex-shrink-0" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-muted">
                    {l.seller_name} · {l.category} · {formatCurrency(l.starting_price)} · {l.bid_count} bids
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleFeature(l)} className="btn-secondary px-2 py-1.5"
                    title={l.is_featured ? 'Unfeature' : 'Feature'}>
                    {l.is_featured ? <StarOff size={13} /> : <Star size={13} />}
                  </button>
                  <button onClick={() => toggleActive(l)} className="btn-secondary px-2 py-1.5"
                    title={l.is_active ? 'Deactivate' : 'Activate'}>
                    {l.is_active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                  </button>
                  <Link href={`/listings/${l.id}`} className="btn-secondary px-2 py-1.5">
                    <Eye size={13} />
                  </Link>
                  <button onClick={() => deleteListing(l.id)} className="btn-secondary px-2 py-1.5 text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Flag size={32} className="mx-auto mb-3 opacity-40" />
              <p>No reports submitted</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {r.listings ? (
                        <Link href={`/listings/${r.listings.id}`} className="hover:text-accent">
                          {r.listings.title}
                        </Link>
                      ) : 'Deleted listing'}
                    </p>
                    <p className="text-xs text-muted">
                      Reported by {r.profiles?.name ?? 'Unknown'} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  {r.listings && (
                    <button onClick={() => deleteListing(r.listings!.id)}
                      className="btn-secondary text-xs px-2 py-1.5 text-red-500">
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
                <p className="text-sm p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  {r.reason}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="card p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm"
                style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                {u.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm flex items-center gap-2">
                  {u.name}
                  {u.is_admin && (
                    <span className="badge text-xs" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">{u.contact || 'No contact'} · {u.hostel || 'No hostel'}</p>
              </div>
              <button onClick={() => toggleAdmin(u)}
                className="btn-secondary text-xs px-2 py-1.5">
                <ShieldCheck size={12} />
                {u.is_admin ? 'Remove Admin' : 'Make Admin'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
