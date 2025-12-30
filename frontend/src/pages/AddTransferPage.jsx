import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { Loader2, ArrowRightLeft, FileText, Minus, Plus, Wallet, Smartphone, X, CheckCircle, AlertCircle, Copy, Check, QrCode, ChevronDown, Phone, Download } from 'lucide-react'
import { apiService } from '../lib/api'
import { getCurrencySymbol, formatCurrency } from '../utils/dateUtils'
import { generateUPIAppLinks, openUPIPayment, isUPISupported, generateUPIPaymentLink, generateMobileDeepLinks } from '../utils/upiUtils'
import { useAuthContext } from '../contexts/AuthContext'
import QRCode from 'react-qr-code'

const AddTransferPage = ({ setPage, names, balance, currency = 'USD' }) => {
  const [formData, setFormData] = useState({
    amount: '',
    fromUser: 'person1',
    description: ''
  })
  const [showUPIModal, setShowUPIModal] = useState(false)
  const [receiverPhone, setReceiverPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('number') // 'number' or 'upi'


  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  // Fetch couple info to get partner's Phone Number
  const { data: coupleInfo } = useQuery(
    'couple',
    apiService.getCurrentCouple,
    {
      enabled: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Get Phone Numbers & UPI IDs
  const currentUserPhone = user?.phone_number || ''
  const currentUserUPI = user?.upi_id || ''
  const partnerPhone = coupleInfo?.partner?.phone_number || ''
  const partnerUPI = coupleInfo?.partner?.upi_id || ''

  // Calculate balance info
  const person1Net = balance.person1Net || 0
  const person2Net = balance.person2Net || 0
  const needsSettle = Math.abs(person1Net) > 0.01 || Math.abs(person2Net) > 0.01

  const suggestedAmount = Math.abs(person1Net > person2Net ? person2Net : person1Net)
  const suggestedPayer = person1Net > person2Net ? 'person2' : 'person1'

  // Determine current situation
  const getBalanceInfo = () => {
    if (Math.abs(person1Net) < 0.01) {
      return { message: 'All settled up', color: 'text-emerald-600' }
    }
    if (person1Net > 0) {
      return {
        message: `${names.person2Name} owes ${formatCurrency(person2Net, currency).replace('-', '')}`,
        color: 'text-amber-600'
      }
    }
    return {
      message: `${names.person1Name} owes ${formatCurrency(person1Net, currency).replace('-', '')}`,
      color: 'text-amber-600'
    }
  }

  const balanceInfo = getBalanceInfo()

  const createTransferMutation = useMutation(apiService.createTransfer, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['transfers'])
      queryClient.invalidateQueries(['expenses'])
      if (data && data.queued) {
        toast.success('Transfer queued and will sync when online')
      } else {
        toast.success('Transfer recorded')
      }
      setTimeout(() => setPage('dashboard'), 500)
    },
    onError: () => {
      toast.error('Unable to record transfer')
    }
  })

  const handleQuickSettle = () => {
    if (suggestedAmount > 0.01) {
      setFormData({
        amount: suggestedAmount.toFixed(2),
        fromUser: suggestedPayer,
        description: ''
      })
      toast.success('Amount set for full settlement')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    const transferData = {
      amount: transferAmount,
      from_user: formData.fromUser,
      to_user: formData.fromUser === 'person1' ? 'person2' : 'person1',
      description: formData.description || ''
    }

    createTransferMutation.mutate(transferData)
  }

  const toUser = formData.fromUser === 'person1' ? 'person2' : 'person1'
  const fromName = formData.fromUser === 'person1' ? names.person1Name : names.person2Name
  const toName = toUser === 'person1' ? names.person1Name : names.person2Name

  // Get receiver's Phone Number & UPI ID (the person receiving the payment)
  const receiverPhoneNum = formData.fromUser === 'person1' ? partnerPhone : currentUserPhone
  const receiverUPI = formData.fromUser === 'person1' ? partnerUPI : currentUserUPI
  const receiverName = toName

  // Pre-fill phone number when available and set default payment method
  React.useEffect(() => {
    if (receiverPhoneNum) {
      setReceiverPhone(receiverPhoneNum)
    }
    // Default to UPI if available, else number
    if (receiverUPI) {
      setPaymentMethod('upi')
    } else {
      setPaymentMethod('number')
    }
  }, [receiverPhoneNum, receiverUPI])

  // Download QR Code for Gallery Scan
  const handleDownloadQR = () => {
    const svg = document.querySelector("#payment-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40; // padding
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `Payment_QR_${receiverName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code Saved! Scan from Gallery in PhonePe/Paytm");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  // SAFE UPI LINK GENERATOR (No programmatic redirects - security best practice)
  // Returns deep link string for use in <a href>, NOT window.location.href
  // This prevents "malicious redirect" warnings in Paytm/browser security
  const generateSafeUPILink = (app = 'universal') => {
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) return null

    if (paymentMethod === 'upi' && receiverUPI) {
      // UPI Intent with mode=02 - Opens contact/chat interface, NOT QR screen
      // NO AMOUNT - Pre-filled amounts trigger UPI security restrictions
      // User enters amount manually in the app (one extra step but always works)

      const upiBase = `pa=${receiverUPI}&pn=${receiverName}&cu=INR&mode=02`

      const links = {
        phonepe: `upi://pay?${upiBase}`,
        googlepay: `tez://upi/pay?${upiBase}`, // Google Pay uses tez:// scheme
        paytm: `upi://pay?${upiBase}`,
        universal: `upi://pay?${upiBase}`
      }
      return links[app] || links.universal
    }

    // Phone number method: Deep links don't work reliably
    // Return null - we'll use manual copy-paste flow instead
    return null
  }

  // Handle manual phone number payment
  const handlePhonePayment = (app) => {
    if (!receiverPhoneNum) {
      toast.error('Phone number not available')
      return
    }

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    // Copy both number and amount to clipboard
    const paymentInfo = `${receiverPhoneNum}\n₹${amount}`
    navigator.clipboard.writeText(paymentInfo)
      .then(() => {
        toast.success(
          `Copied!\n\nOpen ${app} → Send Money → To Mobile Number → Paste`,
          { duration: 5000 }
        )
      })
      .catch(() => toast.error('Failed to copy'))
  }

  // Handle recording transfer after UPI payment
  const handleRecordAfterPayment = () => {
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    const transferData = {
      amount: transferAmount,
      from_user: formData.fromUser,
      to_user: toUser,
      description: formData.description || `Paid via UPI`
    }
    createTransferMutation.mutate(transferData)
    setShowUPIModal(false)
  }

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-4 sm:gap-5 md:gap-6 overflow-y-auto">
      {/* Balance Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 dark:bg-card/90 backdrop-blur-sm border border-border/60 rounded-2xl p-4 sm:p-5 shadow-sm flex-shrink-0"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground truncate">Current Balance</span>
          </div>
          {needsSettle && suggestedAmount > 0.01 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuickSettle}
              className="text-xs font-semibold text-primary hover:text-primary/80 whitespace-nowrap flex-shrink-0 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
            >
              Settle All
            </motion.button>
          )}
        </div>
        <p className="text-lg sm:text-xl font-bold ${balanceInfo.color} break-words">
          {balanceInfo.message}
        </p>
      </motion.div>

      {/* Transfer Flow - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 md:space-y-3"
      >
        <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
          <span>Transfer Direction</span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, fromUser: prev.fromUser === 'person1' ? 'person2' : 'person1' }))}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Switch
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl md:rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex-1 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex h-14 w-14 md:h-12 md:w-12 items-center justify-center rounded-full mb-2 md:mb-2 transition-all border ${formData.fromUser === 'person1'
                  ? 'bg-primary text-primary-foreground border-primary/20'
                  : 'bg-muted text-muted-foreground border-border'
                  }`}
              >
                <span className="text-xl md:text-lg font-bold">
                  {fromName.charAt(0)}
                </span>
              </motion.div>
              <p className="text-sm md:text-xs font-semibold text-foreground">{fromName}</p>
              <p className="text-xs md:text-[10px] text-muted-foreground mt-0.5">Payer</p>
            </div>

            {/* Arrow */}
            <div className="px-3 md:px-4">
              <div className="h-px w-10 md:w-12 bg-border/60 relative">
                <ArrowRightLeft className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 text-muted-foreground bg-card dark:bg-card p-0.5" />
              </div>
            </div>

            {/* To */}
            <div className="flex-1 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex h-14 w-14 md:h-12 md:w-12 items-center justify-center rounded-full mb-2 md:mb-2 transition-all border ${formData.fromUser === 'person1'
                  ? 'bg-muted text-muted-foreground border-border'
                  : 'bg-primary text-primary-foreground border-primary/20'
                  }`}
              >
                <span className="text-xl md:text-lg font-bold">
                  {toName.charAt(0)}
                </span>
              </motion.div>
              <p className="text-sm md:text-xs font-semibold text-foreground">{toName}</p>
              <p className="text-xs md:text-[10px] text-muted-foreground mt-0.5">Receiver</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Amount Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0"
      >
        <label className="text-sm font-medium mb-3 block">Amount</label>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 transition-all focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {getCurrencySymbol(currency)}
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="flex-1 text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
              required
            />
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[100, 250, 500, 1000].map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-muted hover:bg-accent transition-all text-sm font-semibold border border-border active:scale-95"
            >
              {getCurrencySymbol(currency)}{amount}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Note (Optional)</label>
        </div>
        <div className="bg-card border border-border rounded-3xl p-4">
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add a note..."
            className="w-full bg-transparent border-none outline-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
      </motion.div>

      {/* UPI Payment Button - Only show if amount is entered and receiver has UPI ID */}
      {formData.amount && parseFloat(formData.amount) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            type="button"
            onClick={() => setShowUPIModal(true)}
            className="w-full py-4 rounded-3xl bg-foreground text-background font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] border border-border/20"
          >
            <Smartphone className="h-5 w-5" />
            Pay via UPI (No Charges)
          </button>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={createTransferMutation.isLoading || !formData.amount}
          className="w-full py-4 rounded-3xl bg-foreground text-background font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
        >
          {createTransferMutation.isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-5 w-5" />
              Record Transfer
            </>
          )}
        </button>

        {/* Info text */}
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Or use "Pay via UPI" above, then record the transfer after payment is successful
          </p>
        )}
      </motion.div>

      {/* UPI Payment Modal */}
      <AnimatePresence>
        {showUPIModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4"
            onClick={() => setShowUPIModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl overflow-hidden max-w-md md:max-w-3xl w-full flex flex-col md:flex-row shadow-2xl max-h-[90vh]"
            >

              {/* Desktop QR Panel (Hidden on Mobile) */}
              <div className="hidden md:flex w-1/2 bg-muted/30 border-r border-border p-8 flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <h3 className="text-xl font-bold mb-6">Scan to Pay</h3>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                  {paymentMethod === 'upi' && receiverUPI ? (
                    <QRCode
                      value={generateUPIPaymentLink(receiverUPI, parseFloat(formData.amount), receiverName, formData.description || `Payment to ${receiverName}`)}
                      size={180}
                      viewBox={`0 0 256 256`}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  ) : (
                    <div className="h-[180px] w-[180px] flex items-center justify-center bg-gray-100 rounded-xl">
                      <Smartphone className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <p className="text-sm font-medium text-foreground">
                  {paymentMethod === 'upi' ? `Scan specifically for ${formatCurrency(parseFloat(formData.amount), currency)}` : 'Switch to UPI ID to generate specific QR'}
                </p>
                <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                  Open your favorite UPI app on your phone and scan this code to pay instantly.
                </p>
              </div>

              {/* Existing Form Panel */}
              <div className="flex-1 flex flex-col relative overflow-hidden h-full">
                <div className="relative z-10 overflow-y-auto custom-scrollbar p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Pay via UPI</h3>
                      <p className="text-xs text-muted-foreground mt-1">No charges - Direct payment</p>
                    </div>
                    <button
                      onClick={() => setShowUPIModal(false)}
                      className="p-2 hover:bg-accent rounded-xl transition-colors active:scale-95"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Payment Details Card */}
                  <div className="mb-6 p-4 bg-muted/30 dark:bg-muted/20 border border-border rounded-2xl relative overflow-hidden">

                    {/* Method Toggle */}
                    {receiverUPI && receiverPhoneNum && (
                      <div className="flex bg-background/50 p-1 rounded-xl border border-border/40 mb-4 relative z-10">
                        <button
                          onClick={() => setPaymentMethod('upi')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === 'upi' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          UPI ID
                        </button>
                        <button
                          onClick={() => setPaymentMethod('number')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === 'number' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Number
                        </button>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Paying</p>
                      <p className="text-xl font-bold text-foreground">{receiverName}</p>
                    </div>

                    {/* Dynamic Section based on Method */}
                    <div className="bg-background border border-border/50 rounded-xl p-3 mb-4 flex items-center gap-3 shadow-sm">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${paymentMethod === 'upi' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                        {paymentMethod === 'upi' ? <QrCode className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                          {paymentMethod === 'upi' ? 'Linked UPI ID' : 'Mobile Number'}
                        </p>
                        <p className="text-sm font-mono font-medium truncate">
                          {paymentMethod === 'upi' ? receiverUPI : (receiverPhoneNum || receiverPhone || 'Not set')}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(paymentMethod === 'upi' ? receiverUPI : (receiverPhoneNum || receiverPhone));
                          toast.success(`${paymentMethod === 'upi' ? 'UPI ID' : 'Number'} Copied`);
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center px-2">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(parseFloat(formData.amount), currency)}</p>
                    </div>
                  </div>

                  {/* QR Code - PRIMARY PAYMENT METHOD (Mobile Only) */}
                  <div className="md:hidden">
                    {receiverUPI && paymentMethod === 'upi' ? (
                      <div className="bg-white p-4 rounded-xl mb-4">
                        <QRCode
                          value={generateUPIPaymentLink(receiverUPI, parseFloat(formData.amount) || 0, receiverName, formData.description)}
                          size={200}
                          className="mx-auto"
                        />
                        <p className="text-xs text-center text-gray-600 mt-3">Scan with any UPI app to pay</p>
                      </div>
                    ) : null}

                    {/* Download QR Button */}
                    {receiverUPI && paymentMethod === 'upi' && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDownloadQR}
                        className="w-full py-3 mb-3 text-sm font-medium bg-muted hover:bg-accent text-foreground rounded-xl flex items-center justify-center gap-2 transition-colors border border-border"
                      >
                        <Download className="h-4 w-4" />
                        Download QR for Gallery Scan
                      </motion.button>
                    )}
                  </div>

                  {/* SAFE UPI APP LINKS - User-triggered only (No auto-redirects) */}
                  {/* Using <a> tags for UPI ID, buttons for phone number */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs text-center text-muted-foreground mb-2">
                      {paymentMethod === 'upi' ? 'Open UPI app:' : 'Copy & open app manually:'}
                    </p>

                    {/* App Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* PhonePe */}
                      {paymentMethod === 'upi' ? (
                        <a
                          href={generateSafeUPILink('phonepe')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-xl bg-[#5F259F] hover:bg-[#4d1f7f] text-white text-center transition-colors no-underline"
                          onClick={(e) => {
                            const link = generateSafeUPILink('phonepe')
                            if (!link) {
                              e.preventDefault()
                              toast.error('Enter amount first')
                            } else {
                              // Copy amount to clipboard for easy paste
                              const amount = parseFloat(formData.amount)
                              navigator.clipboard.writeText(amount.toString())
                              toast.success(`₹${amount} copied - paste in PhonePe`, { duration: 3000 })
                            }
                          }}
                        >
                          <Smartphone className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold block">PhonePe</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handlePhonePayment('PhonePe')}
                          className="p-4 rounded-xl bg-[#5F259F] hover:bg-[#4d1f7f] text-white text-center transition-colors"
                        >
                          <Smartphone className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold block">PhonePe</span>
                        </button>
                      )}

                      {/* Google Pay */}
                      {paymentMethod === 'upi' ? (
                        <a
                          href={generateSafeUPILink('googlepay')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-xl bg-gradient-to-br from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2d8e47] text-white text-center transition-all no-underline"
                          onClick={(e) => {
                            if (!generateSafeUPILink('googlepay')) {
                              e.preventDefault()
                              toast.error('Enter amount first')
                            }
                          }}
                        >
                          <span className="text-xl font-bold block">G</span>
                          <span className="text-xs font-semibold block">GPay</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handlePhonePayment('Google Pay')}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2d8e47] text-white text-center transition-all"
                        >
                          <span className="text-xl font-bold block">G</span>
                          <span className="text-xs font-semibold block">GPay</span>
                        </button>
                      )}

                      {/* Paytm */}
                      {paymentMethod === 'upi' ? (
                        <a
                          href={generateSafeUPILink('paytm')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-xl bg-[#00BAF2] hover:bg-[#0095c7] text-white text-center transition-colors no-underline"
                          onClick={(e) => {
                            if (!generateSafeUPILink('paytm')) {
                              e.preventDefault()
                              toast.error('Enter amount first')
                            }
                          }}
                        >
                          <Wallet className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold block">Paytm</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handlePhonePayment('Paytm')}
                          className="p-4 rounded-xl bg-[#00BAF2] hover:bg-[#0095c7] text-white text-center transition-colors"
                        >
                          <Wallet className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold block">Paytm</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                      {paymentMethod === 'upi'
                        ? "₹ Amount copied! Tap app → Paste amount → Enter PIN → Pay"
                        : "Number & amount copied. Open app → Send Money → To Mobile Number → Paste"}
                    </p>
                  </div>

                  {/* Record Transfer Section */}
                  <div className="p-4 bg-muted/30 dark:bg-muted/20 border border-border rounded-2xl mt-auto">
                    <div className="flex items-start gap-2 mb-4">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground leading-relaxed">
                        After completing payment, return here and click below to record the transfer.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleRecordAfterPayment}
                      disabled={createTransferMutation.isLoading || !formData.amount}
                      className="w-full py-3 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-border/20"
                    >
                      {createTransferMutation.isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Record Transfer
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AddTransferPage