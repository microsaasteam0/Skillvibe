'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Upload, FileText, CheckCircle, Loader2, Rocket, Sparkles, ChevronRight, Zap, Palette, Cpu, X, ArrowRight, Eye, ArrowLeft, ShieldCheck, Target, Terminal } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'

export default function ResumeUpload({
    onSuccess,
    isAuthenticated = true,
    onRequireAuth
}: {
    onSuccess: (slug: string) => void,
    isAuthenticated?: boolean,
    onRequireAuth?: () => void
}) {
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [step, setStep] = useState<'upload' | 'vibe'>('upload')
    const [extractedSlug, setExtractedSlug] = useState('')
    const [pendingUpload, setPendingUpload] = useState(false)

    // Automatically trigger upload if it was pending and user just logged in
    useEffect(() => {
        if (isAuthenticated && pendingUpload && file) {
            setPendingUpload(false)
            handleUpload()
        }
    }, [isAuthenticated, pendingUpload, file])

    // Disable body scroll when preview is open
    useEffect(() => {
        if (showPreview) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [showPreview])

    // Disable body scroll when generating overlay is shown
    useEffect(() => {
        if (isGenerating) {
            // Lock CSS scroll
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
            // Stop Lenis smooth scroll (it ignores CSS overflow)
            window.lenis?.stop()
        } else {
            document.body.style.overflow = 'unset'
            document.documentElement.style.overflow = 'unset'
            window.lenis?.start()
        }
        return () => {
            document.body.style.overflow = 'unset'
            document.documentElement.style.overflow = 'unset'
            window.lenis?.start()
        }
    }, [isGenerating])

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)

            // Generate preview if PDF
            if (selectedFile.type === 'application/pdf') {
                if (previewUrl) URL.revokeObjectURL(previewUrl)
                setPreviewUrl(URL.createObjectURL(selectedFile))
            } else {
                setPreviewUrl(null)
            }
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please upload a file or enter Github/Linkedin URL.')
            return
        }

        if (!isAuthenticated && onRequireAuth) {
            setPendingUpload(true)
            onRequireAuth()
            return
        }

        setIsUploading(true)
        setProgress(10)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const interval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev))
            }, 400)

            const response = await axios.post(`${API_URL}/api/v1/skillvibe/resume-upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })

            clearInterval(interval)
            setProgress(100)
            setExtractedSlug(response.data.slug)
            setStep('vibe')
            toast.success('Profile generated. Score calculated.')
        } catch (error) {
            toast.error('Session expired. Please log in again.')
        } finally {
            setIsUploading(false)
            setShowPreview(false)
        }
    }

    const selectTemplate = async (templateId: string) => {
        setIsGenerating(true)
        try {
            const response = await axios.post(`${API_URL}/api/v1/skillvibe/generate-portfolio`,
                { template_id: templateId },
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
            )
            const slug = response.data.slug
            requestCache.invalidate(`portfolio-html-${slug}`)
            toast.success('Profile published!')
            onSuccess(slug)
        } catch (error) {
            toast.error('Failed to generate profile.')
        } finally {
            setIsGenerating(false)
        }
    }

    if (step === 'vibe') {
        const archetypes = [
            { id: 'futurist-ops', name: 'NEON BLUE', desc: 'A bright blue theme with glowing lines and cool data patterns.', chip: 'TECH LOOK', gradient: 'from-indigo-600 via-cyan-500 to-blue-700', glow: 'shadow-cyan-500/30', accent: 'text-cyan-400' },
            { id: 'lead-strategist', name: 'CORPORATE', desc: 'A clean and professional design for managers and team leads.', chip: 'OFFICE LOOK', gradient: 'from-slate-700 via-blue-800 to-slate-900', glow: 'shadow-blue-500/20', accent: 'text-blue-400' },
            { id: 'serial-entrepreneur', name: 'HACKER', desc: 'A dark black and green theme that looks like a high-tech computer.', chip: 'BUILDER LOOK', gradient: 'from-gray-900 via-zinc-800 to-black', glow: 'shadow-emerald-500/20', accent: 'text-emerald-400' },
            { id: 'creative-specialist', name: 'ARTIST', desc: 'A colorful and artistic look with smooth shapes and pretty colors.', chip: 'CREATIVE LOOK', gradient: 'from-rose-500 via-pink-600 to-fuchsia-700', glow: 'shadow-rose-500/30', accent: 'text-rose-400' },
            { id: 'cyber-punk', name: 'CYBER', desc: 'A futuristic design with fast animations and bright neon colors.', chip: 'FUTURE LOOK', gradient: 'from-cyan-500 via-teal-600 to-emerald-700', glow: 'shadow-cyan-500/30', accent: 'text-cyan-400' },
            { id: 'glass-prism', name: 'GLASSY', desc: 'A modern and clean look that looks like transparent glass.', chip: 'CLEAN LOOK', gradient: 'from-violet-500 via-indigo-500 to-purple-600', glow: 'shadow-violet-500/30', accent: 'text-violet-400' },
            { id: 'minimal-noir', name: 'SIMPLE', desc: 'A very basic and clean look for people who like to keep it simple.', chip: 'BASIC LOOK', gradient: 'from-zinc-200 via-stone-100 to-zinc-300', glow: 'shadow-zinc-400/20', accent: 'text-zinc-500 dark:text-zinc-400' },
            { id: 'venture-capital', name: 'VIP', desc: 'A high-end design for the best of the best in the industry.', chip: 'ELITE LOOK', gradient: 'from-emerald-600 via-teal-700 to-cyan-800', glow: 'shadow-emerald-500/30', accent: 'text-emerald-400' },
            { id: 'midnight-gold', name: 'GOLDEN', desc: 'A premium look with golden accents for top performers.', chip: 'BEST LOOK', gradient: 'from-amber-500 via-yellow-600 to-orange-700', glow: 'shadow-amber-500/30', accent: 'text-amber-400' },
        ]

        return (
            <div
                className="max-w-6xl mx-auto bg-black rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col"
                style={{ height: '85vh' }}
            >
                {/* Cyber Grid Background */}
                <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Header Container */}
                <div className="relative z-10 px-8 md:px-12 pt-12 pb-8 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                    <button
                        onClick={() => setStep('upload')}
                        className="flex items-center gap-3 px-6 py-3 glass-panel text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:text-cyan-500 hover:glow-cyan transition-all border border-white/5 mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-cyan-500 mb-2">
                                <ShieldCheck className="w-5 h-5 shadow-cyan-500/50" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">READY TO WORK</span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase italic">
                                CHOOSE YOUR <span className="text-gradient-cyan">LOOK</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 font-bold text-sm max-w-sm italic opacity-80">
                            Pick a style for your page. This is how people will see you.
                        </p>
                    </div>
                </div>

                {/* Grid Container */}
                <div className="relative z-10 flex-grow overflow-y-auto px-8 md:px-12 pb-12 pt-8 hide-scrollbar" data-lenis-prevent="true">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {archetypes.map((tmp, i) => (
                            <motion.button
                                key={tmp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                disabled={isGenerating}
                                onClick={() => selectTemplate(tmp.id)}
                                className={`text-left group/card relative rounded-card bg-white/5 border border-white/5 hover:border-cyan-500/40 transition-all duration-500 flex flex-col overflow-hidden hover:glow-cyan hover:-translate-y-2 active:scale-95`}
                            >
                                <div className={`w-full h-32 bg-gradient-to-br ${tmp.gradient} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-cyber-grid opacity-30" />
                                    <div className="absolute inset-0 bg-black/20 group-hover/card:opacity-0 transition-opacity" />
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white">{tmp.chip}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col bg-black/40 backdrop-blur-md border-t border-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight italic leading-none">{tmp.name}</h4>
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover/card:text-cyan-500 group-hover/card:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-[12px] text-slate-500 font-bold leading-relaxed">{tmp.desc}</p>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Magic Component */}
                    <div className="pt-12 border-t border-white/5">
                        <div className="glass-card p-10 md:p-14 rounded-[3rem] border border-cyan-500/20 text-center relative overflow-hidden group/magic hover:glow-cyan transition-all duration-700">
                            <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                            <div className="max-w-3xl mx-auto relative z-10">
                                <div className="flex items-center gap-4 mb-4 justify-center">
                                    <Terminal className="w-7 h-7 text-cyan-500" />
                                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">CUSTOM STYLE</h3>
                                </div>
                                <p className="text-slate-400 font-bold mb-10 text-lg opacity-80">
                                    Tell us what you want your page to look like and we will make it for you.
                                </p>

                                <div className="relative max-w-2xl mx-auto">
                                    <input
                                        id="magic-vibe-input"
                                        type="text"
                                        placeholder="Type your style here..."
                                        className="w-full h-16 bg-black/60 border-2 border-white/10 rounded-2xl px-8 pr-44 text-sm font-mono tracking-widest text-white placeholder-slate-700 outline-none focus:border-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                    />
                                    <button
                                        onClick={() => {
                                            const val = (document.getElementById('magic-vibe-input') as HTMLInputElement).value;
                                            if (val) selectTemplate(val.toLowerCase().replace(/\s+/g, '-'));
                                        }}
                                        className="absolute right-2 top-2 bottom-2 px-8 bg-cyan-500 text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-cyan-500/20"
                                    >
                                        START <Zap className="w-4 h-4 fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generating Overlay */}
                <AnimatePresence>
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="w-32 h-32 mb-12 relative">
                                <div className="absolute inset-0 border-[6px] border-cyan-500/10 rounded-full" />
                                <div className="absolute inset-0 border-[6px] border-t-cyan-500 rounded-full animate-spin glow-cyan" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Target className="w-10 h-10 text-cyan-500 animate-pulse" />
                                </div>
                            </div>

                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase italic">
                                MAKING YOUR <span className="text-gradient-cyan">PAGE...</span>
                            </h3>
                            <div className="space-y-4 max-w-md">
                                <p className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.4em] animate-pulse">
                                    Setting everything up for you
                                </p>
                                <div className="h-1 w-64 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                        animate={{ x: [-300, 300] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        style={{ width: '30%' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-12 lg:p-20 glass-card rounded-[4rem] border border-white/10 shadow-4xl relative overflow-hidden group/container">
            <div className="absolute top-0 right-10 p-12 opacity-5 scale-150 rotate-12 group-hover/container:rotate-0 transition-all duration-1000">
                <Cpu className="w-64 h-64 text-cyan-500" />
            </div>

            <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 glass-panel border border-cyan-500/30 rounded-full text-cyan-500 mb-10 glow-cyan">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">STEP 1: UPLOAD</span>
                </div>

                <h2 className="text-6xl md:text-8xl font-black mb-8 text-white tracking-tighter leading-[0.8] uppercase italic">
                    UPLOAD YOUR <br />
                    <span className="text-gradient-cyan">RESUME.</span>
                </h2>
                <p className="text-slate-500 font-bold text-xl mb-16 max-w-2xl mx-auto leading-relaxed">
                    Upload your resume to get your score. <br className="hidden md:block" /> Our system will read it and show how good you are.
                </p>

                <div
                    className={`border-2 border-dashed rounded-[3rem] p-16 md:p-24 transition-all cursor-pointer relative overflow-hidden group/dropzone ${file ? 'border-cyan-500/60 bg-cyan-500/5' : 'border-white/10 bg-white/5 hover:border-cyan-500/40 hover:bg-white/[0.08]'
                        }`}
                    onClick={() => document.getElementById('resume-input')?.click()}
                >
                    <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
                    <input
                        type="file"
                        id="resume-input"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                    />

                    {file ? (
                        <div className="flex flex-col items-center gap-8 relative z-10">
                            <motion.div
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-24 h-32 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-500 shadow-2xl border border-cyan-500/40"
                            >
                                <FileText className="w-12 h-12" />
                            </motion.div>
                            <div>
                                <h3 className="text-white font-black text-3xl uppercase tracking-tighter italic mb-4">{file.name}</h3>
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest px-5 py-2 glass-panel border border-emerald-500/30 rounded-xl">GOT IT!</div>
                                    {previewUrl && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                                            className="text-[10px] text-white font-black uppercase tracking-widest px-5 py-2 glass-panel border border-white/20 rounded-xl hover:bg-white/10 flex items-center gap-2"
                                        >
                                            <Eye className="w-3 h-3" /> INSPECT
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                                        className="text-[10px] text-red-500 font-black uppercase tracking-widest px-5 py-2 glass-panel border border-red-500/30 rounded-xl hover:bg-red-500/10 flex items-center gap-2"
                                    >
                                        <X className="w-3 h-3" /> EJECT
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-10 group relative z-10">
                            <div className="w-28 h-28 glass-panel rounded-3xl flex items-center justify-center text-slate-600 group-hover:text-cyan-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-white/5 group-hover:border-cyan-500/40">
                                <Upload className="w-12 h-12" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-white font-black uppercase tracking-[0.4em] text-sm">
                                    UPLOAD YOUR WORK HERE
                                </p>
                                <p className="text-slate-600 font-bold text-xs">
                                    PDF FILES ONLY (MAX 10MB)
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {isUploading && (
                    <div className="mt-16 space-y-6">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 font-mono">
                            <span className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin shadow-cyan-500/50" />
                                READING YOUR FILE...
                            </span>
                            <span className="glow-cyan">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-px">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] rounded-full"
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full mt-20 py-8 bg-cyan-500 text-black font-black rounded-[2.5rem] shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            GETTING THINGS READY...
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-6 h-6 group-hover:scale-125 transition-transform" />
                            GET MY SCORE NOW
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform opacity-30" />
                        </>
                    )}
                </button>
            </div>

            {/* Preview Modal Portal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showPreview && previewUrl && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPreview(false)}
                            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-black w-full max-w-6xl h-[85vh] rounded-[3rem] border border-white/10 shadow-4xl relative overflow-hidden flex flex-col"
                            >
                                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                                    <div className="flex items-center gap-6 text-left">
                                        <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                                            <FileText className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">YOUR FILE</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> FILE NAME: {file?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all hover:glow-cyan"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-grow p-4 bg-black relative">
                                    <iframe
                                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-full rounded-2xl shadow-2xl bg-white border border-white/5"
                                        title="Artifact Preview"
                                    />
                                </div>

                                <div className="p-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-6 bg-black/40 backdrop-blur-xl">
                                    <button
                                        onClick={() => { setShowPreview(false); handleUpload(); }}
                                        className="w-full sm:w-auto px-12 py-5 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all flex items-center justify-center gap-3"
                                    >
                                        OK, START <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setShowPreview(false); setFile(null); setPreviewUrl(null); }}
                                        className="w-full sm:w-auto px-10 py-5 glass-panel text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/10"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}
