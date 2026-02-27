'use client'

import { useState } from 'react'
import { X, Mail, Send, Loader } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api-config'

interface ContactModalProps {
    isOpen: boolean
    candidate: any
    onClose: () => void
}

export default function ContactModal({ isOpen, candidate, onClose }: ContactModalProps) {
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!subject.trim() || !message.trim()) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const response = await axios.post(
                `${API_URL}/api/v1/skillvibe/contact/${candidate.slug}`,
                { subject, message },
                { headers: { 'Authorization': `Bearer ${token}` } }
            )

            toast.success('Message sent successfully!')
            setSubject('')
            setMessage('')
            onClose()
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || 'Failed to send message'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !candidate) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-black border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl animated-gradient">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                            <Mail className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-black uppercase text-sm tracking-widest">Contact</h3>
                            <p className="text-cyan-500 text-xs font-bold">{candidate.full_name || candidate.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Subject */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Exciting Opportunity at TechCorp"
                            className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/40 transition-all duration-500 placeholder-slate-600"
                            disabled={loading}
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Share details about the opportunity and why you think they're a great fit..."
                            className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/40 transition-all duration-500 placeholder-slate-600 resize-none h-32"
                            disabled={loading}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-cyan-500 text-black font-black rounded-xl text-[11px] uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all duration-500 disabled:grayscale disabled:opacity-50 active:scale-95 shadow-lg hover:shadow-cyan-500/50"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                SENDING...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                SEND MESSAGE
                            </>
                        )}
                    </button>

                    {/* Cancel Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="w-full py-3 bg-white/5 text-white border border-white/10 font-black rounded-xl text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </form>

                {/* Info Footer */}
                <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 rounded-b-[2.5rem]">
                    <p className="text-[10px] text-slate-500 italic">
                        Your email will be included in the message so they can respond directly.
                    </p>
                </div>
            </div>
        </div>
    )
}
