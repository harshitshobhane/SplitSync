import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { TrendingUp, TrendingDown, Users, Wallet, Calendar, Bell, Share2, Search } from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import SearchModal from '../components/SearchModal'
import ActivityItem from '../components/ActivityItem'
import { formatDate, formatCurrency } from '../utils/dateUtils'
import { share } from '../utils/storage'

const DashboardPage = ({ balance, expenses, transfers, setPage, names, searchQuery, setSearchQuery, showSearch, setShowSearch, currency }) => {
  const queryClient = useQueryClient()
  const { person1Net, person2Net, whoOwesWho, amountOwed, person1Status, person2Status } = balance

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
    const success = await share.shareText('SplitSync Balance', shareText, window.location.href)
    if (!success) {
      const clipboardSuccess = await share.copyToClipboard(shareText)
      if (clipboardSuccess) toast.success('Balance copied to clipboard!')
    }
  }

  return (
    <div className="h-full flex flex-col gap-3 sm:gap-4 w-full pb-20 px-3 sm:px-4 overflow-y-auto scroll-smooth">
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

      {/* Person Cards */}
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
                    <ActivityItem item={item} names={names} currency={currency} />
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

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilter={() => {}} />
    </div>
  )
}

export default DashboardPage