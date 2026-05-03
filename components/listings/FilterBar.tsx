'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, HOSTELS, type Category } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  onSearch: (q: string) => void
  onCategory: (c: Category | '') => void
  onPriceRange: (min: number | null, max: number | null) => void
  onHostel: (h: string) => void
}

export default function FilterBar({ onSearch, onCategory, onPriceRange, onHostel }: FilterBarProps) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [category, setCategory] = useState<Category | ''>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [hostel, setHostel] = useState('')

  const activeFilters = [category, hostel, minPrice, maxPrice].filter(Boolean).length

  const applyFilters = () => {
    onCategory(category)
    onPriceRange(
      minPrice ? parseFloat(minPrice) : null,
      maxPrice ? parseFloat(maxPrice) : null
    )
    onHostel(hostel)
  }

  const clearAll = () => {
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setHostel('')
    onCategory('')
    onPriceRange(null, null)
    onHostel('')
    setQuery('')
    onSearch('')
  }

  return (
    <div className="space-y-3">
      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search listings, tags..."
            value={query}
            onChange={e => { setQuery(e.target.value); onSearch(e.target.value) }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('btn-secondary relative', showFilters && 'border-accent')}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)', fontSize: '0.65rem' }}>
              {activeFilters}
            </span>
          )}
        </button>
        {(activeFilters > 0 || query) && (
          <button onClick={clearAll} className="btn-secondary px-2 py-2 text-muted">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Category */}
          <div>
            <label className="text-xs text-muted mb-1 block font-medium">Category</label>
            <select
              className="input text-sm"
              value={category}
              onChange={e => setCategory(e.target.value as Category | '')}
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Min price */}
          <div>
            <label className="text-xs text-muted mb-1 block font-medium">Min Price (₹)</label>
            <input
              type="number"
              className="input text-sm"
              placeholder="0"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
            />
          </div>

          {/* Max price */}
          <div>
            <label className="text-xs text-muted mb-1 block font-medium">Max Price (₹)</label>
            <input
              type="number"
              className="input text-sm"
              placeholder="Any"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Hostel */}
          <div>
            <label className="text-xs text-muted mb-1 block font-medium">Hostel</label>
            <select
              className="input text-sm"
              value={hostel}
              onChange={e => setHostel(e.target.value)}
            >
              <option value="">Any hostel</option>
              {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4 flex justify-end gap-2">
            <button onClick={clearAll} className="btn-secondary text-sm py-2 px-3">Clear</button>
            <button onClick={() => { applyFilters(); setShowFilters(false) }} className="btn-primary text-sm py-2 px-3">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
