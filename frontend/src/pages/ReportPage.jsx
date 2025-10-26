import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Download, Share2, PieChart, BarChart3, DollarSign, Users, Calendar } from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import { calculateMonthlyTotals, calculateCategoryTotals } from '../utils/calculations'
import { download, share } from '../utils/storage'
import ActivityItem from '../components/ActivityItem'

const ReportPage = ({ expenses, names }) => {
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
Total Spent: $${totalSpent.toFixed(2)}
${names.person1Name} Paid: $${person1Paid.toFixed(2)}
${names.person2Name} Paid: $${person2Paid.toFixed(2)}`

    const success = await share.shareText('SplitSync Monthly Report', reportText)
    if (!success) {
      const clipboardSuccess = await share.copyToClipboard(reportText)
      if (clipboardSuccess) toast.success('Report copied!')
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Total Spend */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <DollarSign className="h-6 w-6 mr-2" />
          <h3 className="text-sm font-medium text-muted-foreground">Total Monthly Spend</h3>
        </div>
        <p className="text-4xl sm:text-5xl font-bold mb-4">${totalSpent.toFixed(2)}</p>
        <div className="flex justify-center gap-3">
          <button onClick={exportData} className="btn btn-secondary px-4 py-2 text-sm flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button onClick={shareReport} className="btn btn-secondary px-4 py-2 text-sm flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </motion.div>

      {/* Person Cards */}
      <div className="grid grid-cols-2 gap-3">
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
          <p className="text-2xl font-bold mb-1">${person1Paid.toFixed(2)}</p>
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
          <p className="text-2xl font-bold mb-1">${person2Paid.toFixed(2)}</p>
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
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Spending by Category
            </h3>
            <span className="text-xs text-muted-foreground">{sortedCategories.length} categories</span>
          </div>
          
          <div className="space-y-2">
            {sortedCategories.map(([key, amount]) => {
              const category = CATEGORIES[key] || CATEGORIES.other
              const percentage = ((amount / totalSpent) * 100).toFixed(0)
              return (
                <div key={key} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">${amount.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Monthly Expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            All Expenses This Month
          </h2>
          <span className="text-xs text-muted-foreground">{monthlyExpenses.length} expenses</span>
        </div>
        
        <div className="space-y-2">
          {monthlyExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">No expenses this month</p>
              <p className="text-xs text-muted-foreground">Start adding expenses to see your report!</p>
            </div>
          ) : (
            monthlyExpenses.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActivityItem item={item} names={names} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportPage