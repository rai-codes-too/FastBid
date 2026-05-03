'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, HOSTELS, type Category } from '@/lib/types'

interface FilterBarProps {
  onSearch: (q: string) => void
  onCategory: (c: Category | '') => void
  onPriceRange: (min: number | null, max: number | null) => void
  onHostel: (h: string) => void
}

export default function FilterBar({ onSearch, onCategory, onPriceRange, onHostel }: FilterBarProps) {
  const [query, setQuery]       = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [category, setCategory] = useState<Category | ''>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [hostel, setHostel]     = useState('')

  const activeFilters = [category, hostel, minPrice, maxPrice].filter(Boolean).length

  const applyFilters = () => {
    onCategory(category)
    onPriceRange(
      minPrice ? parseFloat(minPrice) : null,
      maxPrice ? parseFloat(maxPrice) : null,
    )
    onHostel(hostel)
  }

  const clearAll = () => {
    setCategory(''); setMinPrice(''); setMaxPrice(''); setHostel('')
    setQuery('')
    onCategory(''); onPriceRange(null, null); onHostel(''); onSearch('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ── Search row ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Search input */}
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <span className="icon"><Search size={16} /></span>
          <input
            type="text"
            className="input"
            placeholder="Search listings, tags..."
            value={query}
            onChange={e => { setQuery(e.target.value); onSearch(e.target.value) }}
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(s => !s)}
          className="btn-secondary"
          style={{
            padding: '10px 16px',
            position: 'relative',
            borderColor: showFilters ? 'var(--accent)' : undefined,
            color: showFilters ? 'var(--accent)' : undefined,
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeFilters > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              fontSize: '0.65rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeFilters}
            </span>
          )}
        </button>

        {/* Clear button */}
        {(activeFilters > 0 || query) && (
          <button onClick={clearAll} className="btn-secondary" style={{ padding: '10px 12px' }} title="Clear all">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="card fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select className="input" value={category}
                onChange={e => setCategory(e.target.value as Category | '')}>
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Min Price (₹)
              </label>
              <input type="number" className="input" placeholder="0"
                value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>

            {/* Max Price */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Max Price (₹)
              </label>
              <input type="number" className="input" placeholder="Any"
                value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>

            {/* Hostel */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Hostel
              </label>
              <select className="input" value={hostel} onChange={e => setHostel(e.target.value)}>
                <option value="">Any hostel</option>
                {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
            <button onClick={clearAll} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Clear all
            </button>
            <button
              onClick={() => { applyFilters(); setShowFilters(false) }}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
