'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Trash2, Star, StarOff, Flag, Eye, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, isListingActive } from '@/lib/utils'
import type { Listing, Profile, Report } from '@/lib/types'

interface ReportWithDetails extends Report {
  listings: Pick<Listing, 'id' | 'title'> | null
  profiles: Pick<Profile, 'name'> | null
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
    maxWidth: '860px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
  },
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [listings, setListings]     = useState<Listing[]>([])
  const [reports, setReports]       = useState<ReportWithDetails[]>([])
  const [users, setUsers]           = useState<Profile[]>([])
  const [tab, setTab]               = useState<'listings' | 'reports' | 'users'>('listings')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      setAuthorized(true)
      const [{ data: l }, { data: r }, { data: u }] = await Promise.all([
        supabase.from('listings_with_bids').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*, listings(id, title), profiles(name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ])
      setListings((l as Listing[]) || [])
      setReports((r as ReportWithDetails[]) || [])
      setUsers((u as Profile[]) || [])
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

  if (loading || !authorized) return (
    <div style={S.page}>
      <div style={{ ...S.inner, gap: '16px' }}>
        {[1,2,3].map(i => (
          <div key={i} className="animate-pulse card" style={{ height: '64px', background: 'var(--bg-subtle)' }} />
        ))}
      </div>
    </div>
  )

  const tabList = [
    { key: 'listings', label: `Listings (${listings.length})` },
    { key: 'reports',  label: `Reports (${reports.length})` },
    { key: 'users',    label: `Users (${users.length})` },
  ] as const

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '3px' }}>Manage the FastBid marketplace</p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total Listings', value: listings.length },
            { label: 'Reports',        value: reports.length },
            { label: 'Users',          value: users.length },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div>
          <div style={{
            display: 'inline-flex', gap: '4px', padding: '4px',
            background: 'var(--bg-subtle)', borderRadius: '10px', marginBottom: '16px',
          }}>
            {tabList.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                background: tab === key ? 'var(--bg-card)' : 'transparent',
                color: tab === key ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Listings tab ── */}
          {tab === 'listings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {listings.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No listings yet.
                </div>
              ) : listings.map(l => {
                const active = isListingActive(l)
                return (
                  <div key={l.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Status dot */}
                    <div style={{
                      width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
                      background: active ? 'var(--green)' : 'var(--text-light)',
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link href={`/listings/${l.id}`} style={{
                          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                          {l.title}
                        </Link>
                        {l.is_featured && <Star size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} fill="currentColor" />}
                      </div>
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {l.seller_name} · {l.category} · {formatCurrency(l.starting_price)} · {l.bid_count ?? 0} bids
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => toggleFeature(l)} className="btn-secondary" style={{ padding: '6px 10px' }}
                        title={l.is_featured ? 'Unfeature' : 'Feature'}>
                        {l.is_featured ? <StarOff size={14} /> : <Star size={14} />}
                      </button>
                      <button onClick={() => toggleActive(l)} className="btn-secondary" style={{ padding: '6px 10px' }}
                        title={l.is_active ? 'Deactivate' : 'Activate'}>
                        {l.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <Link href={`/listings/${l.id}`} className="btn-secondary" style={{ padding: '6px 10px' }}>
                        <Eye size={14} />
                      </Link>
                      <button onClick={() => deleteListing(l.id)} className="btn-secondary"
                        style={{ padding: '6px 10px', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Reports tab ── */}
          {tab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <Flag size={36} style={{ color: 'var(--text-light)', margin: '0 auto 14px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No reports submitted</p>
                </div>
              ) : reports.map(r => (
                <div key={r.id} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {r.listings ? (
                          <Link href={`/listings/${r.listings.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                            {r.listings.title}
                          </Link>
                        ) : <span style={{ color: 'var(--text-muted)' }}>Deleted listing</span>}
                      </p>
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Reported by {r.profiles?.name ?? 'Unknown'} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    {r.listings && (
                      <button onClick={() => deleteListing(r.listings!.id)} className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', flexShrink: 0 }}>
                        <Trash2 size={13} /> Delete listing
                      </button>
                    )}
                  </div>
                  <p style={{
                    fontSize: '0.875rem', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-subtle)', color: 'var(--text)',
                  }}>
                    {r.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Users tab ── */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map(u => (
                <div key={u.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--accent-subtle)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem',
                  }}>
                    {u.name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                      {u.is_admin && (
                        <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '0.7rem' }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {u.contact || 'No contact'} · {u.hostel || 'No hostel'}
                    </p>
                  </div>

                  {/* Toggle admin */}
                  <button onClick={() => toggleAdmin(u)} className="btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.8rem', flexShrink: 0 }}>
                    <ShieldCheck size={14} />
                    {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
