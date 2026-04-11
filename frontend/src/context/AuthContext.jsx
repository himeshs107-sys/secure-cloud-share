import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const didInit = useRef(false)   // Fix 4: prevent double-fetch in StrictMode

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const token = localStorage.getItem('vs_token')
    if (!token) { setIsLoading(false); return }
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('vs_token')
        localStorage.removeItem('vs_user')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('vs_token', res.data.token)
      localStorage.setItem('vs_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed.' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/register', { name, email, password })
      localStorage.setItem('vs_token', res.data.token)
      localStorage.setItem('vs_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Registration failed.' }
    } finally {
      setIsLoading(false)
    }
  }

  // Fix 5: Guest creates real temp account in DB
  const loginAsGuest = async () => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/guest')
      localStorage.setItem('vs_token', res.data.token)
      localStorage.setItem('vs_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Guest login failed.' }
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed.' }
    }
  }

  const resetPassword = async (email, newPassword, token) => {
    try {
      await api.post('/auth/reset-password', { token, email, newPassword })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed.' }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/auth/me', updates)
      setUser(res.data.user)
      localStorage.setItem('vs_user', JSON.stringify(res.data.user))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed.' }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed.' }
    }
  }

  // Fix 5: logout calls backend to delete guest account
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    localStorage.removeItem('vs_token')
    localStorage.removeItem('vs_user')
    setUser(null)
  }

  const getAllUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      return res.data.users || []
    } catch { return [] }
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      login, register, loginAsGuest, logout,
      forgotPassword, resetPassword,
      updateProfile, changePassword,
      getAllUsers,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
