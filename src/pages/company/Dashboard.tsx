import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { campaignApi, analyticsApi, companyApi } from '../../api/client'
import type { CampaignDto, CompanyStatisticsDto, CampaignStatisticsDto, CompanyDetailsDto, ConversionFunnelDto } from '../../api/client'
import { TrendingUp, DollarSign, Users, Eye, Search, Filter, BarChart3, ArrowLeft, Plus, MoreVertical, Pause, Play, Trash2, LayoutDashboard, Crown, Star, ShieldAlert, CheckCircle, Clock, RefreshCw, X, Loader2 } from 'lucide-react'
import { dataUtils } from '../../utils/dataUtils'
import * as Types from '../../api/client'
import { toast } from 'react-hot-toast'
import defaultProfileImg from '../../assets/profile.jpg'

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([])
  const [stats, setStats] = useState<CompanyStatisticsDto | null>(null)
  const [topMarketers, setTopMarketers] = useState<any[]>([])
  const [profile, setProfile] = useState<CompanyDetailsDto | null>(null)
  const [campaignStats, setCampaignStats] = useState<Record<number, CampaignStatisticsDto>>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Conversion Funnel modal state
  const [funnelOpen, setFunnelOpen] = useState(false)
  const [funnelCampaign, setFunnelCampaign] = useState<CampaignDto | null>(null)
  const [funnelData, setFunnelData] = useState<ConversionFunnelDto | null>(null)
  const [funnelLoading, setFunnelLoading] = useState(false)

  // Insights modal state
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [allMarketers, setAllMarketers] = useState<any[]>([])

  const load = async (showToast = false) => {
    if (showToast) setIsRefreshing(true)
    else setLoading(true)
    
    setError('')
    try {
      const [campaignsRes, statsRes, myStatsRes, marketersRes, profileRes] = await Promise.all([
        campaignApi.getmycampaigns({ Page: 1, PageSize: 50 }),
        analyticsApi.getcompanyoverview().catch(() => null),
        companyApi.getmystatistics().catch(() => null),
        analyticsApi.getcompanymarketerperformance({ GroupBy: 'Marketer' }).catch(() => []),
        companyApi.getmyprofile().catch(() => null)
      ])
      
      const rawRes = dataUtils.unwrapList<CampaignDto>(campaignsRes)
      setCampaigns(dataUtils.filterTestEntities(rawRes))
      
      const combinedStats = { 
        ...((statsRes as any)?.data || statsRes || {}), 
        ...((myStatsRes as any)?.data || myStatsRes || {}) 
      }
      setStats(combinedStats as unknown as Types.CompanyStatisticsDto)
      const rawProfile = (profileRes as any)?.data || profileRes
      setProfile(rawProfile)
      // Capture raw status field (e.g. 'Pending', 'Approved', 'Rejected') if present
      const rawStatus = (rawProfile as any)?.status || (profileRes as any)?.data?.status || null
      setProfileStatus(rawStatus)
      
      const marketersData = (marketersRes as any)?.data || marketersRes || []
      setAllMarketers(Array.isArray(marketersData) ? marketersData : [])
      setTopMarketers(Array.isArray(marketersData) ? marketersData.slice(0, 5) : [])
      
      if (showToast) toast.success('Status updated')
    } catch (e: any) {
      console.error('Dashboard load error:', e)
      const msg = e.message || ''
      if (msg.includes('Forbidden') || msg.includes('403')) {
        setError('🚫 ACCESS RESTRICTED: Your account is currently under review or has not been fully verified. Please ensure your documents are approved by our admin team.')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (Array.isArray(campaigns) && campaigns.length > 0) {
      campaigns.forEach(async (c) => {
        if (c.id && !campaignStats[c.id]) {
          try {
            const s = await campaignApi.getstatistics(c.id)
            setCampaignStats(prev => ({ ...prev, [c.id!]: s }))
          } catch (err) { console.error(err) }
        }
      })
    }
  }, [campaigns])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggleStatus = async (c: CampaignDto) => {
    if (!c.id) return
    const isPaused = c.status === 'Paused'
    try {
      if (isPaused) {
        await campaignApi.putresume(c.id)
        toast.success(`'${c.title}' resumed!`)
      } else {
        await campaignApi.putpause(c.id)
        toast.success(`'${c.title}' paused.`)
      }
      setOpenMenuId(null)
      load()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    }
  }

  const handleUpdateStatus = async (id: number, status: Types.CampaignStatus) => {
    if (!window.confirm(`Are you sure you want to set this campaign to ${status}?`)) return
    try {
      await campaignApi.putstatus(id, status)
      toast.success(`Campaign status updated to ${status}`)
      setOpenMenuId(null)
      load()
    } catch (err: any) { toast.error(err.message || 'Update failed') }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return
    try {
      await campaignApi.delete(id)
      toast.success('Campaign deleted')
      load()
    } catch (err: any) { toast.error(err.message || 'Delete failed') }
  }

  // Open conversion funnel modal using analyticsApi.getcompanyconversionfunnel(campaignId)
  const openFunnel = async (c: CampaignDto, e: React.MouseEvent) => {
    e.stopPropagation()
    setFunnelCampaign(c)
    setFunnelOpen(true)
    setFunnelData(null)
    setFunnelLoading(true)
    try {
      const res = await analyticsApi.getcompanyconversionfunnel(c.id!)
      setFunnelData((res as any)?.data || res)
    } catch (err: any) {
      toast.error('Failed to load funnel data')
      console.error(err)
    } finally {
      setFunnelLoading(false)
    }
  }

  const filteredResults = search
    ? campaigns.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))
    : campaigns

  // Stats Mapping
  const totalRevenue = stats?.totalRevenue ?? 0
  const activeMarketers = stats?.activeMarketersCount ?? 0
  const activeCampaigns = stats?.activeCampaignsCount ?? 0
  const totalCommissionPaid = stats?.totalCommissionPaid ?? 0
  const totalAllocatedBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0)
  const averageConvRate = stats?.averageConversionRate ?? 0

  const isVerified = profile?.isVerified ?? false
  const isRejected = !isVerified && profileStatus?.toLowerCase() === 'rejected'

  const statsCards = [
    { 
      label: 'Total Budget', 
      value: `$${totalAllocatedBudget.toLocaleString()}`, 
      sub: `Used: $${totalCommissionPaid.toLocaleString()}`,
      icon: DollarSign, 
      color: 'bg-[#1E3A8A]/5', 
      iconColor: 'text-[#1E3A8A]'
    },
    { 
      label: 'Total Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      sub: '+12.5% from last month',
      subColor: 'text-emerald-500',
      icon: BarChart3, 
      color: 'bg-emerald-50', 
      iconColor: 'text-emerald-600'
    },
    { 
      label: 'Active Affiliates', 
      value: String(activeMarketers), 
      sub: `Across ${activeCampaigns} campaigns`,
      icon: Users, 
      color: 'bg-purple-50', 
      iconColor: 'text-purple-600'
    },
    { 
      label: 'Conversion Rate', 
      value: `${Number(averageConvRate).toFixed(1)}%`, 
      sub: '+0.8% from last month',
      subColor: 'text-emerald-500',
      icon: Eye, 
      color: 'bg-orange-50', 
      iconColor: 'text-orange-500'
    },
  ]

  const getStatusStyle = (status?: string | null) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600'
      case 'Paused': return 'bg-amber-50 text-amber-600'
      case 'Pending': return 'bg-blue-50 text-blue-600'
      default: return 'bg-slate-50 text-slate-500'
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF] font-sans pb-20">
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-10">
        
        {/* Verification Alert Banner — Rejected */}
        {isRejected && !loading && (
          <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-slate-800 leading-none mb-2">Account Verification Rejected</h3>
                <p className="text-slate-500 font-medium text-[14px]">Your application was not approved. Please contact support or resubmit your documents for further review.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
               <button
                 onClick={() => load(true)}
                 disabled={isRefreshing}
                 className="flex-1 md:flex-none px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-[14px] hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
               >
                  {isRefreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Check Status
               </button>
               <button className="flex-1 md:flex-none px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-[14px] hover:bg-rose-600 transition-all shadow-lg shadow-rose-900/20">
                 Contact Support
               </button>
            </div>
          </div>
        )}

        {/* Verification Alert Banner — Pending */}
        {!isVerified && !isRejected && !loading && (
          <div className="mb-10 p-6 bg-amber-50 border border-amber-100 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-slate-800 leading-none mb-2">Account Verification Pending</h3>
                <p className="text-slate-500 font-medium text-[14px]">Your campaign creation feature is temporarily restricted while we audit your company documents.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
               <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-all">Support</button>
               <button 
                 onClick={() => load(true)}
                 disabled={isRefreshing}
                 className="flex-1 md:flex-none px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-[14px] hover:bg-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isRefreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Check Status
                </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[26px] font-black text-slate-800 tracking-tight leading-none mb-1.5">Company Dashboard</h1>
                {isVerified ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <p className="text-[14px] font-medium text-slate-400">{profile?.campanyName || 'Your Company'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => isVerified ? navigate('/company/campaigns/new') : toast.error('Account must be verified to create campaigns')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[14px] transition-all shadow-lg active:scale-95 ${
              isVerified 
                ? 'bg-[#1E3A8A] text-white hover:bg-[#152C6E] shadow-blue-900/10' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex-row-reverse'
            }`}
          >
            {isVerified ? <Plus className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            New Campaign
          </button>
        </div>

        {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-100">{error}</div>}

        {loading ? (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-[#1E3A8A]/20 border-t-[#1E3A8A] rounded-full animate-spin mb-4" />
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-300">Synchronizing...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map(({ label, value, sub, subColor, icon: Icon, color, iconColor }) => (
                <div key={label} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm relative group overflow-hidden transition-all duration-500 hover:shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${color} rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div className="text-emerald-400 opacity-60">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[30px] font-black text-slate-800 tracking-tight leading-none mb-2">{value}</h3>
                    <p className="text-[13px] font-bold text-slate-400 mb-1">{label}</p>
                    <div className="flex items-center gap-1.5">
                       <span className={`text-[12px] font-black ${subColor || 'text-slate-400'}`}>{sub}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Marketing Campaigns Table - PIXEL PERFECT DESIGN */}
              <div className="lg:col-span-2 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="px-8 py-8 flex items-center justify-between">
                  <h2 className="text-[22px] font-black text-slate-800 tracking-tight">Marketing Campaigns</h2>
                  <button className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-slate-100 text-[13px] font-black text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>

                <div className="px-8 mb-6">
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-300 group-focus-within:text-[#1E3A8A] transition-colors" />
                    <input 
                      type="text" placeholder="Search for a campaign..." value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 py-3.5 text-[15px] font-medium text-slate-900 bg-white border border-slate-100 rounded-xl focus:border-[#1E3A8A]/20 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/40 text-left">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Campaign Name</th>
                        <th className="px-8 py-5 border-b border-slate-50">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Status
                            <button 
                              onClick={() => load(true)}
                              className={`p-1.5 rounded-full hover:bg-slate-100 transition-all text-slate-400 hover:text-[#1E3A8A] ${isRefreshing ? 'animate-spin text-[#1E3A8A]' : ''}`}
                              title="Refresh Status"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-50">Budget</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-50">Affiliates</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-50">Clicks</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-50">Conversions</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-50">Revenue</th>
                        <th className="px-8 py-5 w-[60px] border-b border-slate-50"></th>
                      </tr>
                    </thead>
                    <tbody className="overflow-visible">
                      {filteredResults.length === 0 ? (
                        <tr><td colSpan={8} className="py-24 text-center text-slate-300 font-black italic uppercase tracking-widest text-[11px]">No campaigns found.</td></tr>
                      ) : (
                        filteredResults.map((c) => {
                          const s = (campaignStats[c.id!] || {}) as any
                          const conversions = s.totalConversions ?? 0
                          const clicks = s.totalClicks ?? 0
                          const affiliates = s.activeMarketersCount ?? 0
                          const spent = s.totalSpent ?? 0
                          const revenue = s.totalRevenue ?? (spent * 1.5) // Mock if not in stats
                          const budget = Number(c.budget) || 0

                          return (
                            <tr key={c.id} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <span className="text-[15px] font-black text-slate-800 group-hover:text-[#1E3A8A] transition-colors">{c.title}</span>
                                  <span className="text-[11px] font-bold text-slate-400 mt-1">{c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(c.status)}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-center text-[10px]">
                                <div className="flex flex-col items-center">
                                  <span className="text-[14px] font-black text-slate-800">${budget.toLocaleString()}</span>
                                  <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase">Used ${spent.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <div className="flex flex-col items-center gap-1">
                                    <span className="text-[14px] font-black text-slate-800">{affiliates.toLocaleString()}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="text-[14px] font-black text-slate-800">{clicks.toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-6 text-center text-[14px] font-black text-slate-800">{conversions.toLocaleString()}</td>
                              <td className="px-8 py-6 text-right">
                                 <span className="text-[14px] font-black text-emerald-600">${revenue.toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-6 text-right relative">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : (c.id || null)) }}
                                  className="p-2 text-slate-300 hover:text-slate-800 transition-colors"
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                                
                                {openMenuId === c.id && (
                                  <div ref={menuRef} className="absolute right-8 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 text-left">
                                    <Link to={`/company/campaigns/${c.id}/applications`} className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                      <LayoutDashboard className="w-4 h-4 text-slate-400" /> View Applications
                                    </Link>
                                    <button onClick={(e) => openFunnel(c, e)} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                      <BarChart3 className="w-4 h-4 text-indigo-400" /> Conversion Funnel
                                    </button>
                                    <button onClick={() => handleToggleStatus(c)} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                      {c.status === 'Paused' ? <><Play className="w-4 h-4 text-emerald-500" /> Resume Campaign</> : <><Pause className="w-4 h-4 text-amber-500" /> Pause Campaign</>}
                                    </button>
                                    {c.status !== 'Completed' && (
                                      <button onClick={() => handleUpdateStatus(c.id!, 'Completed')} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                        <CheckCircle className="w-4 h-4 text-blue-500" /> Close Campaign
                                      </button>
                                    )}
                                    <div className="h-[1px] bg-slate-50 my-1 mx-2"></div>
                                    <button onClick={() => handleDelete(c.id!)} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                                      <Trash2 className="w-4 h-4" /> Delete Campaign
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Performer Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 ring-8 ring-emerald-50/30">
                      <Crown className="w-10 h-10" />
                   </div>
                   <h2 className="text-[18px] font-black text-slate-800">Affiliate Leaderboard</h2>
                   <p className="text-[12px] font-medium text-slate-400 mt-1 max-w-[200px]">Top marketers delivering results across your campaigns</p>
                   
                   <div className="w-full mt-8 space-y-4">
                      {topMarketers.length > 0 ? topMarketers.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                 <img src={defaultProfileImg} alt="M" className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left">
                                 <p className="text-[13px] font-black text-slate-800 truncate max-w-[80px]">{m.marketerName || 'Marketer'}</p>
                                 <p className="text-[10px] font-bold text-emerald-500">{m.totalEarnings ? `$${m.totalEarnings.toLocaleString()}` : 'Top Pro'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span className="text-[11px] font-black text-slate-700">{m.conversionRate ? `${(m.conversionRate * 100).toFixed(1)}%` : 'New'}</span>
                           </div>
                        </div>
                      )) : (
                        <p className="py-8 text-[11px] font-bold text-slate-300 italic">No rankings available yet.</p>
                      )}
                   </div>
                   
                   <button 
                     onClick={() => setInsightsOpen(true)}
                     className="w-full mt-6 py-3.5 rounded-2xl border border-slate-100 text-[11px] font-black uppercase tracking-widest text-[#1E3A8A] hover:bg-slate-50 transition-all hover:shadow-sm active:scale-95"
                   >
                      View All Insights
                   </button>
                </div>

                <div className="bg-gradient-to-br from-[#1E3A8A] to-[#152C6E] rounded-[28px] p-8 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-1000"></div>
                   <h3 className="text-[18px] font-black leading-tight mb-2">Grow your business with AI</h3>
                   <p className="text-white/70 text-[12px] font-medium mb-6">Our AI assistant can help you optimize commission structures and target the right niche.</p>
                   <Link to="/ai-assistant" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1E3A8A] rounded-xl font-bold text-[13px] hover:bg-blue-50 transition-all active:scale-95">
                      Open AI Assistant
                   </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Conversion Funnel Modal ────────────────────────────────── */}
      {funnelOpen && funnelCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFunnelOpen(false)}
        >
          <div
            className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-[#1E3A8A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-[18px] leading-none mb-1">Conversion Funnel</h3>
                  <p className="text-indigo-200 text-[12px] font-medium truncate max-w-[220px]">{funnelCampaign.title}</p>
                </div>
              </div>
              <button onClick={() => setFunnelOpen(false)} className="p-2 hover:bg-white/15 rounded-full transition-colors text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {funnelLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest">Fetching funnel data...</p>
                </div>
              ) : funnelData ? (() => {
                const steps = [
                  { label: 'Views', value: funnelData.totalViews ?? 0, color: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Unique Visitors', value: funnelData.uniqueVisitors ?? 0, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Clicks', value: funnelData.clicks ?? 0, color: 'bg-cyan-500', text: 'text-cyan-600', bg: 'bg-cyan-50' },
                  { label: 'Applications', value: funnelData.applications ?? 0, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Conversions', value: funnelData.conversions ?? 0, color: 'bg-green-600', text: 'text-green-700', bg: 'bg-green-50' },
                ]
                const maxVal = Math.max(...steps.map(s => s.value), 1)
                return (
                  <div className="p-8 space-y-6">
                    {/* Funnel bars */}
                    <div className="space-y-3">
                      {steps.map((step, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] font-black text-slate-600 uppercase tracking-wider">{step.label}</span>
                            <span className={`text-[14px] font-black ${step.text}`}>{step.value.toLocaleString()}</span>
                          </div>
                          <div className="h-9 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                            <div
                              className={`h-full ${step.color} rounded-xl transition-all duration-700 flex items-center justify-end pr-3`}
                              style={{ width: `${Math.max(4, (step.value / maxVal) * 100)}%` }}
                            >
                              {step.value > 0 && (
                                <span className="text-white text-[11px] font-black">
                                  {((step.value / maxVal) * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Rate Cards */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { label: 'View → Click', value: funnelData.viewToClickRate, suffix: '%' },
                        { label: 'Click → Apply', value: funnelData.clickToApplicationRate, suffix: '%' },
                        { label: 'Apply → Complete', value: funnelData.applicationToCompletionRate, suffix: '%' },
                        { label: 'Overall CVR', value: funnelData.overallConversionRate, suffix: '%' },
                      ].map((r, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{r.label}</p>
                          <p className="text-[22px] font-black text-slate-900">
                            {r.value != null ? Number(r.value).toFixed(1) : '—'}
                            {r.value != null && <span className="text-[12px] font-bold text-slate-400 ml-0.5">{r.suffix}</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })() : (
                <div className="py-16 flex flex-col items-center justify-center text-center px-8">
                  <BarChart3 className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="font-bold text-slate-500">No funnel data available yet</p>
                  <p className="text-[12px] text-slate-400 mt-1">Data will appear once the campaign receives traffic.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Performance Insights Modal ───────────────────────────── */}
      {insightsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setInsightsOpen(false)}
        >
          <div 
            className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-7 bg-[#1E3A8A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-[20px] leading-none mb-1.5">Affiliate Performance Insights</h3>
                  <p className="text-blue-200/70 text-[13px] font-medium">Detailed breakdown of all marketers delivering results</p>
                </div>
              </div>
              <button 
                onClick={() => setInsightsOpen(false)} 
                className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Marketers</p>
                  <p className="text-[24px] font-black text-slate-900 leading-none">{allMarketers.length}</p>
                </div>
                <div className="p-5 bg-emerald-50 rounded-[28px] border border-emerald-100 text-center">
                  <p className="text-[10px] font-black text-emerald-800/50 uppercase tracking-widest mb-1.5">Highest CVR</p>
                  <p className="text-[24px] font-black text-emerald-600 leading-none">
                    {allMarketers.length > 0 ? `${(Math.max(...allMarketers.map(m => m.conversionRate || 0)) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="p-5 bg-blue-50 rounded-[28px] border border-blue-100 text-center">
                  <p className="text-[10px] font-black text-blue-800/50 uppercase tracking-widest mb-1.5">Avg Earnings</p>
                  <p className="text-[24px] font-black text-blue-600 leading-none">
                    {allMarketers.length > 0 ? `$${(allMarketers.reduce((acc, m) => acc + (m.totalEarnings || 0), 0) / allMarketers.length).toFixed(0)}` : '$0'}
                  </p>
                </div>
              </div>

              {/* Marketers Table */}
              <div className="space-y-4">
                <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1E3A8A]" /> Complete Ranking
                </h4>
                
                <div className="border border-slate-100 rounded-[32px] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketer</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conversions</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Avg. Rate</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allMarketers.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black italic uppercase tracking-widest text-[11px]">No performance data available yet.</td></tr>
                      ) : (
                        allMarketers.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                   <img src={m.profilePicture || defaultProfileImg} alt="M" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[14px] font-black text-slate-800">{m.marketerName || 'System Marketer'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[14px] font-black text-slate-700">{m.totalConversions || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[14px] font-black text-slate-800">{(m.conversionRate * 100).toFixed(1)}%</span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(m.conversionRate * 100)}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[14px] font-black text-emerald-600">${(m.totalEarnings || 0).toLocaleString()}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pro Tip */}
              <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 flex items-start gap-4">
                 <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <Star className="w-5 h-5 fill-indigo-600" />
                 </div>
                 <div>
                    <h5 className="text-[14px] font-black text-indigo-900 leading-none mb-1.5">Optimization Suggestion</h5>
                    <p className="text-[13px] font-medium text-indigo-700/80 leading-relaxed">
                      Your top 20% of affiliates contribute to 80% of your total revenue. Consider creating exclusive high-commission tiers for them to further drive scale.
                    </p>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
               <button 
                 onClick={() => setInsightsOpen(false)}
                 className="px-8 py-3 bg-[#1E3A8A] text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-[#152C6E] transition-all shadow-lg shadow-blue-900/10 active:scale-95"
               >
                 Close Report
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
