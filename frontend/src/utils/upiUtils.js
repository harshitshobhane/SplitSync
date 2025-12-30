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
 * @param {string} upiId - UPI ID
 * @param {number} amount - Amount to pay
 * @param {string} name - Payee name
 * @param {string} description - Payment description
 * @returns {Object} Object with different UPI app links
 */
export function generateUPIAppLinks(upiId, amount, name = 'SplitHalf Payment', description = '') {
  const baseLink = generateUPIPaymentLink(upiId, amount, name, description)

  if (baseLink) {
    const query = baseLink.split('?')[1]
    return {
      // Universal UPI link (opens default UPI app)
      universal: baseLink,

      // PhonePe
      phonepe: `phonepe://pay?${query}`,

      // Paytm
      paytm: `paytmmp://pay?${query}`,

      // Google Pay
      googlepay: `tez://pay?${query}`,

      // BHIM UPI
      bhim: `bhim://pay?${query}`,

      // Amazon Pay
      amazonpay: `amazonpay://pay?${query}`
    }
  }

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

