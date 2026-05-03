'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Mail, Lock, User, Phone, Home, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HOSTELS } from '@/lib/types'

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>{hint}</p>}
  </div>
)

export default function SignupPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', contact: '', hostel: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const supabase = createClient()
  const router   = useRouter()
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, contact: form.contact || null, hostel: form.hostel || null } },
    })
    setLoading(false)
    if (error) setError(error.message)
    else { router.push('/'); router.refresh() }
  }

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(232,87,31,0.3)',
          }}>
            <Zap size={26} fill="white" color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>Join FastBid</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>NISER student marketplace</p>
        </div>

        <form onSubmit={handleSignup} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <Field label="Full Name *">
            <div className="input-icon-wrap">
              <span className="icon"><User size={16} /></span>
              <input type="text" className="input" placeholder="Arjun Patel"
                value={form.name} onChange={e => upd('name', e.target.value)} required />
            </div>
          </Field>

          <Field label="Email *">
            <div className="input-icon-wrap">
              <span className="icon"><Mail size={16} /></span>
              <input type="email" className="input" placeholder="you@niser.ac.in"
                value={form.email} onChange={e => upd('email', e.target.value)} required />
            </div>
          </Field>

          <Field label="Password *">
            <div className="input-icon-wrap">
              <span className="icon"><Lock size={16} /></span>
              <input type="password" className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => upd('password', e.target.value)} required minLength={6} />
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Contact">
              <div className="input-icon-wrap">
                <span className="icon"><Phone size={15} /></span>
                <input type="tel" className="input" placeholder="+91 …"
                  value={form.contact} onChange={e => upd('contact', e.target.value)} />
              </div>
            </Field>
            <Field label="Hostel">
              <div className="input-icon-wrap">
                <span className="icon"><Home size={15} /></span>
                <select className="input" value={form.hostel} onChange={e => upd('hostel', e.target.value)}
                  style={{ paddingLeft: '38px' }}>
                  <option value="">Select…</option>
                  {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </Field>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 14px', borderRadius: '10px',
              background: 'var(--accent-subtle)', color: 'var(--accent-text)',
              fontSize: '0.85rem',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
