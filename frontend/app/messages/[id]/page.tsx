'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Send, User, ArrowLeft, ShieldCheck, Sparkles, MessageCircle, Check, CheckCheck, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import { API_URL, WS_URL } from '@/lib/api-config'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import toast from 'react-hot-toast'

interface Message {
    id: number
    sender_id: number
    content: string
    created_at: string
    is_read: boolean
}

interface ConversationInfo {
    id: number
    chat_id: string
    other_user_name: string
    other_user_pic?: string
    recruiter_id: number
    candidate_id: number
    other_user_company?: string
    other_user_role?: string
    other_user_location?: string
}

function HeaderSkeleton() {
    return (
        <div className="glass-card p-4 md:p-6 rounded-[2rem] border border-white/10 mb-4 flex items-center gap-4 animate-pulse shadow-xl">
            <div className="w-10 h-10 rounded-full bg-white/5" />
            <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0" />
            <div className="space-y-2">
                <div className="h-5 w-40 bg-white/10 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
        </div>
    )
}

function MessagesSkeleton() {
    return (
        <div className="flex-1 p-6 space-y-4 animate-pulse overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`flex items-end gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />}
                    <div className={`h-12 rounded-3xl ${i % 2 === 0 ? 'bg-cyan-500/20 w-48' : 'bg-white/10 w-64'}`} />
                    {i % 2 === 0 && <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex-shrink-0" />}
                </div>
            ))}
        </div>
    )
}

export default function MessagePage() {
    const { id } = useParams()
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [messages, setMessages] = useState<Message[]>([])
    const [displayedMessages, setDisplayedMessages] = useState<Message[]>([])
    const [isLoadingOlder, setIsLoadingOlder] = useState(false)
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false)
    const MESSAGES_PER_PAGE = 50
    const [displayCount, setDisplayCount] = useState(MESSAGES_PER_PAGE)
    
    const [convInfo, setConvInfo] = useState<ConversationInfo | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [convLoading, setConvLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const isSendingRef = useRef(false)
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([])
    const [isGettingSuggestions, setIsGettingSuggestions] = useState(false)
    const socketRef = useRef<WebSocket | null>(null)
    const isMountedRef = useRef(true)

    // Keep a ref so WS handler always has the current user ID (avoids stale closure)
    const userIdRef = useRef<number | undefined>(user?.id)
    useEffect(() => { userIdRef.current = user?.id }, [user?.id])

    // Global dedup set — every displayed message ID goes in here.
    // This is the single source of truth to prevent any duplicate rendering.
    const shownIds = useRef<Set<number>>(new Set())

    // Update displayed messages based on displayCount (pagination)
    useEffect(() => {
        if (messages.length > 0) {
            const startIndex = Math.max(0, messages.length - displayCount)
            setDisplayedMessages(messages.slice(startIndex))
            setAllMessagesLoaded(displayCount >= messages.length)
        }
    }, [messages, displayCount])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current && displayedMessages.length > 0) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }, 100)
        }
    }, [displayedMessages.length])

    // Mark messages as read when chat is opened (Instagram/WhatsApp style)
    useEffect(() => {
        if (!messages.length || !user || messagesLoading) return

        const token = localStorage.getItem('access_token')
        if (!token) return

        // Auto-mark after 1 second so user sees the unread notification briefly
        const readTimer = setTimeout(() => {
            markAsRead(token)
            console.log('[MessagePage] Auto-marked as read')
        }, 1000)

        return () => clearTimeout(readTimer)
    }, [messages.length, user, messagesLoading])

    const chatId = id as string

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/')
    }, [user, authLoading])

    // Main data fetching — fires in parallel for instant feel
    useEffect(() => {
        if (!user || !chatId) return

        const token = localStorage.getItem('access_token')
        if (!token) return

        // Local cancel flag — immune to Strict Mode double-invoke race
        let cancelled = false

        // ── Fetch 1: Conv metadata ────────────────────────────────────────────
        const loadConvInfo = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/v1/messages/${chatId}/info`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (!cancelled) setConvInfo(res.data)
            } catch (err: any) {
                if (cancelled) return
                // /info not deployed on this backend — fall back to conversations list
                if (err.response?.status === 404 || err.response?.status === 405) {
                    try {
                        const listRes = await axios.get(`${API_URL}/api/v1/messages/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                        const found = listRes.data.find((c: any) => c.chat_id === chatId)
                        if (!cancelled && found) setConvInfo(found)
                    } catch { }
                } else if (err.response?.status === 403) {
                    toast.error('You are not part of this conversation')
                    router.push('/messages')
                }
            } finally {
                if (!cancelled) setConvLoading(false)
            }
        }
        loadConvInfo()

        // ── Fetch 2: Messages ─────────────────────────────────────────────────
        axios.get(`${API_URL}/api/v1/messages/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (cancelled) return
            const msgs: Message[] = res.data
            msgs.forEach(m => shownIds.current.add(m.id))
            setMessages(msgs)
            // Don't mark as read immediately - let user see the notification briefly
            // markAsRead will be called by useEffect after a delay
            fetchSuggestions(token)
        }).catch(err => {
            if (cancelled) return
            console.error('Error loading messages:', err)
            if (err.response?.status !== 401) {
                toast.error('Could not load messages. Please refresh.')
            }
        }).finally(() => {
            if (!cancelled) setMessagesLoading(false)
        })

        // ── Fetch 3: Polling for new messages (fallback for Vercel) ────────────
        const active_ref = { active: true }
        let pollingInterval: NodeJS.Timeout | null = null

        // ── WebSocket Connection for real-time messages ───────────────────────
        const connectWebSocket = () => {
            if (!token || !active_ref.active) return
            
            // Adjust protocol to wss if https, ws if http
            const wsProtocol = window.location.protocol === 'https:' || WS_URL.startsWith('https') ? 'wss:' : 'ws:'
            const wsBaseUrl = WS_URL.replace(/^https?:/, wsProtocol)
            const wsUrl = `${wsBaseUrl}/api/v1/messages/ws/${chatId}?token=${token}`
            
            const ws = new WebSocket(wsUrl)
            socketRef.current = ws

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    const newMsg = data.message || data
                    
                    if (newMsg && typeof newMsg.id === 'number') {
                        if (!shownIds.current.has(newMsg.id)) {
                            shownIds.current.add(newMsg.id)
                            setMessages(prev => {
                                // Replace optimistic message if it exists
                                const hasOptimistic = prev.some(m => m.id < 0 && m.content === newMsg.content)
                                if (hasOptimistic) {
                                    return prev.map(m => (m.id < 0 && m.content === newMsg.content) ? newMsg : m)
                                }
                                return [...prev, newMsg]
                            })
                            
                            if (document.visibilityState === 'visible') {
                                setTimeout(() => markAsRead(token), 500)
                            }
                        }
                    }
                } catch (err) { }
            }
            
            ws.onclose = () => {
                socketRef.current = null
                if (active_ref.active) {
                    setTimeout(connectWebSocket, 3000)
                }
            }
        }
        connectWebSocket()

        let lastMessageCount = 0

        const pollForNewMessages = async () => {
            if (!active_ref.active || document.visibilityState !== 'visible') return

            try {
                const res = await axios.get(`${API_URL}/api/v1/messages/${chatId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (cancelled || !active_ref.active) return

                const msgs: Message[] = res.data
                
                // Check for new messages
                const newMessages = msgs.filter(m => !shownIds.current.has(m.id))
                
                if (newMessages.length > 0) {
                    newMessages.forEach(m => shownIds.current.add(m.id))
                    setMessages(msgs)
                    // Auto-mark new messages as read (Instagram/WhatsApp style)
                    if (document.visibilityState === 'visible') {
                        setTimeout(() => {
                            markAsRead(token)
                        }, 500)
                    }
                }
            } catch (err) {
                if (!cancelled && !active_ref.active) {
                    console.error('Error polling for messages:', err)
                }
            }
        }

        // Start polling every 2 seconds when visible
        const startPolling = () => {
            if (pollingInterval) clearInterval(pollingInterval)
            if (document.visibilityState === 'visible') {
                pollingInterval = setInterval(pollForNewMessages, 2000)
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                startPolling()
                // Auto-mark as read when tab becomes visible
                setTimeout(() => {
                    markAsRead(token)
                }, 500)
            } else {
                if (pollingInterval) clearInterval(pollingInterval)
            }
        }

        startPolling()
        document.addEventListener('visibilitychange', handleVisibilityChange)
        // Auto-mark on window focus (Instagram/WhatsApp behavior)
        const handleFocus = () => {
            setTimeout(() => {
                markAsRead(token)
            }, 500)
        }
        window.addEventListener('focus', handleFocus)

        return () => {
            cancelled = true
            active_ref.active = false
            shownIds.current.clear()
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }
            if (pollingInterval) clearInterval(pollingInterval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
        }
    }, [user?.id, chatId])

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Refresh AI suggestions when the OTHER person sends a new message
    useEffect(() => {
        if (messages.length === 0) return
        const lastMsg = messages[messages.length - 1]
        const token = localStorage.getItem('access_token')
        if (lastMsg.id > 0 && lastMsg.sender_id !== user?.id && token) {
            fetchSuggestions(token)
        } else if (lastMsg.sender_id === user?.id) {
            setSuggestedReplies([])
        }
    }, [messages[messages.length - 1]?.id])

    const markAsRead = async (token: string) => {
        try {
            await axios.post(`${API_URL}/api/v1/messages/${chatId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
        } catch { }
    }

    const fetchSuggestions = async (token: string) => {
        if (!chatId) return
        setIsGettingSuggestions(true)
        try {
            const res = await axios.get(`${API_URL}/api/v1/messages/${chatId}/suggestions`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setSuggestedReplies(res.data)
        } catch { }
        finally { setIsGettingSuggestions(false) }
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newMessage.trim() || isSendingRef.current) return

        isSendingRef.current = true
        setIsSending(true)
        const msgContent = newMessage.trim()
        setNewMessage('') // Clear immediately — feels instant
        setSuggestedReplies([])

        // ── Optimistic UI: show message instantly ─────────────────────────────
        const tempId = -Date.now() // negative so it can't collide with real IDs
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: user?.id ?? 0,
            content: msgContent,
            created_at: new Date().toISOString(),
            is_read: false,
        }
        setMessages(prev => [...prev, optimisticMsg])

        try {
            const token = localStorage.getItem('access_token')
            const res = await axios.post(`${API_URL}/api/v1/messages/${chatId}/send`,
                { content: msgContent },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            // Register the real ID in shownIds so the WS broadcast won't add it again
            shownIds.current.add(res.data.id)
            // Swap optimistic → real
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m))
        } catch {
            toast.error('Failed to send message')
            // Roll back
            setMessages(prev => prev.filter(m => m.id !== tempId))
            setNewMessage(msgContent)
        } finally {
            isSendingRef.current = false
            setIsSending(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="bg-slate-50 dark:bg-black font-sans selection:bg-cyan-500/30 min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-1 pt-20 sm:pt-24 md:pt-28 pb-4 sm:pb-6 px-3 sm:px-4 md:px-6 flex flex-col max-w-5xl mx-auto w-full overflow-y-auto">

                {/* Header */}
                {convLoading ? <HeaderSkeleton /> : (
                    <div className="glass-card p-4 md:p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 mb-4 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/messages')}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex items-center justify-center border-2 border-cyan-500/20">
                                    {convInfo?.other_user_pic ? (
                                        <img src={convInfo.other_user_pic} alt={convInfo?.other_user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg leading-tight uppercase tracking-tighter italic flex items-center gap-2">
                                        {convInfo?.other_user_name}
                                        {convInfo?.other_user_company && (
                                            <span className="text-[10px] normal-case font-black tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-400">
                                                {convInfo.other_user_company}
                                            </span>
                                        )}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {convInfo?.other_user_role === 'recruiter' ? 'Elite Recruiter' : 'Active Connection'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> Secure Chat
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 glass-card rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-white/10 mb-4 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 custom-scrollbar bg-white/5 backdrop-blur-md"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#06b6d4 transparent' }}
                >
                    {messagesLoading ? (
                        <MessagesSkeleton />
                    ) : displayedMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                            <MessageCircle className="w-12 h-12 text-slate-400" />
                            <p className="text-sm font-medium">No messages yet. Send a greeting!</p>
                        </div>
                    ) : (
                        <>
                            {!allMessagesLoaded && messages.length > displayCount && (
                                <div className="flex justify-center py-2">
                                    <button
                                        onClick={() => setDisplayCount(prev => prev + MESSAGES_PER_PAGE)}
                                        disabled={isLoadingOlder}
                                        className="px-4 py-2 text-xs font-black bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all disabled:opacity-50"
                                    >
                                        {isLoadingOlder ? 'Loading...' : `Load Older Messages (${messages.length - displayCount} more)`}
                                    </button>
                                </div>
                            )}
                            {displayedMessages.map((msg) => {
                            const isMine = msg.sender_id === user?.id
                            const isPending = msg.id < 0
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: isPending ? 0.7 : 1, scale: 1 }}
                                    key={msg.id}
                                    className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isMine && (
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/10 text-[10px] font-black">
                                            {convInfo?.other_user_pic ? (
                                                <img src={convInfo.other_user_pic} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                convInfo?.other_user_name?.charAt(0) || '?'
                                            )}
                                        </div>
                                    )}
                                    <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-[70%] p-3 sm:p-4 rounded-2xl sm:rounded-3xl ${isMine
                                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-black font-semibold rounded-br-none shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                        : 'bg-white/10 text-white rounded-bl-none border border-white/10 backdrop-blur-sm'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed tracking-tight">{msg.content}</p>
                                        <div className={`text-[9px] mt-2 font-black uppercase tracking-widest flex items-center gap-2 ${isMine ? 'text-black/60' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMine && (
                                                isPending
                                                    ? <Clock className="w-3 h-3 opacity-50" />
                                                    : msg.is_read
                                                        ? <CheckCheck className="w-3 h-3 text-cyan-300" />
                                                        : <Check className="w-3 h-3 opacity-50" />
                                            )}
                                        </div>
                                    </div>
                                    {isMine && (
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex-shrink-0 flex items-center justify-center border border-cyan-500/30 text-[10px] font-black text-cyan-500">
                                            {user?.profile_picture ? (
                                                <img src={user.profile_picture} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user?.email?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                        </>
                    )}
                </div>

                {/* AI Suggested Replies */}
                <AnimatePresence>
                    {suggestedReplies.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 mb-4 items-center"
                        >
                            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20 shadow-inner">
                                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">AI Options</span>
                            </div>
                            {suggestedReplies.map((reply, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(6,182,212,0.15)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setNewMessage(reply)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 text-xs font-bold transition-all shadow-xl backdrop-blur-md"
                                >
                                    {reply}
                                </motion.button>
                            ))}
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('access_token')
                                    if (token) fetchSuggestions(token)
                                }}
                                disabled={isGettingSuggestions}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-500 hover:border-cyan-500/30 transition-all disabled:opacity-50 shadow-xl"
                                title="Regenerate suggestions"
                            >
                                <Sparkles className={`w-3.5 h-3.5 ${isGettingSuggestions ? 'animate-spin' : ''}`} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="relative group">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                            }
                        }}
                        placeholder="Type your message..."
                        className="w-full pl-4 sm:pl-6 pr-16 sm:pr-20 py-3 sm:py-5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-500 resize-none min-h-[52px] sm:min-h-[64px] max-h-32 transition-all shadow-2xl"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 text-black rounded-lg sm:rounded-2xl flex items-center justify-center transition-all disabled:text-white/20 active:scale-90"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                </form>
            </div>

            <Footer />
        </div>
    )
}
