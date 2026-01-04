import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MoveRight, LogIn, Users } from 'lucide-react'

// Simulated Button component Since '@/components/ui/button' doesn't exist
const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  }

  // Custom overrides for this specific landing page if needed (using direct tailwind colors if theme vars aren't set up perfectly)
  const manualVariants = {
    default: "bg-foreground text-background hover:opacity-90 rounded-full",
    secondary: "bg-background/50 backdrop-blur-md border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-full transition-all duration-300 shadow-sm",
    outline: "border-2 border-border bg-transparent hover:bg-accent hover:text-foreground rounded-full",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-full px-3",
    lg: "h-11 rounded-full px-8 text-base",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={`${baseStyles} ${manualVariants[variant] || variants.default} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default function LandingPage({ onSelectMode }) {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ["connected", "synced", "together", "organized", "happy"],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return (
    <div className="min-h-[100dvh] w-full bg-background overflow-x-hidden flex flex-col items-center justify-center relative selection:bg-primary/20">

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-primary/5 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 relative z-10 w-full">
        <div className="flex gap-6 py-12 lg:py-20 items-center justify-center flex-col w-full">

          {/* Top Pill / Secondary Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 pl-3 pr-4 h-10 text-sm font-semibold whitespace-nowrap"
              onClick={() => onSelectMode('tempGroup')}
            >
              <Users className="w-4 h-4" />
              <span>Try Quick Split (No Signup)</span>
              <MoveRight className="w-3 h-3 ml-1 opacity-70" />
            </Button>
          </motion.div>

          {/* Main Typography */}
          <div className="flex gap-2 flex-col items-center w-full max-w-5xl">
            {/* 
              Responsive H1:
              - clamps font size to ensure it fits on small text
              - "Stay" + word are forced to stay on same line with flex-nowrap
            */}
            <h1 className="tracking-tighter text-center font-bold text-foreground leading-[1] flex flex-col items-center gap-2 w-full">
              {/* Line 1: Split expenses */}
              <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl">Split expenses.</span>

              {/* Line 2: Stay [Rotating Word] - Kept together */}
              <div className="flex flex-row flex-nowrap items-center justify-center gap-2 sm:gap-4 w-full text-4xl sm:text-6xl md:text-7xl lg:text-8xl">
                <span className="text-primary whitespace-nowrap">Stay</span>

                {/* Rotating Container - CSS Grid used to naturally fit the widest word */}
                <span className="relative inline-grid h-[1.1em] overflow-hidden text-left">
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="col-start-1 row-start-1 font-bold text-foreground whitespace-nowrap"
                      initial={{ opacity: 0, y: 40 }}
                      transition={{ type: "spring", stiffness: 50, damping: 20 }}
                      animate={
                        titleNumber === index
                          ? {
                            y: 0,
                            opacity: 1,
                          }
                          : {
                            y: titleNumber > index ? -50 : 50,
                            opacity: 0,
                          }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
              </div>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center mt-6 sm:mt-8 px-4"
            >
              The simplest way for couples to track shared expenses together.
              Avoid complications by ditching spreadsheets.
              Our goal is to streamline your finances.
            </motion.p>
          </div>

          {/* Button Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-row gap-3 w-full sm:w-auto mt-4"
          >
            <Button
              size="lg"
              variant="outline"
              className="gap-2 flex-1 sm:flex-none w-auto sm:min-w-[160px] text-sm sm:text-base font-semibold px-4 whitespace-nowrap"
              onClick={() => onSelectMode('login')}
            >
              Log In <LogIn className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              className="gap-2 flex-1 sm:flex-none w-auto sm:min-w-[160px] text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all px-4 whitespace-nowrap"
              onClick={() => onSelectMode('signup')}
            >
              Get Started <MoveRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
