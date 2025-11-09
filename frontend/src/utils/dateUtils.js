// Date utility functions
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown date'
  
  const date = new Date(timestamp.seconds * 1000)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.ceil(diffTime / (1000 * 60))
  
  // Get time in 12-hour format
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
  
  if (diffDays === 1) return `Today at ${time}`
  if (diffDays === 2) return `Yesterday at ${time}`
  if (diffHours < 24) return `${diffHours} hours ago at ${time}`
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  
  return date.toLocaleDateString() + ' at ' + time
}

export const formatDateShort = (timestamp) => {
  if (!timestamp) return 'Unknown date'
  
  const date = new Date(timestamp.seconds * 1000)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
  
  if (diffDays === 1) return `Today, ${time}`
  if (diffDays === 2) return `Yesterday, ${time}`
  if (diffDays <= 7) return `${diffDays - 1} days ago, ${time}`
  
  return date.toLocaleDateString() + ', ' + time
}

// Returns a converted and formatted amount. Assumes base currency is INR unless overridden via localStorage('fx_base').
export const formatCurrency = (amount, currency = 'USD') => {
  const base = (typeof localStorage !== 'undefined' && localStorage.getItem('fx_base')) || 'INR'
  let amountToFormat = Number(amount) || 0

  // Convert from base -> target if different and we have rates cached
  if (currency && base && currency !== base) {
    try {
      const cacheKey = `fx_${base}`
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey)
      if (raw) {
        const cached = JSON.parse(raw)
        const rate = cached?.rates?.[currency]
        if (typeof rate === 'number' && rate > 0) {
          amountToFormat = amountToFormat * rate
        }
      }
    } catch (_) {
      // ignore conversion errors and fall back to original amount
    }
  }
  // Map currency to appropriate locale for better formatting
  const localeMap = {
    'USD': 'en-US',
    'EUR': 'de-DE',  // Uses € format
    'GBP': 'en-GB',  // Uses £ format
    'INR': 'en-IN',  // Uses ₹ format
    'JPY': 'ja-JP',  // Uses ¥ format
    'CNY': 'zh-CN',  // Uses ¥ format
    'CAD': 'en-CA',
    'AUD': 'en-AU',
    'CHF': 'de-CH',
    'SEK': 'sv-SE',
    'NOK': 'no-NO',
    'DKK': 'da-DK',
  }
  
  const locale = localeMap[currency] || 'en-US'
  
  // For INR and some currencies, ensure proper decimal handling
  const options = {
    style: 'currency',
    currency: currency,
  }
  
  // For JPY and some currencies, don't show decimals
  if (['JPY', 'KRW'].includes(currency)) {
    options.minimumFractionDigits = 0
    options.maximumFractionDigits = 0
  }
  
  try {
    return new Intl.NumberFormat(locale, options).format(amountToFormat)
  } catch (error) {
    // Fallback to simple formatting
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amountToFormat.toFixed(2)}`
  }
}

export const getCurrencySymbol = (currency = 'USD') => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
  }
  return symbols[currency] || '$'
}

export const formatPercentage = (value, total) => {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export const getCurrentMonth = () => {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    firstDay: new Date(now.getFullYear(), now.getMonth(), 1),
  }
}

export const isToday = (timestamp) => {
  if (!timestamp) return false
  const date = new Date(timestamp.seconds * 1000)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export const isThisMonth = (timestamp) => {
  if (!timestamp) return false
  const date = new Date(timestamp.seconds * 1000)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}
