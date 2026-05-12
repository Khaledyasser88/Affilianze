import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { marketerApi, campaignApi, trackingLinkApi } from '../../api/client'
import {
  MousePointer2,
  Target,
  Eye,
  DollarSign,
  Search,
  ArrowUpRight,
  Zap,
  Sparkles,
  BarChart3,
  AlertCircle,
  Star
} from 'lucide-react'
import { activityTracker } from '../../utils/activityTracker'
import ComplaintModal from '../../components/ComplaintModal'
import type { MarketerDashboardDto, CampaignDto, PerformanceHistoryDto, AiSuggestionDto } from '../../api/client'

export default function MarketerDashboard() {
  const [dashboard, setDashboard] = useState<MarketerDashboardDto | null>(() => {
    const cached = localStorage.getItem('affiliance_dashboard_cache')
    return cached ? JSON.parse(cached) : null
  })
  const [allCampaigns, setAllCampaigns] = useState<CampaignDto[]>(() => {
    const cached = localStorage.getItem('affiliance_all_campaigns_cache')
    return cached ? JSON.parse(cached) : []
  })
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistoryDto[]>([])
  const [earningsReport, setEarningsReport] = useState<any | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionDto[]>([])
  const [activeApplications, setActiveApplications] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(!dashboard)
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set())
  const [linkStats, setLinkStats] = useState<Record<number, any>>({})
  
  // Complaint Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<{id: number, title: string, companyId: number, companyName: string} | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const storedIds = new Set<number>(JSON.parse(localStorage.getItem('affiliance_applied_ids') || '[]'))
        setAppliedIds(storedIds)

        const [dashRes, campaignsRes, perfRes, statsRes, appsRes, earningsRes, aiRes, reviewsRes] = await Promise.all([
          marketerApi.getmydashboard(),
          campaignApi.getsearch({ IsActive: true, Page: 1, PageSize: 50 }).catch(() => ({ data: { data: [] } })),
          marketerApi.getmyperformancehistory().catch(() => ({ data: [] })),
          marketerApi.getmystatistics().catch(() => null),
          marketerApi.getmyapplications({ PageSize: 10, Status: 'Accepted' }).catch(() => ({ data: [] })),
          marketerApi.getmyearningsreport().catch(() => null),
          marketerApi.getmyaisuggestions({ limit: 3 }).catch(() => ({ data: { data: [] } })),
          marketerApi.getmyreviews({ pageSize: 5 }).catch(() => ({ data: { data: [] } }))
        ])

        if (!cancelled) {
          if (dashRes) {
            setDashboard(dashRes)
            localStorage.setItem('affiliance_dashboard_cache', JSON.stringify(dashRes))
          }
          const reviewsData = (reviewsRes as any)?.data?.data || (reviewsRes as any)?.data || []
          setReviews(reviewsData)
          const campaignsData = (campaignsRes as any)?.data?.data || (campaignsRes as any)?.data || []
          const filteredCampaigns = campaignsData.filter((c: any) => {
            const title = (c.title || '').toLowerCase()
            return !title.includes('test') && !title.includes('loai') && title !== 'string'
          })
          setAllCampaigns(filteredCampaigns)
          localStorage.setItem('affiliance_all_campaigns_cache', JSON.stringify(filteredCampaigns))
          
          const loadedPerf = (perfRes as any)?.data || []
          setPerformanceHistory(loadedPerf)
          if (earningsRes) setEarningsReport(earningsRes)
          
          const loadedAi = (aiRes as any)?.data?.data || (aiRes as any)?.data || []
          setAiSuggestions(loadedAi)

          const loadedApps = ((appsRes as any)?.data || []).filter((app: any) => {
            const title = (app.campaignTitle || '').toLowerCase()
            return !title.includes('test') && !title.includes('loai') && title !== 'string'
          })
          setActiveApplications(loadedApps)

          if (statsRes) {
             setDashboard(prev => prev ? { ...prev, stats: statsRes } : null)
          }

          // Fetch tracking links stats
          try {
            await marketerApi.getmystatistics().catch(() => null); // Fallback
            // Fetch tracking links to map campaignId to stats
            const tLinksRes = await trackingLinkApi.getmarketermytrackinglinks({ PageSize: 50 }).catch(() => null);
            const loadedLinks = (tLinksRes as any)?.data?.data || (tLinksRes as any)?.data || []
            const statsMap: Record<number, any> = {}
            await Promise.all(loadedLinks.map(async (link: any) => {
              try {
                const s = await trackingLinkApi.getmarketermytrackinglinksstatistics(link.id)
                statsMap[link.campaignId] = (s as any).data || s
              } catch (e) { }
            }))
            if (!cancelled) setLinkStats(statsMap)
          } catch(e) {}
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const joinedCount = appliedIds.size
  const chatConversions = parseInt(localStorage.getItem('affiliance_chat_conversions') || '0')
  
  // Real stats from API with simulation fallback for demo
  const statsFromApi = (dashboard as any)?.stats || {}
  const totalConversions = statsFromApi.totalConversions || (joinedCount + chatConversions)
  const lifetimeEarnings = statsFromApi.totalEarnings || (joinedCount * 150 + (dashboard?.totalEarnings || 0) + (chatConversions * 50))
  const totalClicks = statsFromApi.totalClicks || (joinedCount * 142 + (dashboard?.totalApplications || 0) * 12)

  const openReportModal = (campaign: any) => {
    setSelectedCampaign({
      id: campaign.id,
      title: campaign.title,
      companyId: campaign.companyId || 0,
      companyName: campaign.companyName || 'Brand Partner'
    })
    setReportModalOpen(true)
  }

  // Filter only campaigns that the user has joined (applied to)
  // Merge API accepted applications and local pending applications
  const apiActive = activeApplications.map(app => ({
    id: app.campaignId,
    title: app.campaignTitle,
    companyName: app.companyName,
    status: app.status,
    progress: 10 // Placeholder for simulation
  }))
  
  const localActive = allCampaigns
    .filter((c: CampaignDto) => c.id && appliedIds.has(c.id))
    .map(c => ({
      id: c.id,
      title: c.title,
      companyName: c.companyName || 'Verified Company',
      status: 'Pending',
      progress: 0
    }))

  const activeCampaigns = [
    ...apiActive,
    ...localActive.filter(l => !apiActive.some(a => a.id === l.id))
  ]

  const stats = [
    { 
      label: 'Total Earnings', 
      value: `EGP ${lifetimeEarnings.toLocaleString()}`, 
      change: '+12.5%', 
      icon: <DollarSign className="w-4 h-4 text-green-600" />, 
      bgColor: 'bg-green-50' 
    },
    { 
      label: 'Total Clicks', 
      value: totalClicks.toLocaleString(), 
      change: '+8.2%', 
      icon: <MousePointer2 className="w-4 h-4 text-blue-600" />, 
      bgColor: 'bg-blue-50' 
    },
    { 
      label: 'Conversions', 
      value: totalConversions.toLocaleString(), 
      change: '+15.3%', 
      icon: <Target className="w-4 h-4 text-amber-600" />, 
      bgColor: 'bg-amber-50' 
    },
    { 
      label: 'Impressions', 
      value: (totalClicks * 6.4).toFixed(1) + 'K', 
      change: '+5.7%', 
      icon: <Eye className="w-4 h-4 text-orange-600" />, 
      bgColor: 'bg-orange-50' 
    },
  ]

  const apiActivities = dashboard?.recentActivities || []
  const localActivities = activityTracker.getActivities()
  const recentActivity = [...localActivities, ...apiActivities].sort((a, b) => 
    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  ).slice(0, 10)

  if (recentActivity.length === 0) {
    recentActivity.push({ description: 'No recent activity to show', date: new Date().toISOString() } as any)
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 px-4 md:px-6">
      {/* Top row stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-10 h-10 ${s.bgColor} rounded-xl flex items-center justify-center`}>
                {s.icon}
              </div>
              <div className="flex items-center gap-1 text-green-600 font-bold text-[12px]">
                <ArrowUpRight className="w-3 h-3" />
                {s.change}
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                {loading && !dashboard ? <div className="h-7 w-24 skeleton" /> : s.value}
              </p>
              <p className="text-[13px] font-bold text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>


      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main section: Active Campaigns */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-[20px] font-black text-slate-900 mb-8">Active Campaigns</h2>
            
            <div className="space-y-6">
              {loading && activeCampaigns.length === 0 ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-40 skeleton rounded-2xl" />
                ))
              ) : activeCampaigns.length > 0 ? (
                activeCampaigns.map((c: CampaignDto, i: number) => {
                  const s = linkStats[c.id!] || { totalClicks: 0, totalConversions: 0, totalEarnings: 0 }
                  const clicks = s.totalClicks || 0
                  const conversions = s.totalConversions || 0
                  const earnings = s.totalEarnings || 0
                  const progress = c.daysRemaining ? Math.max(0, 100 - (c.daysRemaining / 30) * 100) : 0

                  return (
                    <div key={i} className="bg-white rounded-2xl border border-gray-50 p-6 transition-all hover:shadow-lg hover:border-blue-100 group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-[17px] font-black text-slate-900 mb-1">{c.title}</h3>
                          <p className="text-gray-400 text-[13px] font-medium">{c.companyName || 'Brand Partner'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-black uppercase tracking-wider rounded-full border border-green-100">
                            Active
                          </span>
                          <button 
                            onClick={() => openReportModal(c)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                            title="Report an issue"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 mb-6">
                        <div>
                          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Clicks</p>
                          <p className="text-[16px] font-black text-slate-900">{clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Conversions</p>
                          <p className="text-[16px] font-black text-slate-900">{conversions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">Earnings</p>
                          <p className="text-[16px] font-black text-green-600">EGP {earnings.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progress</p>
                           <p className="text-[12px] font-black text-slate-900">{progress}%</p>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#1E3A8A] transition-all duration-1000 group-hover:bg-blue-600" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                  <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">No active campaigns yet</p>
                  <Link to="/campaigns" className="mt-4 inline-block text-[#1E3A8A] font-black text-sm hover:underline tracking-tight">Browse available campaigns</Link>
                </div>
              )}
            </div>
          </div>

          {/* Performance Chart Section - Moved under Active Campaigns */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-end mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[20px] font-black text-slate-900 mb-1">Performance Overview</h2>
                  <p className="text-gray-400 text-sm font-medium">Tracking your performance score over the last 7 days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1E3A8A] rounded-full" />
                  <span className="text-xs font-bold text-gray-500">Performance Score</span>
                </div>
              </div>
            </div>
            
            <div className="h-[250px] flex items-end justify-between gap-4 px-4 border-b border-gray-50">
              {performanceHistory.length > 0 ? performanceHistory.map((day: PerformanceHistoryDto, i: number) => {
                const scoreHeight = (day.performanceScore || 0)
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Score: {day.performanceScore || 0}%
                    </div>
                    
                    <div className="w-full max-w-[60px] flex items-end justify-center h-full">
                      <div 
                        className="w-full bg-[#1E3A8A] rounded-t-lg transition-all duration-700 hover:bg-blue-600" 
                        style={{ height: `${Math.max(scoreHeight, 5)}%` }} 
                      />
                    </div>
                    <p className="mt-4 text-[11px] font-bold text-gray-400 uppercase">
                      {day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }) : '---'}
                    </p>
                  </div>
                )
              }) : (
                Array(7).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full max-w-[40px] bg-gray-50 rounded-t-lg h-[20%]" />
                    <p className="mt-4 text-[11px] font-bold text-gray-200 uppercase">---</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: AI Recommendations & Recent Activity */}
        <div className="space-y-6">
          {/* AI Recommendations Card */}
          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#152C6E] rounded-3xl p-8 shadow-xl shadow-blue-900/10 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-[18px] font-black tracking-tight">AI For You</h2>
              </div>
              
              <div className="space-y-4">
                {aiSuggestions.length > 0 ? aiSuggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all cursor-pointer group/item">
                    <div className="flex justify-between items-start mb-1">
                      <div className="w-full">
                        <p className="text-[13px] font-black truncate pr-2">{s.campaignTitle || 'Strategic Match'}</p>
                      </div>
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        {s.matchScore || 95}%
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100/70 line-clamp-1 font-medium mb-2">
                       {s.matchReason || 'High resonance with your audience niche.'}
                    </p>
                    <Link to={`/campaigns`} className="text-[10px] font-black text-white flex items-center gap-1 group-hover/item:gap-2 transition-all">
                      VIEW CAMPAIGN <Zap className="w-3 h-3 fill-white" />
                    </Link>
                  </div>
                )) : loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 skeleton rounded-2xl" />
                  ))
                ) : (
                  <div className="py-6 text-center border border-dashed border-white/20 rounded-2xl">
                    <p className="text-xs text-blue-200/60 font-bold">No recommendations found</p>
                  </div>
                )}
              </div>
            </div>
            {/* Abstract shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-[18px] font-black text-slate-900 mb-8">Recent Activity</h2>
            <div className="space-y-6">
              {recentActivity.length > 0 && recentActivity[0].description !== 'No recent activity to show' ? (
                recentActivity.map((act: any, i: number) => {
                  // Determine if we should show a value (mock/extracted from description if possible)
                  const hasAmount = act.description?.toLowerCase().includes('conversion') || act.description?.toLowerCase().includes('payment')
                  const amount = act.description?.match(/EGP\s*([\d,]+)/)?.[0] || (hasAmount ? `+EGP ${Math.floor(Math.random() * 200 + 100)}` : null)
                  
                  return (
                    <div key={i} className="group relative">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-[14px] font-bold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                            {act.description}
                          </p>
                          <p className="text-[12px] font-medium text-gray-400 mt-1">
                            {new Date(act.date || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        {amount && (
                          <span className="text-[13px] font-black text-green-600 whitespace-nowrap">
                            {amount}
                          </span>
                        )}
                      </div>
                      {i < recentActivity.length - 1 && (
                        <div className="h-[1px] bg-gray-50 w-full mt-6" />
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 italic">No recent activity detected.</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Widget */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-[18px] font-black text-slate-900 mb-6">Recent Reviews</h2>
            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map((rev, i) => (
                <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-black text-slate-800">{rev.reviewerName || 'Brand Manager'}</span>
                    <div className="flex gap-0.5">
                      {Array(5).fill(0).map((_, idx) => (
                        <Star key={idx} className={`w-3 h-3 ${idx < (rev.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[12px] text-slate-500 line-clamp-2 italic">"{rev.comment || 'Great performance on this campaign!'}"</p>
                </div>
              )) : (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs text-gray-400 font-bold">No reviews yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Earnings Report Widget */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-[18px] font-black text-slate-900 mb-6">Earnings Report</h2>
            {earningsReport ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Total Earnings</span>
                  <span className="text-lg font-black text-emerald-600">EGP {((earningsReport as any)?.totalEarnings || 0).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</span>
                    <span className="text-sm font-black text-amber-600">EGP {((earningsReport as any)?.pendingEarnings || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Withdrawn</span>
                    <span className="text-sm font-black text-slate-900">EGP {((earningsReport as any)?.withdrawnEarnings || 0).toLocaleString()}</span>
                  </div>
                </div>
                <Link to="/profile" className="w-full flex justify-center items-center gap-2 mt-4 text-xs font-black text-[#1E3A8A] border border-blue-100 bg-white py-3 rounded-xl hover:bg-blue-50 transition-colors">
                  <DollarSign className="w-3.5 h-3.5" /> Full report
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 font-bold">No earnings data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCampaign && (
        <ComplaintModal 
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          defendantId={selectedCampaign.companyId}
          defendantName={selectedCampaign.companyName}
          campaignId={selectedCampaign.id}
          campaignTitle={selectedCampaign.title}
        />
      )}
    </div>
  )
}
