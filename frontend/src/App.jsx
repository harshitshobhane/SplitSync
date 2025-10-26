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

// Constants
const CATEGORIES = {
  groceries: { label: 'Groceries', icon: Salad, color: '#22c55e', emoji: '🛒' },
  rent: { label: 'Rent/Home', icon: Home, color: '#3b82f6', emoji: '🏠' },
  food: { label: 'Restaurants', icon: Utensils, color: '#f97316', emoji: '🍽️' },
  dating: { label: 'Date Night', icon: Heart, color: '#ec4899', emoji: '💕' },
  utils: { label: 'Utilities', icon: Zap, color: '#facc15', emoji: '⚡' },
  travel: { label: 'Travel', icon: Train, color: '#14b8a6', emoji: '✈️' },
  fun: { label: 'Entertainment', icon: Ticket, color: '#a855f7', emoji: '🎭' },
  gifts: { label: 'Gifts', icon: Gift, color: '#ef4444', emoji: '🎁' },
  bills: { label: 'Bills', icon: FileText, color: '#64748b', emoji: '📄' },
  health: { label: 'Health', icon: Heart, color: '#f43f5e', emoji: '🏥' },
  transport: { label: 'Transport', icon: Train, color: '#06b6d4', emoji: '🚗' },
  other: { label: 'Other', icon: HelpCircle, color: '#9ca3af', emoji: '📦' },
}

// Loading component
const LoadingSpinner = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col justify-center items-center h-80 sm:h-96 space-y-4 sm:space-y-6"
  >
    <div className="relative">
      <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500 animate-spin" />
      <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-rose-200 rounded-full animate-pulse"></div>
    </div>
    <div className="text-center">
      <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Loading your data...</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait a moment</p>
    </div>
  </motion.div>
)

// Header component
const Header = ({ page, setPage, onSearch, searchQuery, setSearchQuery }) => {
  const titles = {
    dashboard: 'Dashboard',
    addExpense: 'New Expense',
    addTransfer: 'New Transfer',
    report: 'Monthly Report',
    settings: 'Settings'
  }

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="gradient-bg-premium text-white p-4 sm:p-6 md:p-8 lg:p-10 shadow-premium-lg rounded-b-2xl sm:rounded-b-3xl relative overflow-hidden w-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-transparent to-purple-500/20"></div>
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between h-8 sm:h-10 md:h-12 mb-2 sm:mb-3 md:mb-4">
          <div className="flex items-center flex-1 min-w-0">
            {page !== 'dashboard' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage('dashboard')} 
                className="mr-2 sm:mr-4 p-2 sm:p-3 -m-2 sm:-m-3 rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm flex-shrink-0"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </motion.button>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight truncate">{titles[page]}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {page === 'dashboard' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSearch()}
                className="p-2 sm:p-3 -m-2 sm:-m-3 rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                <Search size={18} className="sm:w-5 sm:h-5" />
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage('settings')} 
              className="p-2 sm:p-3 -m-2 sm:-m-3 rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            >
              <Settings size={20} className="sm:w-6 sm:h-6" />
            </motion.button>
          </div>
        </div>
        <p className="text-white/80 text-xs sm:text-sm font-medium tracking-wide">Your shared expense tracker</p>
      </div>
    </motion.header>
  )
}

// Bottom Navigation
const BottomNav = ({ currentPage, setPage }) => {
  const navItems = [
    { name: 'dashboard', label: 'Home', icon: Home },
    { name: 'addExpense', label: 'Add', icon: Plus },
    { name: 'addTransfer', label: 'Transfer', icon: ArrowRightLeft },
    { name: 'report', label: 'Report', icon: BarChart3 },
  ]

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 z-10 shadow-premium-lg"
    >
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-around items-center h-16 sm:h-18 md:h-20 lg:h-22 px-2 sm:px-4 md:px-6 lg:px-8">
          {navItems.map((item) => {
            const isActive = currentPage === item.name
            return (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(item.name)}
                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl w-16 sm:w-20 md:w-24 h-14 sm:h-16 md:h-18 transition-all duration-300 ${
                  isActive 
                    ? 'text-rose-600 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/50 dark:to-pink-900/50 dark:text-rose-400 shadow-lg' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700'
                }`}
              >
                <item.icon size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                <span className="text-xs sm:text-sm font-semibold mt-1 hidden sm:block">{item.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
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

  const { data: settings = { person1Name: 'Person 1', person2Name: 'Person 2', theme: 'system' } } = useQuery(
    'settings',
    api.getSettings,
    { enabled: !!user }
  )

  const loading = expensesLoading || transfersLoading || authLoading

  // Calculate balance
  const balanceResult = useMemo(() => {
    let person1Owes = 0
    let person2Owes = 0
    let person1Paid = 0
    let person2Paid = 0

    expenses.forEach(expense => {
      person1Owes += expense.person1Share || 0
      person2Owes += expense.person2Share || 0
      if (expense.paidBy === 'person1') person1Paid += expense.totalAmount
      if (expense.paidBy === 'person2') person2Paid += expense.totalAmount
    })

    transfers.forEach(transfer => {
      if (transfer.fromUser === 'person1') {
        person1Paid += transfer.amount
        person2Paid -= transfer.amount
      } else if (transfer.fromUser === 'person2') {
        person2Paid += transfer.amount
        person1Paid -= transfer.amount
      }
    })

    const person1Net = person1Paid - person1Owes
    const person2Net = person2Paid - person2Owes
    
    const { person1Name, person2Name } = settings
    let whoOwesWho = "You are all settled up! 🎉"
    let amountOwed = 0
    let person1Status = "even"
    let person2Status = "even"

    if (person1Net > person2Net) {
      amountOwed = Math.abs(person2Net)
      whoOwesWho = `${person2Name} owes ${person1Name}`
      person1Status = "positive"
      person2Status = "negative"
    } else if (person2Net > person1Net) {
      amountOwed = Math.abs(person1Net)
      whoOwesWho = `${person1Name} owes ${person2Name}`
      person1Status = "negative"
      person2Status = "positive"
    }

    if (Math.abs(amountOwed) < 0.01) {
      amountOwed = 0
      whoOwesWho = "You are all settled up! 🎉"
      person1Status = "even"
      person2Status = "even"
    }

    return { person1Net, person2Net, whoOwesWho, amountOwed, person1Status, person2Status }
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
    <div className="font-display bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950 min-h-screen w-full">
      <div className="w-full min-h-screen bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-premium-lg relative border border-white/20 dark:border-gray-800/20">
        <Header 
          page={page} 
          setPage={setPage} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24 md:pb-28 lg:pb-32">
          <Suspense fallback={<LoadingSpinner />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-4xl mx-auto"
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
