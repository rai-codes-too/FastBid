'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Mail, Lock, User, Phone, Home, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HOSTELS } from '@/lib/types'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', contact: '', hostel: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name: form.name,
        contact: form.contact || null,
        hostel: form.hostel || null,
        is_admin: false,
      })

      if (profileError) {
        setError('Account created but profile setup failed. Please contact admin.')
      } else {
        setSuccess(true)
      }
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--green-subtle)' }}>
            <CheckCircle size={32} className="text-green" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-muted text-sm mb-6">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/login" className="btn-primary">Go to Sign In</Link>
        </div>
      </div>
    )
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
          <h1 className="font-display text-2xl font-bold">Join FastBid</h1>
          <p className="text-muted text-sm mt-1">NISER student marketplace</p>
        </div>

        <form onSubmit={handleSignup} className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" className="input pl-9" placeholder="Arjun Patel"
                value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email *</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="email" className="input pl-9" placeholder="you@niser.ac.in"
                value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <p className="text-xs text-muted mt-1">Preferably use your NISER email</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Password *</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="password" className="input pl-9" placeholder="Min. 6 characters"
                value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Contact Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="tel" className="input pl-9" placeholder="+91 98765 43210"
                value={form.contact} onChange={e => update('contact', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Hostel</label>
            <div className="relative">
              <Home size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <select className="input pl-9 appearance-none" value={form.hostel}
                onChange={e => update('hostel', e.target.value)}>
                <option value="">Select hostel</option>
                {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-medium hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
