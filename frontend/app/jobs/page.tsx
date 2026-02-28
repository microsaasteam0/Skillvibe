'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Briefcase, MapPin, Search, Building2, Clock3 } from 'lucide-react'

import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal'
import { useAuth } from '../../contexts/AuthContext'
import LocationInput from '../../components/LocationInput'
import JobContent from '../../components/JobContent'

export default function JobsPage() {
  const { isAuthenticated, user } = useAuth()

  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({})

  const getErrorMessage = (error: any, fallback: string) => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      if (typeof first === 'string') return first
      if (typeof first?.msg === 'string') return first.msg
    }
    if (typeof detail?.msg === 'string') return detail.msg
    return fallback
  }

  const canApply = isAuthenticated && user?.role === 'candidate'

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const headers: any = {}
      const token = localStorage.getItem('access_token')
      if (token) headers.Authorization = `Bearer ${token}`
      const cacheKey = `jobs-list-${user?.id || 'guest'}-${search || ''}-${location || ''}`
      const data = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/jobs`, {
            params: { q: search || undefined, location: location || undefined },
            headers,
          })
          return response.data || []
        },
        5000
      )
      setJobs(data)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = async (jobId: number) => {
    if (!isAuthenticated) {
      setAuthModalMode('login')
      setShowAuthModal(true)
      return
    }
    if (user?.role !== 'candidate') {
      toast.error('Switch to candidate role to apply')
      return
    }
    try {
      await axios.post(
        `${API_URL}/api/v1/jobs/${jobId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      )
      requestCache.invalidate(`jobs-list-${user?.id || 'guest'}-${search || ''}-${location || ''}`)
      if (user?.id) {
        requestCache.invalidate(`dashboard-applied-jobs-${user.id}`)
      }
      toast.success('Application submitted')
      fetchJobs()
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Could not apply'))
    }
  }

  const filteredJobs = useMemo(() => jobs, [jobs])

  const toCompanySlug = (name?: string, recruiterId?: number) => {
    const safeName = (name || 'company')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'company'
    return safeName
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
        defaultRole="candidate"
      />
      <DashboardModal isOpen={showDashboard} onClose={() => setShowDashboard(false)} />

      <main className="pt-44 pb-28 relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
              OPEN <span className="text-gradient-cyan">JOBS</span>
            </h1>
            <p className="text-slate-500 font-bold mt-4 uppercase text-sm tracking-wider">
              Find roles and apply in one click
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, company, stack..."
                className="w-full pl-10 pr-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm font-bold"
              />
            </div>
            <div className="relative">
              <LocationInput
                value={location}
                onChange={setLocation}
                placeholder="Global Location (e.g. London, Tokyo...)"
                className="py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm font-bold"
              />
            </div>
          </div>

          <button
            onClick={fetchJobs}
            className="mb-8 px-6 py-3 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest"
          >
            Search Jobs
          </button>

          <div className="space-y-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-52 rounded-3xl bg-white/5 animate-pulse" />)
            ) : filteredJobs.length === 0 ? (
              <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02] text-slate-500 font-bold">
                No jobs found
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-3">
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">{job.title}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                        <span className="inline-flex items-center gap-2"><Building2 className="w-4 h-4" />{job.company_name}</span>
                        <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{job.location || 'Remote'}</span>
                        <span className="inline-flex items-center gap-2"><Briefcase className="w-4 h-4" />{job.job_type}</span>
                        <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" />{job.work_mode}</span>
                      </div>
                      <div className="max-w-3xl">
                        <div className="mb-6">
                          <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mb-3">About Role</p>
                          <JobContent content={job.description} isExpanded={expandedJobs[job.id]} />
                        </div>
                        {job.requirements && (
                          <div className="mb-6 border-t border-white/5 pt-6">
                            <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mb-3">Requirements</p>
                            <JobContent content={job.requirements} isExpanded={expandedJobs[job.id]} />
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedJobs(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                          className="px-4 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[11px] font-black uppercase tracking-widest hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all mt-2"
                        >
                          {expandedJobs[job.id] ? 'Show Less' : 'View Full Details'}
                        </button>
                      </div>
                      {job.salary_range && (
                        <p className="text-cyan-500 text-xs uppercase tracking-widest font-black">Salary: {job.salary_range}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={job.has_applied || !job.is_active}
                        className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        {job.has_applied ? 'Applied' : 'Apply Now'}
                      </button>
                      <Link
                        href={job.posted_by?.id ? `/company/${toCompanySlug(job.company_name, job.posted_by.id)}` : '#'}
                        className="px-6 py-3 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-widest text-center"
                      >
                        View Recruiter
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
