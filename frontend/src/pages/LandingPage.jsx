import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Download } from 'lucide-react'

export default function LandingPage({ onSelectMode }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone
    
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome - use native prompt
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          setIsInstalled(true)
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Install error:', error)
      }
    } else if (isIOS) {
      // iOS - show instructions
      alert('To install: Tap Share (□↑) → "Add to Home Screen"')
    } else {
      // Other browsers
      alert('To install: Look for the install icon in your browser\'s address bar')
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Install Button - Top Right (Mobile Only) */}
      {!isInstalled && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleInstall}
          className="fixed top-4 right-4 md:hidden z-50 p-2 flex items-center justify-center group"
        >
          <Download className="h-7 w-7 text-foreground/80 group-hover:text-foreground group-hover:scale-110 transition-all duration-300" />
        </motion.button>
      )}

      {/* Hero Section - Simple Centered Layout */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
        <div className="relative z-10 max-w-4xl w-full">
          {/* Content - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold text-foreground mb-4 sm:mb-6 tracking-tight leading-[0.95]"
            >
              Split expenses.
              <br />
              <span className="text-primary">Stay connected.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto font-medium"
            >
              The simplest way for couples to track shared expenses together.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode('signup')}
                className="group px-8 sm:px-10 py-3.5 sm:py-4 bg-foreground text-background rounded-2xl font-semibold text-base sm:text-lg flex items-center gap-2 border border-border/20"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode('login')}
                className="px-8 sm:px-10 py-3.5 sm:py-4 bg-card border border-border text-foreground rounded-2xl font-semibold text-base sm:text-lg transition-all duration-300 hover:bg-accent"
              >
                Log In
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
