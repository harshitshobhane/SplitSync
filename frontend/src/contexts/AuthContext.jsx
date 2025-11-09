import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  applyActionCode,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { apiService } from '../lib/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [firebaseUser, setFirebaseUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        // For password-based auth, check if email is verified
        // Google auth is always verified
        const isGoogleAuth = firebaseUser.providerData[0]?.providerId === 'google.com'
        const isEmailVerified = firebaseUser.emailVerified || isGoogleAuth
        
        if (!isEmailVerified && !isGoogleAuth) {
          // Email not verified, set user but mark as needing verification
          setUser({ 
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            needsVerification: true 
          })
          // Don't set loading to false yet - let it continue
          return
        }
        
        try {
          // Verify Firebase token with backend and get custom user data
          const userData = await apiService.verifyFirebaseToken({
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            auth_provider: isGoogleAuth ? 'google' : 'firebase',
            profile_picture: firebaseUser.photoURL || '',
          })
          
          // Store the JWT token
          if (userData.token) {
            localStorage.setItem('auth_token', userData.token)
            console.log('✅ Token stored after auth state change')
          } else {
            console.warn('⚠️ No token in userData:', userData)
          }
          
          setUser(userData.user)
        } catch (error) {
          console.error('Failed to sync with backend:', error)
          // Set user to null on error
          setUser(null)
        }
      } else {
        setUser(null)
        localStorage.removeItem('auth_token')
      }
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (credentials) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      )
      toast.success('Login successful!')
      return userCredential
    } catch (error) {
      let errorMessage = 'Login failed'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }
      toast.error(errorMessage)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )
      
      // Update the user's profile with the name provided during signup
      if (userData.name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: userData.name
        })
      }
      
      // Send verification email immediately after registration
      // Note: This may fail if email verification is not enabled in Firebase Console
      try {
        await sendEmailVerification(userCredential.user)
        toast.success('Account created! Please check your email to verify.')
      } catch (emailError) {
        // Email verification might not be configured, but account is still created
        console.warn('Email verification not sent:', emailError)
        toast.success('Account created! You can verify your email later from settings.')
      }
      return userCredential
    } catch (error) {
      let errorMessage = 'Registration failed'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password authentication is not enabled. Please contact support'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later'
      }
      toast.error(errorMessage)
      throw error
    }
  }

  const googleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      toast.success('Signed in with Google!')
      return userCredential
    } catch (error) {
      let errorMessage = 'Google sign-in failed'
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed'
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Multiple popup requests'
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser'
      }
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('auth_token')
      await signOut(auth)
      await apiService.logout()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error(error.message || 'Logout failed')
      throw error
    }
  }

  const resendVerificationEmail = async () => {
    if (!firebaseUser) {
      throw new Error('No user signed in')
    }
    
    try {
      await sendEmailVerification(firebaseUser)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      let errorMessage = 'Failed to send verification email'
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again in a few minutes.'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.message?.includes('400')) {
        errorMessage = 'Email verification is not enabled in Firebase Console. Please contact support or skip email verification.'
      }
      toast.error(errorMessage)
      console.error('Email verification error:', error)
      throw error
    }
  }

  const checkEmailVerification = async () => {
    if (!firebaseUser) {
      throw new Error('No user signed in')
    }
    
    // Reload user to check verification status
    await firebaseUser.reload()
    
    if (firebaseUser.emailVerified) {
      // Email verified, set user as authenticated
      setUser({ ...firebaseUser, needsVerification: false })
      
      try {
        const userData = await apiService.verifyFirebaseToken({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          auth_provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'firebase',
          profile_picture: firebaseUser.photoURL || '',
        })
        
        if (userData.token) {
          localStorage.setItem('auth_token', userData.token)
          console.log('✅ Token stored in localStorage')
        } else {
          console.warn('⚠️ No token received from backend')
        }
        
        setUser(userData.user)
      } catch (error) {
        console.error('Failed to sync with backend:', error)
      }
      
      return true
    }
    
    return false
  }

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      let errorMessage = 'Failed to send password reset email'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later'
      }
      toast.error(errorMessage)
      throw error
    }
  }

  const changePassword = async (newPassword) => {
    if (!firebaseUser) {
      throw new Error('No user signed in')
    }
    
    try {
      await updatePassword(firebaseUser, newPassword)
      toast.success('Password updated successfully')
    } catch (error) {
      let errorMessage = 'Failed to update password'
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters'
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign in again to change your password'
      }
      toast.error(errorMessage)
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user && !user.needsVerification,
    login,
    register,
    logout,
    googleSignIn,
    resendVerificationEmail,
    checkEmailVerification,
    forgotPassword,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
