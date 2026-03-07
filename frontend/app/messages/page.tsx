'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, User, Calendar, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal.jsx'
import SupportModal from '../../components/SupportModal'
import toast from 'react-hot-toast'

interface Conversation {
    id: number
    chat_id: string
    recruiter_id: number
    candidate_id: number
    last_message: string
    updated_at: string
    other_user_name: string
    other_user_pic?: string
    other_user_company?: string
    other_user_role?: string
    other_user_location?: string
    unread_count: number
}

export default function ConversationsPage() {
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [showDashboard, setShowDashboard] = useState(false)
    const [showSupportModal, setShowSupportModal] = useState(false)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/')
            return
        }

        if (user) {
            fetchConversations()
            
            // Set up polling to refresh conversations every 3 seconds when visible
            let pollingInterval: NodeJS.Timeout | null = null
            
            const startPolling = () => {
                if (document.visibilityState === 'visible') {
                    pollingInterval = setInterval(fetchConversations, 3000)
                }
            }
            
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    startPolling()
                } else {
                    if (pollingInterval) clearInterval(pollingInterval)
                }
            }
            
            startPolling()
            document.addEventListener('visibilitychange', handleVisibilityChange)
            
            return () => {
                if (pollingInterval) clearInterval(pollingInterval)
                document.removeEventListener('visibilitychange', handleVisibilityChange)
            }
        }
    }, [user, authLoading])

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const response = await axios.get(`${API_URL}/api/v1/messages/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setConversations(response.data)
        } catch (error) {
            console.error('Error fetching conversations:', error)
            toast.error('Failed to load your connections')
        } finally {
            setIsLoading(false)
        }
    }

    const LoadingSkeleton = () => (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-white/5" />
                        <div className="space-y-3">
                            <div className="h-5 w-48 bg-white/10 rounded" />
                            <div className="h-4 w-64 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5" />
                </div>
            ))}
        </div>
    )

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
            <Navbar
                onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
                onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                onUserDashboard={() => setShowDashboard(true)}
            />

            <div className="pt-32 pb-20 px-6 text-slate-900 dark:text-white">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                            <MessageSquare className="w-4 h-4" />
                            Connections
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                            Your Inbox
                        </h1>
                        <p className="text-slate-500 max-w-2xl font-medium">
                            Manage your elite connections and professional outreach messages.
                        </p>
                    </div>

                    {/* Conversations List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <LoadingSkeleton />
                        ) : conversations.length === 0 ? (
                            <div className="glass-card p-12 rounded-[2rem] border border-slate-200 dark:border-white/10 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <MessageSquare className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">No connections yet</h3>
                                    <p className="text-slate-500">When you reach out to talent or receive an inquiry, it will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <motion.div
                                    key={conv.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => router.push(`/messages/${conv.chat_id}`)}
                                    className={`glass-card p-6 md:p-8 rounded-[2rem] border transition-all group cursor-pointer flex items-center justify-between gap-6 ${conv.unread_count > 0
                                        ? 'border-cyan-500/50 bg-cyan-500/[0.03] shadow-[0_0_30px_rgba(6,182,212,0.1)]'
                                        : 'border-slate-200 dark:border-white/10 hover:border-cyan-500/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-cyan-500/30 transition-colors">
                                                {conv.other_user_pic ? (
                                                    <img src={conv.other_user_pic} alt={conv.other_user_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-8 h-8 text-slate-400" />
                                                )}
                                            </div>
                                            {conv.unread_count > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full border-4 border-black flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className={`font-bold text-xl group-hover:text-cyan-500 transition-colors flex items-center gap-2 ${conv.unread_count > 0 ? 'text-white' : ''}`}>
                                                {conv.other_user_name}
                                                {conv.other_user_company && (
                                                    <span className="text-[10px] normal-case font-black tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-400">
                                                        {conv.other_user_company}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className={`${conv.unread_count > 0 ? 'text-white font-bold' : 'text-slate-500'} line-clamp-1 text-sm font-medium`}>
                                                {conv.last_message || "Start a conversation..."}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 pt-1">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                                    {conv.other_user_role === 'recruiter' ? 'Elite Recruiter' : 'Candidate'}
                                                </div>
                                                {conv.other_user_location && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                        {conv.other_user_location}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                    <Calendar className="w-3 h-3" />
                                                    {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : new Date().toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        {conv.unread_count > 0 && (
                                            <div className="px-2.5 py-1 rounded-full bg-cyan-500 text-black text-[10px] font-black animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                                {conv.unread_count} NEW
                                            </div>
                                        )}
                                        <div className="hidden sm:block">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <Footer onSupportClick={() => setShowSupportModal(true)} />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
            />

            <DashboardModal
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            <SupportModal
                isOpen={showSupportModal}
                onClose={() => setShowSupportModal(false)}
            />
        </div>
    )
}
