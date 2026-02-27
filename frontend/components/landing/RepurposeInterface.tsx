import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, Twitter,
    Loader2, Copy, Check, Star, Zap, Shield, Users, TrendingUp, Clock,
    ChevronRight, Play, ArrowRight, HelpCircle, CheckCircle, AlertCircle,
    User, LogIn, Settings, Crown, Lock, X, Plus, MessageSquare, Globe, Mail
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { XDisplay } from '../FormattedText'
import { Download } from 'lucide-react'

interface Task {
    id: string
    text: string
    completed: boolean
}

interface RepurposeInterfaceProps {
    isAuthenticated: boolean
    user: any
    usageStats: any
    featureGate: any
    content: string
    setContent: (val: string) => void
    url: string
    setUrl: (val: string) => void
    activeTab: 'content' | 'url'
    setActiveTab: (val: 'content' | 'url') => void
    isLoading: boolean
    handleSubmit: () => void
    results: any
    transformProgress: number
    currentProcessingStep: string
    handleSaveContent: (title: string, type: string, content: string) => Promise<void>
    personalization: any
    setPersonalization: (val: any) => void
    showPersonalization: boolean
    setShowPersonalization: (val: boolean) => void
    onShowAuthModal: (mode: 'login' | 'register') => void
    onShowPaymentModal: () => void
    onShowDashboard: () => void
    onStartOnboarding: () => void
    onShowCustomTemplateModal: () => void
    onShowTemplateSelector: () => void
    setTemplateSelectorSource: (val: string) => void
}

export default function RepurposeInterface({
    isAuthenticated,
    user,
    usageStats,
    featureGate,
    content,
    setContent,
    url,
    setUrl,
    activeTab,
    setActiveTab,
    isLoading,
    handleSubmit,
    results,
    transformProgress,
    currentProcessingStep,
    handleSaveContent,
    personalization,
    setPersonalization,
    showPersonalization,
    setShowPersonalization,
    onShowAuthModal,
    onShowPaymentModal,
    onShowDashboard,
    onStartOnboarding,
    onShowCustomTemplateModal,
    onShowTemplateSelector,
    setTemplateSelectorSource
}: RepurposeInterfaceProps) {

    const [tasks, setTasks] = useState<Task[]>([])
    const [eveningReflection, setEveningReflection] = useState('')

    // Sync from parent content prop to local state (restoration/template loading)
    useEffect(() => {
        // Construct current local representation to check for changes
        const morningString = tasks.map(t => `${t.completed ? '[x]' : '[ ]'} ${t.text}`).join('\n')
        const currentLocal = `MORNING PLAN:\n${morningString}\n\nEVENING REFLECTION:\n${eveningReflection}`.trim()

        // Normalize content for comparison
        const normalizedContent = (content || '').trim()

        // Only update if content is different (external change) and not empty (unless we want to clear)
        if (normalizedContent !== currentLocal && normalizedContent) {
            try {
                const parts = normalizedContent.split('EVENING REFLECTION:')
                const morningPart = parts[0].replace('MORNING PLAN:', '').trim()
                const eveningPart = parts.length > 1 ? parts[1].trim() : ''

                const newTasks = morningPart.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const completed = line.toLowerCase().includes('[x]')
                        const text = line.replace(/\[.?\]/g, '').trim()
                        return {
                            id: Math.random().toString(36).substr(2, 9),
                            text,
                            completed
                        }
                    })
                    .filter(t => t.text)

                setTasks(newTasks)
                setEveningReflection(eveningPart)
            } catch (e) {
                console.error("Failed to parse content sync", e)
            }
        }
    }, [content]) // Dependency on content prop

    // Update parent content whenever local inputs change
    useEffect(() => {
        const morningString = tasks.map(t => `${t.completed ? '[x]' : '[ ]'} ${t.text}`).join('\n')
        const combined = `MORNING PLAN:\n${morningString}\n\nEVENING REFLECTION:\n${eveningReflection}`
        if (content !== combined) {
            setContent(combined)
        }
    }, [tasks, eveningReflection, setContent])

    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopiedStates({ ...copiedStates, [key]: true })
        toast.success('Copied to clipboard!')
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [key]: false }))
        }, 2000)
    }

    const handleExport = (data: string | string[], platform: string, format: 'txt' | 'json' | 'csv' = 'txt') => {
        if (!user?.is_premium) {
            toast.error('Pro Required: This is a premium feature.')
            return
        }

        let content = ''
        let mime = 'text/plain'
        let ext = format

        if (format === 'json') {
            content = JSON.stringify({
                platform,
                date: new Date().toISOString(),
                data
            }, null, 2)
            mime = 'application/json'
        } else if (format === 'csv') {
            mime = 'text/csv'
            if (Array.isArray(data)) {
                content = `"Index","Content"\n` + data.map((item, i) => `"${i + 1}","${item.replace(/"/g, '""')}"`).join('\n')
            } else {
                content = `"Content"\n"${data.replace(/"/g, '""')}"`
            }
        } else {
            // TXT
            content = Array.isArray(data) ? data.join('\n\n---\n\n') : data
        }

        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `ENTREXT_STRATEGY_${platform.toUpperCase()}_${timestamp}.${ext}`
        const blob = new Blob([content], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(`Export Finished: ${format.toUpperCase()}`)
    }

    return (
        <div className="container px-4 mx-auto pb-24" id="repurpose-tool">

            {/* Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-5xl mx-auto"
            >
                <div className="bg-zinc-50 dark:bg-[#020617] rounded-[3rem] overflow-hidden shadow-4xl relative border border-zinc-200 dark:border-slate-800 group">
                    {/* Blueprint Overlay */}
                    <div className="absolute inset-0 bg-grid-blueprint-light opacity-5 pointer-events-none" />

                    {/* Header Area */}
                    <div className="p-6 sm:p-10 pb-0 text-center relative z-10">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-zinc-100 dark:bg-slate-900/50 rounded-lg mb-6 sm:mb-8 border border-zinc-200 dark:border-slate-800">
                            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 dark:text-slate-400 tracking-[0.2em] sm:tracking-[0.3em] flex items-center gap-2 sm:gap-3">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                Workspace
                            </span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-10 pt-4 relative z-10">
                        <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
                            <p className="text-zinc-500 dark:text-slate-400 font-bold text-[10px] sm:text-[11px] tracking-widest leading-relaxed px-2">
                                Protip: Share your progress to grow your audience. You build, we write.
                            </p>
                        </div>

                        {/* Input Area - Split View */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                            {/* Morning Input - To-Do List */}
                            <div className="relative group flex flex-col h-full">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                                <div className="relative bg-zinc-100 dark:bg-slate-900 rounded-[2rem] overflow-hidden h-full border border-zinc-200 dark:border-slate-800 flex flex-col shadow-sm transition-all group-hover:shadow-xl group-hover:border-indigo-500/30">
                                    <div className="bg-zinc-200/50 dark:bg-slate-800/50 p-4 border-b border-zinc-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <span className="font-black text-zinc-900 dark:text-white text-[10px] sm:text-[11px] uppercase tracking-widest">Today's Goals</span>
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 whitespace-nowrap">
                                            {tasks.filter(t => t.completed).length}/{tasks.length} tasks
                                        </div>
                                    </div>

                                    <div className="flex-1 p-4 sm:p-5 flex flex-col gap-4 min-h-[16rem]">
                                        {/* Task Input */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="What are you doing today?"
                                                className="flex-1 min-w-0 bg-zinc-200/50 dark:bg-slate-800/50 border border-zinc-300 dark:border-slate-700 rounded-xl px-4 sm:px-5 py-3 text-xs font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400/50 dark:placeholder:text-slate-600 truncate"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const target = e.target as HTMLInputElement;
                                                        const val = target.value.trim();
                                                        if (val) {
                                                            setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), text: val, completed: false }]);
                                                            target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val) {
                                                        setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), text: val, completed: false }]);
                                                        input.value = '';
                                                    }
                                                }}
                                                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Task List */}
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {tasks.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-sm italic">
                                                    <span className="text-2xl mb-2 opacity-50">📝</span>
                                                    No tasks yet. Add your first task.
                                                </div>
                                            ) : (
                                                tasks.map((task, idx) => (
                                                    <div
                                                        key={task.id}
                                                        className={`group/item flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${task.completed
                                                            ? 'bg-emerald-500/5 border-emerald-500/10 opacity-70'
                                                            : 'bg-zinc-200/50 dark:bg-slate-800/30 border-transparent hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                const newTasks = [...tasks]
                                                                newTasks[idx].completed = !newTasks[idx].completed
                                                                setTasks(newTasks)
                                                            }}
                                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.completed
                                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                : 'border-zinc-300 dark:border-slate-600 text-indigo-500 group-hover/item:border-indigo-500'
                                                                }`}
                                                        >
                                                            <Check className={`w-3.5 h-3.5 transition-opacity ${task.completed ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-30'}`} />
                                                        </button>
                                                        <span className={`flex-1 text-xs font-black tracking-widest transition-all ${task.completed
                                                            ? 'text-slate-400 dark:text-slate-600 line-through'
                                                            : 'text-zinc-900 dark:text-slate-300'
                                                            }`}>
                                                            {task.text}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                const newTasks = [...tasks]
                                                                newTasks.splice(idx, 1)
                                                                setTasks(newTasks)
                                                            }}
                                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Evening Input */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                                <div className="relative bg-zinc-100 dark:bg-slate-900 rounded-[2rem] overflow-hidden h-full border border-zinc-200 dark:border-slate-800 group-hover:shadow-xl group-hover:border-indigo-500/30 transition-all flex flex-col">
                                    <div className="bg-zinc-200/50 dark:bg-slate-800/50 p-4 border-b border-zinc-200 dark:border-slate-800 flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <span className="font-black text-zinc-900 dark:text-white text-[10px] sm:text-[11px] tracking-widest">How did it go?</span>
                                    </div>
                                    <textarea
                                        value={eveningReflection}
                                        onChange={(e) => setEveningReflection(e.target.value)}
                                        placeholder="What did you build today?&#10;&#10;e.g.&#10;Shipped the landing page! But the bug was harder than expected. Tired but happy. Lessons learned about React hooks..."
                                        className="w-full flex-1 min-h-[16rem] p-4 sm:p-6 bg-transparent border-0 focus:ring-0 outline-none resize-none text-sm font-bold tracking-tight placeholder:text-zinc-400 dark:placeholder:text-slate-600 text-zinc-900 dark:text-slate-300 leading-relaxed custom-scrollbar"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Controls & Personalization */}
                        {isAuthenticated && (
                            <div className="mb-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <button
                                        onClick={() => setShowPersonalization(!showPersonalization)}
                                        className="flex items-center text-xs sm:text-sm font-black text-zinc-500 dark:text-slate-400 hover:text-indigo-500 transition-colors tracking-widest"
                                    >
                                        <Settings className="w-3.5 h-3.5 mr-2" />
                                        {showPersonalization ? 'Hide' : 'Show'} settings
                                    </button>

                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/10 dark:border-slate-700 text-[10px] font-black tracking-widest">
                                            <Twitter className="w-3.5 h-3.5" />
                                            Platform: Twitter
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {showPersonalization && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted/30 rounded-2xl border border-border/50">
                                                <div>
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">Target audience</label>
                                                    <input
                                                        type="text"
                                                        value={personalization.audience}
                                                        onChange={(e) => setPersonalization({ ...personalization, audience: e.target.value })}
                                                        placeholder="e.g. Founders, Developers..."
                                                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Post style</label>
                                                    <select
                                                        value={personalization.tone}
                                                        onChange={(e) => setPersonalization({ ...personalization, tone: e.target.value })}
                                                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                                                    >
                                                        <option>Professional</option>
                                                        <option>Casual</option>
                                                        <option>Enthusiastic</option>
                                                        <option>Witty</option>
                                                        <option>Direct</option>
                                                    </select>
                                                </div>
                                                {/* Add more fields as needed but keep it clean */}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col items-center justify-center gap-6">
                            {!isAuthenticated ? (
                                <div className="text-center w-full px-4">
                                    <button
                                        onClick={() => onShowAuthModal('register')}
                                        className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-2xl shadow-indigo-600/20 hover:scale-[1.03] active:scale-95 transition-all duration-300 uppercase tracking-[0.1em] sm:tracking-[0.2em] relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-white/20 blur-sm opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-scanline" />
                                        <div className="flex items-center justify-center">
                                            <Zap className="w-5 h-5 mr-3 sm:mr-4 fill-current" />
                                            Create Posts
                                        </div>
                                    </button>
                                    <p className="mt-6 text-[8px] sm:text-[10px] font-black text-zinc-500 tracking-widest sm:tracking-[0.4em] px-2 truncate">Free to use. No card needed.</p>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center">
                                    <button
                                        onClick={() => {
                                            // ... existing validation
                                            if (tasks.length === 0) {
                                                toast.error('Wait: Please add at least one goal for today.')
                                                return
                                            }
                                            if (!eveningReflection.trim()) {
                                                toast.error('Wait: Please write something about your day.')
                                                return
                                            }
                                            if (!personalization.audience?.trim()) {
                                                if (!showPersonalization) setShowPersonalization(true)
                                                toast.error('Wait: Who are these posts for?')
                                                return
                                            }
                                            if (!personalization.tone?.trim()) {
                                                if (!showPersonalization) setShowPersonalization(true)
                                                toast.error('Wait: How should the posts sound?')
                                                return
                                            }
                                            handleSubmit()
                                        }}
                                        disabled={isLoading || (usageStats?.remaining_requests <= 0 && !user?.is_premium)}
                                        className="group relative w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white font-black text-base sm:text-xl rounded-[1.25rem] sm:rounded-2xl shadow-xl hover:shadow-primary/25 hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden uppercase tracking-widest"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-spin" />
                                                <span className="text-sm sm:text-base">Generating...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                                                    <span className="text-sm sm:text-base">Generate posts</span>
                                                </div>
                                                {usageStats && (
                                                    <span className="text-[9px] sm:text-[10px] opacity-80 font-black bg-black/20 px-2.5 py-1 rounded-lg border border-white/10 tracking-tighter">
                                                        ({usageStats.remaining_requests}/{usageStats.rate_limit} left)
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Button shimmers */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    </button>

                                    {/* Progress Bar */}
                                    <AnimatePresence>
                                        {isLoading && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="w-full max-w-lg mt-6"
                                            >
                                                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                                    <span>{currentProcessingStep}</span>
                                                    <span>{Math.round(transformProgress)}%</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${transformProgress}%` }}
                                                        transition={{ ease: "linear" }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </motion.div>

            {/* Results Section */}
            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mt-32 max-w-6xl mx-auto"
                        id="results-section"
                    >
                        <div className="text-center mb-16 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black tracking-widest border border-indigo-500/20 mb-4">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Your generated content
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-black text-zinc-900 dark:text-white tracking-tighter">
                                Ready to post
                            </h2>
                            <p className="text-zinc-500 dark:text-slate-400 font-bold text-[10px] tracking-[0.4em]">Your posts are ready. Read them below.</p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <div className="bg-zinc-100/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 min-h-[600px] relative border border-zinc-200 dark:border-slate-800 shadow-5xl group">
                                <div className="absolute inset-0 bg-grid-blueprint-light opacity-5 pointer-events-none" />


                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-10 relative z-10"
                                >
                                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-zinc-200 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-[#1DA1F2]/10 border-[#1DA1F2]/20">
                                                <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                                    Twitter thread
                                                </h3>
                                                <div className="text-[10px] font-bold text-zinc-500 tracking-widest mt-1">
                                                    Ready to share • v1.0.4
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {user?.is_premium && (
                                                <div className="flex bg-indigo-500/10 rounded-xl p-1 border border-indigo-500/20">
                                                    <button
                                                        onClick={() => handleExport(results.twitter_thread, 'twitter', 'txt')}
                                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Export TXT"
                                                    >
                                                        TXT
                                                    </button>
                                                    <div className="w-px bg-indigo-500/20 my-1"></div>
                                                    <button
                                                        onClick={() => handleExport(results.twitter_thread, 'twitter', 'json')}
                                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Export JSON"
                                                    >
                                                        JSON
                                                    </button>
                                                    <div className="w-px bg-indigo-500/20 my-1"></div>
                                                    <button
                                                        onClick={() => handleExport(results.twitter_thread, 'twitter', 'csv')}
                                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Export CSV"
                                                    >
                                                        CSV
                                                    </button>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => copyToClipboard(results.twitter_thread.join('\n\n'), 'twitter')}
                                                className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                                            >
                                                {copiedStates['twitter'] ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                {copiedStates['twitter'] ? 'Copied!' : 'Copy all'}
                                            </button>
                                        </div>
                                    </div>

                                    <XDisplay
                                        tweets={results.twitter_thread}
                                        copiedStates={copiedStates}
                                        onCopy={copyToClipboard}
                                        onSave={isAuthenticated ? () => handleSaveContent('Twitter Thread', 'twitter', results.twitter_thread.join('\n\n')) : undefined}
                                        onExport={(format) => handleExport(results.twitter_thread, 'twitter', format)}
                                        isPremium={user?.is_premium}
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
