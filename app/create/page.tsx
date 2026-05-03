'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, Tag, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, HOSTELS } from '@/lib/types'

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card" style={{ padding: '24px' }}>
    <p className="section-label" style={{ marginBottom: '18px' }}>{title}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
  </div>
)

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>{hint}</p>}
  </div>
)

export default function CreateListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [images, setImages]   = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [tagInput, setTagInput]   = useState('')
  const [tags, setTags]           = useState<string[]>([])
  const [form, setForm] = useState({
    title: '', description: '', starting_price: '',
    category: '', hostel: '', duration_type: 'fixed', duration_days: '3',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) { setError('Max 5 images'); return }
    const valid = files.filter(f => f.size < 5 * 1024 * 1024)
    setImages(p => [...p, ...valid])
    setImageUrls(p => [...p, ...valid.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (i: number) => {
    setImages(p => p.filter((_, idx) => idx !== i))
    setImageUrls(p => p.filter((_, idx) => idx !== i))
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t) && tags.length < 8) setTags(p => [...p, t])
    setTagInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!userId) { setError('Not authenticated'); return }
    if (!form.title || !form.starting_price || !form.category) { setError('Fill in all required fields'); return }
    setLoading(true)

    const paths: string[] = []
    for (const file of images) {
      const ext  = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: ue } = await supabase.storage.from('listing-images').upload(path, file)
      if (!ue) paths.push(path)
    }

    let ends_at: string | null = null
    if (form.duration_type === 'fixed') {
      const d = new Date(); d.setDate(d.getDate() + parseInt(form.duration_days))
      ends_at = d.toISOString()
    }

    const { data, error: ie } = await supabase.from('listings').insert({
      seller_id: userId, title: form.title, description: form.description || null,
      images: paths, starting_price: parseFloat(form.starting_price),
      category: form.category, tags, duration_type: form.duration_type,
      ends_at, hostel: form.hostel || null, is_active: true, is_featured: false,
    }).select().single()

    setLoading(false)
    if (ie) setError(ie.message)
    else router.push(`/listings/${data.id}`)
  }

  return (
    <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          List an Item
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
          Create a new auction listing for NISER students
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Basic Info */}
          <SectionCard title="Basic Info">
            <Field label="Title *">
              <input type="text" className="input" placeholder="e.g. HP Pavilion Laptop 15-inch"
                value={form.title} onChange={e => upd('title', e.target.value)} required maxLength={100} />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={4} style={{ resize: 'vertical' }}
                placeholder="Describe condition, defects, why you're selling…"
                value={form.description} onChange={e => upd('description', e.target.value)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Category *">
                <select className="input" value={form.category}
                  onChange={e => upd('category', e.target.value)} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Your Hostel">
                <select className="input" value={form.hostel} onChange={e => upd('hostel', e.target.value)}>
                  <option value="">Select hostel</option>
                  {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
            </div>
          </SectionCard>

          {/* Pricing & Duration */}
          <SectionCard title="Pricing & Duration">
            <Field label="Starting Price (₹) *">
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none',
                }}>₹</span>
                <input type="number" className="input" placeholder="500" style={{ paddingLeft: '28px' }}
                  value={form.starting_price} onChange={e => upd('starting_price', e.target.value)}
                  required min={0} />
              </div>
            </Field>

            <Field label="Duration Type">
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['fixed', 'open'] as const).map(d => (
                  <button key={d} type="button"
                    onClick={() => upd('duration_type', d)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                      border: '1.5px solid',
                      borderColor: form.duration_type === d ? 'var(--accent)' : 'var(--border)',
                      background: form.duration_type === d ? 'var(--accent-subtle)' : 'var(--bg-card)',
                      color: form.duration_type === d ? 'var(--accent-text)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}>
                    {d === 'fixed' ? '📅 Fixed Duration' : '♾️ Open Until Sold'}
                  </button>
                ))}
              </div>
            </Field>

            {form.duration_type === 'fixed' && (
              <Field label="Duration">
                <select className="input" value={form.duration_days} onChange={e => upd('duration_days', e.target.value)}>
                  {[1,2,3,5,7].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
                </select>
              </Field>
            )}
          </SectionCard>

          {/* Images */}
          <SectionCard title="Photos (up to 5)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {imageUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: '88px', height: '88px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(i)} style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label style={{
                  width: '88px', height: '88px', borderRadius: '10px',
                  border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px',
                  color: 'var(--text-muted)', transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <Upload size={18} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Add photo</span>
                  <input type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={handleImageAdd} />
                </label>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max 5MB per image · JPG, PNG, WebP</p>
          </SectionCard>

          {/* Tags */}
          <SectionCard title="Tags">
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="input-icon-wrap" style={{ flex: 1 }}>
                <span className="icon"><Tag size={14} /></span>
                <input type="text" className="input" placeholder="Add a tag and press Enter or +"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
              </div>
              <button type="button" onClick={addTag} className="btn-secondary" style={{ padding: '10px 14px', flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map(tag => (
                  <span key={tag} className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', gap: '6px' }}>
                    #{tag}
                    <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
            {loading ? 'Publishing…' : '🚀 Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
