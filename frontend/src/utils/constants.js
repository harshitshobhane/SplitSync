// Application constants
export const CATEGORIES = {
  groceries: { label: 'Groceries', icon: 'ShoppingCart', color: '#22c55e' },
  rent: { label: 'Rent/Home', icon: 'Home', color: '#3b82f6' },
  food: { label: 'Restaurants', icon: 'UtensilsCrossed', color: '#f97316' },
  dating: { label: 'Date Night', icon: 'Heart', color: '#ec4899' },
  utils: { label: 'Utilities', icon: 'Zap', color: '#facc15' },
  travel: { label: 'Travel', icon: 'Plane', color: '#14b8a6' },
  fun: { label: 'Entertainment', icon: 'Ticket', color: '#a855f7' },
  gifts: { label: 'Gifts', icon: 'Gift', color: '#ef4444' },
  bills: { label: 'Bills', icon: 'FileText', color: '#64748b' },
  health: { label: 'Health', icon: 'HeartPulse', color: '#f43f5e' },
  transport: { label: 'Transport', icon: 'Car', color: '#06b6d4' },
  other: { label: 'Other', icon: 'MoreHorizontal', color: '#9ca3af' },
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  EXPENSES: '/expenses',
  TRANSFERS: '/transfers',
  SETTINGS: '/settings',
  REPORTS: {
    MONTHLY: '/reports/monthly',
    CATEGORIES: '/reports/categories',
  },
}

export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
}

export const SPLIT_TYPES = {
  EQUAL: 'equal',
  RATIO: 'ratio',
  EXACT: 'exact',
}

export const PERSON_TYPES = {
  PERSON1: 'person1',
  PERSON2: 'person2',
}

// Navigation items
export const NAV_ITEMS = [
  { name: 'dashboard', label: 'Home', icon: 'Home' },
  { name: 'addExpense', label: 'Add', icon: 'Plus' },
  { name: 'addTransfer', label: 'Transfer', icon: 'ArrowRightLeft' },
  { name: 'report', label: 'Report', icon: 'BarChart3' },
]

// Page titles
export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  addExpense: 'New Expense',
  addTransfer: 'New Transfer',
  report: 'Monthly Report',
  settings: 'Settings'
}

// Default settings
export const DEFAULT_SETTINGS = {
  person1Name: 'Person 1',
  person2Name: 'Person 2',
  theme: 'system',
  currency: 'USD',
  notifications: true
}
