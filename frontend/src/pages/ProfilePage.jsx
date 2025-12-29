import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, LogOut, ArrowLeft, CheckCircle, Download, Save, QrCode, Copy, Maximize2, X } from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'
import { apiService } from '../lib/api'

export default function ProfilePage({ onBack, onLogout }) {
  const { user, logout } = useAuthContext()
  const [upi, setUpi] = useState(user?.upi_id || '')
  const upiUri = upi ? `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(user?.name || 'SplitHalf User')}&cu=INR` : ''
  const [showQr, setShowQr] = useState(false)

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  const handleSaveUpi = async () => {
    if (!upi || !upi.includes('@')) return
    try {
      await apiService.updateUPI(upi)
      alert('UPI saved')
    } catch (e) {
      alert('Failed to save UPI')
    }
  }

  // Ensure UPI/QR always reflect server value on open
  useEffect(() => {
    (async () => {
      try {
        const me = await apiService.getCurrentUser()
        if (me?.upi_id && typeof me.upi_id === 'string') {
          setUpi(me.upi_id)
        }
      } catch { }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-3xl">
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

          {/* UPI Block */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">UPI for payments</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Your UPI ID</label>
                <div className="flex gap-2">
                  <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" className="input flex-1" />
                  <button onClick={handleSaveUpi} disabled={!upi || !upi.includes('@')} className="btn btn-primary inline-flex items-center gap-2 px-3">
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
                {upi && (
                  <div className="flex items-center gap-4">
                    <button onClick={() => navigator.clipboard.writeText(upi)} className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                      <Copy className="h-4 w-4" /> Copy UPI
                    </button>
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(upiUri)}`} download="upi-qr.png" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                      <Download className="h-4 w-4" /> Download QR
                    </a>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center">
                {upi ? (
                  <div className="relative">
                    <img alt="UPI QR" className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl border border-border bg-background" src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`} />
                    <button
                      onClick={() => setShowQr(true)}
                      aria-label="Open full screen"
                      className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-1 ring-white/20 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/60"
                      title="Full screen"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <QrCode className="h-6 w-6" />
                      Add your UPI to generate QR
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Danger */}
          <div className="flex items-center justify-center pt-2">
            <button onClick={handleLogout} className="px-5 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 text-sm sm:text-base">Logout</button>
          </div>

          {/* QR Fullscreen Modal */}
          <AnimatePresence>
            {showQr && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} className="relative bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl">
                  <button onClick={() => setShowQr(false)} className="absolute -top-3 -right-3 sm:top-2 sm:right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border hover:bg-accent">
                    <X className="h-4 w-4" />
                  </button>
                  <img alt="UPI QR" className="w-[75vw] h-[75vw] max-w-[480px] max-h-[480px] rounded-xl border border-border bg-background object-contain" src={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(upiUri)}`} />
                  {upi && (
                    <div className="mt-3 text-center text-xs sm:text-sm text-muted-foreground break-all">{upi}</div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

