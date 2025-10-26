import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { Loader2, ArrowRightLeft, UserCheck, UserX } from 'lucide-react'
import { apiService } from '../lib/api'

const AddTransferPage = ({ setPage, names }) => {
  const [formData, setFormData] = useState({
    amount: '',
    fromUser: 'person1',
    description: ''
  })
  const [error, setError] = useState(null)
  
  const queryClient = useQueryClient()

  const createTransferMutation = useMutation(apiService.createTransfer, {
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers'])
      toast.success('Transfer logged successfully!')
      setPage('dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to log transfer')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    setError(null)

    const transferData = {
      amount: transferAmount,
      fromUser: formData.fromUser,
      toUser: formData.fromUser === 'person1' ? 'person2' : 'person1',
      description: formData.description || 'Transfer'
    }

    createTransferMutation.mutate(transferData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const toUser = formData.fromUser === 'person1' ? 'person2' : 'person1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Log Transfer</h2>
        <p className="text-gray-600 dark:text-gray-400">Record direct payments between you and your partner</p>
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
          label="Amount ($)"
          id="transfer-amount"
          type="number"
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', e.target.value)}
          placeholder="0.00"
          step="0.01"
          icon="💰"
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Who paid? 💳
          </label>
          <div className="grid grid-cols-2 gap-3">
            <RadioCard
              label={`${names.person1Name} paid`}
              value="person1"
              checked={formData.fromUser === 'person1'}
              onChange={() => handleInputChange('fromUser', 'person1')}
              icon={<UserCheck size={24} />}
            />
            <RadioCard
              label={`${names.person2Name} paid`}
              value="person2"
              checked={formData.fromUser === 'person2'}
              onChange={() => handleInputChange('fromUser', 'person2')}
              icon={<UserX size={24} />}
            />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <ArrowRightLeft size={32} className="text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Transfer Direction</p>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-white">{formData.fromUser === 'person1' ? names.person1Name : names.person2Name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
            </div>
            <ArrowRightLeft size={20} className="text-gray-400" />
            <div className="text-center">
              <p className="font-bold text-blue-600 dark:text-blue-400">{toUser === 'person1' ? names.person1Name : names.person2Name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Received</p>
            </div>
          </div>
        </motion.div>

        <FormInput 
          label="Description (Optional)"
          id="transfer-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="e.g., Settled up, Extra cash, Rent payment"
          icon="📝"
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={createTransferMutation.isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {createTransferMutation.isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            'Log Transfer'
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}

// Helper Components
const FormInput = ({ label, id, type = 'text', value, onChange, placeholder, step, icon }) => (
  <div>
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
      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm px-4 py-3 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
    />
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
      <div className="mb-2 text-blue-600 dark:text-blue-400">{icon}</div>
      <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{label}</span>
    </div>
  </motion.label>
)

export default AddTransferPage
