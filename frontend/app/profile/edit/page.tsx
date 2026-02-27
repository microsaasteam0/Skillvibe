'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Eye, Code, Sparkles, Maximize2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import toast from 'react-hot-toast'
import { useAuth } from '../../../contexts/AuthContext'

export default function PortfolioEditorPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [html, setHtml] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) {
            router.push('/profile')
            return
        }

        const fetchPortfolio = async () => {
            try {
                const token = localStorage.getItem('access_token')
                const response = await axios.get(`${API_URL}/api/v1/skillvibe/profile/portfolio`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                setHtml(response.data.html || '')
            } catch (error) {
                toast.error('Failed to load portfolio data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPortfolio()
    }, [isAuthenticated, authLoading, router])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const token = localStorage.getItem('access_token')
            await axios.put(`${API_URL}/api/v1/skillvibe/profile/portfolio`,
                { html },
                { headers: { 'Authorization': `Bearer ${token}` } }
            )

            // Clear cache via dynamic import to avoid SSR issues
            try {
                const { requestCache } = await import('@/lib/cache-util')
                requestCache.clear()
            } catch (e) {
                console.warn('Cache could not be cleared automatically')
            }

            toast.success('Portfolio saved successfully!')
        } catch (error) {
            toast.error('Failed to save portfolio')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/profile')}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <h1 className="text-sm font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        AI UI Editor
                    </h1>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('edit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'edit' ? 'bg-purple-600 text-white' : 'hover:bg-white/5'}`}
                    >
                        <Code className="w-3 h-3" /> Code
                    </button>
                    <button
                        onClick={() => setViewMode('split')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'split' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-zinc-400'}`}
                    >
                        <Maximize2 className="w-3 h-3" /> Split
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-zinc-400'}`}
                    >
                        <Eye className="w-3 h-3" /> Preview
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-600/20"
                >
                    {isSaving ? (
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-3 h-3" />
                    )}
                    Save Live
                </button>
            </header>

            {/* Editor Area */}
            <main className="flex-1 flex overflow-hidden bg-black">
                {/* Editor Column */}
                {(viewMode === 'split' || viewMode === 'edit') && (
                    <div
                        className="h-full border-r border-white/5 flex flex-col bg-[#0a0a0a] relative"
                        style={{ width: viewMode === 'split' ? '50%' : '100%' }}
                    >
                        <textarea
                            value={html}
                            onChange={(e) => setHtml(e.target.value)}
                            className="w-full h-full bg-[#0a0a0a] p-8 font-mono text-[14px] leading-relaxed outline-none resize-none text-slate-100 focus:text-white transition-all overflow-auto whitespace-pre custom-scrollbar"
                            placeholder="Paste your elite HTML here..."
                            spellCheck={false}
                        />
                        <div className="absolute top-4 right-8 pointer-events-none text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] bg-purple-500/10 border border-purple-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg z-10">
                            Live Source
                        </div>
                    </div>
                )}

                {/* Preview Column */}
                {(viewMode === 'split' || viewMode === 'preview') && (
                    <div
                        className="h-full bg-[#050505] relative flex flex-col"
                        style={{ width: viewMode === 'split' ? '50%' : '100%' }}
                    >
                        {!html ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">No preview available</p>
                            </div>
                        ) : (
                            <iframe
                                srcDoc={html}
                                className="w-full h-full border-none bg-white"
                                title="Preview"
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
