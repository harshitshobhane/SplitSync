import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  Loader2, Sun, Moon, Laptop, User, Bell, DollarSign, 
  Palette, Save, Check, Mail, Users, Send, Copy, CheckCircle2
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useTheme } from '../hooks/useTheme'
import { useAuthContext } from '../contexts/AuthContext'

const SettingsPage = ({ currentSettings, setPage }) => {
  const { theme, setTheme } = useTheme()
  const { user } = useAuthContext()
  
  // Get user's name from auth context
  const userName = user?.name || user?.displayName || user?.email?.split('@')[0] || 'Person 1'
  
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
  
  const queryClient = useQueryClient()

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

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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