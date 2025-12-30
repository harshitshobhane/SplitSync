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
export function generateUPIPaymentLink(upiId, amount, name = 'SplitHalf Payment', description = '') {
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
 * IMPORTANT: We DON'T include amount in deep links to avoid UPI Risk Policy errors
 * User will enter amount manually in the app (more secure and always works)
 * @param {string} upiId - UPI ID
 * @param {number} amount - Amount to pay (for QR code only, not for deep links)
 * @param {string} name - Payee name
 * @param {string} description - Payment description
 * @returns {Object} Object with different UPI app links
 */
export function generateUPIAppLinks(upiId, amount, name = 'SplitHalf Payment', description = '') {
  if (!upiId || !upiId.includes('@')) {
    // Fallback: Return app launch links if no VPA is provided
    return {
      universal: 'upi://pay',
      phonepe: 'phonepe://',
      paytm: 'paytmmp://',
      googlepay: 'tez://',
      bhim: 'bhim://',
      amazonpay: 'amazonpay://'
    }
  }

  // CRITICAL: Don't include amount in deep links to avoid UPI Risk Policy errors
  // Only include: pa (UPI ID), pn (name), cu (currency), mode=02 (opens contact interface)
  // User will enter amount manually in the app
  const safeParams = new URLSearchParams({
    pa: upiId, // Payee address (UPI ID)
    pn: name, // Payee name
    cu: 'INR', // Currency
    mode: '02' // Opens contact/chat interface instead of direct payment (avoids risk policy)
  })
  
  const safeQuery = safeParams.toString()
  
  return {
    // Universal UPI link (opens default UPI app)
    universal: `upi://pay?${safeQuery}`,

    // PhonePe - Use universal UPI scheme (more reliable)
    phonepe: `upi://pay?${safeQuery}`,

    // Paytm - Use universal UPI scheme (avoids risk policy)
    paytm: `upi://pay?${safeQuery}`,

    // Google Pay
    googlepay: `tez://upi/pay?${safeQuery}`,

    // BHIM UPI
    bhim: `bhim://pay?${safeQuery}`,

    // Amazon Pay
    amazonpay: `amazonpay://pay?${safeQuery}`
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

