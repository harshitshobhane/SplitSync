import React from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRightLeft, ShoppingCart, Home, UtensilsCrossed, Heart, 
  Zap, Plane, Ticket, Gift, FileText, HeartPulse, Car, MoreHorizontal 
} from 'lucide-react'
import { CATEGORIES } from '../utils/constants'
import { formatDate } from '../utils/dateUtils'

const iconMap = {
  ShoppingCart, Home, UtensilsCrossed, Heart, Zap, Plane, Ticket, 
  Gift, FileText, HeartPulse, Car, MoreHorizontal
}

const ActivityItem = ({ item, names }) => {
  const isExpense = item.totalAmount !== undefined
  
  const category = isExpense ? CATEGORIES[item.category] || CATEGORIES.other : null
  const CategoryIcon = category ? iconMap[category.icon] : null

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="card p-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {CategoryIcon && (
          <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${category.color}15`}}>
            <CategoryIcon size={20} style={{ color: category.color }} />
          </div>
        )}
        {!isExpense && (
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <ArrowRightLeft size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {isExpense ? item.description : (item.description || "Transfer")}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">
              {isExpense
                ? `${item.paidBy === 'person1' ? names.person1Name : names.person2Name} paid`
                : `${item.fromUser === 'person1' ? names.person1Name : names.person2Name} → ${item.toUser === 'person1' ? names.person1Name : names.person2Name}`
              }
            </span>
            <span>•</span>
            <span>{formatDate(item.timestamp)}</span>
          </div>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className={`text-lg font-bold ${isExpense ? 'text-foreground' : 'text-blue-600'}`}>
          ${isExpense ? item.totalAmount.toFixed(2) : item.amount.toFixed(2)}
        </p>
        {isExpense && category && (
          <p className="text-xs text-muted-foreground">
            {category.label}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default ActivityItem
