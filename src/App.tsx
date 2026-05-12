import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AlertCircle, RotateCcw } from 'lucide-react'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import DashboardNav from './components/Layout/DashboardNav'
import DashboardFooter from './components/Layout/DashboardFooter'
import ScrollToTop from './components/Common/ScrollToTop'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Contact from './pages/Contact'
import CompanyDashboard from './pages/company/Dashboard'
import MarketerDashboard from './pages/marketer/Dashboard'
import CreateCampaign from './pages/company/CreateCampaign'
import CompanyApplications from './pages/company/Applications'
import Applications from './pages/marketer/Applications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import FindCampaigns from './pages/FindCampaigns'
import AiAssistant from './pages/AiAssistant'
import Messages from './pages/Messages'
import PaymentMethods from './pages/PaymentMethods'
import TrackingLinks from './pages/marketer/TrackingLinks'
import AiTools from './pages/marketer/AiTools'
import Notifications from './pages/Notifications'
import Complaints from './pages/Complaints'
// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCampaigns from './pages/admin/Campaigns'
import AdminFinancials from './pages/admin/Financials'
import AdminComplaints from './pages/admin/Complaints'
import AdminCategories from './pages/admin/Categories'
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Dashboard Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm my-8">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 max-w-md mb-8">We encountered an error while rendering this page. This might be due to a temporary connection issue.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
          >
            <RotateCcw className="w-4 h-4" /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 pb-24 md:pb-12 w-full">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <DashboardFooter />
    </div>
  )
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  const { token, isReady, role } = useAuth()
  const path = window.location.pathname
  
  if (!isReady) return null
  if (!token) return <Navigate to="/login" replace />
  
  const roleLower = role?.toLowerCase()
  
  if (roleLower === 'admin' && !path.startsWith('/admin') && path !== '/profile' && path !== '/settings') {
    return <Navigate to="/admin" replace />
  }

  // Proper cross-role redirection
  if (roleLower === 'company' && (path === '/dashboard' || path.startsWith('/admin'))) {
    return <Navigate to="/company" replace />
  }
  
  if (roleLower === 'marketer' && (path.startsWith('/company') || path.startsWith('/admin'))) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Smart Dashboard Component that resolves the correct view based on role
function SmartDashboard() {
  const { role } = useAuth()
  const roleLower = role?.toLowerCase()
  
  if (roleLower === 'company') {
    return <CompanyDashboard />
  }
  if (roleLower === 'admin') {
    return <AdminDashboard />
  }
  return <MarketerDashboard />
}

function HomeRedirect() {
  const { token, role, isReady } = useAuth()
  if (!isReady) return null
  if (token && role) {
    const r = role.toLowerCase()
    if (r === 'admin') return <Navigate to="/admin" replace />
    if (r === 'company') return <Navigate to="/company" replace />
    return <Navigate to="/dashboard" replace />
  }
  return <PublicLayout><Home /></PublicLayout>
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        
        {/* Dashboards */}
        <Route path="/dashboard" element={<Protected><DashboardLayout><SmartDashboard /></DashboardLayout></Protected>} />
        <Route path="/company" element={<Protected><DashboardLayout><CompanyDashboard /></DashboardLayout></Protected>} />
        <Route path="/admin" element={<Protected><DashboardLayout><AdminDashboard /></DashboardLayout></Protected>} />
        
        {/* Company Specific */}
        <Route path="/company/campaigns/new" element={<Protected><DashboardLayout><CreateCampaign /></DashboardLayout></Protected>} />
        <Route path="/company/campaigns/:id/applications" element={<Protected><DashboardLayout><CompanyApplications /></DashboardLayout></Protected>} />
        
        {/* Common & Shared */}
        <Route path="/campaigns" element={<Protected><DashboardLayout><FindCampaigns /></DashboardLayout></Protected>} />
        <Route path="/ai-assistant" element={<Protected><DashboardLayout><AiAssistant /></DashboardLayout></Protected>} />
        <Route path="/messages" element={<Protected><DashboardLayout><Messages /></DashboardLayout></Protected>} />
        <Route path="/payments" element={<Protected><DashboardLayout><PaymentMethods /></DashboardLayout></Protected>} />
        <Route path="/profile" element={<Protected><DashboardLayout><Profile /></DashboardLayout></Protected>} />
        <Route path="/applications" element={<Protected><DashboardLayout><Applications /></DashboardLayout></Protected>} />
        <Route path="/tracking-links" element={<Protected><DashboardLayout><TrackingLinks /></DashboardLayout></Protected>} />
        <Route path="/ai-tools" element={<Protected><DashboardLayout><AiTools /></DashboardLayout></Protected>} />
        <Route path="/notifications" element={<Protected><DashboardLayout><Notifications /></DashboardLayout></Protected>} />
        <Route path="/settings" element={<Protected><DashboardLayout><Settings /></DashboardLayout></Protected>} />
        <Route path="/complaints" element={<Protected><DashboardLayout><Complaints /></DashboardLayout></Protected>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Protected><DashboardLayout><AdminDashboard /></DashboardLayout></Protected>} />
        <Route path="/admin/users" element={<Protected><DashboardLayout><AdminUsers /></DashboardLayout></Protected>} />
        <Route path="/admin/campaigns" element={<Protected><DashboardLayout><AdminCampaigns /></DashboardLayout></Protected>} />
        <Route path="/admin/categories" element={<Protected><DashboardLayout><AdminCategories /></DashboardLayout></Protected>} />
        <Route path="/admin/financials" element={<Protected><DashboardLayout><AdminFinancials /></DashboardLayout></Protected>} />
        <Route path="/admin/complaints" element={<Protected><DashboardLayout><AdminComplaints /></DashboardLayout></Protected>} />
      </Routes>
    </>
  )
}
