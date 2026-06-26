import React, { useEffect, useState } from 'react'
import { campaignApi } from '../../api/client'
import { Check, X, ShieldAlert, RefreshCw, Users, ChevronRight, ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, Globe, Star, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import * as Types from '../../api/client'

export default function AdminCampaigns() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Types.CampaignStatus | "">( "Pending" as any)

  // Applications drill-down state
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null)

  const getAppDetails = (app: any) => {
    const local = localStorage.getItem(`affilianze_app_details_${app.id}`)
    if (local) return JSON.parse(local)
    
    // Fallback details for seeded/database apps during mockup demo
    return {
      pitch: `I am an experienced affiliate marketer. I've promoted campaigns in this niche before and have built an engaged following. I plan to feature your campaign heavily in weekly reels, story swipe-ups, and a detailed blog review.`,
      experienceLevel: app.marketerPerformanceScore && app.marketerPerformanceScore > 80 ? 'Senior' : 'Mid',
      yearsExperience: app.marketerPerformanceScore && app.marketerPerformanceScore > 80 ? '4' : '2',
      channels: ['instagram', 'tiktok', 'facebook'],
      audienceSize: '10K – 50K',
      audienceLocation: 'Egypt',
      portfolioUrl: 'https://behance.net/marketer_portfolio',
      socialLink: 'https://instagram.com/marketer_profile',
      availableFrom: new Date().toISOString().split('T')[0],
      phoneNumber: '+20 100 456 7890',
      cvFileName: `${app.marketerName || 'Marketer'}_Resume.pdf`,
      cvFileBase64: 'mock_base64_data',
    }
  }

  const handleDownloadCV = (details: any) => {
    if (details.cvFileBase64 && details.cvFileBase64 !== 'mock_base64_data') {
      const link = document.createElement('a')
      link.href = details.cvFileBase64
      link.download = details.cvFileName || 'CV.pdf'
      link.click()
    } else {
      const blob = new Blob([`CV/Resume of ${details.phoneNumber}\n\nPitch: ${details.pitch}\nExperience Level: ${details.experienceLevel} (${details.yearsExperience} years)\nPortfolio: ${details.portfolioUrl}\nSocial: ${details.socialLink}`], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = details.cvFileName ? details.cvFileName.replace(/\.pdf$/, '.txt') : 'Resume.txt'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const p: any = { PageSize: 50 }
      if (statusFilter !== "") p.Status = statusFilter
      const res = await campaignApi.get(p)
      setData(res.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [statusFilter])

  const approveCampaign = async (id: number) => {
    try {
      await campaignApi.putadminapprove(id, "Approved via Admin" as any)
      toast.success('✅ Campaign approved successfully')
      loadData()
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const rejectCampaign = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const reason = prompt("Rejection Reason:") || "Rejected via Admin"
    try {
      await campaignApi.putadminreject(id, reason)
      toast.success('Campaign rejected')
      loadData()
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const toggleFeatured = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await campaignApi.posttogglefeatured(id)
      toast.success('Campaign featured status updated')
      loadData()
    } catch (e: any) { toast.error(e.message || 'Error toggling featured status') }
  }

  const [statsData, setStatsData] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)

  const viewStats = async (campaign: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setStatsData(null)
    setShowStats(true)
    try {
      const res = await campaignApi.getstatistics(campaign.id)
      setStatsData((res as any)?.data || res)
    } catch (err: any) {
      toast.error(err.message || 'Error loading statistics')
    }
  }

  // Load applications for a campaign using campaignApi.getapplications(id)
  const openApplications = async (campaign: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCampaign(campaign)
    setAppsLoading(true)
    setApplications([])
    try {
      const res = await campaignApi.getapplications(campaign.id, { pageSize: 100 })
      const list = (res as any)?.data?.items || (res as any)?.data || (res as any)?.items || res || []
      setApplications(Array.isArray(list) ? list : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load applications')
    } finally {
      setAppsLoading(false)
    }
  }

  // ─── Application Accept / Reject ─────────────────────────────────────
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ appId: number; note: string } | null>(null)

  const approveApplication = async (appId: number) => {
    setActionLoading(appId)
    try {
      await campaignApi.postapplicationsapprove(appId, { applicationId: appId, note: 'Approved by admin' })
      toast.success('✅ Application approved!')
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'Accepted' } : a))
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const rejectApplication = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.appId)
    try {
      await campaignApi.postapplicationsreject(rejectModal.appId, { applicationId: rejectModal.appId, note: rejectModal.note || 'Rejected by admin' })
      toast.success('Application rejected')
      setApplications(prev => prev.map(a => a.id === rejectModal.appId ? { ...a, status: 'Rejected', rejectReason: rejectModal.note } : a))
      setRejectModal(null)
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'Paused': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  const getAppStatusStyle = (status: string) => {
    switch(status) {
      case 'Accepted': return 'bg-green-50 text-green-600 border-green-100'
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100'
      case 'Withdrawn': return 'bg-slate-50 text-slate-500 border-slate-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  // ─── Applications Drill-Down Panel ─────────────────────────────────
  if (selectedCampaign) {
    return (
      <div className="space-y-6 py-6 animate-in fade-in max-w-[1200px] mx-auto px-4">
        {/* Back header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedCampaign(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Campaigns
          </button>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 leading-none">{selectedCampaign.title}</h1>
            <p className="text-slate-400 font-medium text-[13px] mt-1">Campaign Applications ({applications.length})</p>
          </div>
        </div>

        {/* Campaign meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: selectedCampaign.status || 'N/A' },
            { label: 'Budget', value: `$${Number(selectedCampaign.budget || 0).toLocaleString()}` },
            { label: 'Commission', value: `${selectedCampaign.commissionAmount || 0} ${selectedCampaign.commissionType === 'Percentage' ? '%' : '$'}` },
            { label: 'Location', value: selectedCampaign.targetLocation || 'Global' },
          ].map((m, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-[15px] font-black text-slate-900">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 flex-wrap">
            <Users className="w-5 h-5 text-[#1E3A8A]" />
            <h2 className="text-[17px] font-black text-slate-900">Marketer Applications</h2>
            <div className="ml-auto flex items-center gap-2">
              {(['Pending','Accepted','Rejected','Withdrawn'] as const).map(s => (
                <span key={s} className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                  s === 'Accepted' ? 'bg-green-50 text-green-700 border-green-100'
                  : s === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : s === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {applications.filter(a => a.status === s).length} {s}
                </span>
              ))}
            </div>
          </div>
          {appsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-24 text-center">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No applications for this campaign yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="px-8 py-5 border-b border-slate-50">Marketer</th>
                    <th className="px-6 py-5 border-b border-slate-50 hidden md:table-cell">Niche</th>
                    <th className="px-6 py-5 border-b border-slate-50 hidden lg:table-cell">Score</th>
                    <th className="px-6 py-5 border-b border-slate-50">Applied On</th>
                    <th className="px-6 py-5 border-b border-slate-50">Status</th>
                    <th className="px-6 py-5 border-b border-slate-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app: any, i: number) => (
                    <React.Fragment key={i}>
                      <tr className="group hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-blue-500 flex items-center justify-center text-white font-black text-[13px] flex-shrink-0">
                              {(app.marketerName || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[14px] font-black text-slate-900">{app.marketerName || `Marketer #${app.marketerId}`}</p>
                              {app.marketerEmail && <p className="text-[12px] text-slate-400 font-medium">{app.marketerEmail}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden md:table-cell">
                          <span className="text-[12px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {app.marketerNiche || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-5 hidden lg:table-cell">
                          {app.marketerPerformanceScore != null ? (
                            <div className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-[13px] font-black text-slate-700">{app.marketerPerformanceScore}</span>
                            </div>
                          ) : <span className="text-slate-300 text-[12px]">—</span>}
                        </td>
                        <td className="px-6 py-5 text-[13px] font-medium text-slate-400">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' }) : '---'}
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${getAppStatusStyle(app.status || 'Pending')}`}>
                              {app.status === 'Accepted' ? <CheckCircle2 className="w-3 h-3" /> :
                               app.status === 'Rejected' ? <XCircle className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              {app.status || 'Pending'}
                            </span>
                            {app.rejectReason && (
                              <p className="text-[11px] text-rose-400 font-medium mt-1 max-w-[160px] truncate" title={app.rejectReason}>
                                {app.rejectReason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black border border-slate-100 transition-all flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {expandedAppId === app.id ? 'Hide' : 'Details'}
                            </button>

                            {(!app.status || app.status === 'Pending') ? (
                              <>
                                <button
                                  onClick={() => approveApplication(app.id)}
                                  disabled={actionLoading === app.id}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[11px] font-black hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Accept
                                </button>
                                <button
                                  onClick={() => setRejectModal({ appId: app.id, note: '' })}
                                  disabled={actionLoading === app.id}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-[11px] font-black hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-200 text-[12px] font-medium pr-2">—</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedAppId === app.id && (
                        <tr>
                          <td colSpan={6} className="px-8 py-6 bg-slate-50/50">
                            {(() => {
                              const details = getAppDetails(app);
                              return (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 text-left">
                                  <div className="grid md:grid-cols-2 gap-8">
                                    {/* Column 1: Pitch & Experience */}
                                    <div className="space-y-4">
                                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Marketer Cover Letter / Pitch</h4>
                                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed bg-white p-5 rounded-2xl border border-slate-100 shadow-sm whitespace-pre-wrap">
                                        {details.pitch}
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience Level</p>
                                          <p className="text-[12px] font-black text-slate-800">{details.experienceLevel} Level ({details.yearsExperience} yrs)</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available From</p>
                                          <p className="text-[12px] font-black text-slate-800">{details.availableFrom}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Column 2: Reach, Contacts & CV */}
                                    <div className="space-y-4">
                                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Promotion Details & Niche</h4>
                                      
                                      <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <div>
                                          <p className="text-[11px] text-slate-400 font-bold mb-2">Target Channels</p>
                                          <div className="flex flex-wrap gap-2">
                                            {details.channels && details.channels.map((c: string) => (
                                              <span key={c} className="px-2.5 py-1 bg-[#1E3A8A]/5 text-[#1E3A8A] text-[10px] font-black rounded-lg border border-[#1E3A8A]/10 uppercase tracking-wide">
                                                {c}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                          <div>
                                            <p className="text-[11px] text-slate-400 font-bold mb-1">Audience Size</p>
                                            <p className="text-[12px] font-black text-slate-800">{details.audienceSize}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] text-slate-400 font-bold mb-1">Audience Location</p>
                                            <p className="text-[12px] font-black text-slate-800">{details.audienceLocation || 'N/A'}</p>
                                          </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                                          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                                            <span className="text-slate-400">📞 Phone:</span>
                                            <a href={`tel:${details.phoneNumber}`} className="hover:underline text-[#1E3A8A] font-black">{details.phoneNumber}</a>
                                          </div>
                                          {details.portfolioUrl && (
                                            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                                              <span className="text-slate-400">🔗 Portfolio:</span>
                                              <a href={details.portfolioUrl} target="_blank" rel="noreferrer" className="hover:underline text-[#1E3A8A] truncate max-w-[200px]">{details.portfolioUrl}</a>
                                            </div>
                                          )}
                                          {details.socialLink && (
                                            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                                              <span className="text-slate-400">📱 Social Profile:</span>
                                              <a href={details.socialLink} target="_blank" rel="noreferrer" className="hover:underline text-[#1E3A8A] truncate max-w-[200px]">{details.socialLink}</a>
                                            </div>
                                          )}
                                          
                                          <div className="pt-3">
                                            <button 
                                              onClick={() => handleDownloadCV(details)}
                                              className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-[11px] rounded-xl border border-amber-100/50 transition-all active:scale-95 w-full justify-center"
                                            >
                                              <Download className="w-4 h-4" /> Download CV / Resume ({details.cvFileName || 'Resume.pdf'})
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reject Note Modal */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setRejectModal(null)}>
            <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-slate-900 mb-1">Reject Application</h3>
              <p className="text-[13px] text-slate-400 font-medium mb-5">Provide a reason — the marketer will see this.</p>
              <textarea
                value={rejectModal.note}
                onChange={e => setRejectModal({ ...rejectModal, note: e.target.value })}
                placeholder="e.g. Does not match our target audience..."
                rows={3}
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-[13px] text-slate-700 font-medium placeholder:text-slate-300 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 resize-none mb-5"
              />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-black text-[13px] hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={rejectApplication}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-black text-[13px] hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Main Campaigns List ────────────────────────────────────────────
  return (
    <div className="space-y-6 py-6 animate-in fade-in max-w-[1200px] mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none mb-2">Campaign Management</h1>
          <p className="text-slate-400 font-medium">Review and moderate company campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-100 bg-white px-5 py-3 rounded-2xl text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">⏳ Pending Approval</option>
            <option value="Active">✅ Active</option>
            <option value="Rejected">❌ Rejected</option>
            <option value="Paused">⏸ Paused</option>
            <option value="Closed">🔒 Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin" />
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Fetching campaigns...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="font-black text-slate-900 text-lg">No campaigns found</h3>
            <p className="text-[13px] text-gray-400 font-medium mt-1">No campaigns match the selected status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5 border-b border-slate-50">Campaign</th>
                  <th className="px-8 py-5 border-b border-slate-50 hidden sm:table-cell">Commission</th>
                  <th className="px-8 py-5 border-b border-slate-50">Status</th>
                  <th className="px-8 py-5 border-b border-slate-50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item: any, i) => (
                  <tr 
                    key={i} 
                    className="group hover:bg-slate-50/30 transition-colors cursor-pointer"
                    onClick={(e) => openApplications(item, e)}
                  >
                    <td className="px-8 py-5">
                      <div>
                        <div className="font-black text-slate-900 text-[15px] mb-1 group-hover:text-[#1E3A8A] transition-colors truncate max-w-[260px]">
                          {item.title}
                        </div>
                        <div className="text-[12px] font-medium text-slate-400 truncate max-w-[260px]">
                          {item.targetAudience || item.companyName || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] w-max">
                          {item.targetLocation || 'Global'}
                        </span>
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg w-max">
                          {item.commissionAmount} {item.commissionType === 'Percentage' ? '%' : '$'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black border tracking-wide ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={(e) => toggleFeatured(item.id, e)}
                            title={item.isFeatured ? "Unmark as Featured" : "Mark as Featured"}
                            className={`p-2.5 rounded-xl border transition-all active:scale-95 ${item.isFeatured ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm shadow-amber-500/10' : 'bg-white border-slate-100 text-slate-300 hover:text-amber-400 hover:border-amber-100'}`}
                        >
                            <Globe className={`w-4 h-4 ${item.isFeatured ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                            onClick={(e) => viewStats(item, e)}
                            className="p-2.5 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-[#1E3A8A] hover:border-[#1E3A8A] transition-all active:scale-95"
                            title="Platform Statistics"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        {item.status === 'Pending' ? (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); approveCampaign(item.id) }} 
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[11px] font-black hover:bg-emerald-100 transition-all uppercase tracking-widest active:scale-95 flex items-center gap-1.5"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button 
                              onClick={(e) => rejectCampaign(item.id, e)} 
                              className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-[11px] font-black hover:bg-rose-100 transition-all uppercase tracking-widest active:scale-95 flex items-center gap-1.5"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center text-slate-200">
                             <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-[#1E3A8A] to-[#0F1D45] p-10 text-white relative">
                    <button onClick={() => setShowStats(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="mb-2 inline-flex px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-black uppercase tracking-widest border border-blue-500/30">Campaign Statistics</div>
                    <h2 className="text-2xl font-black tracking-tight leading-tight">Global Performance</h2>
                </div>
                <div className="p-10 space-y-8">
                    {!statsData ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin" />
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Compiling stats...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clicks</p>
                                    <p className="text-xl font-black text-slate-900">{statsData.totalClicks?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversions</p>
                                    <p className="text-xl font-black text-slate-900">{statsData.totalConversions?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 text-center">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Payouts</p>
                                    <p className="text-xl font-black text-emerald-700">${(statsData.totalPayouts || statsData.totalEarnings || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-500">Applications</span>
                                    <span className="text-lg font-black text-slate-900">{statsData.totalApplications || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-500">Conversion Rate</span>
                                    <span className="text-lg font-black text-slate-900">{statsData.conversionRate?.toFixed(2) || 0}%</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowStats(false)}
                                className="w-full py-4 bg-[#1E3A8A] text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-800 active:scale-[0.98]"
                            >
                                Close Overview
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
