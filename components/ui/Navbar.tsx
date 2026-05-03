'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sun, Moon, Plus, User, LogOut, LayoutDashboard, ShieldCheck, Zap, Pencil, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from './ThemeProvider'
import type { Profile } from '@/lib/types'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }
    getProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data))
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const MenuItem = ({
    href, onClick, icon: Icon, label, danger, accent, mobileOnly,
  }: {
    href?: string; onClick?: () => void; icon: React.ElementType;
    label: string; danger?: boolean; accent?: boolean; mobileOnly?: boolean;
  }) => {
    const style: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 16px', borderRadius: '8px', width: '100%',
      fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
      textDecoration: 'none', border: 'none', background: 'none',
      color: danger ? '#ef4444' : accent ? 'var(--accent)' : 'var(--text)',
      fontFamily: 'var(--font-body)',
      transition: 'background 0.12s',
    }
    const onHover = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
      (e.currentTarget as HTMLElement).style.background = enter
        ? (danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-subtle)')
        : 'none'
    }

    const content = (
      <>
        <span style={{
          width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: danger ? 'rgba(239,68,68,0.1)' : accent ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
          color: danger ? '#ef4444' : accent ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          <Icon size={15} />
        </span>
        {label}
      </>
    )

    if (href) return (
      <Link href={href} onClick={onClick} style={style}
        onMouseEnter={e => onHover(e, true)} onMouseLeave={e => onHover(e, false)}
        className={mobileOnly ? 'sm:hidden' : ''}>
        {content}
      </Link>
    )
    return (
      <button onClick={onClick} style={style}
        onMouseEnter={e => onHover(e, true)} onMouseLeave={e => onHover(e, false)}>
        {content}
      </button>
    )
  }

  return (
    <nav style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="page-container" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: 'var(--accent)' }}>
            <Zap size={16} fill="white" color="white" />
          </span>
          FastBid
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '0.85rem' }}
            className="hidden sm:inline">· NISER</span>
        </Link>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Theme toggle */}
          <button onClick={toggle} className="btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!loading && (
            <>
              {profile ? (
                <>
                  {/* List Item button */}
                  <Link href="/create" className="btn-primary hidden sm:flex" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Plus size={15} /> List Item
                  </Link>

                  {/* Profile dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setMenuOpen(o => !o)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px 6px 8px',
                        background: menuOpen ? 'var(--bg-subtle)' : 'var(--bg-card)',
                        border: '1.5px solid', borderColor: menuOpen ? 'var(--border-strong)' : 'var(--border)',
                        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {/* Avatar */}
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                        background: 'var(--accent)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700,
                      }}>
                        {profile.name[0].toUpperCase()}
                      </span>
                      <span className="hidden sm:block" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile.name.split(' ')[0]}
                      </span>
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                    </button>

                    {menuOpen && (
                      <>
                        {/* Backdrop */}
                        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />

                        {/* Dropdown panel */}
                        <div className="card fade-in" style={{
                          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                          width: '220px', zIndex: 50,
                          boxShadow: 'var(--shadow-lg)',
                          padding: '8px',
                          display: 'flex', flexDirection: 'column', gap: '2px',
                        }}>
                          {/* User info header */}
                          <div style={{
                            padding: '12px 14px 14px',
                            marginBottom: '4px',
                            borderBottom: '1px solid var(--border)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                                background: 'var(--accent)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
                              }}>
                                {profile.name[0].toUpperCase()}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {profile.name}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                  {profile.hostel || 'No hostel set'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <MenuItem href="/profile" onClick={() => setMenuOpen(false)} icon={Pencil} label="Edit Profile" />
                          <MenuItem href="/dashboard" onClick={() => setMenuOpen(false)} icon={LayoutDashboard} label="Dashboard" />
                          {profile.is_admin && (
                            <MenuItem href="/admin" onClick={() => setMenuOpen(false)} icon={ShieldCheck} label="Admin Panel" accent />
                          )}
                          <MenuItem href="/create" onClick={() => setMenuOpen(false)} icon={Plus} label="List an Item" mobileOnly />

                          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                          <MenuItem onClick={handleSignOut} icon={LogOut} label="Sign out" danger />
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Sign in</Link>
                  <Link href="/signup" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Join</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
