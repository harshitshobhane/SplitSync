import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Loader2, Users, Mail } from 'lucide-react'
import { apiService } from '../lib/api'
import { LoadingSpinner } from '../components/ui/FormComponents'
import toast from 'react-hot-toast'

const InvitePage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link')
      return
    }

    // Store invitation token in localStorage
    localStorage.setItem('invitation_token', token)
    
    // Check if user is already logged in
    const authToken = localStorage.getItem('auth_token')
    if (authToken) {
      // User is logged in, try to accept invitation
      handleAcceptInvitation()
    } else {
      // User not logged in, show message to sign up/login
      setStatus('success')
      setMessage('Please sign up or log in to accept the invitation')
    }
  }, [token])

  const handleAcceptInvitation = async () => {
    try {
      const result = await apiService.acceptInvitation(token)
      toast.success('Invitation accepted! You are now connected with your partner.')
      setStatus('success')
      setMessage('Invitation accepted successfully!')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to accept invitation'
      if (errorMsg.includes('already has')) {
        toast.error('You already have a partner. Please disconnect first.')
      } else {
        toast.error(errorMsg)
      }
      setStatus('error')
      setMessage(errorMsg)
    }
  }

  const handleGoToAuth = () => {
    navigate('/')
    // The invitation token is already in localStorage
    // AuthContext will handle it automatically when user signs up/logs in
  }

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full card p-6 text-center space-y-4"
      >
        {status === 'success' ? (
          <>
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold">Partner Invitation</h1>
            <p className="text-sm text-muted-foreground">
              {message || 'You\'ve been invited to join SplitSync as a partner!'}
            </p>
            
            {!localStorage.getItem('auth_token') && (
              <div className="pt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Please sign up or log in to connect with your partner
                </p>
                <button
                  onClick={handleGoToAuth}
                  className="btn btn-primary w-full"
                >
                  Sign Up / Log In
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold">Invalid Invitation</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary w-full mt-4"
            >
              Go to Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default InvitePage

