import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { TrendingUp, TrendingDown, Users, Wallet, Calendar, Bell, Share2, Search, Target, AlertCircle } from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import SearchModal from '../components/SearchModal'
import ActivityItem from '../components/ActivityItem'
import { formatDate, formatCurrency } from '../utils/dateUtils'
import { share } from '../utils/storage'

const DashboardPage = ({ balance, expenses, transfers, setPage, names, searchQuery, setSearchQuery, showSearch, setShowSearch, currency }) => {
  const queryClient = useQueryClient()
  const { person1Net, person2Net, whoOwesWho, amountOwed, person1Status, person2Status } = balance

  // Fetch budgets for current month
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data: budgetsData } = useQuery(
    ['budgets', currentMonth, currentYear],
    () => apiService.getBudgets(currentMonth, currentYear),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Ensure budgets is always an array (handle null/undefined responses)
  const budgets = Array.isArray(budgetsData) ? budgetsData : []

  const recentActivity = useMemo(() => {
    const items = [...expenses, ...transfers]
    return items
      .sort((a, b) => {
        const aTime = a.timestamp?.seconds || (a.created_at ? Math.floor(new Date(a.created_at).getTime() / 1000) : 0)
        const bTime = b.timestamp?.seconds || (b.created_at ? Math.floor(new Date(b.created_at).getTime() / 1000) : 0)
        return bTime - aTime
      })
      .slice(0, 4)
  }, [expenses, transfers])

  const handleShare = async () => {
    const shareText = `${whoOwesWho} - ${formatCurrency(amountOwed, currency)}`
    const success = await share.shareText('SplitHalf Balance', shareText, window.location.href)
    if (!success) {
      const clipboardSuccess = await share.copyToClipboard(shareText)
      if (clipboardSuccess) toast.success('Balance copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen flex flex-col gap-3 sm:gap-4 w-full pt-2 pb-24 px-3 sm:px-4 overflow-y-auto scroll-smooth max-w-4xl mx-auto">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-4 sm:p-6 text-center"
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">{whoOwesWho}</p>
        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{formatCurrency(amountOwed, currency)}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage('addTransfer')} className="btn btn-primary px-4 py-2 text-sm">
            Settle Up
          </button>
        </div>
      </motion.div>

      {/* Person Cards - Only show when there's an outstanding balance */}
      {amountOwed > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-2.5 sm:p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs sm:text-sm font-medium truncate">{names.person1Name}</p>
              {person1Status === 'positive' ? <TrendingUp className="text-emerald-600 h-5 w-5" /> :
                person1Status === 'negative' ? <TrendingDown className="text-red-600 h-5 w-5" /> :
                  <Users className="text-muted-foreground h-5 w-5" />}
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5">{formatCurrency(Math.abs(person1Net), currency)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{person1Net >= 0 ? 'Creditor' : 'Debtor'}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-2.5 sm:p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs sm:text-sm font-medium truncate">{names.person2Name}</p>
              {person2Status === 'positive' ? <TrendingUp className="text-emerald-600 h-5 w-5" /> :
                person2Status === 'negative' ? <TrendingDown className="text-red-600 h-5 w-5" /> :
                  <Users className="text-muted-foreground h-5 w-5" />}
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5">{formatCurrency(Math.abs(person2Net), currency)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{person2Net >= 0 ? 'Creditor' : 'Debtor'}</p>
          </motion.div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: Wallet, label: 'Expenses', value: expenses.length, color: 'text-blue-600' },
          { icon: Calendar, label: 'Today', value: new Date().getDate(), color: 'text-emerald-600' },
          { icon: Bell, label: 'Transfers', value: transfers.length, color: 'text-purple-600' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-premium p-2.5 sm:p-4 text-center"
          >
            <stat.icon className={`${stat.color} mx-auto mb-1 sm:mb-2 h-3.5 w-3.5 sm:h-4 sm:w-4`} />
            <p className="text-base sm:text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Budget Progress */}
      {budgets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Monthly Budgets
            </h2>
            <button
              onClick={() => setPage('settings')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Manage
            </button>
          </div>
          <div className="space-y-2.5">
            {budgets.slice(0, 3).map((budget) => {
              const category = CATEGORIES[budget.budget?.category || budget.category]
              const spent = budget.spent || 0
              const amount = budget.budget?.amount || budget.amount || 0
              const percentUsed = amount > 0 ? (spent / amount) * 100 : 0
              const remaining = amount - spent
              const alertReached = budget.alert_reached || percentUsed >= (budget.budget?.alert_percent || budget.alert_percent || 80)

              return (
                <motion.div
                  key={budget.budget?.id || budget.id || budget.budget?._id || budget._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-premium p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {category && (
                        <div
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${category.color}15` }}
                        >
                          <Target className="h-3.5 w-3.5" style={{ color: category.color }} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{category?.label || budget.budget?.category || budget.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(spent, currency)} / {formatCurrency(amount, currency)}
                        </p>
                      </div>
                    </div>
                    {alertReached && (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all ${percentUsed >= 100 ? 'bg-red-600' :
                        alertReached ? 'bg-amber-600' : 'bg-primary'
                        }`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                      {remaining >= 0 ? `${formatCurrency(remaining, currency)} remaining` : `${formatCurrency(Math.abs(remaining), currency)} over`}
                    </span>
                    <span className="text-muted-foreground">{percentUsed.toFixed(0)}%</span>
                  </div>
                </motion.div>
              )
            })}
            {budgets.length > 3 && (
              <button
                onClick={() => setPage('settings')}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-2"
              >
                View all {budgets.length} budgets →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <div className="flex gap-1">
            <button
              onClick={handleShare}
              className="p-1.5 sm:p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 sm:p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <Wallet className="text-muted-foreground h-14 w-14 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium mb-1.5 text-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mb-4">Start tracking by adding an expense or transfer</p>
              <button
                onClick={() => setPage('addExpense')}
                className="btn btn-primary px-5 py-2.5 text-sm font-medium"
              >
                Add Your First Transaction
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {recentActivity.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ActivityItem
                      item={item}
                      names={names}
                      currency={currency}
                      isMostRecent={i === 0}
                    />
                  </motion.div>
                ))}
              </div>
              {expenses.length + transfers.length > 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <button
                    onClick={() => setPage('allTransactions')}
                    className="w-full btn btn-secondary text-sm font-medium py-3 rounded-xl hover:bg-accent transition-colors"
                  >
                    View All Transactions ({expenses.length + transfers.length})
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilter={() => { }} />
    </div>
  )
}

export default DashboardPage