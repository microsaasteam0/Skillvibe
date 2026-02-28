'use client'

import { useState, useEffect } from 'react'
import { Rocket, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function CompanyInfoSetupModal() {
    const { user, token, refreshUser } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [companyInfo, setCompanyInfo] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        // Check if the user is a recruiter and is missing company_info
        if (user && user.role === 'recruiter' && !user.company_info) {
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!companyInfo.trim()) {
            setError('Company information is required')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await axios.put(
                `${API_URL}/api/v1/auth/profile`,
                { company_info: companyInfo.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            // Refresh user context so the modal disappears
            await refreshUser()
            toast.success('Company info saved successfully')
        } catch (err: any) {
            console.error('Error updating company info:', err)
            setError(err.response?.data?.detail || 'Failed to update company info. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[999999] flex items-center justify-center p-4">
            <div className="glass-card rounded-[3rem] p-10 md:p-14 max-w-lg w-full border border-white/10 shadow-4xl text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scanline" />

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-cyan-500/20 glow-cyan">
                        <Rocket className="w-12 h-12 text-cyan-500" />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Complete Your Profile</h2>
                    <p className="text-slate-400 mb-8 text-sm font-bold uppercase tracking-widest leading-relaxed">
                        As a recruiter, we need your company or organization name to proceed.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3 text-left">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Company Name</label>
                            <div className="relative group/input">
                                <Rocket className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-500 transition-colors w-5 h-5" />
                                <input
                                    type="text"
                                    value={companyInfo}
                                    onChange={(e) => {
                                        setCompanyInfo(e.target.value)
                                        setError('')
                                    }}
                                    className={`w-full pl-14 pr-5 py-5 bg-white/[0.03] border rounded-[1.5rem] focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-white placeholder-slate-700 transition-all font-bold uppercase text-xs tracking-widest ${error ? 'border-red-500' : 'border-white/10'}`}
                                    placeholder="e.g. Acme Corp"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full relative group/btn overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 md:to-blue-500 to-cyan-500 rounded-2xl opacity-100 transition-opacity" />
                            <div className="relative py-5 px-8 flex items-center justify-center gap-3 bg-cyan-500 rounded-2xl group-hover/btn:bg-transparent transition-all border border-transparent shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-black group-hover/btn:text-white" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-black group-hover/btn:text-white transition-colors">
                                            SAVING...
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-black group-hover/btn:text-white transition-colors">
                                        CONTINUE
                                    </span>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    )
}
