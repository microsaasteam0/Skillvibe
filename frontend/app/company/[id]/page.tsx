'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { MapPin, Briefcase, ArrowLeft } from 'lucide-react'

import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'
import { useAuth } from '../../../contexts/AuthContext'
import LocationInput from '../../../components/LocationInput'
import JobContent from '../../../components/JobContent'

export default function CompanyProfilePage() {
  const { user } = useAuth()
  const isRecruiter = user?.role === 'recruiter'
  const params = useParams()
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const recruiterId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    company_name: '',
    location: '',
    overview: '',
  })
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({})

  const getErrorMessage = (error: any, fallback: string) => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      if (typeof first === 'string') return first

      // Handle Pydantic specific min_length error
      if (first?.type === 'string_too_short') {
        const field = first?.loc?.[first.loc.length - 1]
        const limit = first?.ctx?.limit_value
        if (field === 'overview') return `Company overview must be at least ${limit} characters.`
        return `${field || 'Field'} is too short (min ${limit} characters).`
      }

      if (typeof first?.msg === 'string') {
        // Fallback for generic "String should have at least 20 characters"
        if (first.msg.includes('at least 20 characters')) {
          return "Company overview must be at least 20 characters long."
        }
        return first.msg
      }
    }
    if (typeof detail?.msg === 'string') return detail.msg
    return fallback
  }

  useEffect(() => {
    const load = async () => {
      if (!recruiterId) {
        setLoading(false)
        toast.error('Invalid company URL')
        return
      }
      setLoading(true)
      try {
        const cacheKey = `recruiter-company-${recruiterId}-${user?.id || 'guest'}`
        const companyData = await requestCache.get(
          cacheKey,
          async () => {
            const headers: any = {}
            const token = localStorage.getItem('access_token')
            if (token) headers.Authorization = `Bearer ${token}`

            const response = await axios.get(`${API_URL}/api/v1/jobs/recruiter/${recruiterId}/company`, {
              headers,
              timeout: 10000,
            })
            return response.data
          },
          0 // Set TTL to 0 to disable caching and ensure fresh data
        )
        setData(companyData)
        setEditForm({
          company_name: companyData?.company?.name || '',
          location: companyData?.company?.location || 'Remote',
          overview: companyData?.company?.overview || '',
        })
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Could not load company profile'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [recruiterId])

  const isOwner = Number(user?.id) === Number(data?.recruiter?.id)

  const handleSaveCompanyProfile = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Please log in first')
        return
      }

      const overviewValue = editForm.overview?.trim() || ''
      if (!overviewValue) {
        toast.error('Company overview is required.')
        setSaving(false)
        return
      }

      if (overviewValue.length < 20) {
        toast.error('Company overview must be at least 20 characters long.')
        setSaving(false)
        return
      }

      const response = await axios.put(
        `${API_URL}/api/v1/jobs/recruiter/${recruiterId}/company`,
        {
          company_name: editForm.company_name.trim(),
          location: editForm.location.trim(),
          overview: overviewValue,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const updated = {
        ...data,
        company: {
          ...data?.company,
          ...(response.data?.company || {}),
        },
      }
      setData(updated)
      requestCache.invalidate(`recruiter-company-${recruiterId}-${user?.id || 'guest'}`)
      setIsEditing(false)
      toast.success('Company profile updated')
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to update company profile'))
    } finally {
      setSaving(false)
    }
  }



  return (
    <div className="min-h-screen bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Navbar />

      <main className="pt-44 pb-28 relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto space-y-8">


          {loading ? (
            <div className="h-56 rounded-3xl bg-white/5 animate-pulse" />
          ) : !data ? (
            <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold">
              Company profile not found.
            </div>
          ) : (
            <>
              <section className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-5">
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
                  {data.company?.name}
                </h1>
                <div className="flex flex-wrap gap-3">
                  {isOwner && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-black uppercase tracking-widest"
                    >
                      Edit Company Profile
                    </button>
                  )}
                  {!isRecruiter && user && (
                    <Link href="/jobs">
                      <button className="px-4 py-2 rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-500/20 transition-all flex items-center gap-2">
                        <ArrowLeft className="w-3 h-3" />
                        Back to Jobs
                      </button>
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{data.company?.location || 'Remote'}</span>
                  <span className="inline-flex items-center gap-2"><Briefcase className="w-4 h-4" />{data.company?.open_jobs_count || 0} open jobs</span>
                </div>
                {!isEditing ? (
                  <div data-lenis-prevent="true" className="max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                    {data.company?.overview ? (
                      <JobContent content={data.company.overview} isExpanded={true} />
                    ) : (
                      <p className="text-slate-500 font-bold italic">No company overview yet.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <input
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        value={editForm.company_name}
                        disabled={!!user?.company_info}
                        onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="Company name"
                      />
                      {!!user?.company_info && (
                        <p className="mt-2 ml-1 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          * Company name cannot be changed to maintain URL identity.
                        </p>
                      )}
                    </div>
                    <LocationInput
                      value={editForm.location}
                      onChange={(val) => setEditForm(prev => ({ ...prev, location: val }))}
                      placeholder="Company Headquarters (City, Country)"
                      className="py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                    />
                    <textarea
                      data-lenis-prevent="true"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white min-h-[140px]"
                      value={editForm.overview}
                      onChange={(e) => setEditForm(prev => ({ ...prev, overview: e.target.value }))}
                      placeholder="Company overview (Minimum 20 characters) *"
                      required
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveCompanyProfile}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({
                            company_name: data?.company?.name || '',
                            location: data?.company?.location || 'Remote',
                            overview: data?.company?.overview || '',
                          })
                        }}
                        className="px-4 py-2 rounded-lg border border-white/20 text-white text-xs font-black uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl text-white font-black uppercase">Open Positions</h2>
                {(data.open_jobs || []).length === 0 ? (
                  <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-slate-400">
                    No open jobs at the moment.
                  </div>
                ) : (
                  (data.open_jobs || []).map((job: any) => (
                    <div key={job.id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <h3 className="text-2xl font-black text-white uppercase italic">{job.title}</h3>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => setExpandedJobs(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                          className="px-4 py-2 rounded-lg border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                          {expandedJobs[job.id] ? 'Hide Details' : 'View Job'}
                        </button>
                        {!isRecruiter && (
                          <Link href="/jobs" className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-xs font-black uppercase tracking-widest">
                            Apply from Jobs Page
                          </Link>
                        )}
                      </div>

                      {expandedJobs[job.id] && (
                        <div className="mt-6 pt-6 border-t border-white/5 space-y-6">
                          <div>
                            <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mb-2">Job Description</p>
                            <JobContent content={job.description} isExpanded={true} />
                          </div>
                          {job.requirements && (
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-cyan-500 text-[10px] uppercase tracking-widest font-black mb-2">Requirements</p>
                              <JobContent content={job.requirements} isExpanded={true} />
                            </div>
                          )}
                          {job.salary_range && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Budget: <span className="text-cyan-400">{job.salary_range}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
