import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Check } from 'lucide-react'
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
        toast.success('Email verified successfully! Welcome to SplitSync!')
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6"
            >
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your email has been successfully verified. Welcome to SplitSync!
            </p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-blue-600 dark:text-blue-400 font-medium"
            >
              Redirecting to app...
            </motion.div>
          </motion.div>
        ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Mail className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We sent a verification link to <br />
            <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">How to verify your email:</p>
                <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1.5 ml-2">
                  <li>Check your inbox at <strong>{email}</strong></li>
                  <li>Click the verification link in the email</li>
                  <li>Return here and click the button below</li>
                  <li>Start using SplitSync!</li>
                </ol>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? 'Checking...' : 'I\'ve Verified My Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50 transition-colors"
          >
            {isResending ? 'Sending...' : "Didn't receive the email? Resend verification link"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Can't find the email?</p>
              <ul className="text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Wait a few minutes for it to arrive</li>
                <li>• Click "Resend verification link" above if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

