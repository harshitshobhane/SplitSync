import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Check, ArrowRight, Info, AlertCircle } from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function VerifyEmailPage({ email, onBack, onSuccess }) {
  const { checkEmailVerification, resendVerificationEmail } = useAuthContext()
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsChecking(true)
    try {
      const verified = await checkEmailVerification()
      if (verified) {
        setShowSuccess(true)
        toast.success('Email verified successfully! Welcome to SplitHalf!')
        // Wait a moment to show success animation, then redirect
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        toast.error('Email not verified yet. Please click the link in your email.')
      }
    } catch (error) {
      // Error already handled in auth context
    } finally {
      setIsChecking(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await resendVerificationEmail()
    } catch (error) {
      // Error already handled
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 sm:px-6 py-12 sm:py-16">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
              Email Verified!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Your email has been successfully verified. Welcome to SplitHalf!
            </p>
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-primary font-semibold text-sm sm:text-base"
            >
              Redirecting to app...
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full"
          >
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={onBack}
              className="mb-8 flex items-center text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
                >
                  <Mail className="h-8 w-8 text-primary" />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                  Verify Your Email
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  We sent a verification link to
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground mt-1">
                  {email}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-2">How to verify your email:</p>
                    <ol className="text-xs sm:text-sm text-muted-foreground list-decimal list-inside space-y-1.5 ml-2">
                      <li>Check your inbox at <strong className="text-foreground">{email}</strong></li>
                      <li>Click the verification link in the email</li>
                      <li>Return here and click the button below</li>
                      <li>Start using SplitHalf!</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Verify Button */}
              <form onSubmit={handleSubmit} className="mb-6">
                <motion.button
                  type="submit"
                  disabled={isChecking}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-foreground text-background py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-border/20"
                >
                  {isChecking ? (
                    'Checking...'
                  ) : (
                    <>
                      <span>I've Verified My Email</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Resend Link */}
              <div className="text-center mb-6">
                <motion.button
                  onClick={handleResend}
                  disabled={isResending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-sm text-primary hover:text-primary/80 font-semibold disabled:opacity-50 transition-colors"
                >
                  {isResending ? 'Sending...' : "Didn't receive the email? Resend verification link"}
                </motion.button>
              </div>

              {/* Help Section */}
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-foreground mb-2">Can't find the email?</p>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                      <li>• Check your spam/junk folder</li>
                      <li>• Wait a few minutes for it to arrive</li>
                      <li>• Click "Resend verification link" above if needed</li>
                    </ul>
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
