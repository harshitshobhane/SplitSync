// UPI Payment Utilities
// These functions generate UPI payment links that redirect to UPI apps (PhonePe, Paytm, Google Pay, etc.)
// No fees are charged - payments are processed directly through UPI apps

/**
 * Generate UPI payment link for QR codes
 * IMPORTANT: We can optionally exclude amount to avoid UPI Risk Policy errors
 * @param {string} upiId - UPI ID (e.g., "name@paytm")
 * @param {number} amount - Amount to pay (optional, can be 0 to exclude)
 * @param {string} name - Payee name
 * @param {string} description - Payment description/note
 * @param {boolean} includeAmount - Whether to include amount in QR (default: false to avoid errors)
 * @returns {string} UPI payment URI
 */
export function generateUPIPaymentLink(upiId, amount = 0, name = 'SplitHalf Payment', description = '', includeAmount = false) {
  if (!upiId || !upiId.includes('@')) {
    return null
  }

  const params = new URLSearchParams({
    pa: upiId, // Payee address (UPI ID)
    pn: name, // Payee name
    cu: 'INR', // Currency
    ...(description && { tn: description }) // Transaction note
  })

  // Only include amount if explicitly requested and valid
  // Excluding amount avoids "too much money" / "not enough money" errors
  if (includeAmount) {
    const numAmount = parseFloat(amount)
    if (!isNaN(numAmount) && numAmount > 0) {
      // Format amount to 2 decimal places
      const formattedAmount = numAmount.toFixed(2)
      params.set('am', formattedAmount)
    }
  }

  return `upi://pay?${params.toString()}`
}

/**
 * Generate specific Mobile Number deep links for apps that support it
 * This is a fallback/alternative when VPA links are blocked by risk policies.
 * @param {string} phoneNumber - 10 digit mobile number
 * @returns {Object} App links
 */
export function generateMobileDeepLinks(phoneNumber) {
  if (!phoneNumber) return null

  // clean number
  const cleanNum = phoneNumber.replace(/\D/g, '').slice(-10)

  return {
    // PhonePe supports direct number payment via 'mn' param
    phonepe: `phonepe://pay?mn=${cleanNum}`,

    // Paytm often supports this specific scheme for send money
    paytm: `paytmmp://pay?featuretype=sendmoney&recipient=${cleanNum}`,

    // Google Pay: generally just opens the app
    googlepay: 'tez://',

    // Default fallback
    universal: `tel:${cleanNum}` // Not ideal but 'tel' is a safe fallback if nothing else
  }
}

/**
 * Generate UPI payment link for different apps
 * CRITICAL: We open apps WITHOUT any payment parameters to avoid UPI Risk Policy errors
 * Any deep link with UPI parameters triggers risk policy, so we just open the app
 * User will manually enter UPI ID and amount (copied to clipboard)
 * @param {string} upiId - UPI ID (for clipboard, not for deep link)
 * @param {number} amount - Amount to pay (for clipboard, not for deep link)
 * @param {string} name - Payee name (for clipboard, not for deep link)
 * @param {string} description - Payment description (for clipboard, not for deep link)
 * @returns {Object} Object with different UPI app launch links (no payment params)
 */
export function generateUPIAppLinks(upiId, amount, name = 'SplitHalf Payment', description = '') {
  // CRITICAL FIX: Just open the app WITHOUT any payment parameters
  // This completely avoids UPI Risk Policy errors
  // User will paste UPI ID and amount from clipboard
  return {
    // Universal UPI link (opens default UPI app)
    universal: 'upi://',

    // PhonePe - Just open app
    phonepe: 'phonepe://',

    // Paytm - Just open app (no payment params = no risk policy error)
    paytm: 'paytmmp://',

    // Google Pay - Just open app
    googlepay: 'tez://',

    // BHIM UPI - Just open app
    bhim: 'bhim://',

    // Amazon Pay - Just open app
    amazonpay: 'amazonpay://'
  }
}

/**
 * Open UPI payment in the specified app with fallback mechanism
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
    // Try to open the deep link
    try {
      // For Android Intent URLs, use window.location
      if (link.startsWith('intent://')) {
        window.location.href = link
      } else {
        // For regular deep links, try window.open first, then fallback to location
        const opened = window.open(link, '_blank')
        // If window.open failed (blocked), fallback to location
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          window.location.href = link
        }
      }
      return true
    } catch (e) {
      // Fallback to universal UPI link if app-specific link fails
      if (app !== 'universal' && links.universal) {
        window.location.href = links.universal
        return true
      }
      return false
    }
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

