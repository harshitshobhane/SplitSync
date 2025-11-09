import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Zap } from 'lucide-react'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone || 
                        document.referrer.includes('android-app://')
    
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the prompt before (using localStorage)
    const dismissedPrompt = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissedPrompt ? parseInt(dismissedPrompt, 10) : 0
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
    
    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Show prompt if not dismissed or dismissed more than 7 days ago
    if (!dismissedPrompt || daysSinceDismissed > 7) {
      let hasDeferredPrompt = false
      
      // Listen for beforeinstallprompt event (Android/Chrome)
      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        hasDeferredPrompt = true
        // Show prompt when beforeinstallprompt fires
        setShowPrompt(true)
      }
      
      window.addEventListener('beforeinstallprompt', handler)
      
      // For mobile devices, show after a short delay (even without beforeinstallprompt)
      // This covers iOS and other browsers
      if (isMobile) {
        // Show after 1 second for mobile devices
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 1000)
        
        return () => {
          window.removeEventListener('beforeinstallprompt', handler)
          clearTimeout(timer)
        }
      } else {
        // For desktop, show after a delay to allow beforeinstallprompt to fire
        // If beforeinstallprompt fires, it will show immediately
        // Otherwise, show after 2 seconds anyway (for browsers that support PWA but don't fire the event)
        const timer = setTimeout(() => {
          // Show prompt even without beforeinstallprompt for desktop
          setShowPrompt(true)
        }, 2000)
        
        return () => {
          window.removeEventListener('beforeinstallprompt', handler)
          clearTimeout(timer)
        }
      }
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setIsInstalled(true)
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null)
    } else {
      // For iOS or devices without beforeinstallprompt
      // Show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        alert('To install: Tap the Share button and select "Add to Home Screen"')
      } else {
        alert('To install: Look for the install icon in your browser\'s address bar')
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal time in localStorage
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
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
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 hover:bg-accent rounded-xl transition-colors active:scale-95"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>


              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Install SplitSync
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Add SplitSync to your home screen for a faster, app-like experience. Access it anytime, even offline.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 p-3 bg-muted/30 dark:bg-muted/20 rounded-xl">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Quick Access</p>
                    <p className="text-xs text-muted-foreground">One tap to open</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 dark:bg-muted/20 rounded-xl">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">App-like Experience</p>
                    <p className="text-xs text-muted-foreground">Full screen, no browser bars</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstall}
                  className="w-full py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-border/20"
                >
                  <Download className="h-5 w-5" />
                  Install Now
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 rounded-xl text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InstallPrompt

