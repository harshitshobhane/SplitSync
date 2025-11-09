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
  const isQueued = !!(item.queued || item._queued)
  
  const category = isExpense ? CATEGORIES[item.category] || CATEGORIES.other : null
  const CategoryIcon = category ? iconMap[category.icon] : null

  return (
    <motion.div 
      whileHover={{ scale: 1.005, y: -1 }}
      className={`group relative overflow-hidden bg-card/80 backdrop-blur-sm border rounded-2xl p-4 sm:p-5 hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${isQueued ? 'border-dashed border-amber-400/70' : 'border-border/60'}`}
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
                {isQueued && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">Queued</span>
                )}
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
                  {`${item.paidBy === 'person1' ? names.person1Name : names.person2Name} paid`}
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

            {/* Split Information for Expenses */}
            {isExpense && (
              <div className="flex flex-col gap-1">
                {(() => {
                  let person1Share = parseFloat(item.person1Share) || parseFloat(item.person1_share) || 0
                  let person2Share = parseFloat(item.person2Share) || parseFloat(item.person2_share) || 0
                  const totalAmount = parseFloat(item.totalAmount) || parseFloat(item.total_amount) || 0
                  
                  if (totalAmount > 0) {
                    // Validate and fix shares if they don't add up correctly
                    const sumShares = person1Share + person2Share
                    
                    // If shares don't match total, recalculate based on split type
                    if (Math.abs(sumShares - totalAmount) > 0.01) {
                      const splitType = item.splitType || item.split_type || 'equal'
                      
                      if (splitType === 'equal') {
                        // Equal split: 50/50
                        person1Share = totalAmount / 2
                        person2Share = totalAmount / 2
                      } else if (splitType === 'ratio') {
                        // Ratio split: use stored ratio or default to 50/50
                        const person1Ratio = parseFloat(item.person1Ratio) || parseFloat(item.person1_ratio) || 50
                        person1Share = totalAmount * (person1Ratio / 100)
                        person2Share = totalAmount - person1Share
                      } else {
                        // Exact split: normalize the existing shares
                        if (sumShares > 0) {
                          const ratio = totalAmount / sumShares
                          person1Share = person1Share * ratio
                          person2Share = person2Share * ratio
                        } else {
                          // Fallback to equal split
                          person1Share = totalAmount / 2
                          person2Share = totalAmount / 2
                        }
                      }
                    }
                    
                    const person1Percent = ((person1Share / totalAmount) * 100).toFixed(0)
                    const person2Percent = ((person2Share / totalAmount) * 100).toFixed(0)
                    
                    // Show split as percentage if it's close to 50/50, otherwise show percentages
                    const isEqualSplit = Math.abs(person1Percent - person2Percent) < 1
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="text-muted-foreground font-medium">Split:</span>
                        {isEqualSplit ? (
                          <span className="font-semibold text-foreground/90">50% / 50%</span>
                        ) : (
                          <span className="font-semibold text-foreground/90">
                            {person1Percent}% / {person2Percent}%
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground">
                          {names.person1Name}: {formatCurrency(person1Share, currency)} • {names.person2Name}: {formatCurrency(person2Share, currency)}
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
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
