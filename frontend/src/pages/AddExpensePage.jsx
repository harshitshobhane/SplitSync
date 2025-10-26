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
import { getCurrencySymbol } from '../utils/dateUtils'

const iconMap = {
  ShoppingCart, Home, UtensilsCrossed, Heart, Zap, Plane, Ticket, 
  Gift, FileTextIcon, HeartPulse, Car, MoreHorizontal
}

const AddExpensePage = ({ setPage, names, currency = 'USD' }) => {
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
      queryClient.invalidateQueries(['transfers']) // Refresh transfers too for balance calculation
      toast.success('Expense added!')
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
        person2_share: shares.person2Share
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
    <div className="h-full overflow-y-auto space-y-4 pb-20 px-3 sm:px-4 scroll-smooth">
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
             <div className="relative">
               <select
                 id="category"
                 value={formData.category}
                 onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                 className="input w-full pr-10 appearance-none"
                 required
               >
                 <option value="">Choose category</option>
                 {Object.entries(CATEGORIES).map(([key, { label }]) => (
                   <option key={key} value={key}>{label}</option>
                 ))}
               </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                 <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
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
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'equal', label: 'Equal', icon: Calculator },
              { value: 'ratio', label: 'Ratio', icon: Percent }
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
              <select
                id="ratio"
                value={formData.person1Ratio}
                onChange={(e) => setFormData(prev => ({ ...prev, person1Ratio: parseFloat(e.target.value) }))}
                className="input w-full"
              >
                <option value="50">50/50 - Equal</option>
                <option value="60">60/40 - {names.person1Name} pays more</option>
                <option value="70">70/30 - {names.person1Name} pays more</option>
                <option value="80">80/20 - {names.person1Name} pays most</option>
                <option value="40">40/60 - {names.person2Name} pays more</option>
                <option value="30">30/70 - {names.person2Name} pays more</option>
                <option value="20">20/80 - {names.person2Name} pays most</option>
                <option value="100">100/0 - {names.person1Name} pays all</option>
                <option value="0">0/100 - {names.person2Name} pays all</option>
              </select>
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