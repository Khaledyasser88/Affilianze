import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { campaignApi, analyticsApi } from '../../api/client'
import * as Types from '../../api/client'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ExternalLink,
  MessageSquare,
  FileText,
  History,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  MousePointer2,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { activityTracker } from '../../utils/activityTracker'
import defaultProfileImg from '../../assets/profile.jpg'
import ComplaintModal from '../../components/ComplaintModal'

export default function CompanyApplications() {
  const { id } = useParams<{ id: string }>()
  const [applications, setApplications] = useState<Types.CampaignApplicationDto[]>([])
  const [campaign, setCampaign] = useState<Types.CampaignDetailsDto | null>(null)
  const [funnel, setFunnel] = useState<Types.ConversionFunnelDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Complaint Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedMarketer, setSelectedMarketer] = useState<{id: number, name: string} | null>(null)

  useEffect(() => {
    loadApplications()
  }, [id])

  async function loadApplications() {
    if (!id) return
    setLoading(true)
    try {
      const [appRes, campRes, funnelRes] = await Promise.all([
        campaignApi.getapplications(Number(id), { pageSize: 50 }),
        campaignApi.getmycampaigns1(Number(id)).catch(() => null),
        analyticsApi.getcompanyconversionfunnel(Number(id)).catch(() => null)
      ])
      
      // The API return type for paged results usually has the array in .data
      const appsData = (appRes as any)?.data || [];
      setApplications(Array.isArray(appsData) ? appsData : []);
      
      if (campRes) setCampaign((campRes as any)?.data || campRes)
      if (funnelRes) setFunnel((funnelRes as any)?.data || funnelRes)
    } catch (err) {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const toggleCampaignStatus = async () => {
    if (!campaign) return
    const isPaused = campaign.status === 'Paused'
    try {
      if (isPaused) {
        await campaignApi.putresume(campaign.id!)
        toast.success('Campaign resumed')
      } else {
        await campaignApi.putpause(campaign.id!)
        toast.success('Campaign paused')
      }
      loadApplications()
    } catch (err: any) {
      toast.error(err.message || 'Error updating campaign status')
    }
  }

  const handleAction = async (appId: number, action: 'approve' | 'reject') => {
    const app = applications.find(a => a.id === appId)
    setActionLoading(appId)
    try {
      if (action === 'approve') {
        await campaignApi.postapplicationsapprove(appId, { applicationId: appId, note: 'Approved via dashboard' })
        activityTracker.addActivity({
          description: `Approved application from ${app?.marketerName || 'Marketer'}`,
          type: 'system'
        })
        toast.success('Application approved!')
      } else {
        await campaignApi.postapplicationsreject(appId, { applicationId: appId, note: 'Rejected via dashboard' })
        activityTracker.addActivity({
          description: `Rejected application from ${app?.marketerName || 'Marketer'}`,
          type: 'system'
        })
        toast.success('Application rejected')
      }
      loadApplications() // Refresh list
    } catch (err) {
      toast.error(`Failed to ${action} application`)
    } finally {
      setActionLoading(null)
    }
  }

  const openReportModal = (marketerId: number, marketerName: string) => {
    setSelectedMarketer({ id: marketerId, name: marketerName })
    setReportModalOpen(true)
  }

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'Approved':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full border border-green-100"><CheckCircle2 className="w-3 h-3" /> Approved</span>
      case 'Rejected':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-full border border-red-100"><XCircle className="w-3 h-3" /> Rejected</span>
      case 'Pending':
      case 'PendingApproval':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full border border-blue-100"><Clock className="w-3 h-3" /> Pending Review</span>
      default:
        return <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase rounded-full border border-gray-100">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] py-12">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <Link to="/company" className="inline-flex items-center gap-2 text-slate-400 text-[13px] font-black uppercase tracking-widest hover:text-[#1E3A8A] transition-all mb-6 group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
               <h1 className="text-[36px] font-black text-slate-900 tracking-tighter leading-none">
                {campaign ? campaign.title : 'Review Applicants'}
               </h1>
               {campaign && (
                 <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white shadow-sm ring-1 ring-slate-100 ${
                   campaign.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                   campaign.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 
                   'bg-slate-100 text-slate-500'
                 }`}>
                   {campaign.status}
                 </div>
               )}
            </div>
            <p className="text-slate-400 font-medium text-[16px] mt-4 max-w-lg">
              Analyze and manage affiliation requests from influencers and marketers for this campaign.
            </p>
          </div>
          
          {campaign && (campaign.status === 'Active' || campaign.status === 'Paused') && (
            <button 
              onClick={toggleCampaignStatus}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-slate-200/20 active:scale-95 ${
                campaign.status === 'Paused' 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-white border border-slate-100 text-amber-600 hover:bg-amber-50'
              }`}
            >
              {campaign.status === 'Paused' ? (
                <><PlayCircle className="w-4 h-4" /> Resume Campaign</>
              ) : (
                <><PauseCircle className="w-4 h-4" /> Pause Campaign</>
              )}
            </button>
          )}
        </div>

        {funnel && (
          <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-1000">
            {[
              { label: 'Clicks', value: funnel.clicks || 0, icon: MousePointer2, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-600' },
              { label: 'Applications', value: funnel.applications || 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-600', sub: `${Math.round((funnel.clickToApplicationRate || 0) * 100)}% Conv.` },
              { label: 'Conv. Rate', value: `${Math.round((funnel.overallConversionRate || 0) * 100)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-600' },
              { label: 'Total Sales', value: funnel.conversions || 0, icon: CheckCircle2, bg: 'bg-slate-900 text-white', hideProgress: true }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 group ${stat.bg}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${stat.bg.includes('slate-900') ? 'text-white/60' : 'text-slate-400'}`}>{stat.label}</p>
                  {stat.icon && <stat.icon className={`w-4 h-4 ${stat.color || 'text-white/40'}`} />}
                </div>
                <div className="flex items-end justify-between">
                  <h4 className="text-[28px] font-black tracking-tight">{stat.value}</h4>
                  {stat.sub && <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/50">{stat.sub}</span>}
                </div>
                {!stat.hideProgress && (
                  <div className="mt-4 h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.bar || 'bg-slate-900'} rounded-full transition-all duration-1000`} style={{ width: i === 0 ? '100%' : `${(funnel.clickToApplicationRate || 0) * 100}%` }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="py-32 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-[3px] border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Aggregating Marketer Data...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[48px] border border-dashed border-slate-200 animate-in fade-in duration-1000">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <History className="w-8 h-8 text-slate-200" />
            </div>
            <h2 className="text-[20px] font-black text-slate-900 mb-2">No applicants to review</h2>
            <p className="text-slate-400 max-w-xs mx-auto font-medium text-sm">Our system is actively promoting this campaign. Applications will appear here as they arrive.</p>
          </div>
        ) : (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="flex items-center justify-between px-4 mb-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{applications.length} Interested Marketers</span>
                <button className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-widest hover:underline">Batch Actions</button>
             </div>
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm flex flex-wrap items-center justify-between gap-8 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E3A8A] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-[28px] bg-slate-50 flex items-center justify-center text-[#1E3A8A] relative border border-slate-100 p-1 group-hover:scale-105 transition-transform duration-500">
                    <img src={defaultProfileImg} className="w-full h-full object-cover rounded-[24px]" alt="Profile" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-[20px] font-black text-slate-900 group-hover:text-[#1E3A8A] transition-colors">{app.marketerName || 'Anonymous Marketer'}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      <span className="text-[13px] font-bold text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-300" /> Joined {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                      </span>
                      <button 
                        onClick={() => openReportModal(app.marketerId!, app.marketerName || 'Marketer')}
                        className="text-[12px] font-black text-rose-500 flex items-center gap-2 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                      >
                        <AlertCircle className="w-4 h-4" /> Report
                      </button>
                      <button className="text-[12px] font-black text-[#1E3A8A] flex items-center gap-2 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                        <ExternalLink className="w-4 h-4" /> Audit Profile
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto mt-6 lg:mt-0">
                  {app.status === 'Pending' ? (
                    <>
                      <button 
                        onClick={() => handleAction(app.id!, 'reject')}
                        disabled={actionLoading === app.id}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-100 text-slate-400 text-[13px] font-black hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAction(app.id!, 'approve')}
                        disabled={actionLoading === app.id}
                        className="w-full sm:w-auto justify-center px-10 py-4 rounded-2xl bg-[#1E3A8A] text-white text-[13px] font-black shadow-xl shadow-blue-900/20 hover:bg-[#152C6E] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2.5 disabled:opacity-50"
                      >
                        {actionLoading === app.id && <Clock className="w-4 h-4 animate-spin text-white/50" />}
                        Approve Candidate
                      </button>
                    </>
                  ) : (
                    <button className="w-full lg:w-auto group/btn justify-center flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-50 text-slate-400 text-[13px] font-black hover:bg-white hover:border-slate-200 border border-transparent transition-all">
                      <MessageSquare className="w-4 h-4 group-hover/btn:text-[#1E3A8A] transition-colors" /> Message Marketer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMarketer && (
        <ComplaintModal 
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          defendantId={selectedMarketer.id}
          defendantName={selectedMarketer.name}
          campaignId={campaign?.id}
          campaignTitle={campaign?.title || 'Report Issue'}
        />
      )}
    </div>
  )
}
