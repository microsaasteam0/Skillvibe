'use client'

import { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { X, Send, Loader2, MessageSquare, AlertCircle, Sparkles, HelpCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supportClient } from '../lib/support/client'
import toast from 'react-hot-toast'

interface SupportModalProps {
    isOpen: boolean
    onClose: () => void
}

type Category = "feedback" | "bug" | "feature" | "support"

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
    const { user, isAuthenticated } = useAuth()
    const [category, setCategory] = useState<Category>("feedback")
    const [email, setEmail] = useState(user?.email || '')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Sync email when user changes
    useEffect(() => {
        if (user?.email) {
            setEmail(user.email)
        }
    }, [user])

    // Lock scroll (CSS + Lenis) when modal is open
    useScrollLock(isOpen)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !message) {
            toast.error('Email and message are required')
            return
        }

        setIsLoading(true)

        try {
            await supportClient.submitTicket({
                product: "BuildInPublic", // Micro-saas name
                category: category,
                user_email: email,
                message: message,
                metadata: {
                    page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
                    isAuthenticated: isAuthenticated,
                    userId: user?.id
                }
            })

            toast.success('Message sent successfully')
            setMessage('')
            onClose()
        } catch (err) {
            console.error('Support submission error:', err)
            toast.error('Failed to send message')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                {/* Header */}
                <div className="relative p-8 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Support & Feedback</h2>
                            <p className="text-sm text-slate-500 font-bold">How can we help you today?</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="relative p-8 space-y-6">
                    {/* Category Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1">
                            Category
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'feedback', label: 'Feedback', icon: <Sparkles className="w-4 h-4" /> },
                                { id: 'bug', label: 'Bug Report', icon: <AlertCircle className="w-4 h-4" /> },
                                { id: 'feature', label: 'Feature Request', icon: <Send className="w-4 h-4" /> },
                                { id: 'support', label: 'General Support', icon: <HelpCircle className="w-4 h-4" /> }
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id as Category)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-bold text-sm transition-all ${category === cat.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500/50'
                                        }`}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1">
                            Your Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@gmail.com"
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your message here..."
                            rows={4}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Send Message
                            </>
                        )}
                    </button>
                </form>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Average response time: &lt; 24 hours
                    </p>
                </div>
            </div>
        </div>
    )
}
