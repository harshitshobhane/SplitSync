import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { Loader2, ArrowRightLeft, UserCheck, UserX, DollarSign, FileText, ArrowLeft } from 'lucide-react'
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
      toast.success('Transfer logged!')
      setPage('dashboard')
    },
    onError: () => {
      toast.error('Failed to log transfer')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) {
      setError('Please enter a valid amount')
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

  const toUser = formData.fromUser === 'person1' ? 'person2' : 'person1'
  const fromName = formData.fromUser === 'person1' ? names.person1Name : names.person2Name
  const toName = toUser === 'person1' ? names.person1Name : names.person2Name

  return (
    <div className="space-y-4 pb-20">
      {/* Transfer Direction Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4"
      >
        <div className="text-center">
          <ArrowRightLeft className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Transfer Direction</h3>
          <div className="flex items-center justify-center gap-2">
            <div className="text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm font-medium">{fromName}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <UserX className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm font-medium">{toName}</p>
              <p className="text-xs text-muted-foreground">Received</p>
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="amount" className="text-sm font-medium mb-2 block">
            Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              step="0.01"
              className="input pl-10 w-full"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Who paid?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, fromUser: 'person1' }))}
              className={`card p-4 text-center transition-all ${
                formData.fromUser === 'person1' ? 'border-foreground bg-accent/10' : 'border-border'
              }`}
            >
              <UserCheck className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{names.person1Name}</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, fromUser: 'person2' }))}
              className={`card p-4 text-center transition-all ${
                formData.fromUser === 'person2' ? 'border-foreground bg-accent/10' : 'border-border'
              }`}
            >
              <UserX className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{names.person2Name}</p>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-medium mb-2 block">
            Description (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Settled up, Extra cash"
              className="input pl-10 w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createTransferMutation.isLoading}
          className="btn btn-primary w-full py-3 flex items-center justify-center text-sm font-semibold"
        >
          {createTransferMutation.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Log Transfer
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default AddTransferPage