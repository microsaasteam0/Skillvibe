'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Upload, ArrowRight, User, Settings, Edit2, Check, Eye, EyeOff, Globe, Lock, Shield, Zap, Activity, Cpu, Terminal, Radio, Network } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import toast from 'react-hot-toast'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal'

export default function ProfileRedirectPage() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'no-profile' | 'ready' | 'not-authenticated'>('loading')
    const [slug, setSlug] = useState<string | null>(null)
    const [isPublic, setIsPublic] = useState(true)
    const [isEditingSlug, setIsEditingSlug] = useState(false)
    const [newSlug, setNewSlug] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [showDashboard, setShowDashboard] = useState(false)

    useEffect(() => {
        if (isLoading) return

        if (!isAuthenticated || !user) {
            setStatus('not-authenticated')
            return
        }

        const fetchMyProfile = async () => {
            try {
                const response = await requestCache.get('my-profile-slug', async () => {
                    const res = await axios.get(`${API_URL}/api/v1/skillvibe/my-profile`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    })
                    return res.data
                }, 60000)

                if (response?.slug) {
                    setSlug(response.slug)
                    setNewSlug(response.slug)
                    setIsPublic(response.is_public ?? true)
                    setStatus('ready')
                }
            } catch (error: any) {
                if (error.response?.status === 404) {
                    setStatus('no-profile')
                } else {
                    toast.error('Could not load your profile. Please try again.')
                    setStatus('no-profile')
                }
            }
        }

        fetchMyProfile()
    }, [isAuthenticated, user, isLoading])

    const updateSettings = async (updates: any) => {
        setIsUpdating(true)
        try {
            const token = localStorage.getItem('access_token')
            const response = await axios.patch(`${API_URL}/api/v1/skillvibe/profile/settings`, updates, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.data.slug) setSlug(response.data.slug)
            if (response.data.hasOwnProperty('is_public')) setIsPublic(response.data.is_public)

            requestCache.invalidate('my-profile-slug')
            toast.success('Settings saved!')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save settings. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    const toggleVisibility = () => {
        updateSettings({ is_public: !isPublic })
    }

    const saveSlug = () => {
        if (!newSlug.trim() || newSlug === slug) {
            setIsEditingSlug(false)
            return
        }
        updateSettings({ slug: newSlug })
        setIsEditingSlug(false)
    }

    return (
        <div className="min-h-screen bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
            <Navbar
                onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
                onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                onUserDashboard={() => setShowDashboard(true)}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
            />
            <DashboardModal
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            {/* Background Decor */}
            <div className="fixed inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

            <main className="pt-48 pb-48 relative z-10 container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center">

                    {/* Loading State */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-12">
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-32 h-32 border-2 border-cyan-500/20 border-t-cyan-500 rounded-[2.5rem] glow-cyan"
                                />
                                <Activity className="absolute inset-0 m-auto w-10 h-10 text-cyan-500 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-cyan-500 font-black uppercase tracking-[0.5em] animate-pulse italic">
                                    Loading your profile...
                                </p>
                                <div className="h-1 w-48 bg-white/5 rounded-full mx-auto overflow-hidden">
                                    <motion.div
                                        animate={{ x: [-192, 192] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="h-full w-full bg-cyan-500 glow-cyan"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not Authenticated */}
                    {status === 'not-authenticated' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-[4rem] p-16 md:p-24 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-cyan-500/20 group-hover:glow-cyan transition-all duration-700">
                                    <Shield className="w-12 h-12 text-cyan-500" />
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 uppercase italic leading-none">
                                    Sign In Required
                                </h1>
                                <p className="text-slate-500 mb-14 text-xl font-bold uppercase tracking-tight max-w-md mx-auto opacity-70">
                                    You need to be signed in to view your profile.
                                </p>
                                <button
                                    onClick={() => { setShowAuthModal(true); setAuthModalMode('login'); }}
                                    className="px-16 py-6 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-[0.3em] text-xs shadow-xl shadow-cyan-500/30 hover:glow-cyan transition-all duration-500 hover:scale-105 active:scale-95 italic"
                                >
                                    SIGN IN
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Profile Ready */}
                    {status === 'ready' && slug && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            {/* Main Status Panel */}
                            <div className="glass-card rounded-[4rem] p-10 md:p-16 border border-white/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scanline" />

                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] border border-cyan-500/20 glow-cyan mb-10">
                                        <Radio className="w-4 h-4" />
                                        PROFILE LIVE
                                    </div>

                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase italic">
                                        Your portfolio is ready.
                                    </h2>
                                    <p className="text-slate-500 mb-14 text-lg font-bold leading-relaxed uppercase tracking-tight max-w-xl mx-auto opacity-70">
                                        We've built a premium portfolio page for you.
                                        It's now live and visible to recruiters worldwide.
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                        <div className="flex-1 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-left group/box hover:border-cyan-500/30 transition-all duration-700 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60">YOUR LINK</span>
                                                    <div className="w-2 h-2 rounded-full bg-cyan-500 glow-cyan" />
                                                </div>
                                                <h3 className="text-xl font-black text-white mb-8 italic uppercase">PUBLIC PORTFOLIO</h3>

                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => window.open(`/profile/${slug}`, '_blank')}
                                                        className="w-full py-4 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-500 transition-all duration-500 hover:glow-cyan"
                                                    >
                                                        VIEW MY PAGE <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/profile/${slug}`)
                                                            toast.success('Link copied!')
                                                        }}
                                                        className="w-full py-4 bg-white/5 text-white/50 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all duration-500"
                                                    >
                                                        COPY LINK
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Panel */}
                            <div className="glass-card rounded-[3rem] p-10 md:p-14 border border-white/10 relative overflow-hidden group text-left">
                                <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

                                <div className="flex items-center gap-4 mb-12">
                                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 glow-cyan">
                                        <Cpu className="w-6 h-6 text-cyan-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">PAGE SETTINGS</h3>
                                </div>

                                <div className="space-y-10">
                                    {/* Visibility Toggle */}
                                    <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 relative overflow-hidden group/item">
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={`p-4 rounded-2xl border-2 transition-all duration-700 ${isPublic ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 glow-cyan' : 'bg-red-500/10 border-red-500/20 text-red-500 glow-red'}`}>
                                                {isPublic ? <Network className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-widest text-[11px] mb-1">VISIBILITY</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isPublic ? 'PUBLIC — Anyone can find your profile' : 'HIDDEN — Not visible to others'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleVisibility}
                                            disabled={isUpdating}
                                            className={`w-16 h-8 rounded-full transition-all duration-500 relative bg-black border-2 ${isPublic ? 'border-cyan-500 glow-cyan' : 'border-slate-800'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <motion.div
                                                animate={{ x: isPublic ? 32 : 0 }}
                                                className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-lg ${isPublic ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                            />
                                        </button>
                                    </div>

                                    {/* Custom Slug Edit */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="font-black text-white uppercase tracking-widest text-[11px]">YOUR PROFILE URL</p>
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">CUSTOM LINK</span>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-[1.5rem] border border-white/5 group/input focus-within:border-cyan-500/30 transition-all duration-700">
                                            <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest pr-4 border-r border-white/5">
                                                skillvibe.net/
                                            </div>
                                            {isEditingSlug ? (
                                                <input
                                                    value={newSlug}
                                                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveSlug()}
                                                    className="bg-transparent border-none outline-none text-xs font-black text-white flex-1 min-w-0 uppercase tracking-widest placeholder-white/10"
                                                    autoFocus
                                                    placeholder="your-name"
                                                />
                                            ) : (
                                                <span className="text-xs font-black text-white flex-1 truncate uppercase tracking-widest">{slug}</span>
                                            )}
                                            <button
                                                onClick={isEditingSlug ? saveSlug : () => setIsEditingSlug(true)}
                                                disabled={isUpdating}
                                                className={`p-3 rounded-xl transition-all duration-500 ${isEditingSlug ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-cyan-500 hover:border-cyan-500/30'}`}
                                            >
                                                {isEditingSlug ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Edit2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-tight pl-2 px-1">Only letters, numbers and hyphens allowed.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* No Profile Yet */}
                    {status === 'no-profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[4rem] p-16 md:p-24 border border-white/10 relative overflow-hidden group shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scanline" />

                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-cyan-500/20 group-hover:glow-cyan transition-all duration-700">
                                    <Upload className="w-12 h-12 text-cyan-500" />
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 uppercase italic leading-none">
                                    No Profile Yet.
                                </h1>
                                <p className="text-slate-500 mb-14 text-xl font-bold uppercase tracking-tight max-w-md mx-auto opacity-70">
                                    You haven't created a portfolio yet.
                                    Upload your resume to get started.
                                </p>
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-16 py-6 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-[0.3em] text-xs shadow-xl shadow-cyan-500/30 hover:glow-cyan transition-all duration-500 hover:scale-105 active:scale-95 italic"
                                >
                                    CREATE MY PORTFOLIO
                                </button>
                            </div>
                        </motion.div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    )
}
