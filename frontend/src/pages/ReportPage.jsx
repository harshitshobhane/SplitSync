import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Download, Share2, PieChart, BarChart3, DollarSign, Users, Calendar, ArrowRight } from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import { calculateMonthlyTotals, calculateCategoryTotals } from '../utils/calculations'
import { download, share } from '../utils/storage'
import ActivityItem from '../components/ActivityItem'
import { formatCurrency } from '../utils/dateUtils'

const ReportPage = ({ expenses, names, currency, setPage }) => {
  const now = new Date()
  const { totalSpent, person1Paid, person2Paid, monthlyExpenses } = calculateMonthlyTotals(expenses, [])
  const categoryTotals = calculateCategoryTotals(monthlyExpenses)
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  const exportData = async () => {
    try {
      const data = await apiService.exportData('json')
      const filename = `splitsync-report-${now.toISOString().split('T')[0]}.json`
      download.json(data, filename)
      toast.success('Report exported!')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const shareReport = async () => {
    const reportText = `Monthly Report - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}
Total Spent: ${formatCurrency(totalSpent, currency)}
${names.person1Name} Paid: ${formatCurrency(person1Paid, currency)}
${names.person2Name} Paid: ${formatCurrency(person2Paid, currency)}`

    const success = await share.shareText('SplitSync Monthly Report', reportText)
    if (!success) {
      const clipboardSuccess = await share.copyToClipboard(reportText)
      if (clipboardSuccess) toast.success('Report copied!')
    }
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 pb-20 px-3 sm:px-4 scroll-smooth">
      {/* Total Spend */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-4 sm:p-6 text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <DollarSign className="h-6 w-6 mr-2" />
          <h3 className="text-sm font-medium text-muted-foreground">Total Monthly Spend</h3>
        </div>
        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{formatCurrency(totalSpent, currency)}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
          <button onClick={exportData} className="btn btn-secondary px-4 py-2 text-sm flex items-center justify-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button onClick={shareReport} className="btn btn-secondary px-4 py-2 text-sm flex items-center justify-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </motion.div>

      {/* Person Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium truncate">{names.person1Name} Paid</p>
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mb-1">{formatCurrency(person1Paid, currency)}</p>
          <p className="text-xs text-muted-foreground">
            {totalSpent > 0 ? `${((person1Paid / totalSpent) * 100).toFixed(1)}% of total` : '0%'}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium truncate">{names.person2Name} Paid</p>
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mb-1">{formatCurrency(person2Paid, currency)}</p>
          <p className="text-xs text-muted-foreground">
            {totalSpent > 0 ? `${((person2Paid / totalSpent) * 100).toFixed(1)}% of total` : '0%'}
          </p>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {totalSpent > 0 && sortedCategories.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold flex items-center">
              <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Spending by Category
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{sortedCategories.length} categories</span>
          </div>
          
          <div className="space-y-2">
            {sortedCategories.map(([key, amount]) => {
              const category = CATEGORIES[key] || CATEGORIES.other
              const percentage = ((amount / totalSpent) * 100).toFixed(0)
              return (
                <div key={key} className="flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                    <span className="font-medium truncate">{category.label}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                    <span className="text-muted-foreground ml-1 sm:ml-2">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* View All Transactions Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button 
          onClick={() => setPage('allTransactions')}
          className="w-full card p-3 sm:p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold truncate">View All Transactions</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">See detailed expense and transfer history</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </button>
      </motion.div>
    </div>
  )
}

export default ReportPage