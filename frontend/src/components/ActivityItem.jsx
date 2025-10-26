import React from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRightLeft, ShoppingCart, Home, UtensilsCrossed, Heart, 
  Zap, Plane, Ticket, Gift, FileText, HeartPulse, Car, MoreHorizontal 
} from 'lucide-react'
import { CATEGORIES } from '../utils/constants'
import { formatDateShort, formatCurrency } from '../utils/dateUtils'

const iconMap = {
  ShoppingCart, Home, UtensilsCrossed, Heart, Zap, Plane, Ticket, 
  Gift, FileText, HeartPulse, Car, MoreHorizontal
}

const ActivityItem = ({ item, names, currency = 'USD' }) => {
  const isExpense = item.totalAmount !== undefined
  
  const category = isExpense ? CATEGORIES[item.category] || CATEGORIES.other : null
  const CategoryIcon = category ? iconMap[category.icon] : null

  return (
    <motion.div 
      whileHover={{ scale: 1.005, y: -1 }}
      className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-4 sm:p-5 hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Subtle gradient accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Premium Icon Container */}
        <div className="flex-shrink-0 relative">
          {isExpense && CategoryIcon ? (
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div 
                className="p-3 rounded-2xl shadow-md flex items-center justify-center relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}25, ${category.color}10)`,
                  boxShadow: `0 4px 12px ${category.color}15`
                }}
              >
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CategoryIcon size={22} className="relative z-10" style={{ color: category.color }} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/15 via-blue-600/10 to-blue-500/5 flex items-center justify-center border border-blue-500/30 shadow-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <ArrowRightLeft size={22} className="text-blue-600 dark:text-blue-400 relative z-10" />
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Title + Amount */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base sm:text-lg text-foreground truncate leading-tight">
                {isExpense ? item.description : (item.description || "Transfer")}
              </p>
            </div>
            
            {/* Amount - Larger and more prominent */}
            <div className="text-right flex-shrink-0">
              <p className={`text-lg sm:text-xl font-extrabold tracking-tight ${isExpense ? 'text-foreground' : 'text-blue-600 dark:text-blue-500'}`}>
                {formatCurrency(isExpense ? item.totalAmount : item.amount, currency)}
              </p>
            </div>
          </div>

          {/* Details Row */}
          <div className="space-y-1.5">
            {/* Category Badge and Payer Info */}
            {isExpense && category && (
              <div className="flex items-center gap-2 flex-wrap">
                <motion.span 
                  initial={{ opacity: 0.8 }}
                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border"
                  style={{ 
                    backgroundColor: `${category.color}10`, 
                    color: category.color,
                    borderColor: `${category.color}30`
                  }}
                >
                  {category.label}
                </motion.span>
                <span className="text-[10px] text-muted-foreground/70">•</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {isExpense
                    ? `${item.paidBy === 'person1' ? names.person1Name : names.person2Name} paid`
                    : `${item.fromUser === 'person1' ? names.person1Name : names.person2Name} → ${item.toUser === 'person1' ? names.person1Name : names.person2Name}`
                  }
                </span>
              </div>
            )}
            
            {!isExpense && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {`${item.fromUser === 'person1' ? names.person1Name : names.person2Name} → ${item.toUser === 'person1' ? names.person1Name : names.person2Name}`}
                </span>
              </div>
            )}

            {/* Time */}
            <p className="text-[11px] text-muted-foreground/70 font-medium tracking-wide">
              {formatDateShort(item.timestamp || (item.created_at ? { seconds: Math.floor(new Date(item.created_at).getTime() / 1000) } : null))}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ActivityItem
