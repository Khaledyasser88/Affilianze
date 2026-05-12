import { useEffect, useState } from 'react'
import { notificationApi } from '../api/client'
import { Bell, Trash2, CheckCircle, Clock, Settings, Filter, Sparkles, Inbox, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import * as Types from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Notifications() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Types.NotificationType | 'All'>('All')
  const [searchTerm, setSearchTerm] = useState('')

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getmy({ PageSize: 100 })
      const apiList = (res as any)?.items || (res as any)?.data || []
      
      const local = JSON.parse(localStorage.getItem('local_notifications') || '[]')
      const merged = [...local, ...apiList].sort((a, b) => 
        new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
      )
      
      setNotifications(merged)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load notifications')
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAsRead = async (id: number) => {
    try {
      const isLocal = String(id).length > 10
      if (!isLocal) {
        await notificationApi.putread(id)
      }
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      
      const locals = JSON.parse(localStorage.getItem('local_notifications') || '[]')
      const updatedLocals = locals.map((n: any) => n.id === id ? { ...n, isRead: true } : n)
      localStorage.setItem('local_notifications', JSON.stringify(updatedLocals))
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const markAllRead = async () => {
    try {
      await notificationApi.putreadall()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All marked as read')
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const deleteNotification = async (id: number) => {
    try {
      const isLocal = String(id).length > 10
      if (!isLocal) {
        await notificationApi.delete(id)
      }

      setNotifications(prev => prev.filter(n => n.id !== id))
      
      const locals = JSON.parse(localStorage.getItem('local_notifications') || '[]')
      const updatedLocals = locals.filter((n: any) => n.id !== id)
      localStorage.setItem('local_notifications', JSON.stringify(updatedLocals))
      
      toast.success('Notification deleted')
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const filtered = notifications.filter(n => {
    const matchesFilter = filter === 'All' || n.type === filter;
    const matchesSearch = !searchTerm || 
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  })

  // Helper to smartly route user based on notification type and their role
  const handleNotificationClick = (n: any, e: React.MouseEvent) => {
    // Determine if user clicked a specific button (like Mark Read, Delete) so we skip routing
    const target = e.target as HTMLElement
    if (target.closest('button')) return

    if (!n.isRead) markAsRead(n.id)

    let parsedId = null
    try {
      if (n.data) {
        const parsed = typeof n.data === 'string' ? JSON.parse(n.data) : n.data
        parsedId = parsed?.campaignId || parsed?.applicationId || parsed?.id || parsed?.complaintId
      }
    } catch {
      parsedId = parseInt(n.data) || null
    }

    const r = role?.toLowerCase()
    
    switch (n.type) {
      case 'CampaignUpdate':
        if (r === 'company') navigate('/company')
        else if (r === 'admin') navigate('/admin/campaigns')
        else navigate(parsedId ? `/campaigns` : '/campaigns')
        break
      case 'ApplicationStatus':
        if (r === 'company') navigate(parsedId ? `/company/campaigns/${parsedId}/applications` : '/company')
        else if (r === 'admin') navigate('/admin/campaigns')
        else navigate('/applications')
        break
      case 'NewEarning':
        navigate('/payments')
        break
      case 'ComplaintUpdate':
        if (r === 'admin') navigate('/admin/complaints')
        else navigate('/complaints')
        break
      case 'AiMatch':
        navigate('/ai-assistant')
        break
      default:
        // Default fallbacks
        if (r === 'admin') navigate('/admin')
        else if (r === 'company') navigate('/company')
        else navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div className="relative">
          <div className="absolute -left-4 -top-4 w-12 h-12 bg-[#1E3A8A]/5 rounded-full blur-xl animate-pulse" />
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Notifications
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
          </h1>
          <p className="text-slate-400 mt-2 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Stay informed about your latest campaign activities.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button 
                onClick={markAllRead} 
                className="px-6 py-2.5 text-[12px] font-black text-white bg-slate-900 hover:bg-[#1E3A8A] rounded-xl transition-all shadow-lg shadow-black/5 hover:shadow-blue-500/20 active:scale-95"
            >
                MARK ALL AS READ
            </button>
            <div className="w-[1px] h-6 bg-slate-100 mx-1" />
            <Link 
                to="/settings" 
                className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all group"
                title="Notification Settings"
            >
                <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Filter By Type
                </h3>
                <div className="space-y-1.5">
                    {['All', 'System', 'CampaignUpdate', 'ApplicationStatus', 'NewEarning', 'AiMatch'].map((f) => {
                        const count = f === 'All' ? notifications.length : notifications.filter(n => n.type === f).length;
                        return (
                            <button 
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`w-full flex justify-between items-center px-4 py-3 rounded-2xl text-[13px] font-bold transition-all ${
                                    filter === f 
                                    ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/10 scale-[1.02]' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <span>{f === 'CampaignUpdate' ? 'Campaigns' : f === 'ApplicationStatus' ? 'Applications' : f}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${filter === f ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#152C6E] rounded-3xl p-6 shadow-xl shadow-blue-900/10 text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-[14px] font-black mb-2 flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-blue-300" /> Need Help?
                    </p>
                    <p className="text-[11px] text-blue-100/70 font-medium mb-4 leading-relaxed">
                        Adjust your preferences to control how you receive alerts via email & push.
                    </p>
                    <Link to="/settings" className="inline-flex items-center gap-2 text-[10px] font-black bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-all uppercase tracking-wider">
                        Configure Settings
                    </Link>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-4">
            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#1E3A8A] transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search in your notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-[24px] pl-14 pr-6 py-4 text-[14px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all shadow-sm"
                />
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-50 border-t-[#1E3A8A] rounded-full animate-spin" />
                            <Bell className="w-6 h-6 text-[#1E3A8A] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                        </div>
                        <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Alerts</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-center px-4">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 relative">
                            <Bell className="w-10 h-10 text-slate-200" />
                            <div className="absolute -right-2 -top-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-50">
                                <Search className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Everything is Clear</h3>
                        <p className="text-slate-400 text-[14px] mt-3 max-w-xs font-medium leading-relaxed">
                            {searchTerm ? "No results match your search keywords. Try different terms." : "You've addressed all your recent alerts. Check back later for updates."}
                        </p>
                        <button onClick={() => { setFilter('All'); setSearchTerm(''); }} className="mt-8 text-blue-600 font-black text-[11px] uppercase tracking-widest hover:underline">
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filtered.map((n) => (
                            <div 
                                key={n.id} 
                                onClick={(e) => handleNotificationClick(n, e)}
                                className={`group p-8 flex gap-6 cursor-pointer transition-all relative overflow-hidden ${
                                    !n.isRead ? 'bg-[#1E3A8A]/[0.02]' : 'hover:bg-slate-50/50'
                                }`}
                            >
                                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 ${
                                    !n.isRead ? 'bg-gradient-to-br from-[#1E3A8A] to-[#152C6E] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    <Bell className={`w-6 h-6 ${!n.isRead ? 'animate-bell' : ''}`} />
                                    {!n.isRead && (
                                        <div className="absolute -right-1 -top-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className={`text-[16px] font-black tracking-tight text-slate-900 ${!n.isRead ? 'font-black' : 'font-bold'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                                    n.type === 'CampaignUpdate' ? 'bg-indigo-50 text-indigo-600' :
                                                    n.type === 'NewEarning' ? 'bg-emerald-50 text-emerald-600' :
                                                    n.type === 'AiMatch' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-slate-50 text-slate-500'
                                                }`}>
                                                    {n.type}
                                                </span>
                                            </div>
                                            <p className="text-[14px] text-slate-500 font-medium leading-relaxed line-clamp-2 pr-12 group-hover:text-slate-700 transition-colors">
                                                {n.message}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            {!n.isRead && (
                                                <button 
                                                    onClick={() => markAsRead(n.id)} 
                                                    className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all shadow-sm hover:shadow-emerald-500/10" 
                                                    title="Mark as Read"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => deleteNotification(n.id)} 
                                                className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-6">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(n.createdAt).toLocaleDateString(undefined, { 
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                            })}</span>
                                        </div>
                                        <div className="h-1 w-1 bg-slate-200 rounded-full" />
                                        <span className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-widest cursor-pointer hover:underline">
                                            Details
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Accent gradient line for unread */}
                                {!n.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1E3A8A]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes bell {
            0%, 100% { transform: rotate(0); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
            20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }
        .animate-bell {
            animation: bell 2s ease-in-out infinite;
            transform-origin: top;
        }
      `}</style>
    </div>
  )
}

