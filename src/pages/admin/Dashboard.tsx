import { useEffect, useState } from 'react'
import { analyticsApi, notificationApi, companyApi, marketerApi, complaintApi } from '../../api/client'
import { Users, Briefcase, TrendingUp, TrendingDown, Clock, ArrowRight, ShieldCheck, AlertCircle, Building2, Globe, Phone, FileText, Mail, Check, X, ChevronRight, Bell, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { dataUtils } from '../../utils/dataUtils'

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [revenue, setRevenue] = useState<any>(null)
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([])
  const [pendingMarketers, setPendingMarketers] = useState<any[]>([])
  const [complaintStats, setComplaintStats] = useState<any>(null)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [overviewRes, revenueRes, performersRes, notifsRes, pendingRes, pendingMarketersRes, complaintStatsRes] = await Promise.all([
        analyticsApi.getadminplatformoverview(),
        analyticsApi.getadminrevenuebreakdown(),
        analyticsApi.getadmintopperformers({ topCount: 5 }),
        notificationApi.getmy({ PageSize: 10 }).catch(() => null),
        companyApi.getadminpending({ pageSize: 50 }).catch(() => ({ data: [] })),
        marketerApi.getadminpendingverification({ pageSize: 50 }).catch(() => ({ data: [] })),
        complaintApi.getadminstatistics().catch(() => null)
      ])
      
      setOverview((overviewRes as any)?.data || overviewRes)
      setRevenue((revenueRes as any)?.data || revenueRes)
      setComplaintStats((complaintStatsRes as any)?.data || complaintStatsRes)
      
      const rawPerformers = (performersRes as any)?.data || performersRes || []
      setTopPerformers(dataUtils.filterTestEntities(Array.isArray(rawPerformers) ? rawPerformers : []))
      
      const rawNotifs = (notifsRes as any)?.items || (notifsRes as any)?.data || (Array.isArray(notifsRes) ? notifsRes : [])
      setNotifications(Array.isArray(rawNotifs) ? rawNotifs : [])
      
      const rawPending = (pendingRes as any)?.data?.items || (pendingRes as any)?.data || (pendingRes as any)?.items || pendingRes || []
      setPendingCompanies(dataUtils.filterTestEntities(Array.isArray(rawPending) ? rawPending : []))

      const rawPendingMarketers = (pendingMarketersRes as any)?.data?.items || (pendingMarketersRes as any)?.data || (pendingMarketersRes as any)?.items || pendingMarketersRes || []
      setPendingMarketers(dataUtils.filterTestEntities(Array.isArray(rawPendingMarketers) ? rawPendingMarketers : []))
    } catch (error) {
      console.error('Failed to load admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const approveCompany = async (id: number) => {
    try {
      await companyApi.postapprove(id, { note: 'Approved via Admin Dashboard' } as any)
      toast.success('✅ Company approved! They can now create campaigns.')
      setSelectedRequest(null)
      fetchData()
    } catch (e: any) { toast.error(e.message || 'Error approving') }
  }

  const rejectCompany = async (id: number) => {
    try {
      await companyApi.postreject(id, { note: 'Rejected via Admin Dashboard' } as any)
      toast.success('Company rejected.')
      setSelectedRequest(null)
      fetchData()
    } catch (e: any) { toast.error(e.message || 'Error rejecting') }
  }

  const verifyMarketer = async (id: number) => {
    try {
      await marketerApi.putverify(id)
      toast.success('✅ Marketer verified successfully!')
      fetchData()
    } catch (e: any) { toast.error(e.message || 'Error verifying') }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1E3A8A]/20 border-t-[#1E3A8A]"></div>
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Loading Admin Console...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in py-8 max-w-[1300px] mx-auto px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-black tracking-tight text-slate-900 leading-none mb-2">Admin Console</h1>
          <p className="text-slate-400 font-medium text-sm md:text-base">Platform overview and pending actions</p>
        </div>
        <Link to="/admin/users" className="flex items-center gap-2 px-5 py-3 bg-[#1E3A8A] text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-[#152C6E] transition-all shadow-lg shadow-blue-900/10 active:scale-95 w-full sm:w-auto justify-center">
          User Management <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ─── Pending Company Requests Banner ─── */}
      {pendingCompanies.length > 0 && (
        <div className="bg-white rounded-[32px] border border-amber-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="px-4 md:px-8 py-6 bg-amber-50 flex items-center justify-between border-b border-amber-100">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 shrink-0">
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-[16px] md:text-[18px] font-black text-slate-900 leading-tight mb-1">
                  Pending Verification Requests
                </h2>
                <p className="text-[12px] md:text-[13px] font-medium text-slate-500">
                  {pendingCompanies.length} compan{pendingCompanies.length > 1 ? 'ies' : 'y'} waiting for your review
                </p>
              </div>
            </div>
            <span className="w-8 h-8 rounded-full bg-amber-500 text-white text-[13px] font-black flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse shrink-0">
              {pendingCompanies.length}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {pendingCompanies.map((company: any, i: number) => (
              <div key={i} className="px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors group gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} className="w-full h-full object-cover" alt="logo" />
                    ) : (
                      <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] md:text-[16px] font-black text-slate-900 leading-none mb-1.5 truncate">
                      {company.campanyName || company.name || 'Unknown Company'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[11px] md:text-[12px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {company.userEmail || company.contactEmail || company.email || 'N/A'}
                      </span>
                      {company.website && (
                        <span className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {company.website}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:block">
                    {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : ''}
                  </p>
                  <button
                    onClick={() => setSelectedRequest(company)}
                    className="flex-1 md:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl border border-slate-200 text-[11px] md:text-[12px] font-black text-slate-600 hover:border-[#1E3A8A] hover:text-[#1E3A8A] hover:bg-blue-50 transition-all uppercase tracking-widest"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => approveCompany(company.id)}
                    className="flex-1 md:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-emerald-500 text-white text-[11px] md:text-[12px] font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest active:scale-95"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Pending Marketer Requests Banner ─── */}
      {pendingMarketers.length > 0 && (
        <div className="bg-white rounded-[32px] border border-blue-50 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="px-4 md:px-8 py-6 bg-blue-50/50 flex items-center justify-between border-b border-blue-50">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-sm border border-blue-100 shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-[16px] md:text-[18px] font-black text-slate-900 leading-tight mb-1">
                  New Marketer Verifications
                </h2>
                <p className="text-[12px] md:text-[13px] font-medium text-slate-500">
                  {pendingMarketers.length} marketer{pendingMarketers.length > 1 ? 's' : ''} waiting for approval
                </p>
              </div>
            </div>
            <span className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white text-[13px] font-black flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              {pendingMarketers.length}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {pendingMarketers.map((marketer: any, i: number) => (
              <div key={i} className="px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors group gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-sm">
                    {marketer.profilePicture ? (
                      <img src={marketer.profilePicture} className="w-full h-full object-cover" alt="p" />
                    ) : (
                      <User className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] md:text-[16px] font-black text-slate-900 leading-none mb-1.5 truncate">
                      {marketer.fullName || marketer.firstName + ' ' + (marketer.lastName || '')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[11px] md:text-[12px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5 text-blue-400" />
                        Pending Verification
                      </span>
                      <span className="flex items-center gap-1.5 lowercase truncate">
                        <Mail className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        {marketer.email || 'No email'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => verifyMarketer(marketer.id)}
                    className="px-6 py-2 md:py-2.5 rounded-xl bg-[#1E3A8A] text-white text-[11px] md:text-[12px] font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 uppercase tracking-widest active:scale-95"
                  >
                    Verify Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard title="Total Users" value={overview?.totalUsers ?? '-'} icon={<Users className="w-5 h-5" />} trend={+5.2} />
        <StatCard title="Active Campaigns" value={overview?.activeCampaigns ?? '-'} icon={<Briefcase className="w-5 h-5" />} trend={+12.1} />
        <StatCard title="Pending Review" value={pendingCompanies.length + pendingMarketers.length} icon={<Clock className="w-5 h-5" />} />
        <StatCard 
            title="Open Complaints" 
            value={complaintStats?.pendingComplaints ?? complaintStats?.totalComplaints ?? '-'} 
            icon={<AlertCircle className="w-5 h-5" />} 
            trend={complaintStats?.newToday ? +complaintStats.newToday : undefined}
            isDanger={!!(complaintStats?.pendingComplaints > 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 md:p-8 shadow-sm">
          <h3 className="text-[17px] font-black text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1E3A8A]" /> Revenue Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 md:p-5 rounded-2xl">
              <span className="text-[13px] md:text-[14px] text-gray-600 font-bold">Companies Revenue</span>
              <span className="font-black text-slate-900 text-[15px] md:text-[16px]">${revenue?.companiesRevenue?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 md:p-5 rounded-2xl">
              <span className="text-[13px] md:text-[14px] text-gray-600 font-bold">Platform Fees</span>
              <span className="font-black text-slate-900 text-[15px] md:text-[16px]">${revenue?.platformFees?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50 p-4 md:p-5 rounded-2xl border border-emerald-100">
              <span className="text-[13px] md:text-[14px] text-emerald-800 font-black">Net Profit</span>
              <span className="font-black text-emerald-700 text-[15px] md:text-[16px]">${revenue?.netProfit?.toLocaleString() ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[17px] font-black text-slate-900">Top Performers</h3>
            <Link to="/admin/users" className="text-[11px] font-black text-[#1E3A8A] hover:underline flex items-center gap-1 uppercase tracking-widest">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topPerformers.length === 0 ? (
            <div className="text-center py-10 text-slate-300 italic text-sm">No performers found.</div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 md:p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 text-[#1E3A8A] font-black flex items-center justify-center text-xs md:text-sm">{i + 1}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] md:text-[14px] font-black text-slate-900 truncate max-w-[120px] md:max-w-none">{p?.name || 'Unknown User'}</p>
                      <p className="text-[10px] md:text-[11px] text-gray-500 font-bold">{p?.conversions || 0} Conversions</p>
                    </div>
                  </div>
                  <p className="text-[13px] md:text-[14px] font-black text-emerald-600">${(p?.totalEarnings || p?.earnings || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-300" /> Recent Platform Activity
            </h3>
          </div>
          <div className="space-y-5">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-300 italic text-sm">No recent system activities.</div>
            ) : (
              notifications.map((n: any, i: number) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-[#1E3A8A]/30 ring-4 ring-blue-50 shrink-0" />
                  <div className="flex-1 pb-5 border-b border-slate-50 last:border-0">
                    <p className="text-[14px] font-bold text-slate-700">{n.message || n.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1E3A8A] rounded-[28px] p-8 shadow-xl shadow-blue-900/15 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <ShieldCheck className="w-8 h-8 text-blue-300 mb-4" />
            <h4 className="font-black text-lg mb-2">Security & Identity</h4>
            <p className="text-blue-100/80 text-[13px] leading-relaxed mb-6">{overview?.unverifiedUsers || 0} users awaiting identity verification.</p>
            <Link to="/admin/users" className="block w-full text-center py-3 bg-white text-[#1E3A8A] rounded-xl font-black text-[12px] hover:bg-blue-50 transition-all uppercase tracking-widest">
              Review Verifications
            </Link>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-[15px]">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Pending Actions
            </h4>
            <div className="space-y-3">
              <QuickAction label="Pending Companies" count={pendingCompanies.length} link="/admin/users" highlight />
              <QuickAction label="Unapproved Campaigns" count={overview?.pendingCampaigns || 0} link="/admin/campaigns" />
              <QuickAction label="Open Complaints" count={overview?.openComplaints || 0} link="/admin/complaints" />
              <QuickAction label="Withdrawal Requests" count={overview?.pendingWithdrawals || 0} link="/admin/financials" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Company Detail Modal ─── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-[560px] max-h-[90vh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
                  {selectedRequest.logoUrl ? (
                    <img src={selectedRequest.logoUrl} className="w-full h-full object-cover" alt="logo" />
                  ) : (
                    <Building2 className="w-6 h-6 md:w-7 md:h-7 text-[#1E3A8A]" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-[18px] md:text-[20px] leading-none mb-1">{selectedRequest.campanyName || 'Company'}</h3>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">⏳ Awaiting Decision</p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 text-slate-300 hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoField icon={<Mail className="w-4 h-4" />} label="Contact Email" value={selectedRequest.userEmail || selectedRequest.contactEmail || 'N/A'} />
                <InfoField icon={<Phone className="w-4 h-4" />} label="Phone Number" value={selectedRequest.phoneNumber || 'N/A'} />
                <InfoField icon={<Globe className="w-4 h-4" />} label="Website" value={selectedRequest.website || 'N/A'} link={selectedRequest.website} />
                <InfoField icon={<FileText className="w-4 h-4" />} label="Tax ID" value={selectedRequest.taxId || 'N/A'} />
              </div>

              {selectedRequest.address && (
                <div className="p-4 bg-slate-50 rounded-2xl text-[13px] font-medium text-slate-600">
                  📍 {selectedRequest.address}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Document</p>
                {selectedRequest.commercialRegister ? (
                  <a
                    href={selectedRequest.commercialRegister}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#1E3A8A] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#1E3A8A]/5 flex items-center justify-center text-[#1E3A8A]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-slate-800">Commercial Register</p>
                        <p className="text-[11px] font-bold text-slate-400">Click to view document</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-all" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-[13px]">
                    <FileText className="w-5 h-5 opacity-30" /> No document uploaded
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => rejectCompany(selectedRequest.id)}
                  className="flex-1 py-4 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-[13px] hover:bg-rose-50 transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => approveCompany(selectedRequest.id)}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#152C6E] text-white font-black text-[13px] shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Approve Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoField({ icon, label, value, link }: { icon: React.ReactNode, label: string, value: string, link?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px]">
        <span className="text-slate-300">{icon}</span>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="text-[#1E3A8A] hover:underline truncate">{value}</a>
        ) : (
          <span className="truncate">{value}</span>
        )}
      </div>
    </div>
  )
}

function QuickAction({ label, count, link, highlight }: { label: string, count: number, link: string, highlight?: boolean }) {
  if (count === 0) return null;
  return (
    <Link to={link} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${highlight ? 'bg-amber-50 border border-amber-100 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
      <span className={`text-[12px] font-black ${highlight ? 'text-amber-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${highlight ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>{count}</span>
    </Link>
  )
}

function StatCard({ title, value, icon, trend, isDanger }: { title: string, value: string | number, icon: React.ReactNode, trend?: number, isDanger?: boolean }) {
  const isPositive = trend && trend > 0
  return (
    <div className={`bg-white rounded-[24px] border p-6 shadow-sm hover:shadow-md transition-all group ${isDanger ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-[#1E3A8A]/5 text-[#1E3A8A] rounded-xl group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-black flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-[28px] font-black text-slate-900 mb-1 tracking-tight">{value}</h3>
      <p className="text-[13px] font-bold text-gray-500">{title}</p>
    </div>
  )
}
