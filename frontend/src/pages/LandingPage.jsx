import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, TrendingUp, Sparkles, Heart } from 'lucide-react'

export default function LandingPage({ onSelectMode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section - Full Screen */}
      <div className="min-h-screen flex items-center justify-center relative px-4">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-black dark:via-slate-900 dark:to-amber-950/20" />
        
        {/* Geometric decoration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.03, scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-gradient-radial from-slate-400 to-transparent"
        />

        <div className="relative z-10 max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  SplitSync
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-6xl md:text-8xl lg:text-9xl font-light text-slate-900 dark:text-white mb-8 tracking-tight leading-[1.1]"
            >
              For the ones who{' '}
              <br />
              <span className="font-normal text-amber-600 dark:text-amber-400">
                connect deeply.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-16 max-w-2xl mx-auto font-light"
            >
              Effortlessly split expenses with your partner.{' '}
              <br className="hidden md:block" />
              <span className="text-slate-500 dark:text-slate-500">
                Transparent, simple, beautiful.
              </span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode('signup')}
                className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-medium text-base flex items-center gap-2 overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode('login')}
                className="px-8 py-4 bg-transparent border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white rounded-full font-medium text-base transition-all duration-300 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black"
              >
                Log In
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
        </div>
      </div>

      {/* Features Section */}
      <div className="min-h-screen bg-white dark:bg-black py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-6xl font-light text-slate-900 dark:text-white mb-6">
              Designed for
              <br />
              <span className="font-normal text-amber-600 dark:text-amber-400">
                harmony
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-light">
              Everything you need to manage shared expenses beautifully.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: 'Private & Secure',
                description: 'Your data is encrypted and protected with bank-level security.',
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-50 dark:bg-blue-950/20',
              },
              {
                icon: TrendingUp,
                title: 'Smart Insights',
                description: 'Automatic balance tracking and intelligent spending insights.',
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-950/20',
              },
              {
                icon: Heart,
                title: 'Built for Two',
                description: 'Designed specifically for couples who want transparency.',
                color: 'text-rose-600 dark:text-rose-400',
                bgColor: 'bg-rose-50 dark:bg-rose-950/20',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-black dark:to-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
              >
                <div className={`${feature.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-normal text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="min-h-[60vh] bg-gradient-to-br from-slate-50 to-white dark:from-black dark:to-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h2 className="text-5xl md:text-7xl font-light text-slate-900 dark:text-white mb-8">
            Ready to sync?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 font-light">
            Join thousands of couples who split expenses seamlessly.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode('signup')}
            className="group relative px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-medium text-lg flex items-center gap-2 mx-auto overflow-hidden"
          >
            <span className="relative z-10">Get Started Free</span>
            <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

