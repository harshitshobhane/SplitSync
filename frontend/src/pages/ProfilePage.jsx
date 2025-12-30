import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, ArrowLeft, CheckCircle, Save, QrCode, Copy } from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'
import { apiService } from '../lib/api'
import { generateUPIPaymentLink } from '../utils/upiUtils'
import QRCode from 'react-qr-code'

export default function ProfilePage({ onBack, onLogout }) {
  const { user, logout } = useAuthContext()
  const [phone, setPhone] = useState(user?.phone_number || '')
  const [upiId, setUpiId] = useState(user?.upi_id || '')
  const [showQR, setShowQR] = useState(false)

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  const handleSavePhone = async () => {
    if (!phone || phone.length < 10) return
    try {
      await apiService.updatePhone(phone)
      alert('Mobile Number saved')
    } catch (e) {
      alert('Failed to save Mobile Number')
    }
  }

  const handleSaveUPI = async () => {
    if (!upiId || !upiId.includes('@')) return
    try {
      await apiService.updateUPI(upiId)
      alert('UPI ID saved')
    } catch (e) {
      alert('Failed to save UPI ID')
    }
  }

  // Ensure UPI/QR always reflect server value on open
  useEffect(() => {
    (async () => {
      try {
        const me = await apiService.getCurrentUser()
        if (me?.phone_number) {
          setPhone(me.phone_number)
        }
        if (me?.upi_id) {
          setUpiId(me.upi_id)
        }
      } catch { }
    })()
  }, [])

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="inline-flex items-center justify-center rounded-xl hover:bg-accent h-9 w-9 sm:h-10 sm:w-10 transition-colors">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sr-only">Back</span>
            </button>
          </div>

          {/* Identity Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-foreground/[0.05] via-primary/5 to-transparent">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(900px 500px at 10% -10%, rgba(255,255,255,0.08), transparent 60%)' }} />
            <div className="p-6 sm:p-10">
              <div className="flex items-center gap-5 sm:gap-6">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt={user?.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-border shadow" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted flex items-center justify-center ring-2 ring-border shadow">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight">{user?.name || 'User'}</p>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm sm:text-base break-all">{user?.email}</span>
                    {user?.email_verified && (
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-xs sm:text-sm"><CheckCircle className="h-4 w-4" />Verified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Block */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Contact Details</h2>
            </div>
            <div className="space-y-6">
              {/* Phone Number Section */}
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Mobile Number (For Payments)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit number"
                    type="tel"
                    className="input flex-1 font-mono tracking-wide text-sm"
                  />
                  <button onClick={handleSavePhone} disabled={!phone || phone.length < 10} className="btn btn-primary inline-flex items-center justify-center gap-2 px-4 sm:px-3 w-full sm:w-auto">
                    <Save className="h-4 w-4" />
                    <span className="sm:hidden">Save Number</span>
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
                {phone && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <button onClick={() => { navigator.clipboard.writeText(phone); alert('Number copied'); }} className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                      <Copy className="h-4 w-4" /> Copy Number
                    </button>
                    <p className="text-xs text-muted-foreground">Used for receiving payments</p>
                  </div>
                )}
              </div>

              {/* UPI ID Section */}
              <div className="space-y-3 pt-4 border-t border-border">
                <label className="text-xs text-muted-foreground">UPI ID (For Auto-filled Payments)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank (e.g. name@oksbi)"
                    type="text"
                    className="input flex-1 font-mono tracking-wide text-sm"
                  />
                  <button onClick={handleSaveUPI} disabled={!upiId || !upiId.includes('@')} className="btn btn-primary inline-flex items-center justify-center gap-2 px-4 sm:px-3 w-full sm:w-auto">
                    <Save className="h-4 w-4" />
                    <span className="sm:hidden">Save UPI ID</span>
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
                {upiId && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <button onClick={() => { navigator.clipboard.writeText(upiId); alert('UPI ID copied'); }} className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                      <Copy className="h-4 w-4" /> Copy UPI ID
                    </button>
                    <p className="text-xs text-muted-foreground">Enables 1-click payments</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New QR Code Section */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div
              className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowQR(!showQR)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">My Payment QR</h2>
                  <p className="text-xs text-muted-foreground">Show this to receive payments</p>
                </div>
              </div>
              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                {showQR ? 'Hide' : 'Show'}
              </button>
            </div>

            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-8 flex flex-col items-center justify-center bg-white/5 relative">
                    <div className="absolute inset-0 bg-white dark:bg-black opacity-0 dark:opacity-20" />

                    {upiId ? (
                      <div className="bg-white p-4 rounded-3xl shadow-lg relative z-10 mx-auto">
                        <QRCode
                          value={generateUPIPaymentLink(upiId, 0, user?.name, 'Payment to ' + user?.name)}
                          size={200}
                          viewBox={`0 0 256 256`}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4">
                        <div className="bg-muted h-32 w-32 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                          <QrCode className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground mb-2">Add your UPI ID above to generate your QR Code</p>
                      </div>
                    )}

                    {upiId && (
                      <div className="mt-6 text-center space-y-1 relative z-10">
                        <p className="font-bold text-lg text-foreground">{user?.name}</p>
                        <p className="font-mono text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50 inline-block">
                          {upiId}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Scan with any UPI app to pay</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Danger */}
          <div className="flex items-center justify-center pt-2">
            <button onClick={handleLogout} className="px-5 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 text-sm sm:text-base">Logout</button>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
