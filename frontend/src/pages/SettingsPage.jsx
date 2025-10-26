import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  Loader2, 
  Sun, 
  Moon, 
  Laptop, 
  User, 
  Bell,
  DollarSign,
  Palette,
  Save
} from 'lucide-react'
import { apiService } from '../lib/api'

const SettingsPage = ({ currentSettings, setPage }) => {
  const [formData, setFormData] = useState({
    person1Name: currentSettings.person1Name || 'Person 1',
    person2Name: currentSettings.person2Name || 'Person 2',
    theme: currentSettings.theme || 'system',
    currency: currentSettings.currency || 'USD',
    notifications: currentSettings.notifications !== false
  })
  
  const queryClient = useQueryClient()

  const updateSettingsMutation = useMutation(apiService.updateSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      toast.success('Settings saved successfully!')
      setPage('dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save settings')
    }
  })

  const handleSave = () => {
    updateSettingsMutation.mutate(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always use light theme' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark theme' },
    { value: 'system', label: 'System', icon: Laptop, description: 'Follow system preference' },
  ]

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
    { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Customize your SplitSync experience</p>
      </div>

      {/* User Names Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <User className="mr-2" size={24} />
          User Names
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Your Name"
            id="person1Name"
            value={formData.person1Name}
            onChange={(e) => handleInputChange('person1Name', e.target.value)}
            placeholder="Enter your name"
            icon="👤"
          />
          <FormInput
            label="Partner's Name"
            id="person2Name"
            value={formData.person2Name}
            onChange={(e) => handleInputChange('person2Name', e.target.value)}
            placeholder="Enter partner's name"
            icon="👤"
          />
        </div>
      </motion.div>
      
      {/* Theme Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <Palette className="mr-2" size={24} />
          Theme
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeOptions.map(option => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleInputChange('theme', option.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                formData.theme === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <option.icon 
                size={24} 
                className={`mb-2 ${
                  formData.theme === option.value 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300'
                }`} 
              />
              <span className={`font-semibold ${
                formData.theme === option.value 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {option.label}
              </span>
              <span className={`text-xs mt-1 ${
                formData.theme === option.value 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {option.description}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Currency Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <DollarSign className="mr-2" size={24} />
          Currency
        </h3>
        <FormSelect
          label="Select Currency"
          id="currency"
          value={formData.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
        >
          {currencyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </motion.div>

      {/* Notifications Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <Bell className="mr-2" size={24} />
          Notifications
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Enable Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get notified about new expenses and balance changes
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInputChange('notifications', !formData.notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={updateSettingsMutation.isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {updateSettingsMutation.isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <Save className="w-6 h-6 mr-2" />
            Save Settings
          </>
        )}
      </motion.button>
    </motion.div>
  )
}

// Helper Components
const FormInput = ({ label, id, value, onChange, placeholder, icon }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {icon && <span className="mr-2">{icon}</span>}{label}
    </label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm px-4 py-3 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
    />
  </div>
)

const FormSelect = ({ label, id, value, onChange, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm px-4 py-3 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {children}
    </select>
  </div>
)

export default SettingsPage
