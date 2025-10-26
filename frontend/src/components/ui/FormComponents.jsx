import React from 'react'
import { motion } from 'framer-motion'

// Modern Form Input Component
export const ModernFormInput = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  step, 
  containerClassName = "", 
  icon, 
  min, 
  max,
  error 
}) => (
  <div className={containerClassName}>
    <label htmlFor={id} className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {icon && <span className="mr-2 text-gray-500 dark:text-gray-400">{icon}</span>}{label}
    </label>
    <div className="relative">
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className={`input w-full ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  </div>
)

// Modern Form Select Component
export const ModernFormSelect = ({ 
  label, 
  id, 
  value, 
  onChange, 
  children, 
  icon, 
  error 
}) => (
  <div>
    <label htmlFor={id} className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {icon && <span className="mr-2 text-gray-500 dark:text-gray-400">{icon}</span>}{label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`input w-full appearance-none cursor-pointer ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  </div>
)

// Modern Radio Card Component
export const ModernRadioCard = ({ 
  label, 
  value, 
  checked, 
  onChange, 
  icon 
}) => (
  <motion.label
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`card-premium p-3 text-center cursor-pointer transition-all duration-300 ${
      checked
        ? 'ring-2 ring-slate-500/50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/30'
        : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700'
    }`}
  >
    <input
      type="radio"
      name="radio-group"
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div className="flex flex-col items-center space-y-2">
      <div className={`p-2 rounded-lg ${checked ? 'bg-slate-100 dark:bg-slate-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
    </div>
  </motion.label>
)

// Modern Split Option Component
export const ModernSplitOption = ({ 
  label, 
  value, 
  checked, 
  onChange, 
  icon 
}) => (
  <motion.label
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
      checked
        ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/30 border-slate-500 text-slate-700 dark:text-slate-300'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600'
    }`}
  >
    <input
      type="radio"
      name="split-type"
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div className={`mb-2 p-2 rounded-lg ${checked ? 'bg-slate-100 dark:bg-slate-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
      {icon}
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </motion.label>
)

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    default: 'w-12 h-12 sm:w-16 sm:h-16',
    large: 'w-20 h-20'
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col justify-center items-center space-y-4 ${className}`}
    >
      <div className="relative">
        <div className={`${sizeClasses[size]} text-rose-500 animate-spin`}>
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-rose-200 rounded-full animate-pulse`}></div>
      </div>
      <div className="text-center">
        <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Loading...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait a moment</p>
      </div>
    </motion.div>
  )
}

// Error Message Component
export const ErrorMessage = ({ message, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2 ${className}`}
  >
    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
    <span className="text-sm font-medium">{message}</span>
  </motion.div>
)

// Success Message Component
export const SuccessMessage = ({ message, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center space-x-2 ${className}`}
  >
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    <span className="text-sm font-medium">{message}</span>
  </motion.div>
)
