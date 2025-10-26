import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { Loader2, Calculator, Percent, DollarSign } from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../App'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()
  const total = parseFloat(formData.totalAmount) || 0

  const createExpenseMutation = useMutation(apiService.createExpense, {
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      toast.success('Expense added successfully!')
      setPage('dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add expense')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.description || total <= 0 || !formData.category) {
      setError('Please fill in description, amount, and category.')
      return
    }
    setError(null)

    let shares = {}
    try {
      if (formData.splitType === 'equal') {
        shares = { person1Share: total / 2, person2Share: total / 2 }
      } else if (formData.splitType === 'ratio') {
        const ratio = parseFloat(formData.person1Ratio) || 0
        if (ratio < 0 || ratio > 100) throw new Error('Ratio must be between 0 and 100.')
        shares = { person1Share: total * (ratio / 100), person2Share: total * ((100 - ratio) / 100) }
      } else if (formData.splitType === 'exact') {
        const p1Share = parseFloat(formData.person1Share) || 0
        if (p1Share < 0 || p1Share > total) throw new Error(`Share must be between 0 and ${total}.`)
        shares = { person1Share: p1Share, person2Share: total - p1Share }
      }
    } catch (err) {
      setError(err.message)
      return
    }

    const expenseData = {
      description: formData.description,
      totalAmount: total,
      category: formData.category,
      paidBy: formData.paidBy,
      splitType: formData.splitType,
      ...shares
    }

    createExpenseMutation.mutate(expenseData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const getPerson2Share = () => {
    if (formData.splitType === 'equal') return total / 2
    if (formData.splitType === 'ratio') return total * ((100 - (parseFloat(formData.person1Ratio) || 0)) / 100)
    if (formData.splitType === 'exact') return total - (parseFloat(formData.person1Share) || 0)
    return 0
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add New Expense</h2>
        <p className="text-gray-600 dark:text-gray-400">Track shared expenses with your partner</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}
        
        <FormInput 
          label="Description"
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="e.g., Weekly shopping, Dinner date"
          icon="📝"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            label="Total Amount ($)"
            id="amount"
            type="number"
            value={formData.totalAmount}
            onChange={(e) => handleInputChange('totalAmount', e.target.value)}
            placeholder="0.00"
            step="0.01"
            icon="💰"
          />
          <FormSelect
            label="Category"
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            icon="🏷️"
          >
            <option value="" disabled>Select category...</option>
            {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>{emoji} {label}</option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Who paid? 💳
          </label>
          <div className="grid grid-cols-2 gap-3">
            <RadioCard
              label={names.person1Name}
              value="person1"
              checked={formData.paidBy === 'person1'}
              onChange={() => handleInputChange('paidBy', 'person1')}
              icon="👤"
            />
            <RadioCard
              label={names.person2Name}
              value="person2"
              checked={formData.paidBy === 'person2'}
              onChange={() => handleInputChange('paidBy', 'person2')}
              icon="👤"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            How to split? ⚖️
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <SplitOption
              label="Equal"
              value="equal"
              checked={formData.splitType === 'equal'}
              onChange={() => handleInputChange('splitType', 'equal')}
              icon={<Calculator size={20} />}
            />
            <SplitOption
              label="Ratio"
              value="ratio"
              checked={formData.splitType === 'ratio'}
              onChange={() => handleInputChange('splitType', 'ratio')}
              icon={<Percent size={20} />}
            />
            <SplitOption
              label="Exact"
              value="exact"
              checked={formData.splitType === 'exact'}
              onChange={() => handleInputChange('splitType', 'exact')}
              icon={<DollarSign size={20} />}
            />
          </div>
        </div>

        {formData.splitType === 'ratio' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex gap-4 items-center">
              <FormInput 
                label={`${names.person1Name}'s Ratio (%)`}
                id="p1-ratio"
                type="number"
                value={formData.person1Ratio}
                onChange={(e) => handleInputChange('person1Ratio', e.target.value)}
                containerClassName="flex-1"
                min="0"
                max="100"
              />
              <div className="flex-1 mt-6 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{names.person2Name}'s Ratio</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{100 - (parseFloat(formData.person1Ratio) || 0)}%</p>
              </div>
            </div>
          </motion.div>
        )}

        {formData.splitType === 'exact' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800"
          >
            <div className="flex gap-4 items-center">
              <FormInput 
                label={`${names.person1Name}'s Share ($)`}
                id="p1-share"
                type="number"
                value={formData.person1Share}
                onChange={(e) => handleInputChange('person1Share', e.target.value)}
                step="0.01"
                containerClassName="flex-1"
                min="0"
                max={total}
              />
              <div className="flex-1 mt-6 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{names.person2Name}'s Share</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">${getPerson2Share().toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={createExpenseMutation.isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {createExpenseMutation.isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            'Add Expense'
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}

// Helper Components
const FormInput = ({ label, id, type = 'text', value, onChange, placeholder, step, containerClassName = "", icon, min, max }) => (
  <div className={containerClassName}>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {icon && <span className="mr-2">{icon}</span>}{label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm px-4 py-3 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
    />
  </div>
)

const FormSelect = ({ label, id, value, onChange, children, icon }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {icon && <span className="mr-2">{icon}</span>}{label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm px-4 py-3 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {children}
    </select>
  </div>
)

const RadioCard = ({ label, value, checked, onChange, icon }) => (
  <motion.label
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`block border rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
      checked
        ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 ring-2 ring-blue-500/50'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
    }`}
  >
    <input
      type="radio"
      name="radio-group"
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div className="flex flex-col items-center">
      {icon && <span className="text-2xl mb-2">{icon}</span>}
      <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{label}</span>
    </div>
  </motion.label>
)

const SplitOption = ({ label, value, checked, onChange, icon }) => (
  <motion.label
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
      checked
        ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
    }`}
  >
    <input
      type="radio"
      name="split-type"
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div className="mb-1">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </motion.label>
)

export default AddExpensePage
