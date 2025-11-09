// UPI Payment Utilities
// These functions generate UPI payment links that redirect to UPI apps (PhonePe, Paytm, Google Pay, etc.)
// No fees are charged - payments are processed directly through UPI apps

/**
 * Generate UPI payment link
 * @param {string} upiId - UPI ID (e.g., "name@paytm")
 * @param {number} amount - Amount to pay
 * @param {string} name - Payee name
 * @param {string} description - Payment description/note
 * @returns {string} UPI payment URI
 */
export function generateUPIPaymentLink(upiId, amount, name = 'SplitSync Payment', description = '') {
  if (!upiId || !upiId.includes('@')) {
    return null
  }

  const params = new URLSearchParams({
    pa: upiId, // Payee address (UPI ID)
    pn: name, // Payee name
    am: amount.toFixed(2), // Amount
    cu: 'INR', // Currency
    ...(description && { tn: description }) // Transaction note
  })

  return `upi://pay?${params.toString()}`
}

/**
 * Generate UPI payment link for different apps
 * @param {string} upiId - UPI ID
 * @param {number} amount - Amount to pay
 * @param {string} name - Payee name
 * @param {string} description - Payment description
 * @returns {Object} Object with different UPI app links
 */
export function generateUPIAppLinks(upiId, amount, name = 'SplitSync Payment', description = '') {
  const baseLink = generateUPIPaymentLink(upiId, amount, name, description)
  
  if (!baseLink) return null

  return {
    // Universal UPI link (opens default UPI app)
    universal: baseLink,
    
    // PhonePe
    phonepe: `phonepe://pay?${baseLink.split('?')[1]}`,
    
    // Paytm
    paytm: `paytmmp://pay?${baseLink.split('?')[1]}`,
    
    // Google Pay
    googlepay: `tez://pay?${baseLink.split('?')[1]}`,
    
    // BHIM UPI
    bhim: `bhim://pay?${baseLink.split('?')[1]}`,
    
    // Amazon Pay
    amazonpay: `amazonpay://pay?${baseLink.split('?')[1]}`
  }
}

/**
 * Open UPI payment in the specified app
 * @param {string} upiId - UPI ID
 * @param {number} amount - Amount to pay
 * @param {string} name - Payee name
 * @param {string} description - Payment description
 * @param {string} app - App name ('phonepe', 'paytm', 'googlepay', etc.) or 'universal' for default
 */
export function openUPIPayment(upiId, amount, name, description, app = 'universal') {
  const links = generateUPIAppLinks(upiId, amount, name, description)
  
  if (!links) {
    return false
  }

  const link = links[app] || links.universal
  
  if (link) {
    window.location.href = link
    return true
  }
  
  return false
}

/**
 * Check if device supports UPI
 */
export function isUPISupported() {
  // Check if running on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  return isMobile
}

