'use client'

import React, { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { User, Settings, History, Heart, BarChart3, Crown, LogOut, Save, Trash2, Star, Download, Eye, Filter, Edit2, Check, X, FileText, Copy, RefreshCw, Zap, TrendingUp, Clock, Sparkles, ArrowRight, Twitter, Plus, Sun, Moon, CheckCircle, Trophy, ShieldCheck, Cpu, Target, Terminal, Briefcase, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import CustomTemplateManager from './CustomTemplateManager'
import LoadingSpinner from './LoadingSpinner'
import Pagination from './Pagination'
import ImageEditor from './ImageEditor'
import { requestCache } from '../lib/cache-util'
import { API_URL } from '../lib/api-config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface SavedContent {
  id: number
  title: string
  content_type: string
  content: string
  tags?: string
  is_favorite: boolean
  created_at: string
  updated_at?: string
}

interface ContentHistory {
  id: number
  original_content: string
  content_source?: string
  twitter_thread?: string
  processing_time?: number
  created_at: string
}

interface UsageStats {
  total_generations: number
  recent_generations: number
  rate_limit: number
  remaining_requests: number
  is_premium: boolean
  leaderboard_rank?: string
}

interface AppliedJob {
  application_id: number
  status: string
  created_at: string
  job: {
    id: number
    title: string
    company_name: string
    location?: string
    is_active: boolean
  }
}

interface DashboardModalProps {
  isOpen: boolean
  onClose: () => void
  externalUsageStats?: UsageStats | null
}

export default function DashboardModal({ isOpen, onClose, externalUsageStats }: DashboardModalProps) {
  const { user, logout, updateUser, refreshUser } = useAuth()
  const featureGate = useFeatureGate()

  // Refresh user data when dashboard opens
  useEffect(() => {
    if (isOpen) {
      refreshUser()
    }
  }, [isOpen])
  const { autoSaveEnabled, setAutoSaveEnabled, emailNotificationsEnabled, setEmailNotificationsEnabled } = useUserPreferences()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // State management
  const [activeSection, setActiveSection] = useState('overview')
  const [savedContent, setSavedContent] = useState<SavedContent[]>([])
  const [contentHistory, setContentHistory] = useState<ContentHistory[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(externalUsageStats || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewingContent, setViewingContent] = useState<SavedContent | null>(null)
  const [deletingContent, setDeletingContent] = useState<SavedContent | null>(null)

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [editedFullName, setEditedFullName] = useState('')
  const [editedProfilePicture, setEditedProfilePicture] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1
  })
  const [imageEditorRef, setImageEditorRef] = useState<HTMLCanvasElement | null>(null)
  const canViewApplications = user?.role === 'candidate' || user?.role === 'admin'

  // Helper function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false

    // Check for base64 images
    if (url.startsWith('data:image/')) {
      return true
    }

    // Check for regular URLs
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (max 5MB for editing)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image is too large (max 5MB)')
        return
      }

      setSelectedFile(file)

      // Create preview URL and show editor
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setPreviewUrl(imageUrl)
        setShowImageEditor(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image crop and adjustment
  const handleImageCrop = (canvas: HTMLCanvasElement) => {
    // Convert canvas to blob with compression
    canvas.toBlob((blob) => {
      if (blob) {
        // Validate final size (max 750KB after compression)
        if (blob.size > 750 * 1024) {
          toast.error('Image dimensions are too large')
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const croppedImageUrl = e.target?.result as string
          setEditedProfilePicture(croppedImageUrl)
          setShowImageEditor(false)
          setShowProfilePictureModal(false)

          // Auto-save the cropped image
          handleImageUpload(croppedImageUrl)
        }
        reader.readAsDataURL(blob)
      }
    }, 'image/jpeg', 0.8) // 80% quality for compression
  }

  // Upload image to a service (you'll need to implement this)
  const uploadImage = async (imageData?: string): Promise<string> => {
    // Use provided imageData or convert selected file to base64
    if (imageData) {
      return imageData
    }

    if (!selectedFile) {
      throw new Error('No image selected')
    }

    // For now, we'll convert to base64 and store it directly
    // In production, you should upload to a cloud service like AWS S3, Cloudinary, etc.
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Limit base64 size to prevent issues (max 1MB base64 ≈ 750KB original)
        if (result.length > 1000000) {
          reject(new Error('Image too large. Please select a smaller image (max 750KB).'))
          return
        }
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(selectedFile)
    })
  }

  // Handle image upload and save
  const handleImageUpload = async (imageData?: string) => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    setIsUploading(true)
    try {

      const imageUrl = await uploadImage(imageData)

      setEditedProfilePicture(imageUrl)

      // Immediately save the profile with the new image

      const profileData = {
        username: editedUsername.trim(),
        full_name: editedFullName.trim() || null,
        profile_picture: imageUrl
      }


      const response = await axios.put(`${API_URL}/api/v1/auth/profile`, profileData, {
        timeout: 30000, // 30 second timeout for large images
        headers: {
          'Content-Type': 'application/json'
        }
      })


      if (response.data) {
        // Update user context with new data

        const updatedUserData = {
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        }


        updateUser(updatedUserData)

        // Also update the local editing state to reflect the change immediately
        setEditedProfilePicture(response.data.profile_picture)

        setShowProfilePictureModal(false)
        setSelectedFile(null)
        setPreviewUrl('')

        // Force a small delay to ensure state updates
        setTimeout(() => {
          toast.success('Profile picture updated')

          // Force a re-render by updating a dummy state
          setIsEditingProfile(false)
          setTimeout(() => setIsEditingProfile(true), 100)
        }, 100)
      }
    } catch (error: any) {
      console.error('❌ Error uploading and saving profile picture:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error message:', error.message)

      if (error.message.includes('Image too large')) {
        toast.error(error.message)
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid image data')
      } else if (error.response?.status === 413) {
        toast.error('Image too large. Please select a smaller image.')
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. Please try with a smaller image.')
      } else {
        toast.error('Failed to upload profile picture. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPerPage, setHistoryPerPage] = useState(5)

  // Subscription management state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Check if component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock page scroll and stop Lenis to prevent background scrolling.
  useScrollLock(isOpen)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadInitialDataFast()
      if (canViewApplications) {
        loadAppliedJobs()
      }

      // Initialize profile editing state
      setEditedUsername(user.username || '')
      setEditedFullName(user.full_name || '')
      setEditedProfilePicture(user.profile_picture || '')

      // Immediately check cache and load section data in parallel
      if (user.is_premium) {
        const contentCacheKey = `dashboard-saved-content-${user.id}`
        const cachedContent = requestCache.getCached(contentCacheKey)
        if (cachedContent && Array.isArray(cachedContent)) {
          setSavedContent(cachedContent)
        }
        loadSectionData('content')
      }

      const historyCacheKey = `dashboard-content-history-${user.id}`
      const cachedHistory = requestCache.getCached(historyCacheKey)
      if (cachedHistory && Array.isArray(cachedHistory)) {
        setContentHistory(cachedHistory)
      }
      loadSectionData('history')
    }
  }, [isOpen, user, canViewApplications])

  // Preload data when user is available (even when modal is closed)
  useEffect(() => {
    if (user && !isOpen) {

      // Preload usage stats
      const statsCacheKey = `usage-stats-${user.id}`
      if (!requestCache.getCached(statsCacheKey)) {
        requestCache.get(
          statsCacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/auth/usage-stats`, {
              timeout: 15000
            })
            return response.data
          },
          60 * 1000 // 60s short-lived cache
        ).catch(() => { }) // Silent fail for background loading
      }

      // Preload content history for all users
      const historyCacheKey = `dashboard-content-history-${user.id}`
      if (!requestCache.getCached(historyCacheKey)) {
        requestCache.get(
          historyCacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/content/history`, {
              timeout: 15000
            })
            return response.data || []
          },
          30 * 60 * 1000
        ).catch(() => { }) // Silent fail for background loading
      }

      // Preload saved content for premium users
      if (user.is_premium) {
        const contentCacheKey = `dashboard-saved-content-${user.id}`
        if (!requestCache.getCached(contentCacheKey)) {
          requestCache.get(
            contentCacheKey,
            async () => {
              const response = await axios.get(`${API_URL}/api/v1/content/saved`, {
                timeout: 15000
              })
              return response.data || []
            },
            30 * 60 * 1000
          ).catch(() => { }) // Silent fail for background loading
        }
      }
    }
  }, [user, isOpen])

  // Load only essential data first with request deduplication
  const loadInitialDataFast = async () => {
    try {
      // If we have external usage stats, use them immediately
      if (externalUsageStats) {
        setUsageStats(externalUsageStats)
        return
      }

      // Use request cache for deduplication
      const cacheKey = `usage-stats-${user?.id}`
      const stats = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/auth/usage-stats`, {
            timeout: 5000 // Increased timeout
          })
          return response.data
        },
        60 * 1000 // 60s short-lived cache
      )

      setUsageStats(stats)
    } catch (error: any) {
      console.error('Error in loadInitialDataFast:', error)
      // Set default stats if everything fails
      const fallbackStats = {
        total_generations: 0,
        recent_generations: 0,
        rate_limit: user?.is_premium ? 20 : 2,
        remaining_requests: user?.is_premium ? 20 : 2,
        is_premium: user?.is_premium || false
      }
      setUsageStats(fallbackStats)
    }
  }

  const loadAppliedJobs = async () => {
    if (!canViewApplications || !user?.id) return

    setIsLoadingApplications(true)
    try {
      const cacheKey = `dashboard-applied-jobs-${user.id}`
      const jobs = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/jobs/candidate/me`, {
            timeout: 10000
          })
          return response.data || []
        },
        30 * 1000
      )
      setAppliedJobs(jobs)
    } catch (error) {
      console.error('Error loading applied jobs:', error)
      setAppliedJobs([])
    } finally {
      setIsLoadingApplications(false)
    }
  }

  // Load section-specific data when user navigates to that section
  const loadSectionData = async (section: string) => {

    if (section === 'content') {
      const cacheKey = `dashboard-saved-content-${user?.id}`
      const cachedContent = requestCache.getCached(cacheKey)

      // Only show loading if we don't have cached data
      if (!cachedContent || !Array.isArray(cachedContent) || cachedContent.length === 0) {
        setIsLoadingContent(true)
      } else {
        // Use cached data immediately
        setSavedContent(cachedContent)
      }

      try {

        const content = await requestCache.get(
          cacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/content/saved`, {
              timeout: 10000 // Increased timeout
            })
            return response.data || []
          },
          30 * 60 * 1000 // 30 minute cache
        )

        setSavedContent(content)
      } catch (error: any) {
        console.error('Error loading saved content:', error)
        if (error.response?.status === 403) {
        }
        setSavedContent([])
      } finally {
        setIsLoadingContent(false)
      }
    } else if (section === 'history') {
      const cacheKey = `dashboard-content-history-${user?.id}`
      const cachedHistory = requestCache.getCached(cacheKey)

      // Only show loading if we don't have cached data
      if (!cachedHistory || !Array.isArray(cachedHistory) || cachedHistory.length === 0) {
        setIsLoadingHistory(true)
      } else {
        // Use cached data immediately
        setContentHistory(cachedHistory)
      }

      try {

        const history = await requestCache.get(
          cacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/content/history`, {
              timeout: 10000 // Increased timeout
            })
            return response.data || []
          },
          30 * 60 * 1000 // 30 minute cache
        )

        setContentHistory(history)
      } catch (error: any) {
        console.error('Error loading content history:', error)
        if (error.response?.status === 403) {
        }
        setContentHistory([])
      } finally {
        setIsLoadingHistory(false)
      }
    }
  }

  // Load data when section changes
  useEffect(() => {
    if (isOpen && user && activeSection !== 'overview') {

      // Only load if we don't already have data for this section
      if (activeSection === 'content' && user.is_premium && savedContent.length === 0) {
        loadSectionData('content')
      } else if (activeSection === 'history' && contentHistory.length === 0) {
        loadSectionData('history')
      } else {
      }
    }
  }, [activeSection, isOpen, user])

  // Force refresh data after content generation
  const refreshAfterGeneration = async () => {

    // Invalidate caches
    const contentCacheKey = `dashboard-saved-content-${user?.id}`
    const historyCacheKey = `dashboard-content-history-${user?.id}`

    requestCache.invalidate(contentCacheKey)
    requestCache.invalidate(historyCacheKey)

    // Refresh saved content if currently loaded
    if (savedContent.length > 0) {
      try {
        const content = await requestCache.get(
          contentCacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/content/saved`, {
              timeout: 2000
            })
            return response.data || []
          },
          30 * 60 * 1000
        )
        setSavedContent(content)
      } catch (error) {
        console.error('Error refreshing saved content:', error)
      }
    }

    // Refresh history if currently loaded
    if (contentHistory.length > 0) {
      try {
        const history = await requestCache.get(
          historyCacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/content/history`, {
              timeout: 2000
            })
            return response.data || []
          },
          30 * 60 * 1000
        )
        setContentHistory(history)
      } catch (error) {
        console.error('Error refreshing content history:', error)
      }
    }

    // Also refresh usage stats
    loadInitialDataFast()
  }

  // Listen for content-saved and content-generated events to refresh data
  useEffect(() => {
    const handleContentSaved = (event: CustomEvent) => {

      // Only refresh saved content, not history (history tracks generations, not saves)
      if (user?.is_premium && isOpen && savedContent.length > 0) {
        // Refresh saved content
        const contentCacheKey = `dashboard-saved-content-${user?.id}`
        requestCache.invalidate(contentCacheKey)

        // Reload saved content
        loadSectionData('content')
      } else if (user?.is_premium) {
        // If dashboard is closed, just invalidate saved content cache for next time
        const contentCacheKey = `dashboard-saved-content-${user?.id}`
        requestCache.invalidate(contentCacheKey)
      }
    }

    const handleContentGenerated = (event: CustomEvent) => {

      // Refresh both saved content and history after generation
      if (user?.is_premium && isOpen) {
        refreshAfterGeneration()
      } else if (user?.is_premium) {
        // If dashboard is closed, just invalidate caches for next time
        const contentCacheKey = `dashboard-saved-content-${user?.id}`
        const historyCacheKey = `dashboard-content-history-${user?.id}`
        requestCache.invalidate(contentCacheKey)
        requestCache.invalidate(historyCacheKey)
      }
    }

    // Listen for both events regardless of whether dashboard is open
    window.addEventListener('content-saved', handleContentSaved as EventListener)
    window.addEventListener('content-generated', handleContentGenerated as EventListener)

    return () => {
      window.removeEventListener('content-saved', handleContentSaved as EventListener)
      window.removeEventListener('content-generated', handleContentGenerated as EventListener)
    }
  }, [isOpen, user, savedContent.length, contentHistory.length])

  const handleDeleteContent = async (contentId: number) => {
    try {
      await axios.delete(`${API_URL}/api/v1/content/saved/${contentId}`)
      setSavedContent(prev => prev.filter(item => item.id !== contentId))
      setDeletingContent(null)

      // Invalidate caches to prevent ghost items on return
      if (user?.id) {
        requestCache.invalidate(`dashboard-saved-content-${user.id}`)
        requestCache.invalidate(`dashboard-content-history-${user.id}`)
        requestCache.invalidate(`usage-stats-${user.id}`)
      }

      toast.success('Deleted successfully')
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete')
    }
  }

  const handleToggleFavorite = async (contentId: number) => {
    const content = savedContent.find(item => item.id === contentId)
    if (!content) return

    // Optimistic update - update UI immediately
    const newFavoriteState = !content.is_favorite
    setSavedContent(prev => prev.map(item =>
      item.id === contentId
        ? { ...item, is_favorite: newFavoriteState }
        : item
    ))

    // Also update the viewing content if it's the same item
    if (viewingContent && viewingContent.id === contentId) {
      setViewingContent(prev => prev ? { ...prev, is_favorite: newFavoriteState } : null)
    }

    // Show immediate feedback
    toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites')

    // Make API call in background
    try {
      await axios.put(`${API_URL}/api/v1/content/saved/${contentId}`, {
        is_favorite: newFavoriteState
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)

      // Revert the optimistic update on error
      setSavedContent(prev => prev.map(item =>
        item.id === contentId
          ? { ...item, is_favorite: !newFavoriteState }
          : item
      ))

      // Also revert viewing content if it's the same item
      if (viewingContent && viewingContent.id === contentId) {
        setViewingContent(prev => prev ? { ...prev, is_favorite: !newFavoriteState } : null)
      }

      toast.error('Could not save favorite. Please try again.')
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      // Set flag to indicate this is a manual cancellation
      sessionStorage.setItem('manual_cancellation', 'true')

      const response = await axios.post(`${API_URL}/api/v1/payment/cancel`)

      if (response.data.success) {
        // Update user state
        updateUser({ is_premium: false })

        // Clear all cached usage stats to force refresh everywhere
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.includes('usage_stats') || key.includes('dashboard_stats')) {
            sessionStorage.removeItem(key)
          }
        })

        // Refresh feature gate limits
        await featureGate.refreshLimits()

        // Reload fresh usage stats
        await loadInitialDataFast()

        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('subscription-cancelled', {
          detail: { is_premium: false }
        }))

        toast.success('Subscription cancelled')
        setShowCancelModal(false)
      } else {
        toast.error(response.data.message || 'Could not cancel. Please try again.')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Could not cancel. Please try again.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editedUsername.trim()) {
      toast.error('Username is required')
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await axios.put(`${API_URL}/api/v1/auth/profile`, {
        username: editedUsername.trim(),
        full_name: editedFullName.trim() || null,
        profile_picture: editedProfilePicture.trim() || null
      })

      if (response.data) {
        // Update user context with new data
        updateUser({
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        })

        setIsEditingProfile(false)
        toast.success('Profile updated')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Username already taken')
      } else {
        toast.error('Could not update profile. Please try again.')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedUsername(user?.username || '')
    setEditedFullName(user?.full_name || '')
    setEditedProfilePicture(user?.profile_picture || '')
    setIsEditingProfile(false)
  }

  // Export functions
  const handleExportContent = (content: any, format: 'txt' | 'json' | 'csv') => {
    if (!user?.is_premium) {
      toast.error('Pro plan required for this feature.')
      return
    }

    try {
      let exportData: string
      let filename: string
      let mimeType: string

      const sanitizedTitle = (content.title || `generation_${content.id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const timestamp = new Date().toISOString().split('T')[0]

      // Extract content from either SavedContent or ContentHistory
      let mainContent = content.content || "";
      if (!mainContent) {
        const parts = [];
        if (content.twitter_thread) {
          let thread = content.twitter_thread;
          try {
            if (typeof thread === 'string' && thread.startsWith('[')) {
              const parsed = JSON.parse(thread);
              if (Array.isArray(parsed)) thread = parsed.join('\n\n');
            } else if (Array.isArray(thread)) {
              thread = thread.join('\n\n');
            }
          } catch (e) { }
          parts.push(`--- X THREAD ---\n${thread}`);
        }

        mainContent = parts.join('\n\n');
      }

      switch (format) {
        case 'txt':
          exportData = `Title: ${content.title || 'Generation History'}\n` +
            `Type: ${content.content_type || 'history_item'}\n` +
            `Created: ${new Date(content.created_at).toLocaleString()}\n` +
            `${content.updated_at ? `Updated: ${new Date(content.updated_at).toLocaleString()}\n` : ''}` +
            `Favorite: ${content.is_favorite ? 'Yes' : 'No'}\n` +
            `${content.tags ? `Tags: ${content.tags}\n` : ''}` +
            `\n--- Content ---\n\n${mainContent}`
          filename = `${sanitizedTitle}_${timestamp}.txt`
          mimeType = 'text/plain'
          break

        case 'json':
          exportData = JSON.stringify({
            id: content.id,
            title: content.title,
            content_type: content.content_type,
            content: content.content,
            twitter_thread: content.twitter_thread,
            tags: content.tags,
            is_favorite: content.is_favorite,
            created_at: content.created_at,
            updated_at: content.updated_at,
            exported_at: new Date().toISOString()
          }, null, 2)
          filename = `${sanitizedTitle}_${timestamp}.json`
          mimeType = 'application/json'
          break

        case 'csv':
          const csvRows = [
            ['Field', 'Value'],
            ['ID', content.id.toString()],
            ['Title', content.title || 'Generation'],
            ['Type', content.content_type || 'history'],
            ['Content', mainContent.replace(new RegExp('"', 'g'), '""')],
            ['Tags', content.tags || ''],
            ['Favorite', content.is_favorite ? 'Yes' : 'No'],
            ['Created', new Date(content.created_at).toLocaleString()],
            ['Updated', content.updated_at ? new Date(content.updated_at).toLocaleString() : ''],
            ['Exported', new Date().toLocaleString()]
          ]
          exportData = csvRows.map(row =>
            row.map(cell => `"${cell}"`).join(',')
          ).join('\n')
          filename = `${sanitizedTitle}_${timestamp}.csv`
          mimeType = 'text/csv'
          break

        default:
          throw new Error('Unsupported format')
      }

      // Create and download file
      const blob = new Blob([exportData], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${format.toUpperCase()} successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed. Please try again.')
    }
  }

  const handleBulkExport = (format: 'txt' | 'json' | 'csv') => {
    if (!user?.is_premium) {
      toast.error('Pro plan required to export.')
      return
    }

    if (savedContent.length === 0) {
      toast.error('Nothing to export yet.')
      return
    }

    try {
      let exportData: string
      let filename: string
      let mimeType: string

      const timestamp = new Date().toISOString().split('T')[0]

      switch (format) {
        case 'txt':
          exportData = savedContent.map((content, index) =>
            `=== Content ${index + 1} ===\n` +
            `Title: ${content.title}\n` +
            `Type: ${content.content_type}\n` +
            `Created: ${new Date(content.created_at).toLocaleString()}\n` +
            `${content.updated_at ? `Updated: ${new Date(content.updated_at).toLocaleString()}\n` : ''}` +
            `Favorite: ${content.is_favorite ? 'Yes' : 'No'}\n` +
            `${content.tags ? `Tags: ${content.tags}\n` : ''}` +
            `\n--- Content ---\n\n${content.content}\n\n`
          ).join('\n' + '='.repeat(50) + '\n\n')
          filename = `snippetstream_content_${timestamp}.txt`
          mimeType = 'text/plain'
          break

        case 'json':
          exportData = JSON.stringify({
            exported_at: new Date().toISOString(),
            total_items: savedContent.length,
            content: savedContent.map(content => ({
              id: content.id,
              title: content.title,
              content_type: content.content_type,
              content: content.content,
              tags: content.tags,
              is_favorite: content.is_favorite,
              created_at: content.created_at,
              updated_at: content.updated_at
            }))
          }, null, 2)
          filename = `snippetstream_content_${timestamp}.json`
          mimeType = 'application/json'
          break

        case 'csv':
          const csvRows = [
            ['ID', 'Title', 'Type', 'Content', 'Tags', 'Favorite', 'Created', 'Updated']
          ]
          savedContent.forEach(content => {
            csvRows.push([
              content.id.toString(),
              content.title,
              content.content_type,
              content.content.replace(new RegExp('"', 'g'), '""'), // Escape quotes
              content.tags || '',
              content.is_favorite ? 'Yes' : 'No',
              new Date(content.created_at).toLocaleString(),
              content.updated_at ? new Date(content.updated_at).toLocaleString() : ''
            ])
          })
          exportData = csvRows.map(row =>
            row.map(cell => `"${cell}"`).join(',')
          ).join('\n')
          filename = `snippetstream_content_${timestamp}.csv`
          mimeType = 'text/csv'
          break

        default:
          throw new Error('Unsupported format')
      }

      // Create and download file
      const blob = new Blob([exportData], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`All items exported as ${format.toUpperCase()}!`)
    } catch (error) {
      console.error('Bulk export error:', error)
      toast.error('Export failed. Please try again.')
    }
  }

  // Pagination helpers
  const getFilteredContent = () => {
    return savedContent.filter(item =>
      (filterType === 'all' || item.content_type === filterType) &&
      (searchTerm === '' || item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const getPaginatedContent = () => {
    const filtered = getFilteredContent()
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }

  const getPaginatedHistory = () => {
    const startIndex = (historyPage - 1) * historyPerPage
    return contentHistory.slice(startIndex, startIndex + historyPerPage)
  }

  const getTotalPages = () => {
    return Math.ceil(getFilteredContent().length / itemsPerPage)
  }

  const getHistoryTotalPages = () => {
    return Math.ceil(contentHistory.length / historyPerPage)
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // scroll lock handled by useScrollLock above
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose]);

  if (!isOpen || !user || !mounted) {
    return null;
  }

  const modalElement = (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 hide-scrollbar z-[1000]"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        overflow: 'hidden'
      }
      }
    >
      {/* Modal Content */}
      <div
        className="bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl sm:rounded-[2.5rem] flex flex-col sm:flex-row overflow-hidden shadow-2xl hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 'min(95vw, 1200px)',
          maxHeight: '95vh',
          width: '100%',
          height: '95vh',
          margin: 'auto',
          display: 'flex',
          overflowX: 'hidden'
        }}
      >
        {/* Mobile Header with Tab Navigation */}
        <div className="sm:hidden bg-zinc-100/50 dark:bg-slate-900/50 border-b border-zinc-200 dark:border-slate-800 p-3 flex-shrink-0 hide-scrollbar" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                  <>
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide the image and show initials
                        const imgElement = e.currentTarget as HTMLImageElement
                        const container = imgElement.parentElement
                        if (container) {
                          imgElement.style.display = 'none'
                          const fallbackDiv = container.querySelector('.mobile-user-initials') as HTMLElement
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex'
                          }
                        }
                      }}
                      onLoad={(e) => {
                        // Hide initials when image loads
                        const imgElement = e.currentTarget as HTMLImageElement
                        const container = imgElement.parentElement
                        if (container) {
                          const fallbackDiv = container.querySelector('.mobile-user-initials') as HTMLElement
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'none'
                          }
                        }
                      }}
                    />
                    <div
                      className="mobile-user-initials w-full h-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ display: 'none' }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </>
                ) : (
                  <div
                    className="mobile-user-initials w-full h-full flex items-center justify-center text-white font-bold text-sm"
                  >
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{user?.username}</h2>
                {user?.is_premium ? (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex items-center gap-1 w-fit">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-200/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-full border border-gray-300 dark:border-gray-600 w-fit">
                    Free
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  logout()
                  onClose()
                }}
                className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
            <div className="grid grid-cols-5 gap-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeSection === 'overview'
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[9px] leading-tight">Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('content')
                loadSectionData('content')
              }}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'content'
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                }`}
            >
              <div className="relative">
                <Save className="w-4 h-4" />
                {savedContent.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[1rem] h-4 flex items-center justify-center text-[10px]">
                    {savedContent.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] leading-tight">Saved</span>
            </button>

            {canViewApplications ? (
              <button
                onClick={() => {
                  setActiveSection('applications')
                  loadAppliedJobs()
                }}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'applications'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <div className="relative">
                  <Briefcase className="w-4 h-4" />
                  {appliedJobs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[1rem] h-4 flex items-center justify-center text-[10px]">
                      {appliedJobs.length}
                    </span>
                  )}
                </div>
                <span className="text-[9px] leading-tight">Applied</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveSection('history')
                  loadSectionData('history')
                }}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'history'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <div className="relative">
                  <History className="w-4 h-4" />
                  {contentHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[1rem] h-4 flex items-center justify-center text-[10px]">
                      {contentHistory.length}
                    </span>
                  )}
                </div>
                <span className="text-[9px] leading-tight">History</span>
              </button>
            )}

            <button
              onClick={() => setActiveSection('templates')}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'templates'
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                }`}
            >
              <div className="relative">
                <Edit2 className="w-4 h-4" />
                {user?.is_premium && <Crown className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-yellow-500" />}
              </div>
              <span className="text-[9px] leading-tight">Templates</span>
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeSection === 'settings'
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[9px] leading-tight">Settings</span>
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden sm:flex w-80 bg-black border-r border-white/10 p-8 flex-col min-h-0 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />

          {/* User Profile Section */}
          <div className="flex items-center gap-3 mb-10 p-4 bg-white/[0.03] rounded-2xl border border-white/10 relative z-10 group hover:border-cyan-500/40 transition-all duration-500">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center shadow-2xl flex-shrink-0 group-hover:glow-cyan transition-all">
              {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-xl italic uppercase font-mono">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-white truncate uppercase italic tracking-tighter">{user?.username}</h2>
              <div className="flex items-center gap-2 mt-1">
                {user?.is_premium ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-cyan-500/10 text-cyan-500 text-[9px] font-black rounded-full border border-cyan-500/20 uppercase tracking-widest glow-cyan">
                    <ShieldCheck className="w-3 h-3" />
                    PRO MEMBER
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-0.5 bg-white/5 text-slate-500 text-[9px] font-black rounded-full border border-white/5 uppercase tracking-widest">
                    FREE MEMBER
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-2 py-4 relative z-10">
            <div className="space-y-2">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                ...(canViewApplications ? [{ id: 'applications', name: 'Applied Jobs', icon: Briefcase, count: appliedJobs.length, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }] : []),
                { id: 'content', name: 'Saved', icon: Save, count: savedContent.length, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { id: 'history', name: 'History', icon: History, count: contentHistory.length, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { id: 'settings', name: 'Settings', icon: Settings, color: 'text-slate-500', bg: 'bg-white/5' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id)
                    if (item.id === 'content' || item.id === 'history') loadSectionData(item.id)
                    if (item.id === 'applications') loadAppliedJobs()
                  }}
                  className={`w-full group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 relative overflow-hidden ${activeSection === item.id
                    ? 'text-white font-black bg-white/[0.05] shadow-2xl border border-white/10 italic'
                    : 'text-slate-500 hover:text-cyan-400 hover:bg-white/[0.03]'
                    }`}
                >
                  {/* Active Indicator */}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-3 bottom-3 w-1.5 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,1)]"
                    />
                  )}

                  <div className={`p-2.5 rounded-xl transition-all duration-500 ${activeSection === item.id ? item.bg : 'group-hover:bg-white/5'}`}>
                    <item.icon className={`w-5 h-5 ${activeSection === item.id ? item.color + ' glow-cyan' : 'text-slate-600'}`} />
                  </div>

                  <span className="flex-1 text-left text-[11px] tracking-[0.05em] font-black">{item.name}</span>

                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black font-mono ${activeSection === item.id
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'bg-white/5 text-slate-500'}`}>
                      {item.count}
                    </span>
                  )}

                  {item.pro && !user?.is_premium && (
                    <Zap className="w-3.5 h-3.5 text-cyan-500/40" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer - Rank Component (candidates only) */}
          {user?.role !== 'recruiter' && (
            <div className="mx-2 mb-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 relative z-10 group overflow-hidden">
              <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">YOUR RANK</span>
                  <Trophy className="w-4 h-4 text-cyan-500 glow-cyan" />
                </div>
                <div className="text-3xl font-black text-white italic tracking-tighter mb-6 uppercase">
                  {usageStats?.leaderboard_rank || '#---'}
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: usageStats?.leaderboard_rank ? '85%' : '5%' }}
                    className="h-full bg-cyan-500 glow-cyan"
                  />
                </div>
                {!user?.is_premium && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="mt-6 w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-center bg-white text-black rounded-xl hover:bg-cyan-500 transition-all flex items-center justify-center gap-3 hover:glow-cyan italic shadow-2xl"
                  >
                    <Zap className="w-4 h-4" />
                    GO PRO
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => {
              logout()
              onClose()
            }}
            className="flex items-center gap-4 px-6 py-4 text-slate-600 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-500 border border-transparent hover:border-red-500/20 relative z-10 group italic"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">LOG OUT</span>
          </button>
        </div>

        {/* Main Content Area - Responsive Layout */}
        <div className="flex-1 flex flex-col min-h-0 hide-scrollbar bg-black/40 backdrop-blur-3xl relative z-20">
          {/* Header */}
          <div className="hidden sm:flex items-center justify-between p-12 border-b border-white/10">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              {activeSection === 'overview' && 'STATS'}
              {activeSection === 'applications' && 'APPLIED JOBS'}
              {activeSection === 'content' && (
                <span className="flex items-center gap-4">
                  SAVED
                  {savedContent.length > 0 && (
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-xs rounded-lg border border-cyan-500/20 glow-cyan">
                      {getFilteredContent().length} {getFilteredContent().length !== savedContent.length && `/ ${savedContent.length}`}
                    </span>
                  )}
                </span>
              )}
              {activeSection === 'history' && (
                <span className="flex items-center gap-4">
                  HISTORY
                  {contentHistory.length > 0 && (
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-xs rounded-lg border border-cyan-500/20">
                      {contentHistory.length}
                    </span>
                  )}
                </span>
              )}
              {activeSection === 'templates' && 'TEMPLATES'}
              {activeSection === 'settings' && 'SETTINGS'}
            </h1>
            <div className="flex items-center gap-4">
              {/* Refresh Stats/Data Button */}
              {(activeSection === 'overview' || activeSection === 'applications' || activeSection === 'content' || activeSection === 'history') && (
                <button
                  onClick={() => {
                    if (activeSection === 'overview') {
                      loadInitialDataFast()
                    } else if (activeSection === 'applications') {
                      if (user?.id) requestCache.invalidate(`dashboard-applied-jobs-${user.id}`)
                      loadAppliedJobs()
                    } else {
                      // Invalidate cache and reload
                      const cacheKeys: { [key: string]: string } = {
                        'content': `dashboard-saved-content-${user?.id}`,
                        'history': `dashboard-content-history-${user?.id}`,
                        'applications': `dashboard-applied-jobs-${user?.id}`
                      }

                      const key = cacheKeys[activeSection]
                      if (key) {
                        requestCache.invalidate(key)
                        // Clear current data to show loading state
                        if (activeSection === 'content') {
                          setSavedContent([])
                          setIsLoadingContent(true)
                        }
                        if (activeSection === 'history') {
                          setContentHistory([])
                          setIsLoadingHistory(true)
                        }
                        if (activeSection === 'applications') {
                          setAppliedJobs([])
                          setIsLoadingApplications(true)
                        }
                        loadSectionData(activeSection)
                      }
                    }
                  }}
                  className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all hover:glow-cyan border border-white/5"
                  title="Refresh data"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all hover:glow-cyan border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-12 min-h-0 hide-scrollbar"
            data-lenis-prevent
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
          >
            {activeSection === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Welcome Header */}
                <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10 md:p-16">
                  <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                  <div className="absolute top-0 right-0 p-10 opacity-5 scale-150 rotate-12">
                    <Cpu className="w-48 h-48 text-cyan-500" />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                      <div className="inline-flex items-center px-4 py-1.5 bg-cyan-500/10 text-cyan-500 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-cyan-500/20">
                        {user.username}
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Dashboard
                      </h2>
                      <p className="text-slate-500 max-w-lg leading-relaxed text-sm">
                        {user?.is_premium
                          ? 'Pro plan active.'
                          : 'Free plan active. Upgrade for premium features.'
                        }
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {user?.is_premium ? (
                        <div className="p-8 bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] backdrop-blur-sm glow-cyan">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                              <Crown className="w-8 h-8 text-black" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Status</p>
                              <p className="text-2xl font-black text-white italic tracking-tighter uppercase">PRO MEMBER</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push('/pricing')}
                          className="group relative px-10 py-6 bg-white text-black font-black rounded-2xl shadow-4xl transition-all overflow-hidden italic tracking-tighter"
                        >
                          <div className="absolute inset-0 bg-cyan-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                          <div className="relative z-10 flex items-center gap-4 group-hover:text-white transition-colors">
                            <Zap className="w-5 h-5" />
                            <span className="text-lg uppercase">Upgrade</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Main Standing Card */}
                  <div className="md:col-span-8 glass-panel rounded-[2.5rem] p-10 relative overflow-hidden group border border-white/5 bg-white/[0.02]">
                    <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full border-l border-b border-cyan-500/10" />

                    <div className="flex flex-col sm:flex-row items-center gap-12 relative z-10">
                      {/* Rank Indicator */}
                      <div className="relative">
                        <div className="w-48 h-48 rounded-full bg-black border-[6px] border-white/5 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:border-cyan-500/20 transition-all duration-700">
                          <Trophy className="w-10 h-10 text-cyan-500 mb-2 opacity-50 glow-cyan" />
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-5xl font-black text-white italic tracking-tighter"
                          >
                            {usageStats?.leaderboard_rank || '#---'}
                          </motion.span>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/50 mt-2">Rank</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-8">
                        <div>
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Summary</h3>
                          <p className="text-2xl font-black text-white italic tracking-tighter leading-tight uppercase">
                            {user?.role === 'recruiter'
                              ? "Current plan: "
                              : "Current rank: "
                            }
                            <span className="text-cyan-500 glow-cyan">{usageStats?.leaderboard_rank || '#---'}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 font-mono">POSTS</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter uppercase">{usageStats?.total_generations || 0}</p>
                          </div>
                          <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 font-mono">SAVED</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter uppercase">{savedContent.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Start Card */}
                  <div className="md:col-span-4 bg-white text-black rounded-[2.5rem] p-10 shadow-4xl flex flex-col justify-between relative overflow-hidden group hover:bg-cyan-500 transition-all duration-700 cursor-pointer italic" onClick={() => onClose()}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
                      <Target className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center mb-8">
                        <Plus className="w-6 h-6" />
                      </div>
                      <h3 className="text-3xl font-black text-black mb-3 leading-tight uppercase tracking-tighter italic">Go To<br />Recruiter</h3>
                      <p className="text-black/60 text-xs uppercase tracking-widest group-hover:text-black transition-colors">Open talent search.</p>
                    </div>
                    <div className="relative z-10 mt-10 flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em]">
                      <span>Open</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Secondary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Applied Jobs */}
                  <div className="glass-panel rounded-[2.5rem] border border-white/5 bg-white/[0.02] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">APPLIED JOBS</h3>
                      <button
                        onClick={() => { setActiveSection('applications'); loadAppliedJobs(); }}
                        className="text-[10px] font-black text-cyan-500 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        VIEW ALL
                      </button>
                    </div>
                    <div className="divide-y divide-white/5">
                      {isLoadingApplications ? (
                        <div className="p-10 text-center">
                          <LoadingSpinner />
                        </div>
                      ) : appliedJobs.length > 0 ? (
                        appliedJobs.slice(0, 4).map((item) => (
                          <div key={item.application_id} className="p-6 hover:bg-cyan-500/5 transition-all duration-500 group">
                            <div className="flex items-start gap-6">
                              <div className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:glow-cyan group-hover:text-cyan-500 transition-all duration-500 bg-white/[0.03]">
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate mb-2 uppercase italic tracking-tighter">
                                  {item.job?.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                                  <span>{item.job?.company_name}</span>
                                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{item.job?.location || 'Remote'}</span>
                                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                                    item.status === 'hired' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' :
                                    item.status === 'rejected' ? 'border-red-500/40 text-red-400 bg-red-500/10' :
                                    item.status === 'interview' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' :
                                    item.status === 'shortlisted' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                                    'border-slate-500/30 text-slate-300 bg-white/5'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                        )
                      ) : (
                        <div className="p-16 text-center">
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">NO HISTORY YET</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Elite Dashboard Banner */}
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-black border border-white/5 group">
                    <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-4xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 p-12 h-full flex flex-col items-center justify-center text-center space-y-8">
                      <div className="w-20 h-20 glass-panel rounded-[2rem] flex items-center justify-center bg-white/[0.03] group-hover:glow-cyan transition-all duration-700">
                        <Crown className="w-10 h-10 text-cyan-500" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">SCALE UP_</h3>
                        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                          Upgrade to Pro for higher limits and premium features.
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/pricing')}
                        className="px-10 py-5 bg-white text-black font-black rounded-2xl transition-all shadow-4xl flex items-center gap-4 group italic tracking-tighter uppercase"
                      >
                        <Zap className="w-5 h-5 group-hover:text-cyan-500 transition-colors" />
                        Upgrade
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'applications' && (
              <div className="space-y-6">
                {isLoadingApplications ? (
                  <div className="text-center py-20">
                    <LoadingSpinner />
                    <p className="text-slate-500 text-sm mt-4">Loading your applications...</p>
                  </div>
                ) : appliedJobs.length === 0 ? (
                  <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/[0.02]">
                    <Briefcase className="w-10 h-10 mx-auto text-slate-500 mb-4" />
                    <h3 className="text-2xl font-black text-white mb-2">No job applications yet</h3>
                    <p className="text-slate-400 mb-6">Apply to jobs to track your status here.</p>
                    <button
                      onClick={() => {
                        onClose()
                        router.push('/jobs')
                      }}
                      className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appliedJobs.map((item) => (
                      <div key={item.application_id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-xl font-black text-white">{item.job?.title}</p>
                            <p className="text-slate-400 text-sm">{item.job?.company_name} - {item.job?.location || 'Remote'}</p>
                            <p className="text-slate-500 text-xs mt-2">Applied on {new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-lg border text-xs font-black uppercase tracking-widest self-start ${
                            item.status === 'hired' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' :
                            item.status === 'rejected' ? 'border-red-500/40 text-red-400 bg-red-500/10' :
                            item.status === 'interview' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' :
                            item.status === 'shortlisted' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                            'border-slate-500/30 text-slate-300 bg-white/5'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {
              activeSection === 'content' && (
                <div className="space-y-6">
                  {!user?.is_premium ? (
                    <div className="text-center py-16 px-4 border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-[2.5rem] sm:rounded-[3rem] bg-zinc-50 dark:bg-slate-900/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-500/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                        <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 relative z-10" />
                      </div>
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 font-mono truncate px-2">PRO FEATURE</h4>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Premium Vault Access</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-mono text-xs uppercase tracking-wider leading-relaxed mb-8 px-2">
                        Saving posts and syncing history require a Pro plan.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/pricing')}
                        className="relative group w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/30 overflow-hidden flex items-center justify-center gap-3 mx-auto"
                      >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
                        <Sparkles className="w-5 h-5 animate-pulse flex-shrink-0" />
                        <span>Upgrade to Pro</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                      </motion.button>
                    </div>
                  ) : isLoadingContent ? (
                    <div className="text-center py-20">
                      <LoadingSpinner />
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-6">LOADING SAVED POSTS...</p>
                    </div>
                  ) : savedContent.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-[3rem] bg-zinc-50 dark:bg-slate-900/50">
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Save className="w-10 h-10 text-indigo-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">NO SAVED POSTS</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-mono text-xs uppercase tracking-[0.2em] leading-relaxed">
                        No persistent data detected. Start generating and archive your results here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Search and Filter */}
                      <div className="flex flex-col sm:flex-row gap-6 mb-10">
                        <div className="relative flex-1 group">
                          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="text"
                            placeholder="Search saved posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-zinc-100 dark:bg-slate-900/50 border border-zinc-200 dark:border-slate-800 rounded-[1.5rem] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm tracking-tight transition-all"
                          />
                        </div>
                        <div className="flex gap-4">
                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-6 py-4 bg-zinc-100 dark:bg-slate-900/50 border border-zinc-200 dark:border-slate-800 rounded-[1.5rem] text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer hover:border-indigo-500/30"
                          >
                            <option value="all">ALL POSTS</option>
                            <option value="twitter">TWITTER THREADS</option>
                            <option value="auto-generated">AUTO SAVED</option>
                          </select>
                        </div>
                      </div>

                      {/* Content List */}
                      <div className="space-y-4">
                        {/* Bulk Export Options - Only for Pro users */}
                        {user?.is_premium && savedContent.length > 0 && (
                          <div className="bg-slate-900 dark:bg-indigo-500 border border-slate-800 dark:border-indigo-400 rounded-[2rem] p-8 mb-10 relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                              <div>
                                <h4 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-2 font-mono flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  EXPORT ALL
                                </h4>
                                <p className="text-indigo-100/70 text-sm font-bold">Compressing {savedContent.length} X threads for external migration</p>
                              </div>
                              <div className="flex items-center gap-4">
                                {[
                                  { format: 'txt', icon: FileText, label: 'TEXT' },
                                  { format: 'json', icon: Download, label: 'JSON' },
                                  { format: 'csv', icon: Filter, label: 'CSV' }
                                ].map((btn) => (
                                  <button
                                    key={btn.format}
                                    onClick={() => handleBulkExport(btn.format as any)}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 border border-white/10 backdrop-blur-md uppercase font-mono"
                                  >
                                    <btn.icon className="w-3.5 h-3.5" />
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          {getPaginatedContent().map((item, idx) => (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={item.id}
                              className="group bg-zinc-100/50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                                    {item.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border border-indigo-500/20 font-mono">
                                      {(() => {
                                        const type = item.content_type || 'text';
                                        return <Twitter className="w-3.5 h-3.5" />;
                                      })()}
                                      {item.content_type === 'auto-generated' ? 'Auto Saved' : (item.content_type || 'Content').toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest font-mono">
                                      <Clock className="w-3.5 h-3.5 opacity-50" />
                                      {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                    {item.is_favorite && (
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">FAVORITE</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 sm:self-start">
                                  <button
                                    onClick={() => setViewingContent(item)}
                                    className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"
                                    title="View content"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>

                                  {/* Export Dropdown */}
                                  {user?.is_premium && (
                                    <div className="relative group/export">
                                      <button className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all">
                                        <Download className="w-5 h-5" />
                                      </button>
                                      <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all duration-200 z-50 overflow-hidden">
                                        {['TXT', 'JSON', 'CSV'].map((format) => (
                                          <button
                                            key={format}
                                            onClick={() => handleExportContent(item, format.toLowerCase() as any)}
                                            className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex items-center justify-between"
                                          >
                                            {format}
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    onClick={() => handleToggleFavorite(item.id)}
                                    className={`p-2.5 rounded-xl transition-all ${item.is_favorite
                                      ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                                      }`}
                                  >
                                    <Star className={`w-5 h-5 ${item.is_favorite ? 'fill-current' : ''}`} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingContent(item)}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 italic font-serif">
                                "{
                                  item.content_type === 'auto-generated' ? (() => {
                                    try {
                                      const parsed = JSON.parse(item.content);
                                      const text = parsed.original || (Array.isArray(parsed.twitter) ? parsed.twitter[0] : parsed.twitter) || item.content;
                                      return text.substring(0, 180);
                                    } catch (e) { return item.content.substring(0, 180); }
                                  })() : item.content.substring(0, 180)
                                }..."
                              </p>

                              <div className="mt-4 flex items-center justify-end">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.content)
                                    toast.success('Copied!')
                                  }}
                                  className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5"
                                >
                                  <Copy className="w-3 h-3" /> Quick Copy
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={getTotalPages()}
                          onPageChange={setCurrentPage}
                          itemsPerPage={itemsPerPage}
                          totalItems={getFilteredContent().length}
                        />
                      )}
                    </>
                  )}
                </div>
              )
            }

            {
              activeSection === 'history' && (
                <div className="space-y-6">
                  {isLoadingHistory ? (
                    <div className="text-center py-12">
                      <LoadingSpinner />
                      <p className="text-gray-600 dark:text-gray-300 mt-4">Loading content history...</p>
                    </div>
                  ) : contentHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No History</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Your content generation history will appear here
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* History List */}
                      <div className="grid grid-cols-1 gap-6">
                        {getPaginatedHistory().map((item, idx) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={item.id}
                            className="group bg-zinc-100/50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                          >
                            <div className="p-8">
                              <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 duration-500 shadow-inner">
                                    <Twitter className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 font-mono">Generation Event</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {item.processing_time && (
                                    <div className="px-4 py-1.5 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-2">
                                      <Zap className="w-3 h-3 fill-current" />
                                      {item.processing_time}s
                                    </div>
                                  )}
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">DONE</span>
                                </div>
                              </div>

                              <div className="space-y-6">
                                <div className="p-6 bg-zinc-200/50 dark:bg-slate-800/40 rounded-3xl border border-zinc-200 dark:border-white/5 relative group/input overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                                    <Sparkles className="w-24 h-24" />
                                  </div>

                                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 font-mono flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    Original Input
                                  </p>

                                  <div className="space-y-4">
                                    {(() => {
                                      const content = item.original_content || "";
                                      const morningMatch = content.match(/MORNING PLAN:([\s\S]*?)(?=EVENING REFLECTION:|$)/);
                                      const eveningMatch = content.match(/EVENING REFLECTION:([\s\S]*)/);

                                      const morning = morningMatch ? morningMatch[1].trim() : "";
                                      const evening = eveningMatch ? eveningMatch[1].trim() : "";

                                      if (!morning && !evening) return (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                          {content}
                                        </p>
                                      );

                                      return (
                                        <>
                                          {morning && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/80 uppercase tracking-widest font-mono">
                                                <Sun className="w-3 h-3" /> Morning
                                              </div>
                                              <div className="space-y-1.5 pl-5 border-l border-amber-500/20">
                                                {morning.split('\n').map((line, i) => {
                                                  const isCompleted = line.startsWith('[x]');
                                                  const isUncompleted = line.startsWith('[ ]');
                                                  if (isCompleted || isUncompleted) {
                                                    const text = line.substring(3).trim();
                                                    return (
                                                      <div key={i} className="flex items-center gap-2 group/task">
                                                        {isCompleted ? (
                                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        ) : (
                                                          <div className="w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-slate-600 shrink-0" />
                                                        )}
                                                        <span className={`text-sm ${isCompleted ? 'text-slate-400 line-through font-medium' : 'text-slate-700 dark:text-slate-300 font-bold'}`}>
                                                          {text}
                                                        </span>
                                                      </div>
                                                    );
                                                  }
                                                  return (
                                                    <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                                                      {line}
                                                    </p>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          {evening && (
                                            <div className="space-y-2 pt-2">
                                              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400/80 uppercase tracking-widest font-mono">
                                                <Moon className="w-3 h-3" /> Evening
                                              </div>
                                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-bold pl-5 border-l border-indigo-500/20">
                                                {evening}
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {item.twitter_thread && (
                                  <div className="relative p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 group/result">
                                    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                      <Twitter className="w-8 h-8 text-indigo-500" />
                                    </div>
                                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 font-mono flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                      X Thread
                                    </p>

                                    <div className="space-y-3">
                                      {(() => {
                                        let parts = [];
                                        const rawThread = item.twitter_thread;
                                        try {
                                          if (Array.isArray(rawThread)) {
                                            parts = rawThread;
                                          } else if (typeof rawThread === 'string' && rawThread.trim()) {
                                            const trimmed = rawThread.trim();
                                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                              parts = JSON.parse(trimmed);
                                            } else {
                                              parts = [trimmed];
                                            }
                                          }
                                        } catch (e) {
                                          parts = rawThread ? [String(rawThread)] : [];
                                        }

                                        return (parts || []).slice(0, 2).map((part: any, pIdx: number) => (
                                          <p key={pIdx} className="text-sm text-slate-800 dark:text-slate-200 font-bold leading-relaxed line-clamp-2">
                                            {typeof part === 'string' ? part : JSON.stringify(part)}
                                          </p>
                                        ));
                                      })()}
                                      {item.twitter_thread && String(item.twitter_thread).length > 200 && (
                                        <div className="pt-2 flex items-center gap-1.5 text-indigo-500/60 font-black text-[10px] uppercase tracking-widest">
                                          <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                          <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                          <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                          Additional Content Synthesized
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="px-8 py-5 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between group/footer">
                              <div className="flex gap-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingContent(item as any);
                                  }}
                                  className="text-[11px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" /> Expand
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const platforms = [];
                                    if (item.twitter_thread) platforms.push(item.twitter_thread);

                                    let finalPayload = "";
                                    platforms.forEach((p, idx) => {
                                      let text = p;
                                      try {
                                        if (Array.isArray(p)) {
                                          text = p.join('\n\n');
                                        } else if (typeof p === 'string' && p.startsWith('[')) {
                                          const parsed = JSON.parse(p);
                                          if (Array.isArray(parsed)) text = parsed.join('\n\n');
                                        }
                                      } catch (e) { }
                                      finalPayload += (idx > 0 ? '\n\n---\n\n' : '') + text;
                                    });

                                    if (finalPayload) {
                                      navigator.clipboard.writeText(finalPayload);
                                      toast.success('Generated text copied!');
                                    } else {
                                      toast.error('No generated text to copy');
                                    }
                                  }}
                                  className="text-[11px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                                >
                                  <Copy className="w-4 h-4" /> Copy
                                </button>
                              </div>
                              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all duration-500" />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {getHistoryTotalPages() > 1 && (
                        <Pagination
                          currentPage={historyPage}
                          totalPages={getHistoryTotalPages()}
                          onPageChange={setHistoryPage}
                          itemsPerPage={historyPerPage}
                          totalItems={contentHistory.length}
                        />
                      )}
                    </>
                  )}
                </div>
              )
            }

            {
              activeSection === 'templates' && (
                <div>
                  {!user?.is_premium ? (
                    <div className="text-center py-16 px-4 bg-white/5 dark:bg-slate-900 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] sm:rounded-[3.5rem] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-500/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                        <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 relative z-10" />
                      </div>
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 font-mono truncate px-2">PRO REQUIRED</h4>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Enterprise Templates</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-mono text-xs uppercase tracking-wider leading-relaxed mb-8 px-2">
                        Custom blueprint generation and template architecture require an active Pro License.
                      </p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 mx-auto active:scale-95"
                      >
                        <Zap className="w-4 h-4 fill-current flex-shrink-0" />
                        Acquire Pro License
                      </button>
                    </div>
                  ) : (
                    <CustomTemplateManager />
                  )}
                </div>
              )
            }

            {
              activeSection === 'settings' && (
                <div className="space-y-8">
                  {/* Account Information */}
                  <div className="bg-white/50 dark:bg-slate-900/50 border border-zinc-200 dark:border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                      <Settings className="w-24 h-24" />
                    </div>

                    <div className="flex flex-wrap items-start gap-4 justify-between mb-8 sm:mb-10 relative z-10">
                      <div className="min-w-0">
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 font-mono truncate">YOUR PROFILE</h4>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Profile Configuration</h3>
                      </div>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95 flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={handleUpdateProfile}
                            disabled={isSavingProfile}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex-shrink-0"
                          >
                            <Check className="w-3 h-3" />
                            {isSavingProfile ? 'SAVING...' : 'SAVE'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingProfile}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 active:scale-95 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                            CANCEL
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-10 relative z-10">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-4 sm:p-8 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem]">
                        <div className="relative">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl relative">
                            {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                              <>
                                <img
                                  src={user.profile_picture}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const imgElement = e.currentTarget as HTMLImageElement
                                    const container = imgElement.parentElement
                                    if (container) {
                                      imgElement.style.display = 'none'
                                      const fallbackDiv = container.querySelector('.profile-initials') as HTMLElement
                                      if (fallbackDiv) fallbackDiv.style.display = 'flex'
                                    }
                                  }}
                                />
                                <div className="profile-initials w-full h-full flex items-center justify-center text-white font-black text-3xl font-mono" style={{ display: 'none' }}>
                                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              </>
                            ) : (
                              <div className="profile-initials w-full h-full flex items-center justify-center text-white font-black text-3xl font-mono">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          {isEditingProfile && (
                            <button
                              onClick={() => {
                                setShowProfilePictureModal(true)
                                setSelectedFile(null)
                                setPreviewUrl('')
                              }}
                              className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl transition-all border-4 border-white dark:border-slate-900"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">{user?.username}</h4>
                          <p className="text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-widest">
                            UID: {user?.id?.toString().substring(0, 8).toUpperCase() || "PENDING"}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                            {user?.is_premium ? (
                              <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-mono">
                                PRO ACTIVE
                              </div>
                            ) : (
                              <div className="px-3 py-1 bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-mono">
                                FREE PLAN
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">USERNAME</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editedUsername}
                              onChange={(e) => setEditedUsername(e.target.value)}
                              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm"
                              placeholder="Enter unique identifier..."
                            />
                          ) : (
                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 rounded-xl sm:rounded-2xl text-slate-600 dark:text-slate-300 font-mono text-sm italic">
                              {user?.username}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">DISPLAY NAME</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editedFullName}
                              onChange={(e) => setEditedFullName(e.target.value)}
                              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm"
                              placeholder="Enter full name..."
                            />
                          ) : (
                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 rounded-xl sm:rounded-2xl text-slate-600 dark:text-slate-300 font-mono text-sm italic">
                              {user?.full_name || 'Not set'}
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">EMAIL ADDRESS</label>
                          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-zinc-100/50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/5 rounded-xl sm:rounded-2xl text-slate-400 font-mono text-xs sm:text-sm flex items-center justify-between gap-2 overflow-hidden">
                            {user?.email}
                            <div className="flex items-center gap-2 text-[9px] font-black opacity-40">
                              <Check className="w-3 h-3" /> VERIFIED
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-white/50 dark:bg-slate-900/50 border border-zinc-200 dark:border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 backdrop-blur-sm relative overflow-hidden group">
                    <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6 font-mono">APP SETTINGS</h3>
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 justify-between p-4 sm:p-6 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[1.5rem]">
                        <div className="min-w-0 flex-1">
                          <label className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight block truncate">AUTO SAVE</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-wider truncate">
                            {user?.is_premium
                              ? 'SAVE HISTORY'
                              : 'PRO REQUIRED'
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!user?.is_premium) {
                              toast.error('This feature requires a Pro plan.')
                              return
                            }
                            setAutoSaveEnabled(!autoSaveEnabled)
                          }}
                          disabled={!user?.is_premium}
                          className={`flex-shrink-0 relative inline-flex h-8 w-14 items-center rounded-2xl transition-all ${!user?.is_premium
                            ? 'bg-zinc-200 dark:bg-slate-800 cursor-not-allowed opacity-30 shadow-inner'
                            : autoSaveEnabled ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-zinc-300 dark:bg-slate-800'
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-xl bg-white transition-transform duration-300 shadow-md ${user?.is_premium && autoSaveEnabled ? 'translate-x-7' : 'translate-x-2'
                              }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 justify-between p-4 sm:p-6 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[1.5rem]">
                        <div className="min-w-0 flex-1">
                          <label className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight block truncate">EMAIL UPDATES</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-wider truncate">Updates sent by email</p>
                        </div>
                        <button
                          onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                          className={`flex-shrink-0 relative inline-flex h-8 w-14 items-center rounded-2xl transition-all ${emailNotificationsEnabled ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-zinc-300 dark:bg-slate-800'
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-xl bg-white transition-transform duration-300 shadow-md ${emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-2'
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          </div>

          <AnimatePresence>
            {viewingContent && (
              <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setViewingContent(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col group/modal"
                >
                  {/* Modal Header */}
                  <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate pr-6 tracking-tight">
                        {(viewingContent as any).title || "Log"}
                      </h3>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 font-mono">
                          <Twitter className="w-3.5 h-3.5" />
                          {(() => {
                            const type = (viewingContent as any).content_type || 'history';
                            if (type === 'auto-generated') return 'Auto-saved';
                            if (type === 'history') return 'Log';
                            return `${type.toUpperCase()}_Thread`;
                          })()}
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {new Date(viewingContent.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(viewingContent as any).id && (
                        <button
                          onClick={() => handleToggleFavorite((viewingContent as any).id)}
                          className={`p-3 rounded-2xl transition-all duration-300 ${(viewingContent as any).is_favorite
                            ? 'text-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                            }`}
                        >
                          <Star className={`w-6 h-6 ${(viewingContent as any).is_favorite ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={() => setViewingContent(null)}
                        className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-900/50">
                    <div className="space-y-10">
                      {(viewingContent as any).original_content && (
                        <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            INPUT DATA
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(() => {
                              let content = (viewingContent as any).original_content || "";
                              const morningMatch = content.match(/MORNING PLAN:([\s\S]*?)(?=EVENING REFLECTION:|$)/);
                              const eveningMatch = content.match(/EVENING REFLECTION:([\s\S]*)/);
                              const morning = morningMatch ? morningMatch[1].trim() : "";
                              const evening = eveningMatch ? eveningMatch[1].trim() : "";
                              if (!morning && !evening) return (
                                <div className="col-span-2 p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm italic text-slate-600 dark:text-slate-400 leading-relaxed">
                                  "{content}"
                                </div>
                              );
                              return (
                                <>
                                  {morning && (
                                    <div className="p-8 bg-gradient-to-br from-amber-500/[0.03] to-amber-600/[0.05] dark:from-amber-500/[0.05] dark:to-transparent border border-amber-500/20 rounded-[2.5rem] relative overflow-hidden">
                                      <p className="text-[11px] font-black text-amber-600/60 uppercase tracking-[0.3em] mb-6 font-mono flex items-center gap-2">
                                        <Sun className="w-3.5 h-3.5" /> MORNING GOALS
                                      </p>
                                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 italic">"{morning}"</p>
                                    </div>
                                  )}
                                  {evening && (
                                    <div className="p-8 bg-gradient-to-br from-indigo-500/[0.03] to-indigo-600/[0.05] dark:from-indigo-500/[0.05] dark:to-transparent border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden">
                                      <p className="text-[11px] font-black text-indigo-600/60 uppercase tracking-[0.3em] mb-6 font-mono flex items-center gap-2">
                                        <Moon className="w-3.5 h-3.5" /> EVENING REFLECTION
                                      </p>
                                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 italic">"{evening}"</p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
                          GENERATED POSTS
                        </h4>
                        <div className="space-y-12">
                          {(() => {
                            const v = viewingContent as any;
                            const platforms = [];
                            if (v.content_type === 'auto-generated') {
                              try {
                                const parsed = JSON.parse(v.content);
                                if (parsed.twitter) platforms.push({ id: 'twitter_auto', title: 'X Thread', data: parsed.twitter, type: 'twitter' });
                              } catch (e) {
                                platforms.push({ id: 'legacy', title: 'Auto-saved Content', data: v.content, type: 'text' });
                              }
                            } else if (v.content) {
                              platforms.push({ id: 'legacy', title: 'Content', data: v.content, type: v.content_type || 'text' });
                            }
                            if (v.twitter_thread) platforms.push({ id: 'twitter', title: 'X Thread', data: v.twitter_thread, type: 'twitter' });
                            const uniquePlatforms = platforms.filter((p, index, self) => index === self.findIndex((t) => t.data === p.data));
                            if (uniquePlatforms.length === 0) return <div className="p-8 text-center text-slate-400 font-mono text-xs">NO DATA FOUND</div>;
                            return uniquePlatforms.map((platform) => {
                              let parts = [];
                              try {
                                if (Array.isArray(platform.data)) parts = platform.data;
                                else if (typeof platform.data === 'string' && platform.data.trim()) {
                                  const trimmed = platform.data.trim();
                                  parts = (trimmed.startsWith('[') && trimmed.endsWith(']')) ? JSON.parse(trimmed) : trimmed.split('\n\n').filter((p: string) => p.trim());
                                }
                              } catch (e) { parts = platform.data ? [String(platform.data)] : []; }
                              return (
                                <div key={platform.id} className="space-y-6">
                                  <div className="flex items-center gap-3">
                                    {platform.type === 'twitter' && <Twitter className="w-4 h-4 text-indigo-500" />}
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{platform.title}</span>
                                  </div>
                                  <div className="space-y-6">
                                    {parts.map((part: string, idx: number) => (
                                      <div key={idx} className="group/part relative">
                                        <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-indigo-500/20 group-hover/part:bg-indigo-500 transition-colors" />
                                        <div className="p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-md hover:shadow-xl transition-all relative">
                                          <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-300 font-mono">#{idx + 1}</div>
                                          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{part}</p>
                                          <button
                                            onClick={() => { navigator.clipboard.writeText(part); toast.success(`Copied part #${idx + 1}!`); }}
                                            className="mt-6 flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover/part:opacity-100 transition-opacity"
                                          >
                                            <Copy className="w-3.5 h-3.5" /> COPY PART
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <button
                        onClick={() => {
                          const v = viewingContent as any;
                          const outputs = [];
                          if (v.content_type === 'auto-generated') {
                            try {
                              const parsed = JSON.parse(v.content);
                              if (parsed.twitter) outputs.push(parsed.twitter);
                              if (parsed.linkedin) outputs.push(parsed.linkedin);
                            } catch (e) { outputs.push(v.content); }
                          } else if (v.content) outputs.push(v.content);
                          if (v.twitter_thread) outputs.push(v.twitter_thread);
                          const uniqueOutputs = Array.from(new Set(outputs));
                          let finalPayload = "";
                          uniqueOutputs.forEach((out, idx) => {
                            let text = out;
                            try { if (Array.isArray(out)) text = out.join('\n\n'); } catch (e) { }
                            finalPayload += (idx > 0 ? '\n\n---\n\n' : '') + text;
                          });
                          if (finalPayload) { navigator.clipboard.writeText(finalPayload); toast.success('Everything copied!'); }
                          else toast.error('Nothing to copy');
                        }}
                        className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-2xl"
                      >
                        <Copy className="w-5 h-5" /> COPY ALL
                      </button>

                      {(viewingContent as any).id && user?.is_premium && (
                        <div className="flex items-center gap-3">
                          {[
                            { format: 'txt', icon: FileText, label: 'TXT' },
                            { format: 'json', icon: Download, label: 'JSON' }
                          ].map((btn) => (
                            <button
                              key={btn.format}
                              onClick={() => handleExportContent(viewingContent as any, btn.format as any)}
                              className="p-3.5 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-2xl transition-all border border-slate-100 dark:border-white/5"
                              title={`Export as ${btn.label}`}
                            >
                              <btn.icon className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {deletingContent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[1100]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Trash2 className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">ARE YOU SURE?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">Permanently remove <span className="font-bold">"{deletingContent.title}"</span>?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeletingContent(null)} className="flex-1 px-4 py-3.5 bg-zinc-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase">Cancel</button>
                    <button onClick={() => handleDeleteContent(deletingContent.id)} className="flex-1 px-4 py-3.5 bg-red-500 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg">DELETE</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {showProfilePictureModal && !showImageEditor && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[1100]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 font-mono">AVATAR EDITOR</h4>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">UPDATE PICTURE</h3>
                    </div>
                    <button onClick={() => setShowProfilePictureModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-6">
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="profile-picture-upload" />
                    <label htmlFor="profile-picture-upload" className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-all hover:border-indigo-500/50">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Click to upload or drag & drop<br /><span className="text-[10px] font-mono text-slate-400">PNG, JPG, GIF (MAX 5MB)</span></p>
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setEditedProfilePicture(''); setShowProfilePictureModal(false); handleImageUpload(''); }} className="flex-1 px-4 py-3.5 bg-zinc-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase">Remove</button>
                      <button onClick={() => setShowProfilePictureModal(false)} className="flex-1 px-4 py-3.5 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Done</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          <ImageEditor
            imageUrl={previewUrl}
            isOpen={showImageEditor}
            onSave={handleImageCrop}
            onCancel={() => { setShowImageEditor(false); setSelectedFile(null); setPreviewUrl(''); }}
          />

          {showCancelModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[1100]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <LogOut className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">CANCEL PRO</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">Are you sure you want to cancel your <span className="font-bold">Pro License</span>?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCancelModal(false)} disabled={cancelLoading} className="flex-1 px-4 py-3.5 bg-zinc-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase">GO BACK</button>
                    <button onClick={handleCancelSubscription} disabled={cancelLoading} className="flex-1 px-4 py-3.5 bg-red-500 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg disabled:opacity-50">{cancelLoading ? 'SAVING...' : 'CONFIRM CANCEL'}</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
