import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightLeft } from 'lucide-react'
import { CATEGORIES } from '../App'

const ActivityItem = ({ item, names }) => {
  const isExpense = item.totalAmount !== undefined
  
  const category = isExpense ? CATEGORIES[item.category] || CATEGORIES.other : null
  const CategoryIcon = category ? category.icon : null

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    const date = new Date(timestamp.seconds * 1000)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`card-premium p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover-lift transition-all duration-300
      ${isExpense 
        ? 'hover:shadow-xl' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800'}
      `}
    >
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 w-full sm:w-auto">
        {isExpense && CategoryIcon && (
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.1 }}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 flex-shrink-0"
            style={{ backgroundColor: `${category.color}20`}}
          >
             <CategoryIcon size={20} className="sm:w-6 sm:h-6" style={{ color: category.color }} />
          </motion.div>
        )}
        {!isExpense && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 shadow-lg flex-shrink-0">
            <ArrowRightLeft size={20} className="sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">
            {isExpense ? item.description : (item.description || "Transfer")}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            <span>
              {isExpense
                ? `${item.paidBy === 'person1' ? names.person1Name : names.person2Name} paid`
                : `${item.fromUser === 'person1' ? names.person1Name : names.person2Name} → ${item.toUser === 'person1' ? names.person1Name : names.person2Name}`
              }
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{formatDate(item.timestamp)}</span>
          </div>
        </div>
      </div>
      <div className="text-left sm:text-right mt-2 sm:mt-0 w-full sm:w-auto">
        <p className={`text-xl sm:text-2xl font-black ${isExpense ? 'text-gray-800 dark:text-gray-200' : 'text-blue-800 dark:text-blue-300'}`}>
          ${isExpense ? item.totalAmount.toFixed(2) : item.amount.toFixed(2)}
        </p>
        {isExpense && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
            {category?.emoji} {category?.label}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default ActivityItem
