import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const apiService = {
  // Auth
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  // Expenses
  async getExpenses() {
    const response = await api.get('/expenses')
    return response.data.expenses || []
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
    return response.data.transfers || []
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
    return response.data
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
