'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, Lock, ShieldAlert, ArrowUp, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api-config'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import PortfolioRenderer from '@/components/portfolio-templates/PortfolioRenderer'

export default function PortfolioPage() {
    const { slug } = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [portfolioData, setPortfolioData] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!slug) return

        const fetchPortfolio = async () => {
            setLoading(true)
            setError(null)
            try {
                // Fetch structured data only (Native rendering flow)
                const config = localStorage.getItem('access_token')
                    ? { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
                    : {}

                const response = await axios.get(
                    `${API_URL}/api/v1/skillvibe/portfolio/${slug}/data`,
                    config
                )

                if (response.data && response.data.vibe_data) {
                    setPortfolioData(response.data)
                } else {
                    setError('not-found')
                }
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setError('not-found')
                } else if (err.response?.status === 403) {
                    setError('private')
                } else {
                    setError('error')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchPortfolio()
    }, [slug])

    const handleSave = async (updatedData: any) => {
        setSaving(true)
        try {
            await axios.put(`${API_URL}/api/v1/skillvibe/portfolio/update`,
                updatedData,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
            )
            setPortfolioData(updatedData)
            setIsEditing(false)
            toast.success('Vibe updated!')
        } catch (err) {
            toast.error('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const handleUpvote = async () => {
        if (!isAuthenticated) {
            toast.error('Sign up as a Recruiter to boost talent!');
            router.push('/?auth=login&role=recruiter');
            return;
        }

        if (user?.role !== 'recruiter') {
            toast.error('Only verified scouts can boost talent signals.');
            return;
        }

        // Optimistic update — instant feedback
        const wasUpvoted = portfolioData?.interaction?.upvoted;
        const previousCount = portfolioData?.upvote_count || 0;
        const previousScore = portfolioData?.ranking_score;

        setPortfolioData((prev: any) => ({
            ...prev,
            upvote_count: wasUpvoted ? Math.max(0, previousCount - 1) : previousCount + 1,
            interaction: { ...prev.interaction, upvoted: !wasUpvoted }
        }));

        if (!wasUpvoted) toast.success('Signal Boosted!');
        else toast('Signal Boost removed', { icon: '↩️' });

        try {
            const response = await axios.post(`${API_URL}/api/v1/skillvibe/portfolio/${slug}/upvote`, {}, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });

            // Sync with server truth
            setPortfolioData((prev: any) => ({
                ...prev,
                upvote_count: response.data.upvotes,
                ranking_score: response.data.ranking_score,
                interaction: { ...prev.interaction, upvoted: response.data.voted }
            }));
        } catch (err: any) {
            // Rollback on failure
            setPortfolioData((prev: any) => ({
                ...prev,
                upvote_count: previousCount,
                ranking_score: previousScore,
                interaction: { ...prev.interaction, upvoted: wasUpvoted }
            }));
            toast.error(err.response?.data?.detail || 'Failed to upvote');
        }
    };

    const handleReport = async () => {
        if (!isAuthenticated) {
            router.push('/?auth=login&role=recruiter');
            return;
        }

        if (user?.role !== 'recruiter') {
            toast.error('Only verified scouts can report anomalies.');
            return;
        }

        // Optimistic toggle
        const wasFlagged = portfolioData?.interaction?.flagged;
        const previousScore = portfolioData?.ranking_score;

        setPortfolioData((prev: any) => ({
            ...prev,
            interaction: { ...prev.interaction, flagged: !wasFlagged }
        }));

        if (!wasFlagged) toast('Report submitted', { icon: '🚩' });
        else toast('Report withdrawn', { icon: '↩️' });

        try {
            const response = await axios.post(`${API_URL}/api/v1/skillvibe/portfolio/${slug}/flag`,
                { reason: 'Reported by recruiter' },
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
            );
            // Sync with server
            setPortfolioData((prev: any) => ({
                ...prev,
                ranking_score: response.data.ranking_score,
                interaction: { ...prev.interaction, flagged: response.data.flagged }
            }));
        } catch (err: any) {
            // Rollback
            setPortfolioData((prev: any) => ({
                ...prev,
                ranking_score: previousScore,
                interaction: { ...prev.interaction, flagged: wasFlagged }
            }));
            toast.error(err.response?.data?.detail || 'Failed to submit report');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-7 h-7 text-purple-500 animate-pulse" />
                </div>
                <p className="mt-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">
                    Synthesizing Interface...
                </p>
            </div>
        )
    }

    if (error === 'not-found') {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 px-6">
                <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-4">
                    404
                </h1>
                <p className="text-zinc-500 mb-10 max-w-md text-center text-lg font-medium">
                    This portfolio hasn't been generated with the new high-performance engine yet.
                </p>
                <Link
                    href="/"
                    className="px-10 py-4 bg-purple-600 text-white font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-purple-500 transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    if (error === 'private') {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 px-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
                    Secure Profile
                </h1>
                <p className="text-zinc-500 mb-10 max-w-md text-center text-lg">
                    This profile is currently restricted. Please contact the owner for a verified link.
                </p>
                <Link
                    href="/"
                    className="px-10 py-4 bg-zinc-800 text-white font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-zinc-700 transition-colors"
                >
                    Back Home
                </Link>
            </div>
        )
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 px-6">
                <h1 className="text-4xl font-black text-white tracking-tighter mb-4">
                    Engine Failure
                </h1>
                <p className="text-zinc-500 mb-10">We couldn't initialize the premium rendering system.</p>
                <Link
                    href="/"
                    className="px-10 py-4 bg-purple-600 text-white font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-purple-500 transition-colors"
                >
                    Try Again
                </Link>
            </div>
        )
    }

    if (portfolioData) {
        return (
            <div className="relative">
                <PortfolioRenderer
                    data={portfolioData}
                    isEditing={isEditing}
                    onSave={handleSave}
                />

                {/* Floating Navigation / Interaction Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-4 py-3 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                    {portfolioData.is_owner ? (
                        <>
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 px-5 py-2 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/10"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">Dashboard</span>
                            </Link>

                            <div className="w-px h-6 bg-white/10" />

                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center gap-3 px-6 py-2 rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] ${isEditing
                                    ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <Sparkles className={`w-3.5 h-3.5 ${isEditing ? 'animate-spin' : ''}`} />
                                {isEditing ? 'Editing Mode' : 'Customize'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleUpvote}
                                className={`flex items-center gap-3 px-6 py-2 rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] ${portfolioData.interaction?.upvoted
                                    ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <ArrowUp className={`w-3.5 h-3.5 ${portfolioData.interaction?.upvoted ? 'animate-bounce' : ''}`} />
                                {portfolioData.upvote_count || 0} Signal Boosts
                            </button>

                            <div className="w-px h-6 bg-white/10" />

                            <button
                                onClick={handleReport}
                                className={`flex items-center gap-3 px-6 py-2 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] ${portfolioData.interaction?.flagged
                                    ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] border border-red-500/30'
                                    : 'hover:bg-white/5 text-zinc-400 hover:text-red-500'
                                    }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                {portfolioData.interaction?.flagged ? 'Reported' : 'Report'}
                            </button>
                        </>
                    )}
                </motion.div>

                {saving && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-cyan-500 text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-2xl animate-bounce">
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Saving to AI Grid...
                    </div>
                )}
            </div>
        )
    }

    return null
}
