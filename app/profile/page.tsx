'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Home, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HOSTELS } from '@/lib/types'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const router   = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm]       = useState({ name: '', contact: '', hostel: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) { setProfile(data); setForm({ name: data.name, contact: data.contact || '', hostel: data.hostel || '' }) }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)
    const { error } = await supabase.from('profiles')
      .update({ name: form.name, contact: form.contact || null, hostel: form.hostel || null })
      .eq('id', profile!.id)
    setSaving(false)
    if (error) setError(error.message)
    else setSuccess(true)
  }

  if (loading) return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-pulse" style={{ height: '32px', width: '200px', borderRadius: '8px', background: 'var(--bg-subtle)' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>
          Edit Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
          Update your name, contact number, and hostel.
        </p>

        <form onSubmit={handleSave} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Full Name *</label>
            <div className="input-icon-wrap">
              <span className="icon"><User size={16} /></span>
              <input type="text" className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Contact Number</label>
            <div className="input-icon-wrap">
              <span className="icon"><Phone size={16} /></span>
              <input type="tel" className="input" placeholder="+91 98765 43210"
                value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Hostel</label>
            <div className="input-icon-wrap">
              <span className="icon"><Home size={16} /></span>
              <select className="input" value={form.hostel}
                onChange={e => setForm(f => ({ ...f, hostel: e.target.value }))}
                style={{ paddingLeft: '38px' }}>
                <option value="">Select hostel</option>
                {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '0.85rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', background: 'var(--green-subtle)', color: 'var(--green)', fontSize: '0.85rem' }}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} /> Profile updated successfully!
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
