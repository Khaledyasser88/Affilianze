import { useEffect, useState } from 'react'
import { campaignApi } from '../../api/client'
import { Check, X, ShieldAlert, RefreshCw, Users, ChevronRight, ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, Globe } from 'lucide-react'
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
          <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
            <Users className="w-5 h-5 text-[#1E3A8A]" />
            <h2 className="text-[17px] font-black text-slate-900">Marketer Applications</h2>
            <span className="ml-auto px-3 py-1 bg-blue-50 text-[#1E3A8A] text-[11px] font-black rounded-full border border-blue-100">{applications.length} total</span>
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
                    <th className="px-8 py-5 border-b border-slate-50">Applied On</th>
                    <th className="px-8 py-5 border-b border-slate-50">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-[14px] font-black text-slate-900">{app.marketerName || `Marketer #${app.marketerId}`}</p>
                          {app.marketerEmail && <p className="text-[12px] text-slate-400 font-medium">{app.marketerEmail}</p>}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[13px] font-medium text-slate-400">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '---'}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${getAppStatusStyle(app.status || 'Pending')}`}>
                          {app.status === 'Accepted' ? <CheckCircle2 className="w-3 h-3" /> : 
                           app.status === 'Rejected' ? <XCircle className="w-3 h-3" /> : 
                           <Clock className="w-3 h-3" />}
                          {app.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
