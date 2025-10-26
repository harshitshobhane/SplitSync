import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Filter, X } from 'lucide-react'
import ActivityItem from '../components/ActivityItem'
import { formatDate } from '../utils/dateUtils'

const AllTransactionsPage = ({ expenses, transfers, names, currency, setPage, onBack }) => {
  const [filter, setFilter] = useState('all') // 'all', 'expenses', 'transfers'
  const groupedTransactions = useMemo(() => {
    // Filter transactions based on selected filter
    const filteredExpenses = filter === 'transfers' ? [] : expenses
    const filteredTransfers = filter === 'expenses' ? [] : transfers
    const allTransactions = [...filteredExpenses, ...filteredTransfers]
      .sort((a, b) => {
        const aTime = a.timestamp?.seconds || (a.created_at ? Math.floor(new Date(a.created_at).getTime() / 1000) : 0)
        const bTime = b.timestamp?.seconds || (b.created_at ? Math.floor(new Date(b.created_at).getTime() / 1000) : 0)
        return bTime - aTime
      })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    }

    allTransactions.forEach(transaction => {
      const timestamp = transaction.timestamp?.seconds ? new Date(transaction.timestamp.seconds * 1000) : new Date(transaction.created_at)
      const transactionDate = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate())
      
      if (transactionDate >= today) {
        groups.today.push(transaction)
      } else if (transactionDate >= yesterday) {
        groups.yesterday.push(transaction)
      } else if (transactionDate >= weekAgo) {
        groups.thisWeek.push(transaction)
      } else if (transactionDate >= monthAgo) {
        groups.thisMonth.push(transaction)
      } else {
        groups.older.push(transaction)
      }
    })

    return groups
  }, [expenses, transfers, filter])

  const getSectionTitle = (key) => {
    const titles = {
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      older: 'Older'
    }
    return titles[key] || key
  }

  const renderSection = (key, transactions) => {
    if (transactions.length === 0) return null

    return (
      <div key={key} className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
            {getSectionTitle(key)}
          </h3>
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            {transactions.length}
          </span>
        </div>
        <div className="space-y-2.5">
          {transactions.map((item, i) => (
            <motion.div
              key={item.id || `${key}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <ActivityItem item={item} names={names} currency={currency} />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  const totalTransactions = useMemo(() => {
    if (filter === 'expenses') return expenses.length
    if (filter === 'transfers') return transfers.length
    return expenses.length + transfers.length
  }, [expenses.length, transfers.length, filter])

  const filteredCount = useMemo(() => {
    if (filter === 'expenses') return expenses.length
    if (filter === 'transfers') return transfers.length
    return Object.values(groupedTransactions).flat().length
  }, [filter, expenses, transfers, groupedTransactions])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-lg hover:bg-accent h-9 w-9 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </button>
          <h1 className="text-base sm:text-lg md:text-xl font-semibold">All Transactions</h1>
          <div className="ml-auto text-xs sm:text-sm text-muted-foreground font-medium whitespace-nowrap">
            {filteredCount} shown
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-1.5 sm:gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('expenses')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === 'expenses' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilter('transfers')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === 'transfers' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            Transfers
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 scroll-smooth pb-20">
        <div className="max-w-screen-lg mx-auto">
          {filteredCount === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm sm:text-base font-medium mb-2 text-foreground">
                {filter === 'all' ? 'No transactions yet' : `No ${filter} yet`}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 px-4">
                {filter === 'all' 
                  ? 'Add your first expense or transfer to get started' 
                  : `Try the "${filter === 'expenses' ? 'All' : 'Expenses'}" filter or add a transaction`}
              </p>
              {filter === 'all' && (
                <button 
                  onClick={() => setPage('addExpense')}
                  className="btn btn-primary px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium"
                >
                  Add Your First Transaction
                </button>
              )}
            </div>
          ) : (
            <>
              {renderSection('today', groupedTransactions.today)}
              {renderSection('yesterday', groupedTransactions.yesterday)}
              {renderSection('thisWeek', groupedTransactions.thisWeek)}
              {renderSection('thisMonth', groupedTransactions.thisMonth)}
              {renderSection('older', groupedTransactions.older)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AllTransactionsPage

