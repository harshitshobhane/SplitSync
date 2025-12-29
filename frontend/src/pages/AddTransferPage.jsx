import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { Loader2, ArrowRightLeft, FileText, Minus, Plus, Wallet, Smartphone, X, CheckCircle, AlertCircle, Copy, Check, QrCode, ChevronDown, Phone } from 'lucide-react'
import { apiService } from '../lib/api'
import { getCurrencySymbol, formatCurrency } from '../utils/dateUtils'
import { generateUPIAppLinks, openUPIPayment, isUPISupported, generateUPIPaymentLink } from '../utils/upiUtils'
import { useAuthContext } from '../contexts/AuthContext'

const AddTransferPage = ({ setPage, names, balance, currency = 'USD' }) => {
  const [formData, setFormData] = useState({
    amount: '',
    fromUser: 'person1',
    description: ''
  })
  const [showUPIModal, setShowUPIModal] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [receiverPhone, setReceiverPhone] = useState('')

  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  // Fetch couple info to get partner's UPI ID
  const { data: coupleInfo } = useQuery(
    'couple',
    apiService.getCurrentCouple,
    {
      enabled: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Get UPI IDs
  const currentUserUPI = user?.upi_id || ''
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

  // Get receiver's UPI ID (the person receiving the payment)
  const receiverUPI = formData.fromUser === 'person1' ? partnerUPI : currentUserUPI
  const receiverName = toName

  // Handle UPI payment - only opens the app, doesn't record transfer
  const handleUPIPayment = (app = 'universal') => {
    const transferAmount = parseFloat(formData.amount)
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    if (!receiverUPI || !receiverUPI.includes('@')) {
      toast.error(`${receiverName} hasn't set their UPI ID yet. Ask them to add it in Profile settings.`)
      return
    }

    const description = formData.description || `Payment from ${fromName}`
    const success = openUPIPayment(receiverUPI, transferAmount, receiverName, description, app)

    if (success) {
      toast.success(`Opening ${app === 'universal' ? 'UPI app' : app}... Complete payment and return to record the transfer.`)
      // Keep modal open so user can record after payment
    } else {
      toast.error('Failed to open UPI payment')
    }
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
    <div className="h-full overflow-y-auto space-y-6 pb-6 px-3 sm:px-4 scroll-smooth">
      {/* Balance Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 dark:bg-card/90 backdrop-blur-sm border border-border/60 rounded-3xl p-4 sm:p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-semibold text-muted-foreground truncate">Current Balance</span>
          </div>
          {needsSettle && suggestedAmount > 0.01 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuickSettle}
              className="text-xs font-semibold text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 whitespace-nowrap flex-shrink-0 px-2 py-1 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
            >
              Settle All
            </motion.button>
          )}
        </div>
        <p className={`text-lg sm:text-xl font-bold ${balanceInfo.color} break-words`}>
          {balanceInfo.message}
        </p>
      </motion.div>

      {/* Transfer Flow - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Transfer Direction</span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, fromUser: prev.fromUser === 'person1' ? 'person2' : 'person1' }))}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Switch
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex-1 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-3 transition-all border ${formData.fromUser === 'person1'
                  ? 'bg-primary text-primary-foreground border-primary/20'
                  : 'bg-muted text-muted-foreground border-border'
                  }`}
              >
                <span className="text-2xl font-bold">
                  {fromName.charAt(0)}
                </span>
              </motion.div>
              <p className="text-sm font-semibold text-foreground">{fromName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Payer</p>
            </div>

            {/* Arrow */}
            <div className="px-4">
              <div className="h-px w-12 bg-border/60 relative">
                <ArrowRightLeft className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 text-muted-foreground bg-card dark:bg-card p-0.5" />
              </div>
            </div>

            {/* To */}
            <div className="flex-1 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-3 transition-all border ${formData.fromUser === 'person1'
                  ? 'bg-muted text-muted-foreground border-border'
                  : 'bg-primary text-primary-foreground border-primary/20'
                  }`}
              >
                <span className="text-2xl font-bold">
                  {toName.charAt(0)}
                </span>
              </motion.div>
              <p className="text-sm font-semibold text-foreground">{toName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receiver</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Amount Input - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Amount</label>
        </div>

        <div className="bg-card border border-border rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">
              {getCurrencySymbol(currency)}
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="flex-1 text-2xl font-bold bg-transparent border-none outline-none focus:outline-none text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2">
          {[100, 250, 500, 1000].map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
              className="py-2.5 px-3 rounded-2xl bg-muted hover:bg-accent transition-all text-sm font-semibold border border-border active:scale-95"
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
          {receiverUPI && receiverUPI.includes('@') ? (
            <button
              type="button"
              onClick={() => setShowUPIModal(true)}
              className="w-full py-4 rounded-3xl bg-foreground text-background font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] border border-border/20"
            >
              <Smartphone className="h-5 w-5" />
              Pay via UPI (No Charges)
            </button>
          ) : (
            <div className="w-full py-3.5 px-4 rounded-3xl bg-card border border-border text-center">
              <p className="text-sm text-muted-foreground">
                {receiverName} needs to add their UPI ID in Profile settings to enable UPI payments
              </p>
            </div>
          )}
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
        {receiverUPI && receiverUPI.includes('@') && formData.amount && parseFloat(formData.amount) > 0 && (
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
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowUPIModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl p-6 max-w-md w-full relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="relative z-10 overflow-y-auto custom-scrollbar -mr-2 pr-2">
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

                {/* Payment Method Toggle */}
                <div className="flex p-1 bg-muted/50 rounded-xl mb-6">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${paymentMethod === 'upi' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    UPI ID
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${paymentMethod === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Mobile Number
                  </button>
                </div>

                {/* Payment Details Card */}
                <div className="mb-6 p-4 bg-muted/30 dark:bg-muted/20 border border-border rounded-2xl">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Paying to</p>
                  <p className="text-lg font-bold text-foreground mb-1">{receiverName}</p>

                  {paymentMethod === 'upi' ? (
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded border border-border/50">{receiverUPI}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(receiverUPI); toast.success('UPI ID Copied'); }}
                        className="p-1.5 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border/50"
                        title="Copy UPI ID"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="tel"
                        placeholder="Enter mobile number"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        className="text-sm bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 outline-none w-full font-mono placeholder:text-muted-foreground/50"
                      />
                      {receiverPhone && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(receiverPhone); toast.success('Number Copied'); }}
                          className="p-1.5 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border/50"
                          title="Copy Number"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <p className="text-2xl font-extrabold text-foreground">{formatCurrency(parseFloat(formData.amount), currency)}</p>
                  </div>
                </div>

                {/* UPI App Selection */}
                <div className="space-y-2.5 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">Choose UPI app:</p>

                  {/* Universal UPI (Default) */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleUPIPayment('universal')}
                    className="w-full p-4 rounded-2xl bg-foreground text-background font-semibold flex items-center justify-center gap-3 transition-all border border-border/20"
                  >
                    <Smartphone className="h-5 w-5" />
                    Open Default UPI App
                  </motion.button>

                  {/* UPI App Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* PhonePe */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleUPIPayment('phonepe')}
                      className="p-3.5 rounded-2xl bg-[#5F259F] text-white font-semibold flex flex-col items-center justify-center gap-2 transition-all border border-[#5F259F]/20"
                    >
                      <span className="text-2xl">📱</span>
                      <span className="text-sm">PhonePe</span>
                    </motion.button>

                    {/* Paytm */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleUPIPayment('paytm')}
                      className="p-3.5 rounded-2xl bg-[#00BAF2] text-white font-semibold flex flex-col items-center justify-center gap-2 transition-all border border-[#00BAF2]/20"
                    >
                      <span className="text-2xl">💳</span>
                      <span className="text-sm">Paytm</span>
                    </motion.button>

                    {/* Google Pay */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleUPIPayment('googlepay')}
                      className="p-3.5 rounded-2xl bg-[#4285F4] text-white font-semibold flex flex-col items-center justify-center gap-2 transition-all border border-[#4285F4]/20"
                    >
                      <span className="text-2xl font-bold">G</span>
                      <span className="text-sm">Google Pay</span>
                    </motion.button>

                    {/* BHIM UPI */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleUPIPayment('bhim')}
                      className="p-3.5 rounded-2xl bg-[#6C5CE7] text-white font-semibold flex flex-col items-center justify-center gap-2 transition-all border border-[#6C5CE7]/20"
                    >
                      <span className="text-2xl">🇮🇳</span>
                      <span className="text-sm">BHIM UPI</span>
                    </motion.button>
                  </div>
                </div>

                {/* QR Code Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-muted-foreground"
                  >
                    <QrCode className="h-4 w-4" />
                    {showQr ? 'Hide QR Code' : 'Show QR Code to Scan'}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showQr ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showQr && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mt-3 border border-border/20 shadow-sm">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateUPIPaymentLink(receiverUPI, parseFloat(formData.amount), receiverName, formData.description || `Payment from ${fromName}`))}&bgcolor=ffffff`}
                            alt="UPI QR Code"
                            className="w-40 h-40 object-contain"
                          />
                          <p className="text-[10px] text-gray-400 mt-2 text-center max-w-[200px]">
                            Scan with any UPI app on another device
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Record Transfer Section */}
                <div className="p-4 bg-muted/30 dark:bg-muted/20 border border-border rounded-2xl">
                  <div className="flex items-start gap-2 mb-4">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground leading-relaxed">
                      After completing payment in your UPI app, return here and click below to record the transfer.
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AddTransferPage