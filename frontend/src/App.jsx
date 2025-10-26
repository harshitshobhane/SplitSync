import React, { useState, useMemo, Suspense, lazy } from 'react'
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

// API functions
import { apiService as api } from './lib/api'

// Import constants
import { CATEGORIES, NAV_ITEMS, PAGE_TITLES, DEFAULT_SETTINGS } from './utils/constants'
import { calculateBalance } from './utils/calculations'
import { LoadingSpinner } from './components/ui/FormComponents'

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
  const [authView, setAuthView] = useState(null) // 'landing', 'login', 'signup', 'verify', null
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [appPage, setAppPage] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)

  // Fetch data (hooks must be called unconditionally)
  const { data: expenses = [], isLoading: expensesLoading } = useQuery(
    'expenses',
    api.getExpenses,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: false
    }
  )

  const { data: transfers = [], isLoading: transfersLoading } = useQuery(
    'transfers',
    api.getTransfers,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: false
    }
  )

  const { data: settings = DEFAULT_SETTINGS } = useQuery(
    'settings',
    api.getSettings,
    { 
      enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
      retry: false,
      refetchOnWindowFocus: true
    }
  )

  const loading = expensesLoading || transfersLoading

  // Calculate balance using utility function
  const balanceResult = useMemo(() => {
    return calculateBalance(expenses, transfers, settings.person1Name, settings.person2Name)
  }, [expenses, transfers, settings.person1Name, settings.person2Name])

  // Filter expenses based on search
  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses
    return expenses.filter(expense => 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [expenses, searchQuery])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <LoadingSpinner />
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
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )
    }

    const names = { person1Name: settings.person1Name, person2Name: settings.person2Name }
    
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
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={appPage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full h-full max-w-4xl mx-auto flex flex-col"
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>
          
          <BottomNav currentPage={appPage} setPage={setAppPage} />
        </div>
      )}
    </div>
  )
}

export { CATEGORIES }
