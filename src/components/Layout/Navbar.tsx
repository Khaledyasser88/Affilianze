import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell, LogOut, Settings as SettingsIcon, User, Menu, X, ChevronRight } from 'lucide-react'
import { notificationApi } from '../../api/client'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const { role, logout, token } = useAuth()
  
  const isAuthPage = ['/login', '/signup', '/admin/login'].includes(location.pathname)
  const isDashboard = !isAuthPage && (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/company') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/settings') || location.pathname.startsWith('/messages') || !!token)
  
  const roleLower = role?.toLowerCase()
  const dashboardPath = roleLower === 'admin' ? '/admin' : roleLower === 'company' ? '/company' : '/dashboard'

  useEffect(() => {
    if (token) {
      notificationApi.getsummary().then(res => {
        setUnreadCount(res?.data?.unreadCount || 0)
      }).catch(() => null)
    }
  }, [token])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex-1 flex justify-start items-center">
          <Link to="/" className="text-[22px] font-extrabold text-[#1E3A8A] tracking-tight">
            Affilianze
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center items-center gap-8">
          {isDashboard ? (
            <>
              <Link to="/campaigns" className="text-[14px] font-bold text-slate-600 hover:text-[#1E3A8A] transition-colors">Find Campaigns</Link>
              <Link to={dashboardPath} className="text-[14px] font-bold text-slate-600 hover:text-[#1E3A8A] transition-colors">Dashboard</Link>
              <Link to="/messages" className="text-[14px] font-bold text-slate-600 hover:text-[#1E3A8A] transition-colors">Messages</Link>
            </>
          ) : (
            <>
              {publicLinks.map(({ to, label }) => (
                <Link key={to} to={to} className="text-[14px] font-bold text-slate-600 hover:text-[#1E3A8A] transition-all whitespace-nowrap">
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="hidden md:flex items-center">
            {isDashboard ? (
              <div className="flex items-center gap-4">
                 <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-[#1E3A8A] transition-colors relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                  </button>
                </div>
                <Link to="/profile" className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-[#1E3A8A] hover:bg-slate-100 border border-gray-100 transition-all">
                  <User className="w-4 h-4" />
                </Link>
                <Link to="/settings" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <SettingsIcon className="w-5 h-5" />
                </Link>
                <button onClick={() => logout()} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link to="/login" className="text-[14px] font-bold text-slate-800 hover:text-[#1E3A8A] transition-all whitespace-nowrap">Log In</Link>
                <Link to="/signup" className="bg-[#1E3A8A] text-white px-7 py-2.5 rounded-full text-[14px] font-bold hover:bg-[#152C6E] transition-all shadow-lg shadow-blue-900/10 hover:scale-105 active:scale-95 whitespace-nowrap">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {isDashboard && (
               <div className="relative mr-2">
                 <button className="p-2 text-gray-400 hover:text-[#1E3A8A] transition-colors relative">
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                 </button>
               </div>
            )}
            <button type="button" className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-gray-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-8 flex flex-col gap-2">
            {isDashboard ? ( // Auth / Dashboard View Mobile
              <>
                <Link to="/campaigns" onClick={() => setOpen(false)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[15px] font-bold text-slate-900 border border-slate-100">
                  Find Campaigns <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[15px] font-bold text-slate-900 border border-slate-100">
                  Dashboard <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link to="/messages" onClick={() => setOpen(false)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[15px] font-bold text-slate-900 border border-slate-100">
                  Messages <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[15px] font-bold text-slate-900 border border-slate-100">
                  My Profile <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <button onClick={() => { logout(); setOpen(false); }} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl text-[15px] font-bold text-red-600 mt-2">
                  Logout <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : ( // Landing Page View Mobile
              <>
                {publicLinks.map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setOpen(false)} className="p-4 text-[16px] font-bold text-slate-900 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors">
                    {label}
                  </Link>
                ))}
                <div className="grid grid-cols-1 gap-3 mt-6">
                  <Link to="/login" onClick={() => setOpen(false)} className="w-full py-4 text-center rounded-2xl border border-gray-200 text-slate-900 font-bold text-[15px] active:scale-[0.98] transition-all">
                    Log In
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="w-full py-4 text-center rounded-2xl bg-[#1E3A8A] text-white font-bold text-[15px] shadow-xl shadow-blue-900/10 active:scale-[0.98] transition-all">
                    Sign Up Now
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
