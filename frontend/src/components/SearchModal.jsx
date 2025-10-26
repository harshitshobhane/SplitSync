import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { useDebounce } from '../hooks/useUtils'

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, onFilter }) => {
  const [filters, setFilters] = useState({
    category: '',
    dateRange: '',
    amountRange: '',
    sortBy: 'date'
  })
  
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    onFilter(filters)
    onClose()
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      dateRange: '',
      amountRange: '',
      sortBy: 'date'
    })
    setSearchQuery('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="bg-background rounded-2xl p-6 w-full max-w-md shadow-xl border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search & Filter</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses..."
                    className="input pl-10 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">All Categories</option>
                    <option value="groceries">Groceries</option>
                    <option value="rent">Rent/Home</option>
                    <option value="food">Restaurants</option>
                    <option value="dating">Date Night</option>
                    <option value="utils">Utilities</option>
                    <option value="travel">Travel</option>
                    <option value="fun">Entertainment</option>
                    <option value="gifts">Gifts</option>
                    <option value="bills">Bills</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input w-full"
                  >
                    <option value="date">Date (Newest)</option>
                    <option value="amount">Amount (High to Low)</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={applyFilters} className="btn btn-primary flex-1 py-3">
                  Apply Filters
                </button>
                <button onClick={clearFilters} className="btn btn-secondary px-4 py-3">
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchModal
