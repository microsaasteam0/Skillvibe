'use client'

import React, { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { 
  User, Settings, History, Heart, BarChart3, Crown, 
  LogOut, Save, Trash2, Star, Download, Eye, Filter, 
  Edit2, Check, X, FileText, Copy, RefreshCw, Zap, 
  TrendingUp, Clock, Sparkles, ArrowRight, Twitter, 
  Plus, Sun, Moon, CheckCircle, Trophy, ShieldCheck, 
  Cpu, Target, Terminal, Briefcase, MapPin, Quote, Dna 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import { FormattedText } from './FormattedText'
import LoadingSpinner from './LoadingSpinner'
import ImageEditor from './ImageEditor'
import { requestCache } from '../lib/cache-util'
import { API_URL } from '../lib/api-config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface UsageStats {
  total_generations: number
  recent_generations: number
  rate_limit: number
  remaining_requests: number
  is_premium: boolean
  leaderboard_rank?: string
  trust_score?: number
  elite_rating?: number
  ranking_score?: number
  verification_stage?: number
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

interface VibeNote {
  author_name: string
  author_role: string
  content: string
  vibe_type: string
  created_at: string
}

interface DashboardModalProps {
  isOpen: boolean
  onClose: () => void
  externalUsageStats?: UsageStats | null
}

export default function DashboardModal({ isOpen, onClose, externalUsageStats }: DashboardModalProps) {
  const { user, logout, updateUser, refreshUser } = useAuth()
  const featureGate = useFeatureGate()
  const router = useRouter()
  const { autoSaveEnabled, setAutoSaveEnabled, emailNotificationsEnabled, setEmailNotificationsEnabled } = useUserPreferences()

  // State management
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [usageStats, setUsageStats] = useState<UsageStats | null>(externalUsageStats || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  const [myVibeNotes, setMyVibeNotes] = useState<VibeNote[]>([])
  const [isLoadingVibeNotes, setIsLoadingVibeNotes] = useState(false)

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
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const canViewApplications = user?.role === 'candidate' || user?.role === 'admin'

  useEffect(() => {
    setMounted(true)
  }, [])

  useScrollLock(isOpen)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      refreshUser()
      loadUsageStats()
      if (canViewApplications) {
        loadAppliedJobs()
      }
      if (user.role !== 'recruiter') {
        loadVibeNotes()
      }

      setEditedUsername(user.username || '')
      setEditedFullName(user.full_name || '')
      setEditedProfilePicture(user.profile_picture || '')
    }
  }, [isOpen, user, canViewApplications])

  const loadUsageStats = async () => {
    try {
      if (externalUsageStats) {
        setUsageStats(externalUsageStats)
        return
      }

      const cacheKey = `usage-stats-${user?.id}`
      const stats = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/auth/usage-stats`, { timeout: 10000 })
          return response.data
        },
        60 * 1000
      )
      setUsageStats(stats)
    } catch (error) {
      console.error('Error loading usage stats:', error)
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
          const response = await axios.get(`${API_URL}/api/v1/jobs/candidate/me`, { timeout: 15000 })
          return response.data || []
        },
        30 * 1000
      )
      setAppliedJobs(jobs)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const loadVibeNotes = async () => {
    if (user?.role === 'recruiter') return
    setIsLoadingVibeNotes(true)
    try {
      const response = await axios.get(`${API_URL}/api/v1/skillvibe/vibe-notes/me`, { timeout: 15000 })
      setMyVibeNotes(response.data || [])
    } catch (error) {
      console.error('Error loading vibe notes:', error)
    } finally {
      setIsLoadingVibeNotes(false)
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
        updateUser({
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        })
        setIsEditingProfile(false)
        toast.success('Profile updated successfully')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
        setShowImageEditor(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageCrop = async (canvas: HTMLCanvasElement) => {
    canvas.toBlob(async (blob) => {
      if (blob) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const base64 = e.target?.result as string
          setEditedProfilePicture(base64)
          setShowImageEditor(false)
          setShowProfilePictureModal(false)
          
          // Auto-save
          try {
            setIsUploading(true)
            await axios.put(`${API_URL}/api/v1/auth/profile`, { profile_picture: base64 })
            updateUser({ profile_picture: base64 })
            toast.success('Profile picture updated')
          } catch (error) {
            toast.error('Failed to save picture')
          } finally {
            setIsUploading(false)
          }
        }
        reader.readAsDataURL(blob)
      }
    }, 'image/jpeg', 0.8)
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/v1/payment/cancel`)
      if (response.data.success) {
        updateUser({ is_premium: false })
        await featureGate.refreshLimits()
        loadUsageStats()
        toast.success('Subscription cancelled')
        setShowCancelModal(false)
      } else {
        toast.error(response.data.message || 'Could not cancel')
      }
    } catch (error) {
      toast.error('Cancellation failed')
    } finally {
      setCancelLoading(false)
    }
  }

  const isValidImageUrl = (url: string) => {
    if (!url) return false
    return url.startsWith('data:image/') || url.startsWith('http')
  }

  if (!mounted) return null

  const modalElement = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full h-full max-w-7xl bg-slate-950/50 sm:h-[90vh] sm:rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row"
          >
            {/* Sidebar */}
            <div className="w-full lg:w-96 border-r border-white/5 bg-slate-900/40 p-10 flex flex-col relative z-30 overflow-y-auto">
              <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">DASHBOARD</h2>
                  <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest font-mono">Vibe Protocol v4.0</p>
                </div>
              </div>

              <nav className="space-y-3 flex-1">
                {[
                  { id: 'overview', name: 'Overview', icon: BarChart3, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                  ...(canViewApplications ? [{ id: 'applications', name: 'Applied Jobs', icon: Briefcase, count: appliedJobs.length, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }] : []),
                  { id: 'settings', name: 'Settings', icon: Settings, color: 'text-slate-500', bg: 'bg-white/5' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-500 border border-transparent group relative ${
                      activeSection === item.id 
                        ? 'bg-white/10 border-white/10 text-white shadow-xl translate-x-1' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all duration-500 ${activeSection === item.id ? item.bg : 'group-hover:bg-white/5'}`}>
                      <item.icon className={`w-5 h-5 ${activeSection === item.id ? item.color + ' glow-cyan' : ''}`} />
                    </div>
                    <span className="flex-1 text-left text-[11px] font-black uppercase tracking-[0.2em]">{item.name}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black font-mono">{item.count}</span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-12 space-y-4">
                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-white/[0.03]">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 font-mono">Vibe Status</p>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                    <span className={`text-xs font-black uppercase tracking-widest italic ${
                      (usageStats?.verification_stage === 3 || (usageStats?.ranking_score || 0) >= 86) ? 'text-purple-400' :
                      (usageStats?.verification_stage === 2 || (usageStats?.ranking_score || 0) >= 51) ? 'text-cyan-400' :
                      'text-emerald-400'
                    }`}>
                      {(usageStats?.verification_stage === 3 || (usageStats?.ranking_score || 0) >= 86) ? 'TITAN STAGE' :
                       (usageStats?.verification_stage === 2 || (usageStats?.ranking_score || 0) >= 51) ? 'PILLAR STAGE' :
                       'SEED STAGE'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center justify-center gap-4 px-6 py-4 text-slate-600 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20 italic"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">LOG OUT</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-black/40 backdrop-blur-3xl relative z-20 p-8 sm:p-12">
              <div className="max-w-5xl mx-auto space-y-12">
                {activeSection === 'overview' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                     {/* Stats Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-white text-black rounded-[2.5rem] p-10 relative overflow-hidden italic shadow-2xl">
                        <Trophy className="absolute top-10 right-10 w-20 h-20 opacity-5" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-40 italic">Global Rank</p>
                        <h4 className="text-8xl font-black italic tracking-tighter uppercase">{(usageStats?.leaderboard_rank && usageStats.leaderboard_rank !== "0") ? usageStats.leaderboard_rank : '#---'}</h4>
                        <div className="mt-8 flex items-center gap-3 font-black text-[9px] uppercase tracking-widest">
                           <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                           <span>Live Placement</span>
                        </div>
                      </div>

                      <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 bg-white/[0.03] group hover:border-cyan-500/30 transition-all shadow-xl">
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-8 font-mono italic">ELITE PROWESS</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-8xl font-black text-white italic tracking-tighter uppercase">{Math.round(usageStats?.ranking_score || 0)}</span>
                          <span className="text-2xl font-black text-white/20 italic">%</span>
                        </div>
                        <div className="mt-8 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(usageStats?.ranking_score || 0)}%` }}
                            className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                          />
                        </div>
                      </div>

                      <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 bg-white/[0.03] group hover:border-indigo-500/30 transition-all shadow-xl">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-8 font-mono italic">TRUST SCORE</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-8xl font-black text-white italic tracking-tighter uppercase">{Math.round(usageStats?.trust_score || (usageStats?.ranking_score || 0) * 0.8)}</span>
                          <span className="text-2xl font-black text-white/20 italic font-mono uppercase">V.S</span>
                        </div>
                        <div className="mt-8 flex items-center gap-3">
                           <div className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Vibe Certified</div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Vibe Notes Panel */}
                    {user?.role !== 'recruiter' && (
                      <div className="glass-panel rounded-[3rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 italic">
                              <Sparkles className="w-4 h-4 text-cyan-500" />
                              RECENT VIBE NOTES
                            </h3>
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-2">Direct endorsements from verified peers</p>
                          </div>
                          <div className="px-5 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 font-black text-[10px] uppercase tracking-widest glow-cyan">
                            {myVibeNotes.length} SIGNALS
                          </div>
                        </div>
                        <div className="p-10">
                          {isLoadingVibeNotes ? (
                            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                          ) : myVibeNotes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {myVibeNotes.slice(0, 6).map((note, idx) => (
                                <div key={idx} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all duration-500 group relative shadow-lg">
                                  <Quote className="absolute top-8 right-8 w-12 h-12 text-white/5 group-hover:text-cyan-500/10 transition-colors" />
                                  <div className="flex items-center gap-5 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-base font-black text-white border border-white/5 shadow-inner">
                                      {note.author_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-base font-black text-white truncate uppercase italic tracking-tighter">{note.author_name}</p>
                                      <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mt-1">{note.author_role}</p>
                                    </div>
                                  </div>
                                  <div className="text-slate-300 text-sm leading-relaxed italic font-medium relative">
                                    <FormattedText text={`"${note.content}"`} className="inline" />
                                  </div>
                                  <div className="mt-8 flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                                      {note.vibe_type}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-24 text-center">
                              <Dna className="w-12 h-12 text-white/5 mx-auto mb-6" />
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">NO VIBE SIGNALS DETECTED</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'applications' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">APPLICATIONS</h3>
                    </div>
                    {isLoadingApplications ? (
                      <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : appliedJobs.length === 0 ? (
                      <div className="text-center py-24 bg-white/[0.02] border border-white/10 rounded-[3rem]">
                        <Briefcase className="w-12 h-12 text-white/5 mx-auto mb-6" />
                        <h4 className="text-xl font-black text-white mb-2 italic">NO ACTIVE APPLICATIONS</h4>
                        <p className="text-slate-500 mb-8">Ready to build your career legacy?</p>
                        <button onClick={() => { onClose(); router.push('/jobs'); }} className="px-8 py-4 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl">Browse Elite Jobs</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appliedJobs.map((job) => (
                          <div key={job.application_id} className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div>
                               <h4 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-cyan-500 transition-colors">{job.job.title}</h4>
                               <p className="text-slate-400 text-sm mt-1">{job.job.company_name} • {job.job.location || 'Remote'}</p>
                               <div className="mt-4 flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                  <Clock className="w-3 h-3" />
                                  <span>Applied {new Date(job.created_at).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              job.status === 'hired' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              job.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                              'bg-white/5 border-white/10 text-slate-300'
                            }`}>
                              {job.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'settings' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                    <div className="glass-panel p-12 rounded-[4rem] border border-white/10 bg-white/[0.02] relative overflow-hidden group">
                      <Settings className="absolute top-10 right-10 w-32 h-32 text-white/5 group-hover:rotate-45 transition-transform duration-1000" />
                      
                      <div className="relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-8 mb-12">
                          <div>
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-3 italic">IDENTITY SYSTEMS</p>
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Profile Configuration</h3>
                          </div>
                          <div className="flex gap-3">
                            {!isEditingProfile ? (
                              <button onClick={() => setIsEditingProfile(true)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all">Edit ID</button>
                            ) : (
                              <>
                                <button onClick={handleUpdateProfile} disabled={isSavingProfile} className="px-6 py-3 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg glow-cyan">{isSavingProfile ? 'Saving...' : 'Confirm'}</button>
                                <button onClick={() => setIsEditingProfile(false)} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Cancel</button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center gap-6">
                            <div className="relative group/avatar cursor-pointer" onClick={() => setShowProfilePictureModal(true)}>
                              <div className="w-40 h-40 rounded-[3rem] overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center relative shadow-inner">
                                {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                                  <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                                ) : (
                                  <User className="w-12 h-12 text-white/20" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            </div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Identity Matrix</p>
                          </div>

                          <div className="md:col-span-8 lg:col-span-9 space-y-8">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Codename / Username</label>
                                   <input 
                                      disabled={!isEditingProfile}
                                      value={editedUsername}
                                      onChange={(e) => setEditedUsername(e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clear Name / Legal Name</label>
                                   <input 
                                      disabled={!isEditingProfile}
                                      value={editedFullName}
                                      onChange={(e) => setEditedFullName(e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                                   />
                                </div>
                             </div>
                             
                             <div className="pt-8 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                   <div>
                                      <p className="text-white font-black uppercase text-xs tracking-widest italic">Experience Architecture</p>
                                      <p className="text-slate-500 text-[10px] uppercase font-mono mt-1">Refine your protocol interactions</p>
                                   </div>
                                   <div className="flex gap-4">
                                      <button className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-cyan-500/10 transition-all group">
                                         <Zap className="w-4 h-4 text-slate-600 group-hover:text-cyan-500" />
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Card */}
                    <div className="glass-panel p-12 rounded-[4rem] border border-white/10 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative group overflow-hidden">
                       <Crown className="absolute top-10 right-10 w-24 h-24 text-indigo-500/10 group-hover:scale-110 transition-transform duration-1000" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 ">
                             <Zap className="w-10 h-10 text-indigo-500 glow-indigo" />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                             <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Protocol Access: {user?.is_premium ? 'Elite Pro' : 'Free Neural'}</h4>
                             <p className="text-slate-500 text-sm italic font-medium">Your current license determines your processing capabilities and ranking influence.</p>
                          </div>
                          <div className="flex flex-col gap-3 min-w-[200px]">
                             {user?.is_premium ? (
                                <button onClick={() => setShowCancelModal(true)} className="w-full px-8 py-4 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-2xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest">Terminate License</button>
                             ) : (
                                <button onClick={() => router.push('/pricing')} className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Acquire Pro License</button>
                             )
                             }
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Close Button UI - Top Right */}
            <button
               onClick={onClose}
               className="absolute top-12 right-12 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center transition-all z-50 group active:scale-90"
            >
               <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalElement, document.body)
}

function Camera(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}
