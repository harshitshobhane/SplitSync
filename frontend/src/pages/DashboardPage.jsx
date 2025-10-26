import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { TrendingUp, TrendingDown, Users, Wallet, Calendar, Bell, Share2, Search } from 'lucide-react'
import { apiService } from '../lib/api'
import { CATEGORIES } from '../utils/constants'
import SearchModal from '../components/SearchModal'
import ActivityItem from '../components/ActivityItem'
import { formatDate } from '../utils/dateUtils'
import { share } from '../utils/storage'

const DashboardPage = ({ balance, expenses, transfers, setPage, names, searchQuery, setSearchQuery, showSearch, setShowSearch }) => {
  const queryClient = useQueryClient()
  const { person1Net, person2Net, whoOwesWho, amountOwed, person1Status, person2Status } = balance

  const recentActivity = useMemo(() => {
    return [...expenses, ...transfers]
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .slice(0, 5)
  }, [expenses, transfers])

  const handleQuickSettle = async () => {
    try {
      const settleAmount = Math.min(Math.abs(person1Net), Math.abs(person2Net))
      await apiService.createTransfer({
        amount: settleAmount,
        fromUser: person1Net > person2Net ? 'person2' : 'person1',
        toUser: person1Net > person2Net ? 'person1' : 'person2',
        description: 'Quick settle up'
      })
      queryClient.invalidateQueries(['transfers'])
      toast.success('Transfer logged successfully!')
    } catch (error) {
      toast.error('Failed to log transfer')
    }
  }

  const handleShare = async () => {
    const shareText = `${whoOwesWho} - $${amountOwed.toFixed(2)}`
    const success = await share.shareText('SplitSync Balance', shareText, window.location.href)
    if (!success) {
      const clipboardSuccess = await share.copyToClipboard(shareText)
      if (clipboardSuccess) toast.success('Balance copied to clipboard!')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 w-full pb-20">
      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 text-center"
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">{whoOwesWho}</p>
        <p className="text-4xl sm:text-5xl font-bold mb-4">${amountOwed.toFixed(2)}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage('addTransfer')} className="btn btn-primary px-4 py-2 text-sm">
            Settle Up
          </button>
          {amountOwed > 0 && (
            <button onClick={handleQuickSettle} className="btn bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 text-sm">
              Quick Settle
            </button>
          )}
        </div>
      </motion.div>

      {/* Person Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium truncate">{names.person1Name}</p>
            {person1Status === 'positive' ? <TrendingUp className="text-emerald-600 h-5 w-5" /> : 
             person1Status === 'negative' ? <TrendingDown className="text-red-600 h-5 w-5" /> : 
             <Users className="text-muted-foreground h-5 w-5" />}
          </div>
          <p className="text-2xl font-bold mb-1">{person1Net >= 0 ? '+' : ''}${Math.abs(person1Net).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{person1Net >= 0 ? 'Creditor' : 'Debtor'}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium truncate">{names.person2Name}</p>
            {person2Status === 'positive' ? <TrendingUp className="text-emerald-600 h-5 w-5" /> : 
             person2Status === 'negative' ? <TrendingDown className="text-red-600 h-5 w-5" /> : 
             <Users className="text-muted-foreground h-5 w-5" />}
          </div>
          <p className="text-2xl font-bold mb-1">{person2Net >= 0 ? '+' : ''}${Math.abs(person2Net).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{person2Net >= 0 ? 'Creditor' : 'Debtor'}</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
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
            className="card-premium p-4 text-center"
          >
            <stat.icon className={`${stat.color} mx-auto mb-2 h-4 w-4`} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <div className="flex gap-2">
            <button onClick={handleShare} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Search size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="text-muted-foreground h-12 w-12 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">No activity yet</p>
              <p className="text-xs text-muted-foreground mb-3">Add your first expense</p>
              <button onClick={() => setPage('addExpense')} className="btn btn-primary px-4 py-2 text-sm">
                Add Expense
              </button>
            </div>
          ) : (
            recentActivity.slice(0, 3).map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <ActivityItem item={item} names={names} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilter={() => {}} />
    </div>
  )
}

export default DashboardPage