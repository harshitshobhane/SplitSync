import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    const isPublicEndpoint = config.url.includes('/auth/verify')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (!isPublicEndpoint) {
      console.warn('⚠️ API Request:', config.method?.toUpperCase(), config.url, '- No token (will fail if protected)')
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token if it exists (to prevent infinite loops)
      const token = localStorage.getItem('auth_token')
      if (token) {
        localStorage.removeItem('auth_token')
      }
    }
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('⚠️ Request timeout - backend might be down')
    }
    return Promise.reject(error)
  }
)

export const apiService = {
  // Auth
  async verifyFirebaseToken(userData) {
    const response = await api.post('/auth/verify', userData)
    return response.data
  },

  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data.user
  },

  // Expenses
  async getExpenses() {
    const response = await api.get('/expenses')
    // Backend returns array directly, not wrapped in expenses property
    const expenses = Array.isArray(response.data) ? response.data : []
    // Normalize snake_case to camelCase for frontend consistency
    return expenses.map(expense => ({
      ...expense,
      id: expense.id || expense._id,
      totalAmount: expense.total_amount || expense.totalAmount,
      paidBy: expense.paid_by || expense.paidBy,
      splitType: expense.split_type || expense.splitType,
      person1Share: expense.person1_share || expense.person1Share,
      person2Share: expense.person2_share || expense.person2Share,
      timestamp: expense.created_at ? { seconds: Math.floor(new Date(expense.created_at).getTime() / 1000) } : null,
      createdAt: expense.created_at || expense.createdAt,
      updatedAt: expense.updated_at || expense.updatedAt
    }))
  },

  async createExpense(expenseData) {
    const response = await api.post('/expenses', expenseData)
    return response.data
  },

  async updateExpense(id, expenseData) {
    const response = await api.put(`/expenses/${id}`, expenseData)
    return response.data
  },

  async deleteExpense(id) {
    const response = await api.delete(`/expenses/${id}`)
    return response.data
  },

  // Transfers
  async getTransfers() {
    const response = await api.get('/transfers')
    // Backend returns array directly, not wrapped in transfers property
    const transfers = Array.isArray(response.data) ? response.data : []
    // Normalize snake_case to camelCase for frontend consistency
    return transfers.map(transfer => ({
      ...transfer,
      id: transfer.id || transfer._id,
      fromUser: transfer.from_user || transfer.fromUser,
      toUser: transfer.to_user || transfer.to_user || transfer.toUser,
      created_at: transfer.created_at || transfer.createdAt,
      createdAt: transfer.created_at || transfer.createdAt,
      updatedAt: transfer.updated_at || transfer.updatedAt
    }))
  },

  async createTransfer(transferData) {
    const response = await api.post('/transfers', transferData)
    return response.data
  },

  async updateTransfer(id, transferData) {
    const response = await api.put(`/transfers/${id}`, transferData)
    return response.data
  },

  async deleteTransfer(id) {
    const response = await api.delete(`/transfers/${id}`)
    return response.data
  },

  // Settings
  async getSettings() {
    const response = await api.get('/settings')
    // Backend returns snake_case, convert to camelCase for frontend
    const data = response.data
    return {
      ...data,
      person1Name: data.person1_name || data.person1Name,
      person2Name: data.person2_name || data.person2Name,
    }
  },

  async updateSettings(settingsData) {
    const response = await api.put('/settings', settingsData)
    return response.data
  },

  // Reports
  async getMonthlyReport(year, month) {
    const response = await api.get(`/reports/monthly/${year}/${month}`)
    return response.data
  },

  async getCategoryReport(year, month) {
    const response = await api.get(`/reports/categories/${year}/${month}`)
    return response.data
  },

  // Export
  async exportData(format = 'json') {
    const response = await api.get(`/export/${format}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Notifications
  async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  },

  async markNotificationRead(id) {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  }
}

export { api }
