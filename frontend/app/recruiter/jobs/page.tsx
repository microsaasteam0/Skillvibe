'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Sparkles, Brain, UserCheck, ChevronRight, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import AuthModal from '../../../components/AuthModal'
import DashboardModal from '../../../components/DashboardModal'
import { useAuth } from '../../../contexts/AuthContext'
import LocationInput from '../../../components/LocationInput'
import CustomSelect from '../../../components/CustomSelect'
import JobContent from '../../../components/JobContent'

const STATUS_OPTIONS = ['applied', 'shortlisted', 'interview', 'rejected', 'hired']

const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const WORK_MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

export default function RecruiterJobsPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  const [jobs, setJobs] = useState<any[]>([])
  const [applicationsByJob, setApplicationsByJob] = useState<Record<number, any[]>>({})
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null)
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [matchingJobId, setMatchingJobId] = useState<number | null>(null)
  const [aiMatchesByJob, setAiMatchesByJob] = useState<Record<number, any[]>>({})

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)

  const [form, setForm] = useState({
    title: '',
    company_name: '',
    location: 'Remote',
    job_type: 'full-time',
    work_mode: 'remote',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '',
  })

  const getErrorMessage = (error: any, fallback: string) => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      if (typeof first === 'string') return first

      // Handle Pydantic specific min_length error (FastAPI)
      if (first?.type === 'string_too_short' || first?.type === 'value_error.any_str.min_length') {
        const field = first?.loc?.[first.loc.length - 1]
        const limit = first?.ctx?.limit_value || first?.ctx?.limit
        return `${field ? field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ') : 'Field'} must be at least ${limit} characters long.`
      }

      if (typeof first?.msg === 'string') {
        if (first.msg.toLowerCase().includes('at least')) {
          const field = first?.loc?.[first.loc.length - 1]
          return `${field ? field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ') : 'Field'} ${first.msg.toLowerCase()}`
        }
        return first.msg
      }
    }
    if (typeof detail?.msg === 'string') return detail.msg
    return fallback
  }

  const authHeader = { Authorization: `Bearer ${localStorage.getItem('access_token')}` }

  const fetchMyJobs = async () => {
    setLoading(true)
    try {
      const data = await requestCache.get(
        `recruiter-jobs-${user?.id || 'unknown'}`,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/jobs/recruiter/me`, { headers: authHeader })
          return response.data || []
        },
        5000
      )
      setJobs(data)
    } catch (error: any) {
      if (error?.response?.status === 401) toast.error('Please log in')
      else toast.error(getErrorMessage(error, 'Failed to load jobs'))
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async (jobId: number) => {
    try {
      const data = await requestCache.get(
        `job-applications-${jobId}`,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/jobs/${jobId}/applications`, { headers: authHeader })
          return response.data || []
        },
        5000
      )
      setApplicationsByJob(prev => ({ ...prev, [jobId]: data }))
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load applications'))
    }
  }

  const findTopMatches = async (jobId: number) => {
    setMatchingJobId(jobId)
    try {
      const response = await axios.get(`${API_URL}/api/v1/skillvibe/job-matches/${jobId}`, { headers: authHeader })
      setAiMatchesByJob(prev => ({ ...prev, [jobId]: response.data }))
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'AI Engine currently recalibrating...'))
    } finally {
      setMatchingJobId(null)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === 'recruiter') {
      fetchMyJobs()
      if (user.company_info || user.company_location) {
        setForm(prev => ({
          ...prev,
          company_name: user.company_info || prev.company_name,
          location: user.company_location || prev.location
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role, user?.company_info, user?.company_location])

  const submitJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const minSalary = Number(form.salary_min)
      const maxSalary = Number(form.salary_max)
      if (!Number.isFinite(minSalary) || !Number.isFinite(maxSalary) || minSalary <= 0 || maxSalary <= 0) {
        toast.error('Salary min and max must be valid positive numbers')
        setCreating(false)
        return
      }
      if (minSalary > maxSalary) {
        toast.error('Salary min cannot be greater than salary max')
        setCreating(false)
        return
      }

      const payload = {
        title: form.title,
        company_name: form.company_name,
        location: form.location,
        job_type: form.job_type,
        work_mode: form.work_mode,
        salary_range: `${Math.trunc(minSalary)}-${Math.trunc(maxSalary)}`,
        description: form.description,
        requirements: form.requirements,
      }

      await axios.post(`${API_URL}/api/v1/jobs`, payload, { headers: authHeader })
      requestCache.invalidate(`recruiter-jobs-${user?.id || 'unknown'}`)
      toast.success('Job posted')
      setForm({
        title: '',
        company_name: user?.company_info || '',
        location: user?.company_location || 'Remote',
        job_type: 'full-time',
        work_mode: 'remote',
        salary_min: '',
        salary_max: '',
        description: '',
        requirements: '',
      })
      fetchMyJobs()
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Could not post job'))
    } finally {
      setCreating(false)
    }
  }

  const toggleJobStatus = async (job: any) => {
    try {
      await axios.patch(
        `${API_URL}/api/v1/jobs/${job.id}`,
        { is_active: !job.is_active },
        { headers: authHeader }
      )
      requestCache.invalidate(`recruiter-jobs-${user?.id || 'unknown'}`)
      toast.success(job.is_active ? 'Job closed' : 'Job reopened')
      fetchMyJobs()
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Could not update job'))
    }
  }

  const updateApplicationStatus = async (applicationId: number, status: string, jobId: number) => {
    try {
      await axios.patch(
        `${API_URL}/api/v1/jobs/applications/${applicationId}/status`,
        { status },
        { headers: authHeader }
      )
      requestCache.invalidate(`job-applications-${jobId}`)
      requestCache.invalidate(`recruiter-jobs-${user?.id || 'unknown'}`)
      toast.success('Status updated')
      fetchApplications(jobId)
      fetchMyJobs()
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Could not update status'))
    }
  }

  const openCompanyProfile = () => {
    if (!user?.id) {
      toast.error('Please log in first')
      return
    }
    const companyName = user.company_info || jobs?.[0]?.company_name || form.company_name
    let slug = ''
    if (companyName) {
      slug = companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }
    slug = slug || user?.id?.toString() || 'company'
    router.push(`/company/${slug}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar
          onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
          onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
          onUserDashboard={() => setShowDashboard(true)}
        />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authModalMode} defaultRole="recruiter" />
        <DashboardModal isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
        <main className="pt-44 container mx-auto px-6 text-white">
          <p className="font-black uppercase">Please log in as recruiter</p>
        </main>
      </div>
    )
  }

  if (user?.role !== 'recruiter') {
    return (
      <div className="min-h-screen bg-black">
        <Navbar onUserDashboard={() => setShowDashboard(true)} />
        <DashboardModal isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
        <main className="pt-44 container mx-auto px-6 text-white">
          <p className="font-black uppercase">Recruiter access only</p>
          <Link href="/jobs" className="text-cyan-400 uppercase text-sm font-black">Go to jobs marketplace</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Navbar
        onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
        onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
        onUserDashboard={() => setShowDashboard(true)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authModalMode} defaultRole="recruiter" />
      <DashboardModal isOpen={showDashboard} onClose={() => setShowDashboard(false)} />

      <main className="pt-44 pb-28 relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <section>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
              JOB <span className="text-gradient-cyan">PORTAL</span>
            </h1>
            <p className="text-slate-500 uppercase text-sm font-bold mt-3 tracking-widest">
              Post roles and manage your hiring pipeline
            </p>
          </section>

          <section className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl text-white font-black uppercase mb-6">Create Job</h2>
            <div className="mb-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-bold leading-6">
              Complete company details clearly. Candidates will see this as your company profile when they click "View Recruiter".
            </div>
            <div className="mb-6 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-white text-xs font-black uppercase tracking-widest mb-3">How Company Profile Works</p>
              <div className="space-y-2 text-slate-300 text-sm leading-6">
                <p>1. Fill company name, location, role description, and requirements clearly.</p>
                <p>2. Post at least one job. Your latest posted job details become your company profile summary.</p>
                <p>3. Candidates clicking <span className="font-black text-white">View Recruiter</span> will see your company profile page.</p>
              </div>
              <button
                type="button"
                onClick={openCompanyProfile}
                className="mt-4 px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-black uppercase tracking-widest"
              >
                Open Company Profile
              </button>
            </div>
            <form onSubmit={submitJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-bold" placeholder="Job title (e.g. Senior AI Engineer)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input
                className={`px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-bold ${user?.company_info ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Company name (e.g. Entrext Labs)"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                required
                readOnly={!!user?.company_info}
              />
              <div className="md:col-span-1">
                <LocationInput
                  value={form.location}
                  onChange={(val) => setForm(prev => ({ ...prev, location: val }))}
                  placeholder="Job Location (City, Country)"
                  className="py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  placeholder="Salary min"
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value.replace(/[^\d]/g, '') })}
                  required
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  placeholder="Salary max"
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value.replace(/[^\d]/g, '') })}
                  required
                />
              </div>
              <CustomSelect
                options={JOB_TYPE_OPTIONS}
                value={form.job_type}
                onChange={(val) => setForm(prev => ({ ...prev, job_type: val }))}
                placeholder="Job Type"
              />
              <CustomSelect
                options={WORK_MODE_OPTIONS}
                value={form.work_mode}
                onChange={(val) => setForm(prev => ({ ...prev, work_mode: val }))}
                placeholder="Work Mode"
              />
              <textarea className="md:col-span-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white min-h-[120px]" placeholder="Role description: team context, responsibilities, and expected outcomes." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <textarea className="md:col-span-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white min-h-[100px]" placeholder="Requirements: core skills, years of experience, tools/stack, and must-haves." value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
              <button disabled={creating} className="md:col-span-2 px-6 py-3 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest disabled:opacity-50">
                {creating ? 'Posting...' : 'Post Job'}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl text-white font-black uppercase">My Job Posts</h2>
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="h-44 rounded-3xl bg-white/5 animate-pulse" />)
            ) : jobs.length === 0 ? (
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-slate-500 font-bold">No job posts yet</div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl text-white font-black uppercase italic">{job.title}</h3>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                        {job.company_name} • {job.location || 'Remote'} • {job.application_count} applications
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setExpandedPostId(expandedPostId === job.id ? null : job.id)}
                        className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5"
                      >
                        {expandedPostId === job.id ? 'Hide Details' : 'View Post'}
                      </button>
                      <button onClick={() => toggleJobStatus(job)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5">
                        {job.is_active ? 'Close Job' : 'Reopen Job'}
                      </button>
                      <button
                        onClick={() => {
                          const next = expandedJobId === job.id ? null : job.id
                          setExpandedJobId(next)
                          if (next) fetchApplications(job.id)
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-black uppercase tracking-widest"
                      >
                        {expandedJobId === job.id ? 'Hide applications' : 'View applications'}
                      </button>
                      <button
                        onClick={() => findTopMatches(job.id)}
                        disabled={matchingJobId === job.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 ${matchingJobId === job.id ? 'animate-spin' : ''}`} />
                        {matchingJobId === job.id ? 'AI Matching...' : 'AI Signal Search'}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(aiMatchesByJob[job.id] || []).length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-8 border-t border-purple-500/20 pt-8"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <Brain className="w-5 h-5 text-purple-400" />
                          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">AI-Matched <span className="text-purple-400">Elite Talent</span></h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {(aiMatchesByJob[job.id] || []).map((match, idx) => (
                            <motion.div
                              key={match.slug}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black">
                                  {match.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-[10px] font-black text-purple-400">
                                  MATCH: {match.match_score}%
                                </div>
                              </div>
                              <h5 className="text-white font-black truncate">{match.full_name}</h5>
                              <p className="text-purple-400/60 text-[10px] uppercase font-black tracking-widest mb-4 truncate">{match.elite_tag || 'Verified Talent'}</p>
                              <p className="text-slate-400 text-xs leading-relaxed italic mb-6 flex-grow">
                                "{match.explanation?.slice(0, 100)}..."
                              </p>
                              <Link
                                href={`/profile/${match.slug}`}
                                className="w-full py-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all"
                              >
                                Deep Scan Profile
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {expandedPostId === job.id && (
                    <div className="mt-8 border-t border-white/5 pt-8">
                      <div className="max-w-4xl mx-auto space-y-8">
                        <div>
                          <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mb-3">Post Description</p>
                          <JobContent content={job.description} isExpanded={true} />
                        </div>
                        {job.requirements && (
                          <div className="pt-6 border-t border-white/5">
                            <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mb-3">Key Requirements</p>
                            <JobContent content={job.requirements} isExpanded={true} />
                          </div>
                        )}
                        {job.salary_range && (
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Expected Compensation: <span className="text-cyan-400">{job.salary_range}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {expandedJobId === job.id && (
                    <div className="mt-6 space-y-3">
                      {(applicationsByJob[job.id] || []).length === 0 ? (
                        <p className="text-slate-500 text-sm font-bold">No applications yet</p>
                      ) : (
                        (applicationsByJob[job.id] || []).map((app) => (
                          <div key={app.application_id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="text-white font-black">{app.candidate?.full_name || app.candidate?.username}</p>
                              <p className="text-slate-500 text-xs font-bold">{app.candidate?.email}</p>
                              {app.candidate?.slug && (
                                <Link href={`/profile/${app.candidate.slug}`} className="text-cyan-400 text-xs font-black uppercase">View Profile</Link>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <select
                                value={app.status}
                                onChange={(e) => updateApplicationStatus(app.application_id, e.target.value, job.id)}
                                className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-black uppercase"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
