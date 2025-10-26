import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  Loader2, Calculator, Percent, DollarSign, FileText, CreditCard, Tag, Users, Plus,
  ShoppingCart, Home, UtensilsCrossed, Heart, Zap, Plane, Ticket, Gift, FileText as FileTextIcon, HeartPulse, Car, MoreHorizontal
} from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import { calculateSplitAmounts } from '../utils/calculations'

const iconMap = {
  ShoppingCart, Home, UtensilsCrossed, Heart, Zap, Plane, Ticket, 
  Gift, FileTextIcon, HeartPulse, Car, MoreHorizontal
}

const AddExpensePage = ({ setPage, names }) => {
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    category: '',
    paidBy: 'person1',
    splitType: 'equal',
    person1Ratio: 50,
    person1Share: ''
  })
  const [error, setError] = useState(null)
  
  const queryClient = useQueryClient()
  const total = parseFloat(formData.totalAmount) || 0

  const createExpenseMutation = useMutation(apiService.createExpense, {
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      toast.success('Expense added!')
      setPage('dashboard')
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
        totalAmount: total,
        category: formData.category,
        paidBy: formData.paidBy,
        splitType: formData.splitType,
        ...shares
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
    <div className="space-y-4 pb-20">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="text-sm font-medium mb-2 block">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input pl-10 w-full"
                required
              >
                <option value="">Choose category</option>
                {Object.entries(CATEGORIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Who paid?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paidBy: 'person1' }))}
              className={`card p-3 text-center ${
                formData.paidBy === 'person1' ? 'border-foreground bg-accent/10' : 'border-border'
              }`}
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs font-medium">{names.person1Name}</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paidBy: 'person2' }))}
              className={`card p-3 text-center ${
                formData.paidBy === 'person2' ? 'border-foreground bg-accent/10' : 'border-border'
              }`}
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs font-medium">{names.person2Name}</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Split Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'equal', label: 'Equal', icon: Calculator },
              { value: 'ratio', label: 'Ratio', icon: Percent },
              { value: 'exact', label: 'Exact', icon: DollarSign }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: value }))}
                className={`card p-3 text-center ${
                  formData.splitType === value ? 'border-foreground bg-accent/10' : 'border-border'
                }`}
              >
                <Icon className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {formData.splitType === 'ratio' && (
          <div className="card p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="ratio" className="text-xs text-muted-foreground mb-1 block">
                  {names.person1Name}'s %
                </label>
                <input
                  type="number"
                  id="ratio"
                  value={formData.person1Ratio}
                  onChange={(e) => setFormData(prev => ({ ...prev, person1Ratio: e.target.value }))}
                  min="0"
                  max="100"
                  className="input w-full"
                />
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">{names.person2Name}'s share</p>
                <p className="text-lg font-bold">{100 - (parseFloat(formData.person1Ratio) || 0)}%</p>
              </div>
            </div>
          </div>
        )}

        {formData.splitType === 'exact' && (
          <div className="card p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="share" className="text-xs text-muted-foreground mb-1 block">
                  {names.person1Name}'s amount
                </label>
                <input
                  type="number"
                  id="share"
                  value={formData.person1Share}
                  onChange={(e) => setFormData(prev => ({ ...prev, person1Share: e.target.value }))}
                  step="0.01"
                  min="0"
                  max={total}
                  className="input w-full"
                />
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">{names.person2Name}'s share</p>
                <p className="text-lg font-bold">${getPerson2Share().toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

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