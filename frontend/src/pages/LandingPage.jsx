import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, Wallet, TrendingUp } from 'lucide-react'

export default function LandingPage({ onSelectMode }) {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Creative Split Layout */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
        <div className="relative z-10 max-w-7xl w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold text-foreground mb-3 sm:mb-4 tracking-tight leading-[0.95]"
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
                className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 font-medium px-2 sm:px-0"
              >
                The simplest way for couples to track shared expenses together.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="flex flex-row flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start items-center px-2 sm:px-0"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMode('signup')}
                  className="group px-6 sm:px-8 py-2.5 sm:py-3.5 bg-foreground text-background rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base flex items-center gap-2 border border-border/20 w-full sm:w-auto justify-center"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMode('login')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-card border border-border text-foreground rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-accent w-full sm:w-auto justify-center"
                >
                  Log In
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Side - Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:block relative order-1 lg:order-2"
            >
              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Feature Cards Stack */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 right-0 p-3 sm:p-4 bg-card border border-border rounded-xl sm:rounded-2xl shadow-lg w-40 sm:w-48"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">Transparent</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Sharing</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-0 left-0 p-3 sm:p-4 bg-card border border-border rounded-xl sm:rounded-2xl shadow-lg w-40 sm:w-48"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">Smart</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Balance</p>
                    </div>
                  </div>
                </motion.div>

                {/* Center Visual */}
                <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-card border border-border rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <Wallet className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
