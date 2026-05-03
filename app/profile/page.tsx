'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Home, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HOSTELS } from '@/lib/types'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', contact: '', hostel: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({ name: data.name, contact: data.contact || '', hostel: data.hostel || '' })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: form.name, contact: form.contact || null, hostel: form.hostel || null })
      .eq('id', profile!.id)

    setSaving(false)
    if (updateError) setError(updateError.message)
    else setSuccess(true)
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="animate-pulse h-8 w-48 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" className="input pl-9" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Contact Number</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="tel" className="input pl-9" placeholder="+91 98765 43210"
              value={form.contact}
              onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Hostel</label>
          <div className="relative">
            <Home size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select className="input pl-9 appearance-none" value={form.hostel}
              onChange={e => setForm(f => ({ ...f, hostel: e.target.value }))}>
              <option value="">Select hostel</option>
              {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
            style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
            style={{ backgroundColor: 'var(--green-subtle)', color: 'var(--green)' }}>
            <CheckCircle size={14} /> Profile updated!
          </div>
        )}

        <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
