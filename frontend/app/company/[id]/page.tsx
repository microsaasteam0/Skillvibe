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

export default function CompanyProfilePage() {
  const { user } = useAuth()
  const params = useParams()
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const recruiterId = (() => {
    if (!rawParam) return null
    const asString = String(rawParam)
    if (/^\d+$/.test(asString)) return asString
    const match = asString.match(/-(\d+)$/)
    return match ? match[1] : null
  })()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    company_name: '',
    location: '',
    overview: '',
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

  useEffect(() => {
    const load = async () => {
      if (!recruiterId) {
        setLoading(false)
        toast.error('Invalid company URL')
        return
      }
      setLoading(true)
      try {
        const cacheKey = `recruiter-company-${recruiterId}`
        const companyData = await requestCache.get(
          cacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/jobs/recruiter/${recruiterId}/company`, {
              timeout: 10000,
            })
            return response.data
          },
          60 * 1000
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

      const response = await axios.put(
        `${API_URL}/api/v1/jobs/recruiter/${recruiterId}/company`,
        {
          company_name: editForm.company_name.trim(),
          location: editForm.location.trim(),
          overview: editForm.overview.trim(),
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
      requestCache.invalidate(`recruiter-company-${recruiterId}`)
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
          <Link href="/jobs" className="inline-flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Link>

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
                {isOwner && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-black uppercase tracking-widest"
                  >
                    Edit Company Profile
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{data.company?.location || 'Remote'}</span>
                  <span className="inline-flex items-center gap-2"><Briefcase className="w-4 h-4" />{data.company?.open_jobs_count || 0} open jobs</span>
                </div>
                {!isEditing ? (
                  <p className="text-slate-300 text-sm leading-7 whitespace-pre-line">{data.company?.overview || 'No company overview yet.'}</p>
                ) : (
                  <div className="space-y-3">
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Company name"
                    />
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                    />
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white min-h-[140px]"
                      value={editForm.overview}
                      onChange={(e) => setEditForm(prev => ({ ...prev, overview: e.target.value }))}
                      placeholder="Company overview"
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
                      <p className="text-slate-400 text-sm mt-2">{job.location || 'Remote'} - {job.job_type} - {job.work_mode}</p>
                      <Link href="/jobs" className="inline-block mt-4 px-4 py-2 rounded-lg bg-cyan-500 text-black text-xs font-black uppercase tracking-widest">
                        Apply from Jobs Page
                      </Link>
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
