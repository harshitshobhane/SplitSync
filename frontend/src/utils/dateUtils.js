// Date utility functions
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown date'
  
  const date = new Date(timestamp.seconds * 1000)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  
  return date.toLocaleDateString()
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
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
