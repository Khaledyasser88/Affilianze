import { useEffect, useState } from 'react'
import { complaintApi, campaignApi } from '../../api/client'
import { Check, MessageSquare, AlertTriangle, RefreshCw, X, User, Briefcase, Calendar, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { dataUtils } from '../../utils/dataUtils'

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Resolved' | 'Escalated'>('All')
  const [loading, setLoading] = useState(false)
  const [serverStats, setServerStats] = useState<any>(null)

  // Detail modal
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [allowingReapply, setAllowingReapply] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const allRes = await complaintApi.getadminall({ PageSize: 500 })
      const raw = allRes.data?.items || allRes.data || []
      setComplaints(dataUtils.filterTestEntities(Array.isArray(raw) ? raw : []))

      try {
        const statRes = await complaintApi.getadminstatistics()
        setServerStats(statRes?.data || statRes)
      } catch (statErr) { console.warn('Could not load server complaint stats', statErr) }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Open detail modal and fetch full complaint via complaintApi.get(id)
  const openDetail = async (complaint: any) => {
    setSelectedComplaint(complaint)
    setDetailData(null)
    setResolutionNote('')
    setDetailLoading(true)
    try {
      const res = await complaintApi.get(complaint.id)
      setDetailData((res as any)?.data || res || complaint)
    } catch (err) {
      console.error('Failed to load complaint detail:', err)
      setDetailData(complaint) // fallback
    } finally {
      setDetailLoading(false)
    }
  }

  const resolveComplaint = async () => {
    if (!detailData?.id) return
    if (!resolutionNote.trim()) {
      toast.error('Please enter a resolution note')
      return
    }
    setResolving(true)
    try {
      await complaintApi.postresolve(detailData.id, { 
        status: 'Resolved', 
        resolutionNote: resolutionNote 
      } as any)
      toast.success('✅ Complaint resolved successfully')
      setSelectedComplaint(null)
      setDetailData(null)
      loadData()
    } catch (e: any) { 
      toast.error(e.message || 'Error occurred') 
    } finally {
    }
  }

  const handleAllowReapply = async () => {
    if (!detailData) return;
    
    let appId: number | null = null;
    if (detailData.description) {
      const match = detailData.description.match(/Application ID: (\d+)/);
      if (match) {
        appId = parseInt(match[1]);
      }
    }
    
    if (!appId && detailData.campaignId && detailData.complainantId) {
      try {
        const res = await campaignApi.getapplications(detailData.campaignId, { pageSize: 100 });
        const apps = (res as any)?.data?.items || (res as any)?.data || (res as any)?.items || res || [];
        const matchApp = Array.isArray(apps) ? apps.find((a: any) => a.marketerId === detailData.complainantId) : null;
        if (matchApp && matchApp.id) {
          appId = matchApp.id;
        }
      } catch (err) {
        console.error('Failed to lookup application ID:', err);
      }
    }
    
    if (!appId) {
      toast.error('Could not determine the Application ID to allow re-application.');
      return;
    }

    setAllowingReapply(true)
    try {
      // Rejecting the withdrawn application allows the marketer to apply again
      await campaignApi.postapplicationsreject(appId, { note: 'Admin allowed re-application via resolution center' } as any)
      
      // Also resolve the complaint
      await complaintApi.postresolve(detailData.id, { 
        status: 'Resolved', 
        resolutionNote: 'Re-application has been allowed. The marketer can now apply again.' 
      } as any)
      
      toast.success('✅ Re-application allowed and complaint resolved')
      setSelectedComplaint(null)
      loadData()
    } catch (e: any) {
      console.error('Allow re-apply failed:', e)
      const msg = e.response?.data?.message || e.message || 'Failed to allow re-application'
      toast.error(msg)
    } finally {
      setAllowingReapply(false)
    }
  }

  const filteredComplaints = filter === 'All' 
    ? complaints 
    : complaints.filter(c => c.status === filter || (filter === 'Pending' && (c.status === 'Open' || !c.status)))

  const displayStats = serverStats ? {
    total: serverStats.totalComplaints || serverStats.total || complaints.length,
    pending: serverStats.pendingComplaints || serverStats.pending || complaints.filter(c => c.status === 'Pending' || c.status === 'Open' || !c.status).length,
    resolved: serverStats.resolvedComplaints || serverStats.resolved || complaints.filter(c => c.status === 'Resolved').length,
    escalated: serverStats.escalatedComplaints || serverStats.escalated || complaints.filter(c => c.status === 'Escalated').length
  } : {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending' || c.status === 'Open' || !c.status).length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => c.status === 'Escalated').length
  }

  return (
    <div className="space-y-6 py-6 animate-in fade-in max-w-[1200px] mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none mb-2">Complaints</h1>
          <p className="text-slate-400 font-medium">Manage user complaints and disputes</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search subject, description, or parties..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-[13px] font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all outline-none"
              onChange={(e) => {
                const term = e.target.value;
                if (term.length > 2 || term.length === 0) {
                  // Re-fetch with search term
                  complaintApi.getadminall({ SearchTerm: term, PageSize: 100 }).then(res => {
                    const raw = res.data?.items || res.data || []
                    setComplaints(dataUtils.filterTestEntities(Array.isArray(raw) ? raw : []))
                  })
                }
              }}
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {(['All', 'Pending', 'Resolved', 'Escalated'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-[12px] font-black transition-all ${
                  filter === f 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-gray-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: displayStats.total, color: 'border-l-blue-500', textColor: 'text-slate-900' },
          { label: 'Pending', value: displayStats.pending, color: 'border-l-amber-500', textColor: 'text-amber-600' },
          { label: 'Resolved', value: displayStats.resolved, color: 'border-l-emerald-500', textColor: 'text-emerald-600' },
          { label: 'Escalated', value: displayStats.escalated, color: 'border-l-rose-500', textColor: 'text-rose-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${s.color}`}>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">{s.label}</span>
            <span className={`text-2xl font-black ${s.textColor}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No complaints found</h3>
            <p className="text-xs text-gray-400 font-medium max-w-[240px] mt-1">Everything looks clear! No complaints match your current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-5 border-b border-gray-50">Subject & Description</th>
                  <th className="p-5 border-b border-gray-50">Parties Involved</th>
                  <th className="p-5 border-b border-gray-50">Date</th>
                  <th className="p-5 border-b border-gray-50">Status</th>
                  <th className="p-5 border-b border-gray-50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredComplaints.map((c, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-slate-50/30 transition-all group cursor-pointer"
                    onClick={() => openDetail(c)}
                  >
                    <td className="p-5 max-w-xs">
                      <div className="font-black text-slate-900 text-[14px] mb-1 line-clamp-1 group-hover:text-[#1E3A8A] transition-colors">{c.subject}</div>
                      <div className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">{c.description}</div>
                    </td>
                    <td className="p-5 text-[12px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-400 uppercase tracking-[0.1em] text-[9px]">From:</span>
                          <span className="font-bold text-slate-700">{c.complainantName || `User #${c.complainantId}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-400 uppercase tracking-[0.1em] text-[9px]">To:</span>
                          <span className="font-bold text-slate-700">{c.defendantName || `User #${c.defendantId}`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-[12px] text-slate-400 font-medium">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-5">
                      {c.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Check className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          c.status === 'Escalated' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          <AlertTriangle className="w-3 h-3" /> {c.status || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      {c.status !== 'Resolved' && (
                        <button 
                          onClick={() => openDetail(c)} 
                          className="px-5 py-2.5 bg-[#1E3A8A] text-white text-[11px] font-black rounded-xl hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-900/10 uppercase tracking-widest"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Complaint Detail Modal ─────────────────────────────────── */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#1E3A8A] border border-slate-100">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-none mb-1">Complaint Detail</h3>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">ID #{selectedComplaint.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-[#1E3A8A] animate-spin mb-4" />
                  <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest">Loading details...</p>
                </div>
              ) : detailData ? (
                <div className="p-8 space-y-6">
                  {/* Subject */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</p>
                    <h4 className="text-[17px] font-black text-slate-900">{detailData.subject}</h4>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] text-slate-700 font-medium leading-relaxed">
                      {detailData.description || 'No description provided.'}
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Complainant</p>
                      </div>
                      <p className="text-[14px] font-black text-slate-900">{detailData.complainantName || `User #${detailData.complainantId}`}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defendant</p>
                      </div>
                      <p className="text-[14px] font-black text-slate-900">{detailData.defendantName || `User #${detailData.defendantId}`}</p>
                    </div>
                  </div>

                  {/* Campaign & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    {detailData.campaignTitle && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign</p>
                        </div>
                        <p className="text-[13px] font-bold text-[#1E3A8A] truncate">{detailData.campaignTitle}</p>
                      </div>
                    )}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filed On</p>
                      </div>
                      <p className="text-[13px] font-bold text-slate-700">
                        {detailData.createdAt ? new Date(detailData.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Existing resolution note */}
                  {detailData.resolutionNote && (
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Resolution Note</p>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[13px] text-emerald-800 font-medium leading-relaxed">
                        {detailData.resolutionNote}
                      </div>
                    </div>
                  )}

                  {/* Re-apply Request Action */}
                  {detailData.status !== 'Resolved' && detailData.subject === 'Re-apply Request' && (
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[32px] space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                          <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 leading-none mb-1">Allow Re-application?</p>
                          <p className="text-[11px] font-medium text-slate-500">This will reset the marketer's status for this campaign.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleAllowReapply}
                        disabled={allowingReapply}
                        className="w-full py-4 bg-white border-2 border-blue-100 text-[#1E3A8A] rounded-2xl font-black text-[12px] hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                      >
                        {allowingReapply ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {allowingReapply ? 'Processing...' : 'Reset & Allow Re-apply'}
                      </button>
                    </div>
                  )}

                  {/* Resolve Form */}
                  {detailData.status !== 'Resolved' && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Resolution Note</p>
                      <textarea
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        rows={3}
                        placeholder="Describe how this complaint was resolved..."
                        className="w-full border border-slate-100 bg-slate-50 rounded-2xl px-4 py-3 text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all placeholder:text-gray-300 resize-none"
                      />
                      <button
                        onClick={resolveComplaint}
                        disabled={resolving || !resolutionNote.trim()}
                        className="w-full mt-3 py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-[13px] hover:bg-[#152C6E] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-blue-900/10"
                      >
                        {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {resolving ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
