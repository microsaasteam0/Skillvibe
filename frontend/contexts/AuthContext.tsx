'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  username: string
  full_name?: string
  profile_picture?: string
  role?: string
  company_info?: string
  company_location?: string
  company_overview?: string
  is_active: boolean
  is_verified: boolean
  is_premium: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, role?: string) => Promise<boolean>
  register: (email: string, username: string, password: string, fullName?: string, role?: string, companyInfo?: string) => Promise<boolean>
  googleAuth: (googleToken: string, role?: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  updateUser: (userData: Partial<User>) => void
  forceRestoreAuth: () => boolean
  refreshUser: () => Promise<User | null>
  requestPasswordReset: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastLoginTime, setLastLoginTime] = useState<number | null>(null)

  const isAuthenticated = !!user && !!token

  // Preload usage stats function
  const preloadUsageStats = async (userData: User) => {
    try {
      const cacheKey = `usage-stats-${userData.id}`
      const existingCache = sessionStorage.getItem(`cache-${cacheKey}`)
      if (existingCache) return

      const response = await axios.get(`${API_URL}/api/v1/auth/usage-stats`, {
        timeout: 5000
      })

      const cacheData = {
        data: response.data,
        timestamp: Date.now()
      }
      sessionStorage.setItem(`cache-${cacheKey}`, JSON.stringify(cacheData))
    } catch (error) { }
  }

  // Preload content history function
  const preloadContentHistory = async (userData: User) => {
    try {
      const cacheKey = `dashboard-content-history-${userData.id}`
      const existingCache = sessionStorage.getItem(`cache-${cacheKey}`)
      if (existingCache) return

      const response = await axios.get(`${API_URL}/api/v1/content/history`, {
        timeout: 5000
      })

      const cacheData = {
        data: response.data || [],
        timestamp: Date.now()
      }
      sessionStorage.setItem(`cache-${cacheKey}`, JSON.stringify(cacheData))
    } catch (error) { }
  }

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token')
        const storedRefreshToken = localStorage.getItem('refresh_token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setRefreshTokenValue(storedRefreshToken)
          setUser(parsedUser)

          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`

          // Set loading to false early so pages can render
          setIsLoading(false)

          // Preload content in background
          setTimeout(() => {
            preloadUsageStats(parsedUser)
            preloadContentHistory(parsedUser)
          }, 500)

          // Background verification
          setTimeout(async () => {
            try {
              const lastVerified = sessionStorage.getItem('token_last_verified')
              const now = Date.now()
              const oneHour = 60 * 60 * 1000

              if (!lastVerified || (now - parseInt(lastVerified)) > oneHour) {
                const meResponse = await axios.get(`${API_URL}/api/v1/auth/me`, {
                  timeout: 5000
                })
                sessionStorage.setItem('token_last_verified', now.toString())
                const freshUserData = meResponse.data
                setUser(freshUserData)
                localStorage.setItem('user', JSON.stringify(freshUserData))
              }
            } catch (error: any) {
              if (error.response?.status === 401 || error.response?.status === 403) {
                const timeSinceLogin = lastLoginTime ? Date.now() - lastLoginTime : Infinity
                if (timeSinceLogin > 30000) {
                  if (storedRefreshToken) {
                    const refreshed = await refreshToken()
                    if (!refreshed) clearAuthData()
                  } else {
                    clearAuthData()
                  }
                }
              }
            }
          }, 1000)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string, role?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const normalizedRole = role?.toLowerCase()
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)
      if (normalizedRole) {
        formData.append('role', normalizedRole)
        formData.append('selected_role', normalizedRole)
      }

      const response = await axios.post(
        `${API_URL}/api/v1/auth/login`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      const { access_token, refresh_token, user: userData } = response.data
      let finalUserData = userData

      if (normalizedRole && normalizedRole !== userData.role) {
        try {
          const roleResponse = await axios.put(
            `${API_URL}/api/v1/auth/role`,
            { role: normalizedRole },
            { headers: { 'Authorization': `Bearer ${access_token}` } }
          )
          finalUserData = roleResponse.data
        } catch (roleErr) {
          toast.error('Could not switch role. Please try again.')
          return false
        }
      }

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(finalUserData))

      setToken(access_token)
      setRefreshTokenValue(refresh_token)
      setUser(finalUserData)
      setLastLoginTime(Date.now())
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setTimeout(() => {
        preloadUsageStats(finalUserData)
        preloadContentHistory(finalUserData)
      }, 100)

      toast.success('Welcome back!')
      return true
    } catch (error: any) {
      let message = error.response?.data?.detail || 'Login failed'
      if (typeof message !== 'string') message = message[0]?.msg || 'Login failed'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const googleAuth = async (googleToken: string, role?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await axios.post(`${API_URL}/api/v1/auth/google`, { token: googleToken })
      const { access_token, refresh_token, user: userData } = response.data
      const normalizedRole = role?.toLowerCase()
      let finalUserData = userData

      if (normalizedRole && normalizedRole !== userData.role) {
        try {
          const roleResponse = await axios.put(
            `${API_URL}/api/v1/auth/role`,
            { role: normalizedRole },
            { headers: { 'Authorization': `Bearer ${access_token}` } }
          )
          finalUserData = roleResponse.data
        } catch (roleErr) {
          toast.error('Could not set account role.')
          return false
        }
      }

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(finalUserData))
      setToken(access_token)
      setRefreshTokenValue(refresh_token)
      setUser(finalUserData)
      setLastLoginTime(Date.now())
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setTimeout(() => {
        preloadUsageStats(finalUserData)
        preloadContentHistory(finalUserData)
      }, 100)

      toast.success('Signed in with Google!')
      return true
    } catch (error: any) {
      let message = error.response?.data?.detail || 'Google authentication failed'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    email: string,
    username: string,
    password: string,
    fullName?: string,
    role?: string,
    companyInfo?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await axios.post(`${API_URL}/api/v1/auth/register`, {
        email, username, password, full_name: fullName,
        role: (role || 'candidate').toLowerCase(),
        company_info: companyInfo
      })

      const { access_token, refresh_token, user: userData } = response.data
      if (!access_token || !refresh_token) return true

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(access_token)
      setRefreshTokenValue(refresh_token)
      setUser(userData)
      setLastLoginTime(Date.now())
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setTimeout(() => preloadUsageStats(userData), 100)
      toast.success('Account created! Please check your email to verify.')
      return true
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!refreshTokenValue) return false
      const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refresh_token: refreshTokenValue })
      const { access_token } = response.data
      localStorage.setItem('access_token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      return true
    } catch (error) { return false }
  }

  const clearAuthData = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setToken(null)
    setRefreshTokenValue(null)
    setUser(null)
    setLastLoginTime(null)
    delete axios.defaults.headers.common['Authorization']
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith('cache-usage-stats-')) keysToRemove.push(key)
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    }
  }

  const logout = () => {
    const wasLoggedIn = !!user && !!token
    clearAuthData()
    if (wasLoggedIn) toast.success('Logged out successfully.')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const forceRestoreAuth = () => {
    const storedToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setRefreshTokenValue(storedRefreshToken)
      setUser(JSON.parse(storedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      return true
    }
    return false
  }

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry && token) {
          originalRequest._retry = true
          const refreshed = await refreshToken()
          if (refreshed) {
            const newToken = localStorage.getItem('access_token')
            if (newToken) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`
              return axios(originalRequest)
            }
          } else {
            clearAuthData()
            toast.error('Your session has expired. Please log in again.')
          }
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [token, refreshTokenValue])

  const value: AuthContextType = React.useMemo(() => ({
    user, token, isLoading, isAuthenticated,
    login, register, googleAuth, logout, refreshToken, updateUser, forceRestoreAuth,
    refreshUser: async () => {
      try {
        if (!token) return null
        const response = await axios.get(`${API_URL}/api/v1/auth/me`)
        const freshUser = response.data
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
        sessionStorage.setItem('token_last_verified', Date.now().toString())
        return freshUser
      } catch (error) { return null }
    },
    requestPasswordReset: async (email: string) => {
      try {
        setIsLoading(true)
        await axios.post(`${API_URL}/api/v1/auth/request-password-reset`, { email })
        toast.success('If an account exists, a reset link has been sent.')
        return true
      } catch (error) {
        toast.error('Failed to send reset link.')
        return false
      } finally { setIsLoading(false) }
    }
  }), [user, token, isLoading, isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
