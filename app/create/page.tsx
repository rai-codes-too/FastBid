'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, Tag, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, HOSTELS } from '@/lib/types'

export default function CreateListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    starting_price: '',
    category: '',
    hostel: '',
    duration_type: 'fixed',
    duration_days: '3',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }
    const newFiles = files.filter(f => f.size < 5 * 1024 * 1024)
    setImages(prev => [...prev, ...newFiles])
    setImageUrls(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setImageUrls(prev => prev.filter((_, idx) => idx !== i))
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags(prev => [...prev, t])
    }
    setTagInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userId) { setError('Not authenticated'); return }
    if (!form.title || !form.starting_price || !form.category) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    // Upload images
    const uploadedPaths: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file)

      if (!uploadError) uploadedPaths.push(path)
    }

    // Calculate end date
    let ends_at: string | null = null
    if (form.duration_type === 'fixed') {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(form.duration_days))
      ends_at = d.toISOString()
    }

    const { data, error: insertError } = await supabase.from('listings').insert({
      seller_id: userId,
      title: form.title,
      description: form.description || null,
      images: uploadedPaths,
      starting_price: parseFloat(form.starting_price),
      category: form.category,
      tags,
      duration_type: form.duration_type,
      ends_at,
      hostel: form.hostel || null,
      is_active: true,
      is_featured: false,
    }).select().single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push(`/listings/${data.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">List an Item</h1>
        <p className="text-muted text-sm mt-1">Create a new auction listing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">Basic Info</h2>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <input type="text" className="input" placeholder="e.g. HP Pavilion Laptop 15-inch"
              value={form.title} onChange={e => update('title', e.target.value)} required maxLength={100} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea className="input resize-none" rows={4}
              placeholder="Describe the item's condition, any defects, why you're selling..."
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category *</label>
              <select className="input" value={form.category}
                onChange={e => update('category', e.target.value)} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Hostel</label>
              <select className="input" value={form.hostel}
                onChange={e => update('hostel', e.target.value)}>
                <option value="">Select hostel</option>
                {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Duration */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">Pricing & Duration</h2>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Starting Price (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium">₹</span>
              <input type="number" className="input pl-7" placeholder="500"
                value={form.starting_price} onChange={e => update('starting_price', e.target.value)}
                required min={0} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Duration Type</label>
            <div className="flex gap-3">
              {(['fixed', 'open'] as const).map(d => (
                <button key={d} type="button"
                  onClick={() => update('duration_type', d)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${form.duration_type === d
                    ? 'border-accent text-accent'
                    : 'border-border text-muted'
                  }`}
                  style={{
                    backgroundColor: form.duration_type === d ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                    borderColor: form.duration_type === d ? 'var(--accent)' : 'var(--border)',
                  }}>
                  {d === 'fixed' ? '📅 Fixed Duration' : '♾️ Open Until Sold'}
                </button>
              ))}
            </div>
          </div>

          {form.duration_type === 'fixed' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duration</label>
              <select className="input" value={form.duration_days}
                onChange={e => update('duration_days', e.target.value)}>
                {[1, 2, 3, 5, 7].map(d => (
                  <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">Images (up to 5)</h2>

          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border"
                style={{ borderColor: 'var(--border)' }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
                style={{ borderColor: 'var(--border)' }}>
                <Upload size={18} className="text-muted mb-1" />
                <span className="text-xs text-muted">Add photo</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageAdd} />
              </label>
            )}
          </div>
          <p className="text-xs text-muted">Max 5MB per image. JPG, PNG, WebP.</p>
        </div>

        {/* Tags */}
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">Tags</h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" className="input pl-8 text-sm" placeholder="Add a tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
            </div>
            <button type="button" onClick={addTag} className="btn-secondary px-3">
              <Plus size={15} />
            </button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="badge text-sm flex items-center gap-1"
                  style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  #{tag}
                  <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
            style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full justify-center text-base py-3" disabled={loading}>
          {loading ? 'Publishing...' : '🚀 Publish Listing'}
        </button>
      </form>
    </div>
  )
}
