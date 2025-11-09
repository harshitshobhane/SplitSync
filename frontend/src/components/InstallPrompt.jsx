import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone
    
    if (isStandalone) {
      return // Already installed, don't show
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    
    if (!dismissed) {
      // Listen for beforeinstallprompt event (Android/Chrome)
      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPrompt(true)
      }
      
      window.addEventListener('beforeinstallprompt', handler)
      
      // Show after 1.5 seconds for all devices
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1500)
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(timer)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome - use native prompt
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          setShowPrompt(false)
        } else {
          handleDismiss()
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Install error:', error)
        handleDismiss()
      }
    } else {
      // iOS or other browsers - show instructions
      handleDismiss()
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 hover:bg-accent rounded-xl transition-colors active:scale-95 z-10"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Install SplitSync
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add SplitSync to your home screen for quick access and an app-like experience.
              </p>
            </div>

            {/* iOS Instructions */}
            {isIOS && !deferredPrompt && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-sm font-semibold text-foreground mb-2">How to install on iOS:</p>
                <ol className="text-xs text-muted-foreground space-y-1 text-left list-decimal list-inside">
                  <li>Tap the Share button <span className="font-semibold text-foreground">(□↑)</span> at the bottom</li>
                  <li>Scroll down and tap <span className="font-semibold text-foreground">"Add to Home Screen"</span></li>
                  <li>Tap <span className="font-semibold text-foreground">"Add"</span> to confirm</li>
                </ol>
              </div>
            )}

            {/* Android Instructions (if no beforeinstallprompt) */}
            {!isIOS && !deferredPrompt && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-sm font-semibold text-foreground mb-2">How to install:</p>
                <p className="text-xs text-muted-foreground text-left">
                  Look for the <span className="font-semibold text-foreground">install icon</span> in your browser's address bar, or check the browser menu for <span className="font-semibold text-foreground">"Install App"</span>.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              {deferredPrompt ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstall}
                  className="w-full py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-border/20"
                >
                  <Download className="h-5 w-5" />
                  Install Now
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDismiss}
                  className="w-full py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-border/20"
                >
                  Got it
                </motion.button>
              )}
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InstallPrompt
