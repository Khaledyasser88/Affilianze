import { useEffect, useState } from 'react'
import { marketerApi } from '../../api/client'
import type { CampaignApplicationDto } from '../../api/client'
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Loader2,
  Trash2,
  X,
  Briefcase,
  Calendar,
  DollarSign,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Applications() {
  const [applications, setApplications] = useState<CampaignApplicationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'>('All')

  // Detail panel state
  const [selectedApp, setSelectedApp] = useState<CampaignApplicationDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await marketerApi.getmyapplications()
        setApplications(res.data || [])
      } catch (err) {
        console.error('Failed to load applications:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Fetch individual application detail using marketerApi.getmyapplications1(applicationId)
  const openDetail = async (app: CampaignApplicationDto) => {
    setSelectedApp(app)
    setDetailData(null)
    setDetailLoading(true)
    try {
      const res = await marketerApi.getmyapplications1(app.id!)
      setDetailData((res as any)?.data || res || app)
    } catch (err) {
      console.error('Failed to load application detail:', err)
      setDetailData(app) // fallback to cached data
    } finally {
      setDetailLoading(false)
    }
  }

  const handleWithdraw = async (appId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return
    try {
      await marketerApi.postmyapplicationswithdraw(appId)
      toast.success('Application withdrawn successfully')
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'Withdrawn' } : a))
      if (selectedApp?.id === appId) {
        setDetailData((prev: any) => ({ ...prev, status: 'Withdrawn' }))
        setSelectedApp(prev => prev ? { ...prev, status: 'Withdrawn' } : null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw application')
    }
  }

  const filteredApps = applications.filter(app => {
    if (filter === 'All') return true
    return app.status === filter
  })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-50 text-green-600 border-green-100'
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100'
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'Withdrawn': return 'bg-slate-50 text-slate-500 border-slate-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted': return <CheckCircle2 className="w-4 h-4" />
      case 'Rejected': return <XCircle className="w-4 h-4" />
      case 'Pending': return <Clock className="w-4 h-4" />
      case 'Withdrawn': return <XCircle className="w-4 h-4" />
      default: return null
    }
  }

  const filterCounts = {
    All: applications.length,
    Pending: applications.filter(a => a.status === 'Pending').length,
    Accepted: applications.filter(a => a.status === 'Accepted').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length,
    Withdrawn: applications.filter(a => a.status === 'Withdrawn').length,
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">My Applications</h1>
        <p className="text-gray-500 font-medium">Track your campaign applications and their current status. Click any card for full details.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: applications.length, color: 'text-slate-900', border: 'border-l-slate-400' },
          { label: 'Accepted', value: filterCounts.Accepted, color: 'text-green-600', border: 'border-l-green-500' },
          { label: 'Pending', value: filterCounts.Pending, color: 'text-amber-600', border: 'border-l-amber-500' },
          { label: 'Withdrawn/Rejected', value: filterCounts.Withdrawn + filterCounts.Rejected, color: 'text-red-600', border: 'border-l-red-500' },
        ].map((s, i) => (
          <div key={i} className={`bg-white p-5 rounded-2xl border border-gray-100 border-l-4 ${s.border} shadow-sm`}>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(['All', 'Pending', 'Accepted', 'Rejected', 'Withdrawn'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${
              filter === f 
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-lg shadow-blue-900/10' 
                : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
            }`}
          >
            {f}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${filter === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {filterCounts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-[#1E3A8A] animate-spin mb-4" />
            <p className="text-gray-400 font-bold">Loading applications...</p>
          </div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app: CampaignApplicationDto, i: number) => (
            <div 
              key={i} 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm group hover:shadow-md hover:border-blue-100 transition-all cursor-pointer"
              onClick={() => openDetail(app)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-[#1E3A8A] transition-colors">{app.campaignTitle || 'Campaign Title'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 font-medium">
                      <span>Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '---'}</span>
                      {app.campaignId && <span className="text-blue-600 font-bold">ID: #{app.campaignId}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full border text-[12px] font-black uppercase tracking-wider flex items-center gap-2 ${getStatusStyle(app.status || '')}`}>
                    {getStatusIcon(app.status || '')}
                    {app.status}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <Search className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-400 font-black">No {filter.toLowerCase()} applications found</p>
          </div>
        )}
      </div>

      {/* ─── Application Detail Modal ──────────────────────────────── */}
      {selectedApp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedApp(null)}
        >
          <div 
            className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-none mb-1">Application Detail</h3>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                    {selectedApp.campaignTitle}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
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
                  {/* Status Banner */}
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${getStatusStyle(detailData.status || '')}`}>
                    {getStatusIcon(detailData.status || '')}
                    <div>
                      <p className="font-black text-[15px]">{detailData.status || 'Pending'}</p>
                      {detailData.status === 'Rejected' && detailData.rejectionReason && (
                        <p className="text-[12px] font-medium opacity-80 mt-0.5">Reason: {detailData.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign</p>
                        </div>
                        <p className="text-[13px] font-black text-slate-900 truncate">{detailData.campaignTitle || '—'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Applied On</p>
                        </div>
                        <p className="text-[13px] font-black text-slate-900">
                          {detailData.appliedAt ? new Date(detailData.appliedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      {detailData.commissionEarned != null && (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div className="flex items-center gap-2 mb-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Earned</p>
                          </div>
                          <p className="text-[15px] font-black text-emerald-700">EGP {Number(detailData.commissionEarned || 0).toLocaleString()}</p>
                        </div>
                      )}
                      {detailData.clickCount != null && (
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-2 mb-1.5">
                            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Clicks</p>
                          </div>
                          <p className="text-[15px] font-black text-blue-700">{(detailData.clickCount || 0).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter / Notes */}
                  {detailData.coverLetter && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Cover Letter</p>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] text-slate-700 font-medium leading-relaxed">
                        {detailData.coverLetter}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {detailData.status === 'Rejected' && detailData.rejectionReason && (
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Rejection Reason</p>
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-[13px] text-red-700 font-medium leading-relaxed flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {detailData.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {detailData.status === 'Pending' && (
                    <button
                      onClick={() => handleWithdraw(detailData.id!)}
                      className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[13px] hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Withdraw Application
                    </button>
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
