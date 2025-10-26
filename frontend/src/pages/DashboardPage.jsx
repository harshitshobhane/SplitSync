import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet, 
  Calendar,
  Bell,
  Share2,
  Download,
  Filter,
  Search
} from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../App'
import SearchModal from '../components/SearchModal'
import ActivityItem from '../components/ActivityItem'

const DashboardPage = ({ 
  balance, 
  expenses, 
  transfers, 
  setPage, 
  names, 
  searchQuery, 
  setSearchQuery,
  showSearch,
  setShowSearch
}) => {
  const [filters, setFilters] = useState({})
  const queryClient = useQueryClient()
  
  const { person1Net, person2Net, whoOwesWho, amountOwed, person1Status, person2Status } = balance

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    if (searchQuery) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filters.category) {
      filtered = filtered.filter(expense => expense.category === filters.category)
    }

    if (filters.dateRange) {
      const now = new Date()
      const filterDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(expense => 
        expense.timestamp && new Date(expense.timestamp.seconds * 1000) >= filterDate
      )
    }

    // Sort
    switch (filters.sortBy) {
      case 'amount':
        filtered.sort((a, b) => b.totalAmount - a.totalAmount)
        break
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category))
        break
      default:
        filtered.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
    }

    return filtered
  }, [expenses, searchQuery, filters])

  const recentActivity = [...filteredExpenses, ...transfers]
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
    .slice(0, 5)

  const getStatusClasses = (status) => {
    switch (status) {
      case 'positive':
        return 'status-positive'
      case 'negative':
        return 'status-negative'
      default:
        return 'status-neutral'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'positive':
        return <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
      case 'negative':
        return <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
      default:
        return <Users className="text-gray-600 dark:text-gray-400" size={20} />
    }
  }

  const handleQuickSettle = async () => {
    try {
      const settleAmount = Math.min(Math.abs(person1Net), Math.abs(person2Net))
      await apiService.createTransfer({
        amount: settleAmount,
        fromUser: person1Net > person2Net ? 'person2' : 'person1',
        toUser: person1Net > person2Net ? 'person1' : 'person2',
        description: 'Quick settle up'
      })
      
      queryClient.invalidateQueries(['transfers'])
      toast.success('Transfer logged successfully!')
    } catch (error) {
      toast.error('Failed to log transfer')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SplitSync Balance',
          text: `${whoOwesWho} - $${amountOwed.toFixed(2)}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${whoOwesWho} - $${amountOwed.toFixed(2)}`)
      toast.success('Balance copied to clipboard!')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-bg-premium p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-premium-lg text-white relative overflow-hidden hover-lift w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-transparent to-purple-500/20"></div>
        <div className="relative z-10 text-center w-full">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-lg md:text-xl lg:text-2xl font-semibold text-white/90 tracking-wide"
          >
            {whoOwesWho}
          </motion.p>
          <motion.p 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black my-2 sm:my-3 md:my-4 tracking-tight"
          >
            ${amountOwed.toFixed(2)}
          </motion.p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage('addTransfer')} 
              className="btn btn-primary px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              Settle Up
            </motion.button>
            {amountOwed > 0 && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickSettle}
                className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
              >
                Quick Settle
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Person Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`card-premium p-4 sm:p-6 hover-lift ${getStatusClasses(person1Status)}`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="font-bold text-base sm:text-lg md:text-xl truncate">{names.person1Name}</p>
            {getStatusIcon(person1Status)}
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2">
            {person1Net >= 0 ? '+' : '-'}${Math.abs(person1Net).toFixed(2)}
          </p>
          <p className="text-xs sm:text-sm font-semibold opacity-80">
            {person1Net >= 0 ? 'is in +' : 'is in -'}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`card-premium p-4 sm:p-6 hover-lift ${getStatusClasses(person2Status)}`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="font-bold text-base sm:text-lg md:text-xl truncate">{names.person2Name}</p>
            {getStatusIcon(person2Status)}
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2">
            {person2Net >= 0 ? '+' : '-'}${Math.abs(person2Net).toFixed(2)}
          </p>
          <p className="text-xs sm:text-sm font-semibold opacity-80">
            {person2Net >= 0 ? 'is in +' : 'is in -'}
          </p>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-4 sm:p-5 text-center hover-lift"
        >
          <Wallet className="text-rose-500 dark:text-rose-400 mx-auto mb-2 sm:mb-3" size={24} />
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">
            {expenses.length}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Expenses</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-premium p-4 sm:p-5 text-center hover-lift"
        >
          <Calendar className="text-emerald-500 dark:text-emerald-400 mx-auto mb-2 sm:mb-3" size={24} />
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">
            {new Date().getDate()}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Today</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-premium p-4 sm:p-5 text-center hover-lift"
        >
          <Bell className="text-purple-500 dark:text-purple-400 mx-auto mb-2 sm:mb-3" size={24} />
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">
            {transfers.length}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Transfers</p>
        </motion.div>
      </div>

      {/* Recent Activity Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient dark:text-gradient-dark">Recent Activity</h2>
        <div className="flex space-x-2 sm:space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="p-2 sm:p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-lg sm:rounded-xl transition-all duration-300"
          >
            <Share2 size={18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(true)}
            className="p-2 sm:p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-lg sm:rounded-xl transition-all duration-300"
          >
            <Search size={18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-3">
        {recentActivity.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="relative mb-4 sm:mb-6">
              <Wallet className="text-gray-400 dark:text-gray-600 mx-auto mb-4" size={48} className="sm:w-16 sm:h-16" />
              <div className="absolute inset-0 bg-gradient-to-r from-rose-200 to-pink-200 dark:from-rose-800 dark:to-pink-800 rounded-full blur-xl opacity-30"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl font-semibold mb-2">No activity yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Add your first expense to get started!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage('addExpense')}
              className="btn btn-primary px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl"
            >
              Add Expense
            </motion.button>
          </motion.div>
        ) : (
          recentActivity.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ActivityItem item={item} names={names} />
            </motion.div>
          ))
        )}
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFilter={setFilters}
      />
    </div>
  )
}

export default DashboardPage
