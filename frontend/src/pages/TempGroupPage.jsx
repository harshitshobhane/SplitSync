import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Users, Plus, X, QrCode, Copy, Share2, ArrowLeft, Calculator, DollarSign,
  UserPlus, Hash, CheckCircle, AlertCircle, Trash2, Edit2, LogOut, UserMinus
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { CATEGORIES } from '../utils/constants'
import { getCurrencySymbol, formatCurrency } from '../utils/dateUtils'

// Generate a random group code
const generateGroupCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Load/save group data from localStorage
const loadGroupData = (groupId) => {
  try {
    const data = localStorage.getItem(`temp_group_${groupId}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const saveGroupData = (groupId, data) => {
  try {
    localStorage.setItem(`temp_group_${groupId}`, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

const TempGroupPage = ({ onBack }) => {
  const [groupId, setGroupId] = useState(null)
  const [groupData, setGroupData] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    paidBy: '',
    splitType: 'equal', // 'equal', 'custom'
    shares: {} // { memberId: amount }
  })
  const [currentUserId, setCurrentUserId] = useState(null) // Track current user's member ID

  // Load group from URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      const data = loadGroupData(code)
      if (data) {
        setGroupId(code)
        setGroupData(data)
        // Load current user ID if exists
        const savedUserId = sessionStorage.getItem(`temp_group_user_${code}`)
        if (savedUserId) {
          setCurrentUserId(savedUserId)
        }
      } else {
        toast.error('Group not found')
      }
    } else {
      // Check if there's a group in session
      const savedGroupId = sessionStorage.getItem('current_temp_group')
      if (savedGroupId) {
        const data = loadGroupData(savedGroupId)
        if (data) {
          setGroupId(savedGroupId)
          setGroupData(data)
          // Load current user ID if exists
          const savedUserId = sessionStorage.getItem(`temp_group_user_${savedGroupId}`)
          if (savedUserId) {
            setCurrentUserId(savedUserId)
          }
        }
      }
    }
  }, [])

  // Save group data whenever it changes
  useEffect(() => {
    if (groupId && groupData) {
      saveGroupData(groupId, groupData)
      sessionStorage.setItem('current_temp_group', groupId)
    }
  }, [groupId, groupData])

  // Create new group
  const handleCreateGroup = () => {
    const code = generateGroupCode()
    const creatorId = String(Date.now())
    const newGroup = {
      code,
      creatorId, // Track who created the group
      members: [
        { id: creatorId, name: 'You', color: '#3b82f6' }
      ],
      expenses: [],
      createdAt: Date.now()
    }
    setGroupId(code)
    setGroupData(newGroup)
    setCurrentUserId(creatorId) // Set current user
    sessionStorage.setItem(`temp_group_user_${code}`, creatorId)
    setShowCreateModal(false)
    toast.success(`Group created! Code: ${code}`)
  }

  // Join existing group
  const handleJoinGroup = () => {
    const code = joinCode.toUpperCase().trim()
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-character code')
      return
    }

    const data = loadGroupData(code)
    if (!data) {
      toast.error('Group not found')
      return
    }

    // Check if user already in group
    const savedUserId = sessionStorage.getItem(`temp_group_user_${code}`)
    if (savedUserId && data.members.find(m => m.id === savedUserId)) {
      // User already in group, just load it
      setGroupId(code)
      setGroupData(data)
      setCurrentUserId(savedUserId)
      setShowJoinModal(false)
      setJoinCode('')
      return
    }

    // Add current user to group
    const newMemberId = String(Date.now())
    const updatedData = {
      ...data,
      members: [
        ...data.members,
        { id: newMemberId, name: 'You', color: `#${Math.floor(Math.random()*16777215).toString(16)}` }
      ]
    }

    setGroupId(code)
    setGroupData(updatedData)
    setCurrentUserId(newMemberId)
    sessionStorage.setItem(`temp_group_user_${code}`, newMemberId)
    setShowJoinModal(false)
    setJoinCode('')
    toast.success('Joined group!')
  }

  // Add new member
  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      toast.error('Enter member name')
      return
    }

    const newMemberId = String(Date.now())
    const newMember = {
      id: newMemberId,
      name: newMemberName.trim(),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }

    setGroupData({
      ...groupData,
      members: [...groupData.members, newMember]
    })
    setNewMemberName('')
    toast.success('Member added!')
  }

  // Add expense
  const handleAddExpense = () => {
    const amount = parseFloat(expenseForm.amount)
    if (!amount || amount <= 0) {
      toast.error('Enter valid amount')
      return
    }
    if (!expenseForm.description.trim()) {
      toast.error('Enter description')
      return
    }
    if (!expenseForm.paidBy) {
      toast.error('Select who paid')
      return
    }

    let shares = {}
    if (expenseForm.splitType === 'equal') {
      // Equal split
      const perPerson = amount / groupData.members.length
      groupData.members.forEach(member => {
        shares[member.id] = perPerson
      })
    } else {
      // Custom split
      const totalShares = Object.values(expenseForm.shares).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
      if (Math.abs(totalShares - amount) > 0.01) {
        toast.error(`Shares must total ₹${amount.toFixed(2)}`)
        return
      }
      shares = expenseForm.shares
    }

    const newExpense = {
      id: String(Date.now()),
      amount,
      description: expenseForm.description.trim(),
      paidBy: expenseForm.paidBy,
      shares,
      createdAt: Date.now()
    }

    setGroupData({
      ...groupData,
      expenses: [...groupData.expenses, newExpense]
    })

    setExpenseForm({
      amount: '',
      description: '',
      paidBy: '',
      splitType: 'equal',
      shares: {}
    })
    setShowAddExpense(false)
    toast.success('Expense added!')
  }

  // Delete expense
  const handleDeleteExpense = (expenseId) => {
    setGroupData({
      ...groupData,
      expenses: groupData.expenses.filter(e => e.id !== expenseId)
    })
    toast.success('Expense removed')
  }

  // Remove member (only creator can remove others)
  const handleRemoveMember = (memberId) => {
    if (!groupData || !currentUserId) return

    // Check if user is creator
    const isCreator = groupData.creatorId === currentUserId
    if (!isCreator) {
      toast.error('Only group creator can remove members')
      return
    }

    // Can't remove yourself
    if (memberId === currentUserId) {
      toast.error('Use "Leave Group" to remove yourself')
      return
    }

    // Can't remove if only one member left
    if (groupData.members.length <= 1) {
      toast.error('Cannot remove the last member')
      return
    }

    // Remove member and their expenses
    const updatedMembers = groupData.members.filter(m => m.id !== memberId)
    const updatedExpenses = groupData.expenses.filter(expense => {
      // Remove expenses where this member paid or was involved
      if (expense.paidBy === memberId) return false
      if (expense.shares[memberId]) {
        // Remove member from shares, redistribute if needed
        const remainingMembers = Object.keys(expense.shares).filter(id => id !== memberId)
        if (remainingMembers.length === 0) return false // Remove expense if no one left
        
        // Redistribute the removed member's share equally
        const removedShare = expense.shares[memberId]
        const sharePerPerson = removedShare / remainingMembers.length
        remainingMembers.forEach(id => {
          expense.shares[id] = (expense.shares[id] || 0) + sharePerPerson
        })
        delete expense.shares[memberId]
      }
      return true
    })

    setGroupData({
      ...groupData,
      members: updatedMembers,
      expenses: updatedExpenses
    })
    toast.success('Member removed')
  }

  // Leave group
  const handleLeaveGroup = () => {
    if (!groupData || !currentUserId || !groupData) return

    // Can't leave if you're the only member
    if (groupData.members.length <= 1) {
      toast.error('Cannot leave - you are the only member')
      return
    }

    // Remove current user from members
    const updatedMembers = groupData.members.filter(m => m.id !== currentUserId)
    
    // Handle expenses - remove expenses where user paid, or remove user from shares
    const updatedExpenses = groupData.expenses.filter(expense => {
      // Remove expenses where user paid
      if (expense.paidBy === currentUserId) return false
      
      // Remove user from shares and redistribute
      if (expense.shares[currentUserId]) {
        const remainingMembers = Object.keys(expense.shares).filter(id => id !== currentUserId)
        if (remainingMembers.length === 0) return false
        
        const removedShare = expense.shares[currentUserId]
        const sharePerPerson = removedShare / remainingMembers.length
        remainingMembers.forEach(id => {
          expense.shares[id] = (expense.shares[id] || 0) + sharePerPerson
        })
        delete expense.shares[currentUserId]
      }
      return true
    })

    // If user was creator, transfer creator to first remaining member
    let updatedCreatorId = groupData.creatorId
    if (groupData.creatorId === currentUserId && updatedMembers.length > 0) {
      updatedCreatorId = updatedMembers[0].id
    }

    setGroupData({
      ...groupData,
      creatorId: updatedCreatorId,
      members: updatedMembers,
      expenses: updatedExpenses
    })

    // Clear session and go back
    sessionStorage.removeItem(`temp_group_user_${groupId}`)
    sessionStorage.removeItem('current_temp_group')
    setGroupId(null)
    setGroupData(null)
    setCurrentUserId(null)
    
    if (onBack) {
      onBack()
    } else {
      window.location.href = window.location.pathname
    }
    toast.success('Left group')
  }

  // Calculate balances
  const balances = useMemo(() => {
    if (!groupData) return {}

    const memberBalances = {}
    groupData.members.forEach(member => {
      memberBalances[member.id] = { paid: 0, owes: 0, net: 0 }
    })

    // Calculate from expenses
    groupData.expenses.forEach(expense => {
      // Who paid gets credited
      memberBalances[expense.paidBy].paid += expense.amount

      // Everyone owes their share
      Object.entries(expense.shares).forEach(([memberId, share]) => {
        memberBalances[memberId].owes += share
      })
    })

    // Calculate net
    Object.keys(memberBalances).forEach(memberId => {
      memberBalances[memberId].net = memberBalances[memberId].paid - memberBalances[memberId].owes
    })

    return memberBalances
  }, [groupData])

  // Copy group link
  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?code=${groupId}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied!')
  }

  // Get share URL
  const shareUrl = groupId ? `${window.location.origin}${window.location.pathname}?code=${groupId}` : ''

  if (!groupData) {
    // Show create/join options
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-4"
        >
          <div className="text-center mb-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Temporary Group Split</h1>
            <p className="text-muted-foreground">
              Split expenses with friends instantly. No signup required!
            </p>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 bg-foreground text-background rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create New Group
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoinModal(true)}
              className="w-full py-4 bg-card border border-border rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Hash className="h-5 w-5" />
              Join Group
            </motion.button>

            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Home
              </button>
            )}
          </div>

          {/* Create Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                onClick={() => setShowCreateModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-border rounded-2xl p-6 max-w-md w-full"
                >
                  <h2 className="text-xl font-bold mb-4">Create Group</h2>
                  <p className="text-muted-foreground mb-6">
                    Create a temporary group to split expenses. Share the code with friends!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2 px-4 border border-border rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGroup}
                      className="flex-1 py-2 px-4 bg-foreground text-background rounded-xl font-semibold"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join Modal */}
          <AnimatePresence>
            {showJoinModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                onClick={() => setShowJoinModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-border rounded-2xl p-6 max-w-md w-full"
                >
                  <h2 className="text-xl font-bold mb-4">Join Group</h2>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="w-full input mb-4 text-center text-2xl font-mono tracking-widest"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowJoinModal(false)}
                      className="flex-1 py-2 px-4 border border-border rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinGroup}
                      className="flex-1 py-2 px-4 bg-foreground text-background rounded-xl font-semibold"
                    >
                      Join
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    )
  }

  // Main group view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold">Group: {groupId}</h1>
                <p className="text-xs text-muted-foreground">
                  {groupData.members.length} member{groupData.members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 hover:bg-accent rounded-lg"
                title="Share QR Code"
              >
                <QrCode className="h-5 w-5" />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2 hover:bg-accent rounded-lg"
                title="Copy Link"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Group Code Display */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Group Code</p>
              <p className="text-2xl font-mono font-bold">{groupId}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(groupId)
                toast.success('Code copied!')
              }}
              className="p-2 hover:bg-accent rounded-lg"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Members</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Add member..."
                className="input text-sm flex-1 max-w-[150px]"
              />
              <button
                onClick={handleAddMember}
                className="p-2 bg-primary text-primary-foreground rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {groupData.members.map(member => {
              const balance = balances[member.id] || { net: 0, paid: 0, owes: 0 }
              const isCurrentUser = member.id === currentUserId
              const isMemberCreator = groupData.creatorId === member.id
              const isCurrentUserCreator = groupData.creatorId === currentUserId
              const canRemove = isCurrentUserCreator && !isCurrentUser && groupData.members.length > 1
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-xl group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{member.name}</p>
                        {isMemberCreator && (
                          <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paid: {formatCurrency(balance.paid, 'INR')} • Owes: {formatCurrency(balance.owes, 'INR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {balance.net > 0.01 ? (
                        <p className="text-sm font-bold text-green-600">
                          +{formatCurrency(balance.net, 'INR')}
                        </p>
                      ) : balance.net < -0.01 ? (
                        <p className="text-sm font-bold text-red-600">
                          {formatCurrency(balance.net, 'INR')}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Even</p>
                      )}
                    </div>
                    {/* Action buttons - Always visible */}
                    <div className="flex items-center gap-1">
                      {isCurrentUser ? (
                        <button
                          onClick={handleLeaveGroup}
                          className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors opacity-70 hover:opacity-100"
                          title="Leave Group"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      ) : canRemove ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${member.name} from the group?`)) {
                              handleRemoveMember(member.id)
                            }
                          }}
                          className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors opacity-70 hover:opacity-100"
                          title="Remove Member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Leave Group Button (always visible for current user) */}
          {currentUserId && groupData.members.find(m => m.id === currentUserId) && (
            <button
              onClick={handleLeaveGroup}
              className="w-full mt-4 py-2.5 px-4 border border-red-500/30 text-red-500 rounded-xl font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Leave Group
            </button>
          )}
        </div>

        {/* Add Expense Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddExpense(true)}
          className="w-full py-4 bg-foreground text-background rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Expense
        </motion.button>

        {/* Expenses List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Expenses</h2>
          {groupData.expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No expenses yet. Add one to get started!</p>
            </div>
          ) : (
            groupData.expenses.map(expense => {
              const paidByMember = groupData.members.find(m => m.id === expense.paidBy)
              return (
                <div
                  key={expense.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid by {paidByMember?.name || 'Unknown'} • {formatCurrency(expense.amount, 'INR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 hover:bg-accent rounded-lg text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Split:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(expense.shares).map(([memberId, share]) => {
                        const member = groupData.members.find(m => m.id === memberId)
                        return (
                          <div
                            key={memberId}
                            className="text-xs px-2 py-1 rounded bg-muted"
                          >
                            {member?.name}: {formatCurrency(share, 'INR')}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAddExpense(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold mb-4">Add Expense</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getCurrencySymbol('INR')}
                    </span>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full input pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="What was this for?"
                    className="w-full input"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Paid By</label>
                  <select
                    value={expenseForm.paidBy}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                    className="w-full input"
                  >
                    <option value="">Select member</option>
                    {groupData.members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Split Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpenseForm({ ...expenseForm, splitType: 'equal' })}
                      className={`flex-1 py-2 px-4 rounded-xl border ${
                        expenseForm.splitType === 'equal'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border'
                      }`}
                    >
                      Equal
                    </button>
                    <button
                      onClick={() => setExpenseForm({ ...expenseForm, splitType: 'custom' })}
                      className={`flex-1 py-2 px-4 rounded-xl border ${
                        expenseForm.splitType === 'custom'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {expenseForm.splitType === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Custom Split</label>
                    {groupData.members.map(member => (
                      <div key={member.id} className="flex items-center gap-2">
                        <span className="text-sm w-20">{member.name}:</span>
                        <input
                          type="number"
                          value={expenseForm.shares[member.id] || ''}
                          onChange={(e) => setExpenseForm({
                            ...expenseForm,
                            shares: {
                              ...expenseForm.shares,
                              [member.id]: e.target.value
                            }
                          })}
                          placeholder="0.00"
                          step="0.01"
                          className="flex-1 input text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddExpense(false)}
                    className="flex-1 py-2 px-4 border border-border rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExpense}
                    className="flex-1 py-2 px-4 bg-foreground text-background rounded-xl font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <h2 className="text-xl font-bold mb-4">Share Group</h2>
              <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
                <QRCode value={shareUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scan to join group: <strong>{groupId}</strong>
              </p>
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-4 bg-foreground text-background rounded-xl font-semibold"
              >
                Copy Link
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TempGroupPage

