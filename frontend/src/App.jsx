import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react'
import { useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from 'react-query'
import { 
  Home, 
  Plus, 
  ArrowRightLeft, 
  BarChart3, 
  ArrowLeft,
  Settings,
  User,
  Search,
} from 'lucide-react'
import { useAuthContext } from './contexts/AuthContext'
import { useLocation } from 'react-router-dom'

// Lazy load components for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const AddExpensePage = lazy(() => import('./pages/AddExpensePage.jsx'))
const AddTransferPage = lazy(() => import('./pages/AddTransferPage.jsx'))
const ReportPage = lazy(() => import('./pages/ReportPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const AllTransactionsPage = lazy(() => import('./pages/AllTransactionsPage.jsx'))
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const InvitePage = lazy(() => import('./pages/InvitePage.jsx'))

// API functions
import { apiService as api } from './lib/api'

// Import constants
import { CATEGORIES, NAV_ITEMS, PAGE_TITLES, DEFAULT_SETTINGS } from './utils/constants'
import { calculateBalance } from './utils/calculations'
import { LoadingSpinner } from './components/ui/FormComponents'
import InstallPrompt from './components/InstallPrompt'

// Header component
const Header = ({ page, setPage, onSearch, searchQuery, setSearchQuery, onProfile }) => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-screen-lg">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {page !== 'dashboard' && (
              <button 
                onClick={() => setPage('dashboard')} 
                className="inline-flex items-center justify-center rounded-lg hover:bg-accent h-9 w-9 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </button>
            )}
            <h1 className="text-lg sm:text-xl font-semibold">
              {PAGE_TITLES[page]}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {page === 'dashboard' && (
              <button 
                onClick={() => onSearch()} 
                className="inline-flex items-center justify-center rounded-lg hover:bg-accent h-9 w-9 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </button>
            )}
            <button 
              onClick={() => setPage('settings')} 
              className="inline-flex items-center justify-center rounded-lg hover:bg-accent h-9 w-9 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </button>
            <button 
              onClick={onProfile}
              className="inline-flex items-center justify-center rounded-lg hover:bg-accent h-9 w-9 transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

// Icon mapping for navigation
const iconMap = {
  Home,
  Plus,
  ArrowRightLeft,
  BarChart3
}

// Bottom Navigation
const BottomNav = ({ currentPage, setPage }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.name
            const IconComponent = iconMap[item.icon]
            return (
              <button
                key={item.name}
                onClick={() => setPage(item.name)}
                className={`relative flex flex-col items-center justify-center h-full px-4 rounded-lg transition-all duration-200 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground rounded-t-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

// Main App Component
export default function App() {
  // Declare ALL hooks at the top, before any conditional logic
  const location = useLocation()
  const [authView, setAuthView] = useState(null) // 'landing', 'login', 'signup', 'verify', null
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [appPage, setAppPage] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)
  const [fxTick, setFxTick] = useState(0)
  const queryClient = useQueryClient()

  // Prefetch FX rates (base INR) and cache in localStorage to enable display conversion
  useEffect(() => {
    const base = 'INR'
    try {
      localStorage.setItem('fx_base', base)
      const cacheKey = `fx_${base}`
      const cachedRaw = localStorage.getItem(cacheKey)
      const now = Date.now()
      const ttlMs = 12 * 60 * 60 * 1000 // 12 hours
      let shouldFetch = true
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw)
          if (cached && cached.timestamp && now - cached.timestamp < ttlMs) {
            shouldFetch = false
          }
        } catch {}
      }
      if (!shouldFetch) return
      const save = (rates) => {
        const payload = { rates, timestamp: Date.now() }
        localStorage.setItem(cacheKey, JSON.stringify(payload))
        setFxTick(t => t + 1)
      }
      const tryHost = () => fetch('https://api.exchangerate.host/latest?base=' + base)
        .then(r => r.json()).then(d => { if (d?.rates) save(d.rates); else throw new Error('no rates') })
      const tryOpen = () => fetch('https://open.er-api.com/v6/latest/' + base)
        .then(r => r.json()).then(d => { if (d?.rates) save(d.rates); else throw new Error('no rates') })
      const tryXRapi = () => fetch('https://api.exchangerate-api.com/v4/latest/' + base)
        .then(r => r.json()).then(d => { if (d?.rates) save(d.rates); else throw new Error('no rates') })
      tryHost().catch(() => tryOpen().catch(() => tryXRapi().catch(() => {})))
    } catch {}
  }, [])

  // Periodic refresh for FX rates and today’s data
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        // Trigger FX refresh by clearing staleness window
        const base = 'INR'
        const cacheKey = `fx_${base}`
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw)
          cached.timestamp = 0
          localStorage.setItem(cacheKey, JSON.stringify(cached))
        }
        // Force a re-render to apply any newly fetched rates
        setFxTick(t => t + 1)
      } catch {}
      // Refetch data queries (only if authenticated)
      if (isAuthenticated) {
        queryClient.invalidateQueries(['expenses'])
        queryClient.invalidateQueries(['transfers'])
        queryClient.invalidateQueries(['settings'])
      }
    }, 30 * 60 * 1000) // every 30 minutes
    return () => clearInterval(interval)
  }, [isAuthenticated, queryClient])

  // Fetch data (hooks must be called unconditionally - BEFORE any early returns)
  const { data: expensesRaw = [], isLoading: expensesLoading } = useQuery(
    'expenses',
    api.getExpenses,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: false
    }
  )

  // Normalize expenses: swap person1/person2 if expense was created by partner
  const expenses = useMemo(() => {
    if (!expensesRaw || !user) return expensesRaw
    
    // Current user ID
    const currentUserId = user.id || user._id || user.uid
    
    return expensesRaw.map(expense => {
      // Expense creator ID
      const creatorId = expense.user_id || expense.userId || expense.userID
      
      // If expense was created by partner (not current user), swap person1 <-> person2
      const isCreatedByPartner = creatorId && String(creatorId) !== String(currentUserId)
      
      if (isCreatedByPartner) {
        return {
          ...expense,
          paidBy: expense.paidBy === 'person1' ? 'person2' : 'person1',
          person1Share: expense.person2Share || expense.person2_share,
          person2Share: expense.person1Share || expense.person1_share
        }
      }
      
      return expense
    })
  }, [expensesRaw, user])

  const { data: transfersRaw = [], isLoading: transfersLoading } = useQuery(
    'transfers',
    api.getTransfers,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: false
    }
  )

  // Normalize transfers: swap person1/person2 if transfer was created by partner
  const transfers = useMemo(() => {
    if (!transfersRaw || !user) return transfersRaw
    
    // Current user ID (try multiple possible fields)
    const currentUserId = user.id || user._id || user.uid
    
    return transfersRaw.map(transfer => {
      // Transfer creator ID
      const creatorId = transfer.user_id || transfer.userId || transfer.userID
      
      // If transfer was created by partner (not current user), swap person1 <-> person2
      const isCreatedByPartner = creatorId && String(creatorId) !== String(currentUserId)
      
      if (isCreatedByPartner) {
        return {
          ...transfer,
          fromUser: transfer.fromUser === 'person1' ? 'person2' : 'person1',
          toUser: transfer.toUser === 'person1' ? 'person2' : 'person1'
        }
      }
      
      return transfer
    })
  }, [transfersRaw, user])

  const { data: settings = DEFAULT_SETTINGS } = useQuery(
    'settings',
    api.getSettings,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true
    }
  )

  // Fetch couple info to get partner name
  const { data: coupleInfo } = useQuery(
    'couple',
    api.getCurrentCouple,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: 30000 // Poll every 30 seconds for partner updates
    }
  )

  const loading = expensesLoading || transfersLoading

  // Get user's own name (from auth context)
  const userName = user?.name || user?.displayName || user?.email?.split('@')[0] || 'You'

  // Get partner name for calculations
  const partnerName = coupleInfo?.couple?.status === 'active' && coupleInfo?.partner
    ? (coupleInfo.partner.name || coupleInfo.partner.email?.split('@')[0] || 'Partner')
    : 'Partner'

  // Calculate balance using utility function
  const balanceResult = useMemo(() => {
    return calculateBalance(expenses, transfers, userName, partnerName)
  }, [expenses, transfers, userName, partnerName, fxTick])

  // Filter expenses based on search
  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses
    return expenses.filter(expense => 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [expenses, searchQuery])

  // Check if this is an invitation link (AFTER all hooks)
  const inviteMatch = location.pathname.match(/^\/invite\/(.+)$/)
  if (inviteMatch) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <InvitePage />
      </Suspense>
    )
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex items-center justify-center h-full w-full">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // If user needs email verification, show verification screen
  // This must come before isAuthenticated check
  if (user && user.needsVerification) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <VerifyEmailPage
          email={user.email}
          onBack={() => setAuthView(null)}
          onSuccess={() => setAuthView(null)}
        />
      </Suspense>
    )
  }

  // If user is not authenticated, show auth flow
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {authView === null && (
          <LandingPage onSelectMode={setAuthView} />
        )}
        {authView === 'login' && (
          <LoginPage
            onBack={() => setAuthView(null)}
            onSuccess={() => setAuthView(null)}
          />
        )}
        {authView === 'signup' && (
          <SignupPage
            onBack={() => setAuthView(null)}
            onSuccess={(email) => {
              if (email) {
                setAuthView('verify')
              } else {
                setAuthView(null)
              }
            }}
          />
        )}
      </Suspense>
    )
  }

  // User is authenticated - show main app

  const handleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) setSearchQuery('')
  }

  // Render page content
  const renderPage = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center h-full w-full">
          <LoadingSpinner />
        </div>
      )
    }

    // Use user's own name and partner name (already calculated above)
    const names = { 
      person1Name: userName, 
      person2Name: partnerName 
    }
    
    const pageProps = {
      balance: balanceResult,
      expenses: filteredExpenses,
      transfers,
      setPage: setAppPage,
      names,
      searchQuery,
      setSearchQuery,
      showSearch,
      setShowSearch,
      currency: settings.currency || 'USD'
    }

    switch (appPage) {
      case 'dashboard':
        return <DashboardPage {...pageProps} />
      case 'allTransactions':
        return <AllTransactionsPage {...pageProps} onBack={() => setAppPage('dashboard')} />
      case 'addExpense':
        return <AddExpensePage {...pageProps} />
      case 'addTransfer':
        return <AddTransferPage {...pageProps} />
      case 'report':
        return <ReportPage {...pageProps} />
      case 'settings':
        return <SettingsPage {...pageProps} currentSettings={settings} />
      default:
        return <DashboardPage {...pageProps} />
    }
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      {showProfile ? (
        <Suspense fallback={<LoadingSpinner />}>
          <ProfilePage
            onBack={() => setShowProfile(false)}
            onLogout={() => setShowProfile(false)}
          />
        </Suspense>
      ) : (
        <div className="w-full h-screen flex flex-col bg-background">
          {appPage !== 'allTransactions' && (
            <Header 
              page={appPage} 
              setPage={setAppPage} 
              onSearch={handleSearch}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onProfile={() => setShowProfile(true)}
            />
          )}
          
          <main className="flex-1 overflow-hidden px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full w-full">
                <LoadingSpinner />
              </div>
            }>
              <AnimatePresence mode="wait">
                <motion.div
                  key={appPage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full h-full max-w-4xl mx-auto flex flex-col relative"
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>
          
          <BottomNav currentPage={appPage} setPage={setAppPage} />
        </div>
      )}
      
      {/* PWA Install Prompt - Only show when NOT authenticated */}
      {!isAuthenticated && <InstallPrompt />}
    </div>
  )
}

export { CATEGORIES }
