import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import toast from 'react-hot-toast'
import {
  Loader2, Calculator, Percent, DollarSign, FileText, CreditCard, Tag, Users, Plus,
  ShoppingCart, Home, UtensilsCrossed, Heart, Zap, Plane, Ticket, Gift, FileText as FileTextIcon, HeartPulse, Car, MoreHorizontal, ChevronDown
} from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import { calculateSplitAmounts } from '../utils/calculations'
import { getCurrencySymbol } from '../utils/dateUtils'

const CategorySelector = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedCategory = selected ? CATEGORIES[selected] : null
  const SelectedIconComponent = selectedCategory ? iconMap[CATEGORIES[selected]?.icon] : null

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between input hover:border-foreground/50 transition-colors py-2.5 sm:py-3"
      >
        {selected && SelectedIconComponent ? (
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded bg-muted flex-shrink-0">
              <SelectedIconComponent className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: selectedCategory.color }} />
            </div>
            <span className="font-medium text-xs sm:text-sm truncate">{selectedCategory.label}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">Select category</span>
        )}
        <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-hidden"
          >
            <div className="overflow-y-auto max-h-64 custom-scrollbar">
              {Object.entries(CATEGORIES).map(([key, category]) => {
                const IconComponent = iconMap[category.icon]
                const isSelected = selected === key
                if (!IconComponent) return null
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange(key)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 hover:bg-accent transition-colors text-left ${isSelected ? 'bg-accent' : ''
                      }`}
                  >
                    <div className="p-1.5 sm:p-2 rounded bg-muted flex-shrink-0">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: category.color }} />
                    </div>
                    <span className="flex-1 font-medium text-xs sm:text-sm">{category.label}</span>
                    {isSelected && (
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const RatioSelector = ({ selected, onChange, names }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const ratioOptions = [
    { value: 50, label: '50/50 - Equal' },
    { value: 60, label: `60/40 - ${names.person1Name} pays more` },
    { value: 70, label: `70/30 - ${names.person1Name} pays more` },
    { value: 80, label: `80/20 - ${names.person1Name} pays most` },
    { value: 40, label: `40/60 - ${names.person2Name} pays more` },
    { value: 30, label: `30/70 - ${names.person2Name} pays more` },
    { value: 20, label: `20/80 - ${names.person2Name} pays most` },
    { value: 100, label: `100/0 - ${names.person1Name} pays all` },
    { value: 0, label: `0/100 - ${names.person2Name} pays all` }
  ]

  const selectedOption = ratioOptions.find(opt => opt.value === selected)

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between input hover:border-foreground/50 transition-colors py-2.5 sm:py-3"
      >
        {selectedOption ? (
          <span className="font-medium text-xs sm:text-sm truncate">{selectedOption.label}</span>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">Select ratio</span>
        )}
        <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-hidden"
          >
            <div className="overflow-y-auto max-h-64 custom-scrollbar">
              {ratioOptions.map((option) => {
                const isSelected = selected === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 hover:bg-accent transition-colors ${isSelected ? 'bg-accent' : ''
                      }`}
                  >
                    <span className="font-medium text-xs sm:text-sm">{option.label}</span>
                    {isSelected && (
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const iconMap = {
  ShoppingCart,
  Home,
  UtensilsCrossed,
  Heart,
  Zap,
  Plane,
  Ticket,
  Gift,
  FileText,
  HeartPulse,
  Car,
  MoreHorizontal
}

const AddExpensePage = ({ setPage, names, currency = 'USD' }) => {
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    category: '',
    paidBy: 'person1',
    splitType: 'equal',
    person1Ratio: 50,
    person1Share: '',
    notes: ''
  })
  const [error, setError] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const queryClient = useQueryClient()
  const total = parseFloat(formData.totalAmount) || 0

  // Fetch templates
  const { data: templatesData } = useQuery(['templates'], apiService.getTemplates, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Ensure templates is always an array (handle null/undefined responses)
  const templates = templatesData && Array.isArray(templatesData) ? templatesData : []

  // Load template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate || t._id === selectedTemplate)
      if (template) {
        setFormData({
          description: template.description,
          totalAmount: template.total_amount || template.totalAmount,
          category: template.category,
          paidBy: template.paid_by || template.paidBy,
          splitType: template.split_type || template.splitType,
          person1Ratio: template.split_type === 'ratio' ? (template.person1_share / (template.person1_share + template.person2_share)) * 100 : 50,
          person1Share: template.person1_share || '',
          notes: ''
        })
      }
    }
  }, [selectedTemplate, templates])

  const createExpenseMutation = useMutation(apiService.createExpense, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['transfers']) // Refresh transfers too for balance calculation
      if (data && data.queued) {
        toast.success('Expense queued and will sync when online')
      } else {
        toast.success('Expense added!')
      }
      setTimeout(() => setPage('dashboard'), 500)
    },
    onError: () => {
      toast.error('Failed to add expense')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.description || !total || !formData.category) {
      setError('Please fill in all required fields')
      return
    }
    setError(null)

    try {
      const shares = calculateSplitAmounts(total, formData.splitType, formData.person1Ratio, formData.person1Share)

      const expenseData = {
        description: formData.description,
        total_amount: total,
        category: formData.category,
        paid_by: formData.paidBy,
        split_type: formData.splitType,
        person1_share: shares.person1Share,
        person2_share: shares.person2Share,
        notes: formData.notes
      }

      createExpenseMutation.mutate(expenseData)
    } catch (err) {
      setError(err.message)
    }
  }

  const getPerson2Share = () => {
    const shares = calculateSplitAmounts(total, formData.splitType, formData.person1Ratio, formData.person1Share)
    return shares.person2Share
  }

  const CategoryIcon = formData.category ? iconMap[CATEGORIES[formData.category]?.icon] : null

  return (
    <div className="min-h-screen overflow-y-auto space-y-4 pt-2 pb-24 px-3 sm:px-4 scroll-smooth max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="description" className="text-sm font-medium mb-2 block">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Grocery shopping"
              className="input pl-10 w-full"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="text-sm font-medium mb-2 block">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{getCurrencySymbol(currency)}</span>
              <input
                type="number"
                id="amount"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                className="input pl-10 w-full"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="text-sm font-medium mb-2 block">
              Category
            </label>
            <CategorySelector
              selected={formData.category}
              onChange={(category) => setFormData(prev => ({ ...prev, category }))}
              currency={currency}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Who paid?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paidBy: 'person1' }))}
              className={`card p-3 text-center ${formData.paidBy === 'person1' ? 'border-foreground bg-accent/10' : 'border-border'
                }`}
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs font-medium">{names.person1Name}</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paidBy: 'person2' }))}
              className={`card p-3 text-center ${formData.paidBy === 'person2' ? 'border-foreground bg-accent/10' : 'border-border'
                }`}
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs font-medium">{names.person2Name}</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Split Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'equal', label: 'Equal', icon: Calculator },
              { value: 'ratio', label: 'Ratio', icon: Percent }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: value }))}
                className={`card p-3 text-center ${formData.splitType === value ? 'border-foreground bg-accent/10' : 'border-border'
                  }`}
              >
                <Icon className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {formData.splitType === 'ratio' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 space-y-3"
          >
            <div>
              <label htmlFor="ratio" className="text-sm font-medium mb-2 block">
                Split Ratio
              </label>
              <RatioSelector
                selected={formData.person1Ratio}
                onChange={(ratio) => setFormData(prev => ({ ...prev, person1Ratio: ratio }))}
                names={names}
              />
            </div>

            <div className="bg-muted p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{names.person1Name}</span>
                <span className="text-sm font-bold">{formData.person1Ratio}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{names.person2Name}</span>
                <span className="text-sm font-bold">{100 - formData.person1Ratio}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Template Selection */}
        {templates && templates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="card p-4 space-y-3"
          >
            <label className="text-sm font-medium mb-2 block">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id || template._id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id || template._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTemplate === (template.id || template._id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent'
                    }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notes Field */}
        <div>
          <label htmlFor="notes" className="text-sm font-medium mb-2 block">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes..."
            rows={3}
            className="input w-full resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={createExpenseMutation.isLoading}
          className="btn btn-primary w-full py-3 flex items-center justify-center text-sm font-semibold"
        >
          {createExpenseMutation.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default AddExpensePage