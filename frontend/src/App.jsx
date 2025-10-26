import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { 
  Home, 
  Plus, 
  ArrowRightLeft, 
  BarChart3, 
  ArrowLeft,
  Loader2,
  Settings,
  Sun,
  Moon,
  Laptop,
  Salad,
  Utensils,
  Heart,
  Ticket,
  Train,
  Zap,
  Gift,
  FileText,
  HelpCircle,
  TrendingUp,
  Calendar,
  Users,
  Wallet,
  Bell,
  Search,
  Filter,
  Download,
  Share2
} from 'lucide-react'

// Lazy load components for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AddExpensePage = lazy(() => import('./pages/AddExpensePage'))
const AddTransferPage = lazy(() => import('./pages/AddTransferPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

// API functions
import { apiService as api } from './lib/api'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './hooks/useAuth'

// Import constants
import { CATEGORIES, NAV_ITEMS, PAGE_TITLES, DEFAULT_SETTINGS } from './utils/constants'
import { calculateBalance } from './utils/calculations'
import { LoadingSpinner } from './components/ui/FormComponents'

// Header component
const Header = ({ page, setPage, onSearch, searchQuery, setSearchQuery }) => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
  const [page, setPage] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: expenses = [], isLoading: expensesLoading } = useQuery(
    'expenses',
    api.getExpenses,
    { enabled: !!user }
  )

  const { data: transfers = [], isLoading: transfersLoading } = useQuery(
    'transfers',
    api.getTransfers,
    { enabled: !!user }
  )

  const { data: settings = DEFAULT_SETTINGS } = useQuery(
    'settings',
    api.getSettings,
    { enabled: !!user }
  )

  const loading = expensesLoading || transfersLoading || authLoading

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

  const handleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) setSearchQuery('')
  }

  // Render page content
  const renderPage = () => {
    if (loading) {
      return <LoadingSpinner />
    }

    const names = { person1Name: settings.person1Name, person2Name: settings.person2Name }
    
    const pageProps = {
      balance: balanceResult,
      expenses: filteredExpenses,
      transfers,
      setPage,
      names,
      searchQuery,
      setSearchQuery,
      showSearch,
      setShowSearch
    }

    switch (page) {
      case 'dashboard':
        return <DashboardPage {...pageProps} />
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
      <div className="w-full h-screen flex flex-col bg-background">
        <Header 
          page={page} 
          setPage={setPage} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main className="flex-1 overflow-hidden px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <Suspense fallback={<LoadingSpinner />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
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
        
        <BottomNav currentPage={page} setPage={setPage} />
      </div>
    </div>
  )
}

export { CATEGORIES }
