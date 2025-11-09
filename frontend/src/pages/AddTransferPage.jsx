import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { Loader2, ArrowRightLeft, FileText, Minus, Plus, Wallet } from 'lucide-react'
import { apiService } from '../lib/api'
import { getCurrencySymbol, formatCurrency } from '../utils/dateUtils'

const AddTransferPage = ({ setPage, names, balance, currency = 'USD' }) => {
  const [formData, setFormData] = useState({
    amount: '',
    fromUser: 'person1',
    description: ''
  })
  
  const queryClient = useQueryClient()

  // Calculate balance info
  const person1Net = balance.person1Net || 0
  const person2Net = balance.person2Net || 0
  const needsSettle = Math.abs(person1Net) > 0.01 || Math.abs(person2Net) > 0.01
  
  const suggestedAmount = Math.abs(person1Net > person2Net ? person2Net : person1Net)
  const suggestedPayer = person1Net > person2Net ? 'person2' : 'person1'
  
  // Determine current situation
  const getBalanceInfo = () => {
    if (Math.abs(person1Net) < 0.01) {
      return { message: 'All settled up', color: 'text-emerald-600' }
    }
    if (person1Net > 0) {
      return { 
        message: `${names.person2Name} owes ${formatCurrency(person2Net, currency).replace('-', '')}`, 
        color: 'text-amber-600' 
      }
    }
    return { 
      message: `${names.person1Name} owes ${formatCurrency(person1Net, currency).replace('-', '')}`, 
      color: 'text-amber-600' 
    }
  }
  
  const balanceInfo = getBalanceInfo()

  const createTransferMutation = useMutation(apiService.createTransfer, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['transfers'])
      queryClient.invalidateQueries(['expenses'])
      if (data && data.queued) {
        toast.success('Transfer queued and will sync when online')
      } else {
        toast.success('Transfer recorded')
      }
      setTimeout(() => setPage('dashboard'), 500)
    },
    onError: () => {
      toast.error('Unable to record transfer')
    }
  })

  const handleQuickSettle = () => {
    if (suggestedAmount > 0.01) {
      setFormData({
        amount: suggestedAmount.toFixed(2),
        fromUser: suggestedPayer,
        description: ''
      })
      toast.success('Amount set for full settlement')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    const transferData = {
      amount: transferAmount,
      from_user: formData.fromUser,
      to_user: formData.fromUser === 'person1' ? 'person2' : 'person1',
      description: formData.description || ''
    }

    createTransferMutation.mutate(transferData)
  }

  const toUser = formData.fromUser === 'person1' ? 'person2' : 'person1'
  const fromName = formData.fromUser === 'person1' ? names.person1Name : names.person2Name
  const toName = toUser === 'person1' ? names.person1Name : names.person2Name

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-6 px-3 sm:px-4 scroll-smooth">
      {/* Balance Summary */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-4 sm:p-5"
      >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate">Current Balance</span>
            </div>
            {needsSettle && suggestedAmount > 0.01 && (
              <button
                onClick={handleQuickSettle}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap flex-shrink-0"
              >
                Settle All
              </button>
            )}
        </div>
        <p className={`text-lg sm:text-xl font-semibold ${balanceInfo.color} break-words`}>
          {balanceInfo.message}
        </p>
      </motion.div>

      {/* Transfer Flow - Apple Style */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Transfer Direction</span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, fromUser: prev.fromUser === 'person1' ? 'person2' : 'person1' }))}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Switch
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex-1 text-center">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full mb-3 ${
                formData.fromUser === 'person1' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
              }`}>
                <span className="text-xl font-semibold">
                  {fromName.charAt(0)}
                </span>
              </div>
              <p className="text-sm font-semibold">{fromName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Payer</p>
            </div>

            {/* Arrow */}
            <div className="px-4">
              <div className="h-px w-12 bg-border relative">
                <ArrowRightLeft className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 text-muted-foreground bg-background" />
              </div>
            </div>

            {/* To */}
            <div className="flex-1 text-center">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full mb-3 ${
                formData.fromUser === 'person1' 
                  ? 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                  : 'bg-blue-600 text-white'
              }`}>
                <span className="text-xl font-semibold">
                  {toName.charAt(0)}
                </span>
            </div>
              <p className="text-sm font-semibold">{toName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receiver</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Amount Input - Apple Style */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Amount</label>
          </div>
        
        <div className="bg-card border border-border rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-muted-foreground">
              {getCurrencySymbol(currency)}
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2">
          {[100, 250, 500, 1000].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
              className="py-2.5 px-3 rounded-2xl bg-muted hover:bg-accent transition-colors text-sm font-medium border border-border"
            >
              {getCurrencySymbol(currency)}{amount}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Description */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Note (Optional)</label>
          </div>
        <div className="bg-card border border-border rounded-3xl p-4">
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add a note..."
            className="w-full bg-transparent border-none outline-none focus:outline-none text-sm"
            />
          </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={createTransferMutation.isLoading || !formData.amount}
          className="w-full py-4 rounded-3xl bg-foreground text-background font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
        >
          {createTransferMutation.isLoading ? (
            <>
            <Loader2 className="h-5 w-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-5 w-5" />
              Record Transfer
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}

export default AddTransferPage