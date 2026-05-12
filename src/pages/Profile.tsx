import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { marketerApi, paymentApi, reviewApi, companyApi } from '../api/client'
import { activityTracker } from '../utils/activityTracker'
import { 
  Plus, 
  CheckCircle2, 
  Crown, 
  Landmark, 
  Wallet,
  History as HistoryIcon,
  CreditCard,
  Star,
  Smartphone,
  ChevronLeft,
  Download,
  Clock,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  TrendingUp, BarChart, Settings, Sparkles,
  Target, MousePointer2, Activity, Camera, Trash2, Edit2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

import Modal from '../components/Common/Modal'
import SupportModal from '../components/Common/SupportModal'
import { toast } from "react-hot-toast"
import type { CreateWithdrawalRequestDto } from '../api/client'
import * as Types from '../api/client'

type TabType = 'wallet' | 'transactions' | 'payments' | 'reviews' | 'insights'

export default function Profile() {
  const location = useLocation()
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const { avatar, name, email, role, token } = useAuth()
  const roleLowerInit = role?.toLowerCase()
  const [activeTab, setActiveTab] = useState<TabType>(
    location.state?.activeTab ||
    (roleLowerInit === 'admin' || roleLowerInit === 'company' ? 'reviews' : 'wallet')
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [selectedType, setSelectedType] = useState<'bank' | 'wallet' | 'instapay' | null>(null)
  
  // Real Data State
  const [balance, setBalance] = useState(0)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [submittingMethod, setSubmittingMethod] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [givenReviews, setGivenReviews] = useState<any[]>([])
  const [reviewTab, setReviewTab] = useState<'received' | 'given'>('received')
  const [totalReviews, setTotalReviews] = useState(0)
  const [aveRating, setAveRating] = useState(0)
  const [ratingDistrib, setRatingDistrib] = useState<Record<string, number>>({})
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any | null>(null)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([])
  const [earningsReport, setEarningsReport] = useState<any | null>(null)
  const [personalityTest, setPersonalityTest] = useState<any | null>(null)
  
  const appliedCount = JSON.parse(localStorage.getItem('affiliance_applied_ids') || '[]').length

  const handleAddMethod = async (methodData: any) => {
    setSubmittingMethod(true)
    try {
      if (editingPaymentMethod) {
        await paymentApi.putpaymentmethod(editingPaymentMethod.id, methodData)
        toast.success('Payment method updated successfully')
      } else {
        await paymentApi.postpaymentmethod(methodData)
        toast.success('Payment method added successfully')
      }
      
      const res = await paymentApi.getpaymentmethods()
      setPaymentMethods((res as any)?.data || res)
      
      setShowAddModal(false)
      setEditingPaymentMethod(null)
      setSelectedType(null)
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setSubmittingMethod(false)
    }
  }

  const handleDeleteMethod = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return
    try {
      await paymentApi.deletepaymentmethod(id)
      setPaymentMethods(prev => prev.filter(m => m.id !== id))
      toast.success('Payment method deleted successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payment method')
    }
  }

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export')
      return
    }

    const doc = new jsPDF()
    doc.setFillColor(30, 58, 138)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('AFILIANZE', 20, 25)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Transaction History Report', 20, 32)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 140, 25)
    doc.text(`User: ${name || email}`, 140, 32)

    const tableData = transactions.map((tx: any) => [
      tx.date ? new Date(tx.date).toLocaleDateString() : '---',
      tx.title || (tx.amount < 0 ? 'Withdrawal' : 'Commission'),
      tx.description || tx.paymentMethodName || 'Transaction',
      tx.status || 'Pending',
      `${tx.amount < 0 ? '-' : '+'} EGP ${Math.abs(tx.amount).toLocaleString()}`
    ])

    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Type', 'Description', 'Status', 'Amount']],
      body: tableData,
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 50 },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } }
    })

    doc.save(`Afilianze_Transactions_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Report exported successfully')
  }

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = Number(formData.get('amount'))
    const paymentMethodId = Number(formData.get('paymentMethodId'))

    if (amount > balance) {
      toast.error('Insufficient balance')
      return
    }

    setWithdrawing(true)
    try {
      const data: CreateWithdrawalRequestDto = {
        amount,
        paymentMethodId,
        notes: formData.get('notes') as string
      }
      await paymentApi.postwithdrawalrequest(data)
      toast.success('Withdrawal request submitted successfully')
      
      activityTracker.addActivity({
        description: `Requested withdrawal of EGP ${amount.toLocaleString()}`,
        type: 'payment',
        amount: `EGP ${amount.toLocaleString()}`
      })

      setShowWithdrawModal(false)
      const balRes = await paymentApi.getbalance()
      setBalance(balRes.data?.availableBalance || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal request')
    } finally {
      setWithdrawing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const roleLower = role?.toLowerCase()

        if (roleLower === 'admin') {
          if (!cancelled) setLoading(false)
          return
        }

        const isCompany = roleLower === 'company'
        const isAdmin = roleLower === 'admin'
        const isMarketer = roleLower === 'marketer'

        if (isMarketer || isAdmin) {
          const [dashRes, paymentsRes, balanceRes, historyRes, reviewsRes, givenReviewsRes, statsRes, profRes, ratingRes, earningsRes, aiRes, perfRes, eReportRes, personalityRes] = await Promise.all([
            isMarketer ? marketerApi.getmydashboard().catch(() => null) : Promise.resolve(null),
            (isMarketer || isCompany) ? paymentApi.getpaymentmethods().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            isMarketer ? paymentApi.getbalance().catch(() => ({ data: { availableBalance: 0, pendingBalance: 0 } })) : Promise.resolve({ data: { availableBalance: 0, pendingBalance: 0 } }),
            isMarketer ? paymentApi.getwithdrawalhistory({ PageSize: 20 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            reviewApi.getmarketermyreviews({ PageSize: 10 }).catch(() => ({ data: [] })),
            isMarketer ? reviewApi.getmarketermyreviewsgiven({ pageSize: 10 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            isMarketer ? marketerApi.getmystatistics().catch(() => null) : Promise.resolve(null),
            isMarketer ? marketerApi.getmyprofile().catch(() => null) : Promise.resolve(null),
            reviewApi.getmarketermyaveragerating().catch(() => null),
            isMarketer ? paymentApi.getearnings1().catch(() => null) : Promise.resolve(null),
            isMarketer ? marketerApi.getmyaisuggestions({ limit: 5 }).catch(() => null) : Promise.resolve(null),
            isMarketer ? marketerApi.getmyperformancehistory().catch(() => null) : Promise.resolve(null),
            isMarketer ? marketerApi.getmyearningsreport().catch(() => null) : Promise.resolve(null),
            isMarketer ? marketerApi.getmypersonalitytest().catch(() => null) : Promise.resolve(null)
          ])

          if (!cancelled) {
            if (profRes) setProfileData(profRes)
            if (dashRes && 'totalEarnings' in (dashRes as any)) {
              setLifetimeEarnings((dashRes as any).totalEarnings || 0)
              setAveRating((dashRes as any).averageRating || 0)
            }
            if (statsRes) {
              const s = (statsRes as any)?.data || statsRes
              setTotalClicks(s.totalClicks || 0)
              setConversionRate(s.conversionRate || 0)
              if (s.totalEarnings > 0) setLifetimeEarnings(s.totalEarnings)
            }
            if (ratingRes) {
               const r = (ratingRes as any)?.data || ratingRes
               setAveRating(r.averageRating || 0)
               setTotalReviews(r.totalReviews || 0)
               setRatingDistrib(r.ratingDistribution || {})
            }
            if (earningsRes) {
               const e = (earningsRes as any)?.data || earningsRes
               if (e.totalEarnings > 0) setLifetimeEarnings(e.totalEarnings)
            }
            if (aiRes) setAiSuggestions((aiRes as any)?.data?.data || (aiRes as any)?.data || [])
            if (perfRes) setPerformanceHistory((perfRes as any)?.data || perfRes || [])
            if (eReportRes) setEarningsReport((eReportRes as any)?.data || eReportRes || null)
            if (personalityRes) setPersonalityTest((personalityRes as any)?.data || personalityRes)
            
            const pms = (paymentsRes as any)?.data || (Array.isArray(paymentsRes) ? paymentsRes : [])
            setPaymentMethods(pms)
            
            const bal = (balanceRes as any)?.data || balanceRes
            setBalance(bal?.availableBalance || 0)
            setPendingBalance(bal?.pendingBalance || 0)
            const txData = (historyRes as any)?.data || historyRes
            setTransactions(Array.isArray(txData) ? txData : (txData as any)?.data || [])
            const revData = (reviewsRes as any)?.data || reviewsRes
            setReviews(Array.isArray(revData) ? revData : (revData as any)?.data || [])
            
            const givenRevData = (givenReviewsRes as any)?.data || givenReviewsRes
            setGivenReviews(Array.isArray(givenRevData) ? givenRevData : (givenRevData as any)?.data || [])
            
            setTotalReviews((reviewsRes as any)?.totalCount || (revData as any)?.length || 0)
          }
        } else if (isCompany) {
          const [companyProfRes, companyReviewsRes, paymentsRes] = await Promise.all([
            companyApi.getmyprofile().catch(() => null),
            Promise.resolve({ data: [] }),
            paymentApi.getpaymentmethods().catch(() => ({ data: [] }))
          ])
          if (!cancelled) {
            if (companyProfRes) setProfileData(companyProfRes)
            const revData = (companyReviewsRes as any)?.data || companyReviewsRes
            const revList = Array.isArray(revData) ? revData : (revData as any)?.data || []
            setReviews(revList)
            setTotalReviews((companyReviewsRes as any)?.totalCount || revList.length)
            setAveRating((companyProfRes as any)?.averageRating || 0)
            
            const pms = (paymentsRes as any)?.data || (Array.isArray(paymentsRes) ? paymentsRes : [])
            setPaymentMethods(pms)
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [role, token])

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 pb-20">
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 md:p-10 shadow-sm mb-10 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-28 h-28 rounded-[40px] bg-[#FBBF24] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-amber-500/20 overflow-hidden ring-4 ring-white transition-transform group-hover:scale-[1.02]">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="Profile" /> : (name?.charAt(0) || 'U')}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-[32px] font-black text-slate-900 mb-2 tracking-tight">{name || (role === 'Admin' ? 'System Administrator' : 'User Profile')}</h1>
              <p className="text-slate-400 font-medium text-[15px] mb-4 flex items-center justify-center md:justify-start gap-2">
                {email || 'user@email.com'}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-600 text-[11px] font-black uppercase tracking-wider rounded-full border border-green-100/50">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Account
                </span>
                {role === 'Admin' ? (
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-wider rounded-full border border-red-100/50">
                    <Crown className="w-3.5 h-3.5" /> Administrator
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-[#1E3A8A] text-[11px] font-black uppercase tracking-wider rounded-full border border-blue-100/50">
                    <Crown className="w-3.5 h-3.5" /> Premium Member
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link to="/settings" className="flex items-center gap-2.5 px-8 py-3.5 bg-slate-50 text-slate-900 border border-slate-100 rounded-[20px] text-[13px] font-black hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all active:scale-95">
            <Settings className="w-4 h-4" /> Edit Profile
          </Link>
        </div>

        {role?.toLowerCase() === 'admin' ? (
          <div className="mt-10 pt-8 border-t border-gray-50">
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-wider rounded-full border border-red-100/60">
                <Crown className="w-3.5 h-3.5" /> Platform Administrator
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-[#1E3A8A] text-[11px] font-black uppercase tracking-wider rounded-full border border-blue-100/60">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
              </span>
            </div>
            <p className="text-[13px] text-gray-400 mt-3 font-medium">Access the <Link to="/admin" className="text-[#1E3A8A] font-bold hover:underline">Admin Dashboard</Link> to manage users, campaigns, and platform settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-10 border-t border-gray-50">
            <div className="text-center">
              <p className="text-[28px] font-black text-slate-900 mb-1">{appliedCount}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap lg:whitespace-normal">Active Campaigns</p>
            </div>
            <div className="text-center lg:border-l border-gray-100">
              <p className="text-[28px] font-black text-[#10B981] mb-1">EGP {(lifetimeEarnings >= 1000 ? (lifetimeEarnings / 1000).toFixed(1) + 'K' : lifetimeEarnings.toLocaleString())}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Earnings</p>
            </div>
            <div className="text-center lg:border-l border-gray-100">
              <p className="text-[28px] font-black text-slate-900 mb-1">{totalClicks.toLocaleString()}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Clicks</p>
            </div>
            <div className="text-center lg:border-l border-gray-100">
              <p className="text-[28px] font-black text-[#F59E0B] mb-1">{conversionRate}%</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Conversion Rate</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-10">
        <div className="bg-white p-1.5 rounded-[20px] border border-gray-100 shadow-sm flex flex-wrap items-center justify-center gap-1">
            {(['wallet', 'transactions', 'payments', 'reviews', 'insights'] as TabType[]).map((tab) => {
                const isCompany = role?.toLowerCase() === 'company';
                const isAdmin = role?.toLowerCase() === 'admin';

                // Admin: reviews
                if (isAdmin && tab !== 'reviews') return null;

                // Company: reviews and payments
                if (isCompany && tab !== 'reviews' && tab !== 'payments') return null;
                return (
                  <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-6 lg:px-8 py-2.5 rounded-xl text-[13px] font-black transition-all ${
                      activeTab === tab 
                      ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/10' 
                      : 'text-gray-400 hover:text-slate-600'
                  }`}
                  >
                  {tab === 'wallet' && <Wallet className="w-4 h-4" />}
                  {tab === 'transactions' && <HistoryIcon className="w-4 h-4" />}
                  {tab === 'payments' && <CreditCard className="w-4 h-4" />}
                  {tab === 'reviews' && <Star className="w-4 h-4" />}
                  {tab === 'insights' && <Sparkles className="w-4 h-4" />}
                  {tab === 'payments' ? (isCompany ? 'Payment Methods' : 'Payout Methods') : tab === 'insights' ? 'AI Insights' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
            })}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 rounded-3xl border border-dashed border-gray-100">
            <Clock className="w-12 h-12 text-gray-200 mb-4 animate-spin" />
            <p className="text-gray-400 font-black">Loading profile data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'wallet' && role?.toLowerCase() === 'marketer' && (
              <div className="space-y-12">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center">
                           <Activity className="w-5 h-5" />
                         </div>
                         <h3 className="text-[18px] font-black text-slate-900">Skills & Expertise</h3>
                       </div>
                       <Link to="/settings" className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-widest hover:underline">Edit</Link>
                    </div>

                    <div className="space-y-7">
                      {(profileData?.skillsExtracted?.split(',') || ['Social Media Marketing', 'Content Creation', 'Photography', 'Data Analytics']).map((skill: string, i: number) => {
                        const skillName = skill.trim();
                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
                        const icons = [TrendingUp, Target, Camera, Activity, MousePointer2];
                        const Icon = icons[i % icons.length];
                        const color = colors[i % colors.length];
                        const rating = 5 - (i % 2); 

                        return (
                          <div key={i} className="group">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                <span className="text-[14px] font-bold text-slate-700">{skillName}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`w-3 h-3 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                              <div className={`h-full ${color} rounded-full transition-all duration-1000 group-hover:opacity-80`} style={{ width: `${80 - (i * 10)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Categories Card */}
                  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                           <BarChart className="w-5 h-5" />
                         </div>
                         <h3 className="text-[18px] font-black text-slate-900">Top Categories</h3>
                       </div>
                       <button className="text-[11px] font-black text-purple-600 uppercase tracking-widest hover:underline">Manage</button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-10">
                      {(profileData?.niche?.split(',') || ['Fashion & Beauty', 'Technology', 'Health & Fitness', 'E-commerce', 'Lifestyle']).map((n: string, i: number) => (
                        <span key={i} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${i === 0 ? 'bg-blue-50 text-blue-600' : i === 1 ? 'bg-purple-50 text-purple-600' : i === 2 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {n.trim()}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Performance by Category</h4>
                    <div className="space-y-6">
                      {['Fashion & Beauty', 'Technology', 'Health & Fitness', 'E-commerce'].map((cat, i) => {
                        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500'];
                        const earnings = [45200, 38500, 32800, 28400];
                        return (
                          <div key={cat}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[13px] font-bold text-slate-700">{cat}</span>
                              <span className="text-[13px] font-black text-slate-900">EGP {(earnings[i]/1000).toFixed(1)}K</span>
                            </div>
                            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[i]} rounded-full transition-all duration-1000`} style={{ width: `${85 - (i * 15)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>


                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-[#1E3A8A] rounded-[40px] p-10 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Wallet className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-blue-100 text-xs font-black uppercase tracking-[0.2em]">Available Balance</p>
                        </div>
                        <Eye className="w-5 h-5 text-blue-200 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <h2 className="text-[48px] font-black mb-2 leading-none">EGP {balance?.toLocaleString()}</h2>
                      <p className="text-blue-200/50 text-[13px] font-bold mb-10">Ready to withdraw</p>
                      
                      <div className="flex gap-4">
                        <button onClick={() => setShowWithdrawModal(true)} className="flex-1 bg-white text-[#1E3A8A] py-4 rounded-2xl font-black text-[13px] shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                           <Download className="w-4 h-4" /> Withdraw
                        </button>
                        <button onClick={() => setActiveTab('transactions')} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black text-[13px] backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                           <ExternalLink className="w-4 h-4" /> Details
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                  </div>

                  <div className="bg-[#F59E0B] rounded-[40px] p-10 text-white shadow-2xl shadow-amber-900/10 relative overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-amber-100 text-xs font-black uppercase tracking-[0.2em]">Pending Earnings</p>
                      </div>
                      
                      <h2 className="text-[48px] font-black mb-2 leading-none">EGP {pendingBalance?.toLocaleString()}</h2>
                      <p className="text-amber-100/60 text-[13px] font-bold mb-auto uppercase tracking-widest">Being processed</p>
                      
                      <div className="mt-8 pt-8 border-t border-white/10">
                        <p className="text-[12px] font-medium text-amber-100/80 leading-relaxed">
                          Earnings will be available in 2-5 business days after campaign completion.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col justify-between group hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Earnings</span>
                    </div>
                    <div>
                      <h3 className="text-[24px] font-black text-slate-900 mb-2">EGP {lifetimeEarnings.toLocaleString()}</h3>
                      <p className="text-[12px] font-black text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +12.5% this month
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col justify-between group hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <Download className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Withdrawn</span>
                    </div>
                    <div>
                      <h3 className="text-[24px] font-black text-slate-900 mb-2">EGP {(lifetimeEarnings - balance - pendingBalance).toLocaleString()}</h3>
                      <p className="text-[12px] font-medium text-gray-400">Last: Jan 14, 2025</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col justify-between group hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                         <Target className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">This Month</span>
                    </div>
                    <div>
                      <h3 className="text-[24px] font-black text-slate-900 mb-2">EGP {(lifetimeEarnings * 0.15).toLocaleString()}</h3>
                      <p className="text-[12px] font-medium text-gray-400">From {appliedCount} campaigns</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'payments') && (role?.toLowerCase() === 'marketer' || role?.toLowerCase() === 'company') && (
              <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-[20px] font-black text-slate-900">{role?.toLowerCase() === 'company' ? 'Payment Methods' : 'Payout Methods'}</h2>
                  <button onClick={() => setShowAddModal(true)} className="bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2">
                    <Plus className="w-4 h-4 font-black" /> Add New Method
                  </button>
                </div>
                <div className="space-y-4">
                  {paymentMethods.length > 0 ? paymentMethods.map((method, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between group hover:border-blue-100 transition-all shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 transition-colors">
                          {method.type?.includes('Bank') ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-[15px]">{method.accountType || method.type}</h3>
                          <p className="text-[13px] text-gray-400 font-medium">{method.accountDetails || method.accountNumber || method.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full border border-green-100">Verified</span>
                        <button onClick={() => { setEditingPaymentMethod(method); setShowAddModal(true); }} className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Method">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteMethod(method.id)} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Method">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) : <p className="text-center py-10 text-gray-400 font-bold">No payment methods added yet.</p>}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && role?.toLowerCase() === 'marketer' && (
              <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-[20px] font-black text-slate-900">Transaction History</h2>
                  <button onClick={handleExport} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-600 text-[12px] font-bold">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
                <div className="space-y-4">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-50 p-5 flex items-center justify-between group hover:shadow-lg transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.amount < 0 ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                             {tx.amount < 0 ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-[15px] mb-1">{tx.title || (tx.amount < 0 ? 'Withdrawal' : 'Commission')}</h3>
                            <p className="text-[11px] text-gray-300 font-bold">{new Date(tx.date || Date.now()).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <p className={`text-[16px] font-black ${tx.amount < 0 ? 'text-slate-900' : 'text-green-600'}`}>EGP {tx.amount?.toLocaleString()}</p>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest text-xs">No transactions recorded.</p>}
                </div>
              </div>
            )}

            {activeTab === 'insights' && role?.toLowerCase() === 'marketer' && (
              <div className="space-y-8 pb-20">
                 <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h2 className="text-[20px] font-black text-slate-900 mb-1">Growth Pulse</h2>
                         <p className="text-[12px] font-bold text-gray-400">Your performance score over the last 30 days</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                   </div>
                   {performanceHistory.length > 0 ? (
                     <div className="flex items-end gap-2 h-48 px-4">
                       {performanceHistory.slice(-15).map((point, idx) => {
                         const height = (point.performanceScore || 0)
                         return (
                           <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                             <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                               {point.performanceScore} Score
                             </div>
                             <div 
                               className="w-full bg-blue-500/10 rounded-t-lg group-hover:bg-blue-500 transition-all duration-500" 
                               style={{ height: `${height}%` }}
                             />
                           </div>
                         )
                       })}
                     </div>
                   ) : (
                     <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">No performance history recorded yet.</div>
                   )}
                 </div>

                 {/* AI Suggestions & Earnings */}
                 <div className="grid lg:grid-cols-2 gap-8">
                   <div className="bg-[#1E3A8A] rounded-[32px] p-10 shadow-xl shadow-blue-900/20 text-white overflow-hidden relative">
                      <Sparkles className="absolute -top-10 -right-10 w-48 h-48 text-white/5" />
                      <h2 className="text-[20px] font-black mb-1">AI Matchmaking</h2>
                      <p className="text-white/60 text-[12px] font-bold mb-8">Smart campaign recommendations based on your niche.</p>
                      
                       <div className="space-y-4">
                          {aiSuggestions.length > 0 ? aiSuggestions.slice(0, 3).map((sug, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all">
                               <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-[14px]">{sug.campaignTitle}</h4>
                                  <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full">{sug.matchScore}% Match</span>
                               </div>
                               <p className="text-[11px] text-white/60 leading-relaxed">{sug.matchReason}</p>
                            </div>
                          )) : loading ? (
                            Array(3).fill(0).map((_, i) => (
                              <div key={i} className="h-24 bg-white/5 skeleton rounded-2xl" />
                            ))
                          ) : (
                            <p className="text-white/40 text-[12px] font-bold italic">No matches currently available. Try updating your profile niches!</p>
                          )}
                       </div>
                   </div>

                   <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm">
                      <h2 className="text-[20px] font-black text-slate-900 mb-1">Earnings Report</h2>
                      <p className="text-gray-400 text-[12px] font-bold mb-8">Breakdown of earnings by period.</p>
                      
                      <div className="space-y-6">
                          {loading ? (
                            Array(4).fill(0).map((_, i) => (
                              <div key={i} className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 skeleton rounded-xl" />
                                    <div className="space-y-2">
                                       <div className="h-4 w-24 skeleton" />
                                       <div className="h-3 w-16 skeleton" />
                                    </div>
                                 </div>
                                 <div className="h-5 w-20 skeleton" />
                              </div>
                            ))
                          ) : earningsReport?.earningsByPeriod?.length > 0 ? earningsReport.earningsByPeriod.slice(0, 4).map((period: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                     <BarChart className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <p className="text-[13px] font-black text-slate-900">{period.period}</p>
                                     <p className="text-[10px] text-gray-400 font-bold">{period.conversions || 0} Conversions</p>
                                  </div>
                               </div>
                               <span className="text-[15px] font-black text-slate-900">EGP {period.earnings?.toLocaleString()}</span>
                            </div>
                          )) : (
                            <div className="py-10 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">No reports available.</div>
                          )}
                      </div>
                   </div>

                   <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm lg:col-span-2">
                       <div className="flex items-center justify-between mb-8">
                          <div>
                             <h2 className="text-[20px] font-black text-slate-900 mb-1">Professional Personality</h2>
                             <p className="text-gray-400 text-[12px] font-bold">Psychometric matching results for better brand alignment.</p>
                          </div>
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                             <Target className="w-6 h-6" />
                          </div>
                       </div>
                       
                       {personalityTest ? (
                         <div className="grid md:grid-cols-3 gap-6">
                            {[
                              { label: 'Analytical', score: personalityTest.analytical || personalityTest.data?.analytical || 75, color: 'bg-blue-500' },
                              { label: 'Creative', score: personalityTest.creative || personalityTest.data?.creative || 85, color: 'bg-purple-500' },
                              { label: 'Reliable', score: personalityTest.reliable || personalityTest.data?.reliable || 95, color: 'bg-emerald-500' }
                            ].map((trait, i) => (
                              <div key={i} className="space-y-3">
                                 <div className="flex justify-between items-center px-1">
                                    <span className="text-[13px] font-black text-slate-700">{trait.label}</span>
                                    <span className="text-[13px] font-black text-slate-900">{trait.score}%</span>
                                 </div>
                                 <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div className={`h-full ${trait.color} rounded-full`} style={{ width: `${trait.score}%` }} />
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                            <p className="text-slate-400 font-bold text-sm mb-4">Complete your personality assessment to unlock premium matchmaking.</p>
                            <Link to="/settings" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:scale-[1.02] transition-all active:scale-95">Take Assessment</Link>
                         </div>
                       )}
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h2 className="text-[20px] font-black text-slate-900 mb-1">{role} Reviews</h2>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-[12px] font-bold text-gray-400">{aveRating.toFixed(1)} Rating • {totalReviews} Reviews</span>
                      </div>
                   </div>
                   {aveRating > 0 && (
                     <div className="flex gap-2 min-w-[200px]">
                       {[5, 4, 3, 2, 1].map(star => {
                         const count = ratingDistrib[String(star)] || 0;
                         const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                         return (
                           <div key={star} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                             <div className="w-full bg-slate-50 rounded-full overflow-hidden flex flex-col justify-end h-12 border border-slate-100/50">
                               <div className="bg-yellow-400 w-full transition-all duration-700" style={{ height: `${pct}%` }} />
                             </div>
                             <span className="text-[9px] font-black text-gray-400">{star}★</span>
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                               {count} reviews
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                   {role?.toLowerCase() !== 'company' && (
                     <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
                       <button onClick={() => setReviewTab('received')} className={`px-4 py-2 rounded-lg text-[13px] font-black transition-all ${reviewTab === 'received' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-400 hover:text-slate-600'}`}>Received</button>
                       <button onClick={() => setReviewTab('given')} className={`px-4 py-2 rounded-lg text-[13px] font-black transition-all ${reviewTab === 'given' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-400 hover:text-slate-600'}`}>Given</button>
                     </div>
                   )}
                </div>
                <div className="space-y-6">
                  {(reviewTab === 'received' ? reviews : givenReviews).length > 0 ? (reviewTab === 'received' ? reviews : givenReviews).map((rev: any, idx: number) => (
                    <div key={idx} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-50 hover:border-blue-100 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center font-black text-[#1E3A8A]">
                               {(reviewTab === 'received' ? rev.reviewerName : rev.revieweeName)?.charAt(0) || 'U'}
                             </div>
                             <div>
                               <h4 className="font-black text-slate-900 text-[14px]">{(reviewTab === 'received' ? rev.reviewerName : rev.revieweeName) || 'Anonymous'}</h4>
                               {reviewTab === 'given' && <p className="text-[11px] font-bold text-gray-400">Review you gave</p>}
                             </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= (rev.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
                          </div>
                       </div>
                       <p className="text-slate-600 text-[13px] leading-relaxed italic">"{rev.comment || 'No comment provided.'}"</p>
                    </div>
                  )) : <p className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest text-xs">No reviews {reviewTab === 'received' ? 'received' : 'given'} yet.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingPaymentMethod(null); setSelectedType(null); }} title={editingPaymentMethod ? "Edit Payment Method" : "Add Payment Method"}>
         {!selectedType ? (
           <div className="grid gap-4">
             {[{id:'bank', title:'Bank Account'}, {id:'wallet', title:'Mobile Wallet'}, {id:'instapay', title:'InstaPay'}].map(t => (
               <button key={t.id} onClick={() => setSelectedType(t.id as any)} className="p-6 bg-slate-50 border border-transparent hover:border-[#1E3A8A] rounded-2xl text-left font-black text-slate-900 transition-all">{t.title}</button>
             ))}
           </div>
         ) : (
           <form onSubmit={(e) => {
             e.preventDefault();
             const fd = new FormData(e.currentTarget);
             const typeMap: Record<string, Types.PaymentMethodType> = {
               bank: 'BankAccount',
               wallet: 'Ewallet',
               instapay: 'Other'
             };
             
             const type = typeMap[selectedType] || 'Other';
             const details = selectedType === 'bank' 
               ? `Bank: ${fd.get('bankName')}, Account: ${fd.get('accountNumber')}`
               : selectedType === 'wallet'
               ? `Provider: ${fd.get('provider')}, Phone: ${fd.get('phone')}`
               : `InstaPay ID: ${fd.get('handle')}`;

             handleAddMethod({
               type,
               accountDetails: details,
               accountHolderName: name,
               setAsDefault: true
             });
           }} className="space-y-6">
              <button onClick={() => setSelectedType(null)} className="text-xs font-black text-gray-400 flex items-center gap-1 hover:text-[#1E3A8A] mb-4"><ChevronLeft className="w-3 h-3"/> BACK</button>
              {selectedType === 'bank' ? (
                <>
                  <input name="bankName" required defaultValue={editingPaymentMethod?.accountDetails?.split(': ')[1]?.split(', ')[0] || ''} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Bank Name" />
                  <input name="accountNumber" required defaultValue={editingPaymentMethod?.accountDetails?.split(': ')[2] || ''} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Account Number / IBAN" />
                </>
              ) : selectedType === 'wallet' ? (
                <>
                  <select name="provider" defaultValue={editingPaymentMethod?.accountDetails?.split(': ')[1]?.split(', ')[0] || "Vodafone Cash"} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                    <option>Vodafone Cash</option><option>Orange Money</option><option>Etisalat Cash</option>
                  </select>
                  <input name="phone" required defaultValue={editingPaymentMethod?.accountDetails?.split(': ')[2] || ''} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Mobile Number" />
                </>
              ) : (
                <input name="handle" required defaultValue={editingPaymentMethod?.accountDetails?.split(': ')[1] || ''} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="InstaPay ID" />
              )}
              <button type="submit" disabled={submittingMethod} className="w-full bg-[#1E3A8A] text-white py-4 rounded-2xl font-black text-sm disabled:opacity-50">{submittingMethod ? 'Saving...' : (editingPaymentMethod ? 'Save Changes' : 'Save Method')}</button>
           </form>
         )}
      </Modal>

      {/* Withdraw */}
      <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Withdraw Funds">
         <form onSubmit={handleWithdraw} className="space-y-6">
             <div className="bg-blue-50 p-6 rounded-3xl mb-8">
                <p className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest mb-1">Available balance</p>
                <h3 className="text-3xl font-black text-[#1E3A8A]">EGP {balance.toLocaleString()}</h3>
             </div>
             <input name="amount" type="number" required min="100" max={balance} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Amount (min 100)" />
             <select name="paymentMethodId" required className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.accountType || m.type}</option>)}
                {paymentMethods.length === 0 && <option disabled>No payment methods found</option>}
             </select>
             <button type="submit" disabled={withdrawing || paymentMethods.length === 0} className="w-full bg-[#1E3A8A] text-white py-4 rounded-2xl font-black text-sm disabled:opacity-50">{withdrawing ? 'Processing...' : 'Request Withdrawal'}</button>
         </form>
      </Modal>

      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </div>
  )
}
