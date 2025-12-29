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
import { jsPDF } from 'jspdf'

const ReportPage = ({ expenses, transfers = [], names, currency, setPage }) => {
  const now = new Date()
  const { totalSpent, person1Paid, person2Paid, monthlyExpenses } = calculateMonthlyTotals(expenses, transfers)
  const categoryTotals = calculateCategoryTotals(monthlyExpenses)
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  const exportData = async () => {
    try {
      const reportDate = now.toISOString().split('T')[0]
      const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' })
      const currentTime = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      // PDF Export with Ultra Premium Design
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPos = margin

      // Premium Gradient Header
      for (let i = 0; i < 80; i++) {
        const shade = Math.floor(30 + (80 * (i / 80)))
        doc.setFillColor(15, 23, 42, shade / 100) // Dark slate gradient
        doc.rect(0, i, pageWidth, 1, 'F')
      }

      // Premium Logo Area
      doc.setFillColor(59, 130, 246) // Blue accent
      doc.circle(35, 25, 18, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('SS', 30, 28, { align: 'center' })

      // App Name
      doc.setFontSize(32)
      doc.setFont('helvetica', 'normal')
      doc.text('SplitHalf', 60, 25)

      doc.setFontSize(11)
      doc.text('Expense Intelligence Report', 60, 33)

      // Premium Date Time Display
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const dateTimeText = `${monthYear.toUpperCase()} • ${currentTime}`
      doc.text(dateTimeText, pageWidth - margin, 20, { align: 'right' })

      yPos = 95

      // Premium Summary Section with Card
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(margin, yPos, pageWidth - (2 * margin), 45, 3, 'F')

      // Border
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, yPos, pageWidth - (2 * margin), 45, 3, 'D')

      yPos += 12

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('MONTHLY SUMMARY', margin + 5, yPos)

      yPos += 12
      const summaryX = margin + 8

      // Person 1 with icon
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(`${names.person1Name}`, summaryX, yPos)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(34, 197, 94)
      doc.text(formatCurrency(person1Paid, currency), summaryX + 65, yPos)
      yPos += 7

      // Person 2 with icon
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(`${names.person2Name}`, summaryX, yPos)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(34, 197, 94)
      doc.text(formatCurrency(person2Paid, currency), summaryX + 65, yPos)
      yPos += 7

      // Total - Premium Highlight
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Total Spent', summaryX, yPos)
      doc.setTextColor(59, 130, 246)
      doc.text(formatCurrency(totalSpent, currency), summaryX + 55, yPos)

      yPos += 25

      // Premium Category Breakdown
      if (sortedCategories.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('CATEGORY BREAKDOWN', margin, yPos)
        yPos += 8

        // Premium Table Header
        doc.setFillColor(30, 58, 138)
        doc.roundedRect(margin, yPos - 5, pageWidth - (2 * margin), 8, 2, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('CATEGORY', margin + 5, yPos)
        doc.text('AMOUNT', pageWidth - margin - 25, yPos, { align: 'right' })
        doc.text('%', pageWidth - margin - 5, yPos, { align: 'right' })

        doc.setTextColor(15, 23, 42)
        yPos += 5

        // Premium Data Rows
        sortedCategories.slice(0, 11).forEach(([key, amount], index) => {
          const category = CATEGORIES[key]?.label || key
          const percentage = ((amount / totalSpent) * 100).toFixed(1)

          if (yPos > pageHeight - 30) {
            doc.addPage()
            yPos = margin + 10
          }

          // Alternating premium row background
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252)
            doc.rect(margin, yPos - 5, pageWidth - (2 * margin), 9, 'F')
          }

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 23, 42)
          doc.text(category, margin + 5, yPos)

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(34, 197, 94)
          doc.text(formatCurrency(amount, currency), pageWidth - margin - 25, yPos, { align: 'right' })

          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 116, 139)
          doc.text(`${percentage}%`, pageWidth - margin - 5, yPos, { align: 'right' })

          yPos += 9
        })
      }

      // Premium Recent Expenses
      if (monthlyExpenses.length > 0 && yPos < pageHeight - 60) {
        yPos += 15
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('RECENT EXPENSES', margin, yPos)
        yPos += 8

        monthlyExpenses.slice(0, 6).forEach((expense) => {
          if (yPos > pageHeight - 30) {
            doc.addPage()
            yPos = margin + 10
          }

          // Expense card with border
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(margin, yPos - 5, pageWidth - (2 * margin), 10, 2, 'F')
          doc.setDrawColor(226, 232, 240)
          doc.setLineWidth(0.3)
          doc.roundedRect(margin, yPos - 5, pageWidth - (2 * margin), 10, 2, 'D')

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 23, 42)
          doc.text(expense.description || 'No description', margin + 3, yPos)

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 116, 139)
          const paidBy = expense.paidBy === 'person1' ? names.person1Name : names.person2Name
          doc.text(paidBy, margin + 3, yPos + 4)

          doc.setFont('helvetica', 'bold')
          doc.setTextColor(59, 130, 246)
          doc.text(formatCurrency(expense.totalAmount || 0, currency), pageWidth - margin - 3, yPos, { align: 'right' })

          yPos += 12
        })
      }

      // Premium Footer on all pages
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)

        // Line separator
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.5)
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)
        const footerText = `Generated by SplitHalf • ${currentTime}`
        doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }

      // Save PDF
      doc.save(`splithalf-report-${reportDate}.pdf`)
      toast.success('Premium PDF exported!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  const shareReport = async () => {
    const reportText = `Monthly Report - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}
Total Spent: ${formatCurrency(totalSpent, currency)}
${names.person1Name} Paid: ${formatCurrency(person1Paid, currency)}
${names.person2Name} Paid: ${formatCurrency(person2Paid, currency)}`

    const success = await share.shareText('SplitHalf Monthly Report', reportText)
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
            Export PDF
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