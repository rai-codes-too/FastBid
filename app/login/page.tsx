'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)' }}>
              <Zap size={24} fill="white" className="text-white" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to FastBid</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                className="input pl-9"
                placeholder="you@niser.ac.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                className="input pl-9"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-muted">
            New to FastBid?{' '}
            <Link href="/signup" className="text-accent font-medium hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
