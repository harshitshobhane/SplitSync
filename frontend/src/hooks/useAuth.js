import { useState, useEffect } from 'react'
import { apiService } from '../lib/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token')
    if (token) {
      // For now, set a default user since we don't have auth endpoints working yet
      setUser({ id: '1', name: 'User', email: 'user@example.com' })
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials)
      localStorage.setItem('auth_token', response.token)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData)
      localStorage.setItem('auth_token', response.token)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated: !!user
  }
}
