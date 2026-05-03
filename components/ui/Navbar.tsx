'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sun, Moon, Plus, User, LogOut, LayoutDashboard, ShieldCheck, Zap, Pencil } from 'lucide-react'
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

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
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

  return (
    <nav style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <Zap size={20} className="text-accent" fill="currentColor" />
          <span>FastBid</span>
          <span className="text-muted font-body font-normal text-sm hidden sm:inline">· NISER</span>
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={toggle} className="btn-secondary px-2 py-2" title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!loading && (
            <>
              {profile ? (
                <>
                  <Link href="/create" className="btn-primary text-sm py-2 px-3 hidden sm:flex">
                    <Plus size={15} />
                    List Item
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="btn-secondary px-2 py-2 gap-2 text-sm"
                    >
                      <User size={16} />
                      <span className="hidden sm:inline max-w-24 truncate">{profile.name.split(' ')[0]}</span>
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 card p-1 w-52 z-50 shadow-lg">
                          <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-sm font-medium truncate">{profile.name}</p>
                            <p className="text-xs text-muted truncate">{profile.hostel || 'No hostel set'}</p>
                          </div>
                          <Link href="/profile" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-subtle w-full">
                            <Pencil size={15} />
                            Edit Profile
                          </Link>
                          <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-subtle w-full">
                            <LayoutDashboard size={15} />
                            Dashboard
                          </Link>
                          {profile.is_admin && (
                            <Link href="/admin" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-subtle w-full text-accent">
                              <ShieldCheck size={15} />
                              Admin Panel
                            </Link>
                          )}
                          <Link href="/create" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-subtle w-full sm:hidden">
                            <Plus size={15} />
                            List Item
                          </Link>
                          <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
                          <button onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-subtle w-full text-left">
                            <LogOut size={15} />
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary text-sm py-2 px-3">Sign in</Link>
                  <Link href="/signup" className="btn-primary text-sm py-2 px-3">Join</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
