import React from 'react'
import { motion } from 'framer-motion'
import { User, Mail, LogOut, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'

export default function ProfilePage({ onBack, onLogout }) {
  const { user, logout } = useAuthContext()

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center rounded-lg hover:bg-accent h-9 w-9 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </button>
            <h1 className="text-2xl font-semibold ml-4">Profile</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-background shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center ring-4 ring-background shadow-lg">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    {user?.name || 'User'}
                  </h2>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border">
              {/* Email */}
              <div className="px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{user?.email || 'N/A'}</p>
                  </div>
                </div>
                {user?.email_verified && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>

              {/* Auth Provider */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Authentication</p>
                    <p className="font-medium text-foreground capitalize">{user?.auth_provider || 'Email'}</p>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="px-6 py-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

