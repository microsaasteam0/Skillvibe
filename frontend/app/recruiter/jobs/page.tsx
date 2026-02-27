'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import AuthModal from '../../../components/AuthModal'
import DashboardModal from '../../../components/DashboardModal'
import { useAuth } from '../../../contexts/AuthContext'

const STATUS_OPTIONS = ['applied', 'shortlisted', 'interview', 'rejected', 'hired']

export default function RecruiterJobsPage() {
  const { isAuthenticated, user } = useAuth()

  const [jobs, setJobs] = useState<any[]>([])
  const [applicationsByJob, setApplicationsByJob] = useState<Record<number, any[]>>({})
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

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
      if (typeof first?.msg === 'string') return first.msg
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

  useEffect(() => {
    if (isAuthenticated && user?.role === 'recruiter') fetchMyJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

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
        company_name: '',
        location: 'Remote',
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
    const companyName = jobs?.[0]?.company_name || form.company_name || 'company'
    const slug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'company'
    window.open(`/company/${slug}-${user.id}`, '_blank')
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
              <input className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white" placeholder="Job title (e.g. Senior AI Engineer)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white" placeholder="Company name (e.g. Entrext Labs)" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
              <input className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white" placeholder="Location (e.g. Pune, India)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
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
              <select className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <select className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white" value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value })}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
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
                      <button onClick={() => toggleJobStatus(job)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest">
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
                        {expandedJobId === job.id ? 'Hide Applications' : 'View Applications'}
                      </button>
                    </div>
                  </div>

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
