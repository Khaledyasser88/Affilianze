import { useEffect, useState } from 'react'
import { trackingLinkApi, paymentApi } from '../../api/client'
import type { TrackingLinkDto, TrackingLinkStatisticsDto } from '../../api/client'
import { 
  Link as LinkIcon, 
  ExternalLink, 
  Copy, 
  Check, 
  MousePointer2, 
  Target, 
  Clock, 
  Search, 
  BarChart2,
  X,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface LinkDetail {
  link: TrackingLinkDto
  stats: TrackingLinkStatisticsDto
  earnings: number
}

export default function TrackingLinks() {
  const [links, setLinks] = useState<TrackingLinkDto[]>([])
  const [stats, setStats] = useState<Record<number, TrackingLinkStatisticsDto>>({})
  const [earnings, setEarnings] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<LinkDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await trackingLinkApi.getmarketermytrackinglinks({ PageSize: 50 })
        if (!cancelled) {
          const loadedLinks = (res as any)?.data?.data || (res as any)?.data || []
          setLinks(loadedLinks)
          
          const statsMap: Record<number, TrackingLinkStatisticsDto> = {}
          const earningsMap: Record<number, number> = {}
          
          await Promise.all(loadedLinks.map(async (link: any) => {
            try {
              const [s, e] = await Promise.all([
                trackingLinkApi.getmarketermytrackinglinksstatistics(link.id),
                link.campaignId ? paymentApi.getearnings(link.campaignId).catch(() => ({ data: 0 })) : Promise.resolve({ data: 0 })
              ])
              statsMap[link.id] = (s as any).data || s
              earningsMap[link.id] = (e as any).data ?? (typeof e === 'number' ? e : 0)
            } catch (e) {
              console.warn(`Failed to fetch info for link ${link.id}`, e)
            }
          }))
          
          if (!cancelled) {
            setStats(statsMap)
            setEarnings(earningsMap)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Failed to load tracking links:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleCopy = (url: string, id: number) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ─── Open detail modal using individual link endpoint ─────────────
  const openDetail = async (link: TrackingLinkDto) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailData(null)
    try {
      // Fetch individual link details using the /api/marketer/my/tracking-links/{linkId} endpoint
      const [linkRes, statsRes] = await Promise.all([
        trackingLinkApi.getmarketermytrackinglinks1(link.id!),
        trackingLinkApi.getmarketermytrackinglinksstatistics(link.id!)
      ])
      const fullLink: TrackingLinkDto = (linkRes as any)?.data || link
      const fullStats: TrackingLinkStatisticsDto = (statsRes as any)?.data || stats[link.id!] || {}
      const earnVal = earnings[link.id!] ?? 0
      setDetailData({ link: fullLink, stats: fullStats, earnings: earnVal })
    } catch (err) {
      console.error('Failed to load link detail:', err)
      // Fallback to cached data
      setDetailData({ link, stats: stats[link.id!] || {}, earnings: earnings[link.id!] ?? 0 })
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredLinks = links.filter(l => 
    (l.campaignTitle?.toLowerCase().includes(search.toLowerCase()) || 
     l.uniqueLink?.toLowerCase().includes(search.toLowerCase()))
  )

  const totalClicks = Object.values(stats).reduce((acc, s) => acc + (s.totalClicks || 0), 0)
  const totalConversions = Object.values(stats).reduce((acc, s) => acc + (s.totalConversions || 0), 0)
  const totalEarnings = Object.values(earnings).reduce((acc, v) => acc + v, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[24px] font-black text-slate-900 leading-tight">My Tracking Links</h1>
            <p className="text-gray-400 text-[14px] mt-1">Monitor the performance of your affiliate marketing URLs in real-time.</p>
          </div>
        </div>

        {/* Stats Row — 4 cards now with Total Clicks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Links', value: links.length, icon: LinkIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Clicks', value: totalClicks, icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Conversions', value: totalConversions, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Estimated Earnings', value: totalEarnings, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', isPrice: true }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-[22px] font-black text-slate-900 mt-0.5">
                  {loading ? '...' : (stat as any).isPrice ? `EGP ${stat.value.toLocaleString()}` : stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search links or campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-[14px] focus:ring-2 focus:ring-[#1E3A8A]/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Campaign & Link</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Clicks</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Earnings</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Conv. Rate</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Created</th>
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 h-20 bg-gray-50/10"></td>
                    </tr>
                  ))
                ) : filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <LinkIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-slate-900 font-bold mb-1">No links found</h3>
                        <p className="text-gray-400 text-[13px]">Apply for campaigns to generate your unique tracking links.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((link) => {
                    const linkStats = stats[link.id!] || { totalClicks: 0, totalConversions: 0 }
                    const clicks = linkStats.totalClicks || 0
                    const convRate = clicks ? ((linkStats.totalConversions || 0) / clicks * 100).toFixed(1) : '0.0'
                    
                    return (
                      <tr 
                        key={link.id} 
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => openDetail(link)}
                      >
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-slate-900 mb-1 group-hover:text-[#1E3A8A] transition-colors">{link.campaignTitle || 'Unnamed Campaign'}</span>
                            <div className="flex items-center gap-2 group/url" onClick={(e) => { e.stopPropagation(); handleCopy(link.uniqueLink || '', link.id!) }}>
                              <code className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">
                                {link.uniqueLink}
                              </code>
                              {copiedId === link.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-300 group-hover/url:text-[#1E3A8A]" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <MousePointer2 className="w-4 h-4 text-indigo-400" />
                            <span className="text-[15px] font-black text-slate-900">{clicks.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-black text-emerald-600">EGP {earnings[link.id!]?.toLocaleString() || '0'}</span>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Total Gained</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${Math.min(100, parseFloat(convRate) * 5)}%` }} 
                              />
                            </div>
                            <span className="text-[12px] font-bold text-slate-900">{convRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-medium text-[13px] text-gray-500">
                          {link.createdAt ? new Date(link.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(link)}
                              className="p-2.5 bg-blue-50 text-[#1E3A8A] rounded-xl hover:bg-blue-100 transition-colors"
                              title="View Details"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </button>
                            <a 
                              href={link.uniqueLink || undefined} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                              title="Open Link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-gray-50">
            <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium">
              <Clock className="w-4 h-4" />
              Statistics are updated every 15 minutes. Click any row to view detailed analytics.
            </div>
          </div>
        </div>
      </main>

      {/* ─── Link Detail Modal ─────────────────────────────────────── */}
      {detailOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setDetailOpen(false)}
        >
          <div 
            className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-[#1E3A8A] to-[#2d55c7] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-[18px] leading-none mb-1">Link Analytics</h3>
                  <p className="text-blue-200 text-[12px] font-medium truncate max-w-[220px]">
                    {detailData?.link.campaignTitle || 'Loading...'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-full transition-colors text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#1E3A8A] animate-spin mb-4" />
                <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest">Loading analytics...</p>
              </div>
            ) : detailData ? (
              <div className="p-8 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Clicks', value: (detailData.stats.totalClicks || 0).toLocaleString(), icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Conversions', value: (detailData.stats.totalConversions || 0).toLocaleString(), icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Earnings', value: `EGP ${(detailData.earnings || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                      <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                        <s.icon className="w-4.5 h-4.5" />
                      </div>
                      <p className="text-[18px] font-black text-slate-900">{s.value}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Conversion Rate Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <p className="text-[13px] font-black text-slate-900">Conversion Rate</p>
                    </div>
                    <span className="text-[14px] font-black text-[#1E3A8A]">
                      {detailData.stats.totalClicks 
                        ? ((detailData.stats.totalConversions || 0) / detailData.stats.totalClicks * 100).toFixed(2)
                        : '0.00'}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#1E3A8A] to-blue-500 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${detailData.stats.totalClicks 
                          ? Math.min(100, ((detailData.stats.totalConversions || 0) / detailData.stats.totalClicks * 100))
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Link Details */}
                <div className="space-y-3">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Link Information</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 mb-1">Unique Tracking URL</p>
                    <div 
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleCopy(detailData.link.uniqueLink || '', detailData.link.id!)}
                    >
                      <code className="text-[12px] text-[#1E3A8A] font-mono flex-1 truncate">{detailData.link.uniqueLink}</code>
                      <Copy className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] shrink-0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
                      <p className="text-[13px] font-bold text-slate-700">
                        {detailData.link.createdAt ? new Date(detailData.link.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleCopy(detailData.link.uniqueLink || '', detailData.link.id!)}
                    className="flex-1 py-3.5 bg-[#1E3A8A] text-white rounded-2xl font-black text-[13px] hover:bg-[#152C6E] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                  <a
                    href={detailData.link.uniqueLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-700 rounded-2xl font-black text-[13px] border border-slate-100 hover:bg-white hover:border-blue-100 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
