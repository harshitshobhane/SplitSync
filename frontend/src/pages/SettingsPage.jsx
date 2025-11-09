import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { 
  Loader2, Sun, Moon, Laptop, User, Bell, DollarSign, 
  Palette, Save, Check, Mail, Users, Send, Copy, CheckCircle2,
  Target, Plus, Trash2, Edit2, AlertCircle, FileText, Zap
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import { useAuthContext } from '../contexts/AuthContext'
import { CATEGORIES } from '../utils/constants'
import { formatCurrency } from '../utils/dateUtils'

const SettingsPage = ({ currentSettings, setPage }) => {
  const { theme, setTheme } = useTheme()
  const { user } = useAuthContext()
  
  // Get user's name from auth context
  const userName = user?.name || user?.displayName || user?.email?.split('@')[0] || 'Me'
  
  const [formData, setFormData] = useState({
    theme: theme || 'system',
    currency: currentSettings.currency || 'USD',
    notifications: currentSettings.notifications !== false
  })
  
  // No name fields in settings anymore
  
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [coupleInfo, setCoupleInfo] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Get partner's name from couple info (using useMemo to ensure it's calculated after state is initialized)
  const partnerName = useMemo(() => {
    return coupleInfo?.partner?.name || coupleInfo?.partner?.email?.split('@')[0] || 'Other'
  }, [coupleInfo])
  
  // Budget state
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    alertPercent: 80
  })
  
  // Template state
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    totalAmount: '',
    category: '',
    paidBy: 'person1',
    splitType: 'equal',
    person1Ratio: 50
  })
  
  const queryClient = useQueryClient()
  
  // Fetch budgets
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  const { data: budgetsData, refetch: refetchBudgets } = useQuery(
    ['budgets', currentMonth, currentYear],
    () => apiService.getBudgets(currentMonth, currentYear),
    {
      enabled: !!coupleInfo?.couple && coupleInfo.couple.status === 'active',
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )
  
  // Ensure budgets is always an array (handle null/undefined responses)
  const budgets = Array.isArray(budgetsData) ? budgetsData : []
  
  // Fetch templates
  const { data: templatesData, refetch: refetchTemplates } = useQuery(
    ['templates'],
    () => apiService.getTemplates(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
  
  // Ensure templates is always an array (handle null/undefined responses)
  const templates = Array.isArray(templatesData) ? templatesData : []

  // Fetch couple info on mount (still used for invite link and display-only partner name)
  useEffect(() => {
    const fetchCoupleInfo = async () => {
      try {
        const data = await apiService.getCurrentCouple()
        if (data.couple) {
          setCoupleInfo(data)
          if (data.invitation?.token) {
            const link = `${window.location.origin}/invite/${data.invitation.token}`
            setInviteLink(link)
          }
          // Names are derived at render time; no need to store in settings form
        }
      } catch (error) {
        // Silently fail
      }
    }

    fetchCoupleInfo()
    
    // Poll for couple status changes (in case partner accepts while on settings page)
    const interval = setInterval(fetchCoupleInfo, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Update form data when currentSettings or theme changes
  useEffect(() => {
    setFormData(prev => {
      return {
        theme: theme || 'system',
        currency: currentSettings.currency || 'USD',
        notifications: currentSettings.notifications !== false
      }
    })
  }, [currentSettings, theme])

  const updateSettingsMutation = useMutation(apiService.updateSettings, {
    onSuccess: (data) => {
      // Update cache with the returned data to ensure UI updates immediately
      queryClient.setQueryData('settings', data)
      queryClient.invalidateQueries(['settings'])
      toast.success('Settings saved!')
      setPage('dashboard')
    },
    onError: () => {
      toast.error('Failed to save settings')
    }
  })

  const handleSave = () => {
    const settingsData = {
      theme: formData.theme,
      currency: formData.currency,
      notifications: formData.notifications
    }
    updateSettingsMutation.mutate(settingsData)
  }

  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }))
    setTheme(newTheme)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const invitePartnerMutation = useMutation(
    (email) => apiService.invitePartner(email),
    {
      onSuccess: (data) => {
        toast.success('Invitation sent! Share the link with your partner')
        const link = `${window.location.origin}/invite/${data.invitation.token}`
        setInviteLink(link)
        setInviteEmail('')
      // Refresh couple info after sending invitation
      apiService.getCurrentCouple().then(data => {
        if (data.couple) {
          setCoupleInfo(data)
        }
      })
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send invitation')
      }
    }
  )

  const handleInvitePartner = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    invitePartnerMutation.mutate(inviteEmail)
  }

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode' },
    { value: 'system', label: 'System', icon: Laptop, description: 'Auto' },
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP (£)', symbol: '£' },
    { value: 'INR', label: 'INR (₹)', symbol: '₹' },
    { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
    { value: 'CNY', label: 'CNY (¥)', symbol: '¥' },
    { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
    { value: 'CHF', label: 'CHF', symbol: 'CHF' },
    { value: 'SEK', label: 'SEK', symbol: 'kr' },
    { value: 'NOK', label: 'NOK', symbol: 'kr' },
    { value: 'DKK', label: 'DKK', symbol: 'kr' },
  ]

  return (
    <div className="h-full overflow-y-auto pb-20 px-3 sm:px-4">
      <div className="space-y-4">

        {/* Partner Invitation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-4"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Invite Partner
          </h3>
          
          {coupleInfo?.couple && coupleInfo.couple.status === 'active' ? (
            // Already connected
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Connected with Partner</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {coupleInfo.partner?.name || coupleInfo.partner?.email || 'Partner'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              
              {/* Names are shown read-only elsewhere; no name fields here */}
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to disconnect from your partner?')) {
                    apiService.disconnectCouple().then(() => {
                      toast.success('Disconnected successfully')
                      setCoupleInfo(null)
                      setInviteLink('')
                      // No name state to reset
                    }).catch(err => {
                      toast.error(err.response?.data?.error || 'Failed to disconnect')
                    })
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Disconnect Partner
              </button>
            </div>
          ) : inviteLink ? (
            // Invitation sent, show link
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Invitation Link (Share this with your partner)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="input flex-1 text-xs font-mono"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="btn btn-secondary px-3 py-2"
                    title="Copy link"
                  >
                    {linkCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Partner will automatically connect when they sign up/login via this link
                </p>
              </div>
              <button
                onClick={() => {
                  setInviteLink('')
                  setCoupleInfo(null)
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel Invitation
              </button>
            </div>
          ) : (
            // No invitation, show invite form
            <div className="space-y-3">
              <div>
                <label htmlFor="inviteEmail" className="text-xs text-muted-foreground mb-1 block">
                  Partner's Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input flex-1"
                    placeholder="partner@example.com"
                    onKeyPress={(e) => e.key === 'Enter' && handleInvitePartner()}
                  />
                  <button
                    onClick={handleInvitePartner}
                    disabled={invitePartnerMutation.isLoading || !inviteEmail}
                    className="btn btn-primary px-4"
                  >
                    {invitePartnerMutation.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                An invitation link will be generated. Share it with your partner via email or directly.
              </p>
            </div>
          )}

        </motion.div>

        {/* Theme Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = formData.theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-foreground bg-accent/10'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-xs font-medium">{option.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{option.description}</div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-foreground rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-background" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Currency */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Currency
          </h3>
          <select
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="input w-full"
          >
            {currencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Notifications */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get notified about expenses and balances
              </p>
            </div>
            <button
              onClick={() => handleInputChange('notifications', !formData.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.notifications ? 'bg-foreground' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform ${
                  formData.notifications ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Budget Tracking */}
        {coupleInfo?.couple && coupleInfo.couple.status === 'active' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center">
                <Target className="mr-2 h-4 w-4" />
                Monthly Budgets
              </h3>
              <button
                onClick={() => {
                  setShowBudgetForm(true)
                  setEditingBudget(null)
                  setBudgetForm({ category: '', amount: '', alertPercent: 80 })
                }}
                className="btn btn-secondary px-3 py-1.5 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Budget
              </button>
            </div>

            {showBudgetForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-muted rounded-lg space-y-3"
              >
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={budgetForm.category}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, category: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="">Select category</option>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Monthly Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : formData.currency === 'INR' ? '₹' : formData.currency}
                    </span>
                    <input
                      type="number"
                      value={budgetForm.amount}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      className="input pl-10 w-full text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Alert at {budgetForm.alertPercent}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={budgetForm.alertPercent}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, alertPercent: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!budgetForm.category || !budgetForm.amount) {
                        toast.error('Please fill all fields')
                        return
                      }
                      try {
                        await apiService.createOrUpdateBudget({
                          category: budgetForm.category,
                          amount: parseFloat(budgetForm.amount),
                          month: currentMonth,
                          year: currentYear,
                          alert_percent: budgetForm.alertPercent
                        })
                        toast.success(editingBudget ? 'Budget updated!' : 'Budget created!')
                        setShowBudgetForm(false)
                        setEditingBudget(null)
                        setBudgetForm({ category: '', amount: '', alertPercent: 80 })
                        refetchBudgets()
                      } catch (error) {
                        toast.error('Failed to save budget')
                      }
                    }}
                    className="btn btn-primary px-3 py-1.5 text-xs flex-1"
                  >
                    {editingBudget ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowBudgetForm(false)
                      setEditingBudget(null)
                      setBudgetForm({ category: '', amount: '', alertPercent: 80 })
                    }}
                    className="btn btn-secondary px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {budgets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No budgets set for this month. Add one to track spending!
                </p>
              ) : (
                budgets.map((budget) => {
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
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{category?.label || budget.budget?.category || budget.category}</span>
                            {alertReached && (
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatCurrency(spent, formData.currency)} / {formatCurrency(amount, formData.currency)}</span>
                            <span>•</span>
                            <span>{percentUsed.toFixed(1)}% used</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingBudget(budget)
                              setBudgetForm({
                                category: budget.budget?.category || budget.category,
                                amount: (budget.budget?.amount || budget.amount).toString(),
                                alertPercent: budget.budget?.alert_percent || budget.alert_percent || 80
                              })
                              setShowBudgetForm(true)
                            }}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this budget?')) {
                                try {
                                  await apiService.deleteBudget(budget.budget?.id || budget.id || budget.budget?._id || budget._id)
                                  toast.success('Budget deleted')
                                  refetchBudgets()
                                } catch (error) {
                                  toast.error('Failed to delete budget')
                                }
                              }
                            }}
                            className="p-1 hover:bg-accent rounded text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-background rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentUsed >= 100 ? 'bg-red-600' :
                            alertReached ? 'bg-amber-600' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                          {remaining >= 0 ? `${formatCurrency(remaining, formData.currency)} remaining` : `${formatCurrency(Math.abs(remaining), formData.currency)} over budget`}
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* Expense Templates */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Quick Templates
            </h3>
            <button
              onClick={() => {
                setShowTemplateForm(true)
                setEditingTemplate(null)
                setTemplateForm({
                  name: '',
                  description: '',
                  totalAmount: '',
                  category: '',
                  paidBy: 'person1',
                  splitType: 'equal',
                  person1Ratio: 50
                })
              }}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Template
            </button>
          </div>

          {showTemplateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-muted rounded-lg space-y-3"
            >
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Groceries"
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Grocery shopping"
                  className="input w-full text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : formData.currency === 'INR' ? '₹' : formData.currency}
                    </span>
                    <input
                      type="number"
                      value={templateForm.totalAmount}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      className="input pl-8 w-full text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="">Select</option>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Paid By</label>
                  <select
                    value={templateForm.paidBy}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, paidBy: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="person1">{userName}</option>
                    <option value="person2">{partnerName}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Split Type</label>
                  <select
                    value={templateForm.splitType}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, splitType: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="equal">Equal</option>
                    <option value="ratio">Ratio</option>
                  </select>
                </div>
              </div>
              {templateForm.splitType === 'ratio' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {userName} Ratio: {templateForm.person1Ratio}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={templateForm.person1Ratio}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, person1Ratio: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!templateForm.name || !templateForm.description || !templateForm.totalAmount || !templateForm.category) {
                      toast.error('Please fill all fields')
                      return
                    }
                    try {
                      const totalAmount = parseFloat(templateForm.totalAmount)
                      let person1Share = 0
                      let person2Share = 0
                      
                      if (templateForm.splitType === 'equal') {
                        person1Share = totalAmount / 2
                        person2Share = totalAmount / 2
                      } else {
                        person1Share = totalAmount * (templateForm.person1Ratio / 100)
                        person2Share = totalAmount - person1Share
                      }
                      
                      const templateData = {
                        name: templateForm.name,
                        description: templateForm.description,
                        total_amount: totalAmount,
                        category: templateForm.category,
                        paid_by: templateForm.paidBy,
                        split_type: templateForm.splitType,
                        person1_share: person1Share,
                        person2_share: person2Share
                      }
                      
                      if (editingTemplate) {
                        await apiService.updateTemplate(editingTemplate.id || editingTemplate._id, templateData)
                        toast.success('Template updated!')
                      } else {
                        await apiService.createTemplate(templateData)
                        toast.success('Template created!')
                      }
                      setShowTemplateForm(false)
                      setEditingTemplate(null)
                      setTemplateForm({
                        name: '',
                        description: '',
                        totalAmount: '',
                        category: '',
                        paidBy: 'person1',
                        splitType: 'equal',
                        person1Ratio: 50
                      })
                      refetchTemplates()
                    } catch (error) {
                      toast.error('Failed to save template')
                    }
                  }}
                  className="btn btn-primary px-3 py-1.5 text-xs flex-1"
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowTemplateForm(false)
                    setEditingTemplate(null)
                    setTemplateForm({
                      name: '',
                      description: '',
                      totalAmount: '',
                      category: '',
                      paidBy: 'person1',
                      splitType: 'equal',
                      person1Ratio: 50
                    })
                  }}
                  className="btn btn-secondary px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No templates yet. Create one for quick expense entry!
              </p>
            ) : (
              templates.map((template) => {
                const category = CATEGORIES[template.category]
                return (
                  <motion.div
                    key={template.id || template._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-muted rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {category && (
                          <div 
                            className="p-1 rounded"
                            style={{ backgroundColor: `${category.color}15` }}
                          >
                            <FileText className="h-3 w-3" style={{ color: category.color }} />
                          </div>
                        )}
                        <span className="text-sm font-semibold">{template.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(template.total_amount || template.totalAmount, formData.currency)} • {category?.label || template.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingTemplate(template)
                          setTemplateForm({
                            name: template.name,
                            description: template.description,
                            totalAmount: (template.total_amount || template.totalAmount).toString(),
                            category: template.category,
                            paidBy: template.paid_by || template.paidBy,
                            splitType: template.split_type || template.splitType,
                            person1Ratio: template.split_type === 'ratio' ? 
                              ((template.person1_share || template.person1Share) / (template.total_amount || template.totalAmount)) * 100 : 50
                          })
                          setShowTemplateForm(true)
                        }}
                        className="p-1 hover:bg-accent rounded"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this template?')) {
                            try {
                              await apiService.deleteTemplate(template.id || template._id)
                              toast.success('Template deleted')
                              refetchTemplates()
                            } catch (error) {
                              toast.error('Failed to delete template')
                            }
                          }
                        }}
                        className="p-1 hover:bg-accent rounded text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={updateSettingsMutation.isLoading}
          className="btn btn-primary w-full py-3 flex items-center justify-center text-sm font-semibold"
        >
          {updateSettingsMutation.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Settings
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

export default SettingsPage