import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  Loader2, Sun, Moon, Laptop, User, Bell, DollarSign, 
  Palette, Save, Check
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useTheme } from '../hooks/useTheme'

const SettingsPage = ({ currentSettings, setPage }) => {
  const { theme, setTheme } = useTheme()
  const [formData, setFormData] = useState({
    person1Name: currentSettings.person1Name || 'Person 1',
    person2Name: currentSettings.person2Name || 'Person 2',
    theme: theme || 'system',
    currency: currentSettings.currency || 'USD',
    notifications: currentSettings.notifications !== false
  })
  
  const queryClient = useQueryClient()

  const updateSettingsMutation = useMutation(apiService.updateSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      toast.success('Settings saved!')
      setPage('dashboard')
    },
    onError: () => {
      toast.error('Failed to save settings')
    }
  })

  const handleSave = () => {
    updateSettingsMutation.mutate(formData)
  }

  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }))
    setTheme(newTheme)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  ]

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="space-y-4">
        {/* User Names */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <User className="mr-2 h-4 w-4" />
            User Names
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="person1Name" className="text-xs text-muted-foreground mb-1 block">
                Your Name
              </label>
              <input
                type="text"
                id="person1Name"
                value={formData.person1Name}
                onChange={(e) => handleInputChange('person1Name', e.target.value)}
                className="input w-full"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="person2Name" className="text-xs text-muted-foreground mb-1 block">
                Partner's Name
              </label>
              <input
                type="text"
                id="person2Name"
                value={formData.person2Name}
                onChange={(e) => handleInputChange('person2Name', e.target.value)}
                className="input w-full"
                placeholder="Partner's name"
              />
            </div>
          </div>
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
              Save Settings
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

export default SettingsPage