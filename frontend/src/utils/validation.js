// Validation utility functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const validateAmount = (amount) => {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

export const validateRequired = (value) => {
  return value && value.trim().length > 0
}

export const validateRatio = (ratio) => {
  const num = parseFloat(ratio)
  return !isNaN(num) && num >= 0 && num <= 100
}

export const validateExactAmount = (amount, total) => {
  const num = parseFloat(amount)
  return !isNaN(num) && num >= 0 && num <= total
}

// Form validation helpers
export const getFieldError = (field, value, rules = {}) => {
  if (rules.required && !validateRequired(value)) {
    return `${field} is required`
  }
  
  if (rules.email && !validateEmail(value)) {
    return 'Please enter a valid email address'
  }
  
  if (rules.password && !validatePassword(value)) {
    return 'Password must be at least 6 characters'
  }
  
  if (rules.amount && !validateAmount(value)) {
    return 'Please enter a valid amount'
  }
  
  if (rules.ratio && !validateRatio(value)) {
    return 'Ratio must be between 0 and 100'
  }
  
  if (rules.exactAmount && !validateExactAmount(value, rules.max)) {
    return `Amount must be between 0 and ${rules.max}`
  }
  
  return null
}
