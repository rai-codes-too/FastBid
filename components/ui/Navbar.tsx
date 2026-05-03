'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sun, Moon, Plus, User, LogOut, LayoutDashboard, ShieldCheck, Zap } from 'lucide-react'
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
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setLoading(false)
    }
    getProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getProfile()
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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <Zap size={20} className="text-accent" fill="currentColor" />
          <span>FastBid</span>
          <span className="text-muted font-body font-normal text-sm hidden sm:inline">· NISER</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
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
                      <div className="absolute right-0 top-full mt-1 card p-1 w-48 z-50 shadow-lg">
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
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary text-sm py-2 px-3">
                    Sign in
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm py-2 px-3">
                    Join
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
