import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Share2, 
  PieChart,
  BarChart3,
  DollarSign,
  Users
} from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../App'
import ActivityItem from '../components/ActivityItem'

const ReportPage = ({ expenses, names }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const queryClient = useQueryClient()

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => e.timestamp && e.timestamp.seconds * 1000 >= firstDayOfMonth.getTime())
  }, [expenses, firstDayOfMonth])

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.totalAmount, 0)
  const person1Paid = monthlyExpenses.filter(e => e.paidBy === 'person1').reduce((sum, e) => sum + e.totalAmount, 0)
  const person2Paid = monthlyExpenses.filter(e => e.paidBy === 'person2').reduce((sum, e) => sum + e.totalAmount, 0)

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    return monthlyExpenses.reduce((acc, exp) => {
      const category = exp.category || 'other'
      acc[category] = (acc[category] || 0) + exp.totalAmount
      return acc
    }, {})
  }, [monthlyExpenses])

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  // Create conic-gradient string for pie chart
  const gradientString = useMemo(() => {
    if (sortedCategories.length === 0) return ''
    
    let gradient = 'conic-gradient('
    let currentPercentage = 0
    
    sortedCategories.forEach(([key, amount]) => {
      const category = CATEGORIES[key] || CATEGORIES.other
      const percentage = (amount / totalSpent) * 100
      gradient += `${category.color} ${currentPercentage}% ${currentPercentage + percentage}%, `
      currentPercentage += percentage
    })
    
    return gradient.slice(0, -2) + ')'
  }, [sortedCategories, totalSpent])

  const exportData = async () => {
    try {
      const data = await apiService.exportData('json')
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `splitsync-report-${now.toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report exported successfully!')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const shareReport = async () => {
    const reportText = `SplitSync Monthly Report - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}
Total Spent: $${totalSpent.toFixed(2)}
${names.person1Name} Paid: $${person1Paid.toFixed(2)}
${names.person2Name} Paid: $${person2Paid.toFixed(2)}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SplitSync Monthly Report',
          text: reportText,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(reportText)
      toast.success('Report copied to clipboard!')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Monthly Report</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Total Spend Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="gradient-bg p-6 sm:p-8 rounded-2xl shadow-xl text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign size={24} className="text-blue-100 mr-2" />
            <p className="text-xl font-medium text-blue-100">Total Monthly Spend</p>
          </div>
          <motion.p 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-5xl font-extrabold my-3"
          >
            ${totalSpent.toFixed(2)}
          </motion.p>
          <div className="flex justify-center space-x-4 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportData}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium hover:bg-white/30 transition-all flex items-center"
            >
              <Download size={16} className="mr-2" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareReport}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium hover:bg-white/30 transition-all flex items-center"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Person Payment Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-5 rounded-2xl shadow-md border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{names.person1Name} Paid</p>
            <Users className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${person1Paid.toFixed(2)}
          </p>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {totalSpent > 0 ? `${((person1Paid / totalSpent) * 100).toFixed(1)}% of total` : '0% of total'}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-5 rounded-2xl shadow-md border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{names.person2Name} Paid</p>
            <Users className="text-green-600 dark:text-green-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${person2Paid.toFixed(2)}
          </p>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {totalSpent > 0 ? `${((person2Paid / totalSpent) * 100).toFixed(1)}% of total` : '0% of total'}
          </p>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {totalSpent > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <PieChart className="mr-2" size={24} />
              Spending by Category
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {sortedCategories.length} categories
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div 
              className="w-36 h-36 rounded-full flex-shrink-0 border-4 border-gray-100 dark:border-gray-700 shadow-inner relative"
              style={{ background: gradientString }}
              role="img"
              aria-label="Pie chart of spending by category"
            >
              {totalSpent === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-600 text-sm">No data</span>
                </div>
              )}
            </div>
            
            <div className="w-full">
              <ul className="space-y-3">
                {sortedCategories.map(([key, amount], index) => {
                  const category = CATEGORIES[key] || CATEGORIES.other
                  const percentage = ((amount / totalSpent) * 100).toFixed(0)
                  return (
                    <motion.li 
                      key={key}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: category.color }}></span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{category.emoji} {category.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">${amount.toFixed(2)}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">({percentage}%)</span>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Expenses List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <BarChart3 className="mr-2" size={24} />
            All Expenses This Month
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {monthlyExpenses.length} expenses
          </span>
        </div>
        
        <div className="space-y-3">
          {monthlyExpenses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="text-gray-400 dark:text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No expenses this month</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Start adding expenses to see your report!</p>
            </motion.div>
          ) : (
            monthlyExpenses.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActivityItem item={item} names={names} />
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ReportPage
