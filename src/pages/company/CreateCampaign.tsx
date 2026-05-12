import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { campaignApi, categoryApi, companyApi } from '../../api/client'
import type { CategoryDto, CommissionType, CompanyDetailsDto } from '../../api/client'
import { Sparkles, DollarSign, Users, Globe, CheckCircle2, Calendar, ArrowLeft, Instagram, Youtube, Twitter, Facebook, Linkedin, Video, Target, Gift, ShieldAlert, Clock } from 'lucide-react'
import { activityTracker } from '../../utils/activityTracker'
import { dataUtils } from '../../utils/dataUtils'
import toast from 'react-hot-toast'

const steps = [
  { name: 'Basic Info', icon: Sparkles },
  { name: 'Budget & Commission', icon: DollarSign },
  { name: 'Requirements', icon: Users }
]

const platforms = [
  { name: 'Instagram', icon: Instagram },
  { name: 'TikTok', icon: Video },
  { name: 'YouTube', icon: Youtube },
  { name: 'Twitter', icon: Twitter },
  { name: 'Facebook', icon: Facebook },
  { name: 'LinkedIn', icon: Linkedin }
]

export default function CreateCampaign() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [profile, setProfile] = useState<CompanyDetailsDto | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: 0,
    productUrl: '',
    totalBudget: '',
    commissionType: 'Percentage' as CommissionType,
    commissionValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetAudience: '',
    minFollowers: '',
    allowedPlatforms: [] as string[],
    additionalNotes: '',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, profRes] = await Promise.all([
          categoryApi.getroots(),
          companyApi.getmyprofile().catch(err => {
            console.error('Failed to load profile:', err)
            return null
          })
        ])
        setCategories(dataUtils.filterTestEntities(catRes))
        setProfile((profRes as any)?.data || profRes)
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to load required data. Please refresh and try again.')
      } finally {
        setInitialLoading(false)
      }
    }
    init()
  }, [])

  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      allowedPlatforms: f.allowedPlatforms.includes(p)
        ? f.allowedPlatforms.filter(x => x !== p)
        : [...f.allowedPlatforms, p],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      window.scrollTo(0, 0)
      return
    }
    setError('')
    setLoading(true)
    try {
      const budget = form.totalBudget ? parseFloat(form.totalBudget) : null
      const promotionalMaterials = [
        `Target Audience: ${form.targetAudience}`,
        `Min Followers: ${form.minFollowers}`,
        `Platforms: ${form.allowedPlatforms.join(', ')}`,
        `Notes: ${form.additionalNotes}`
      ].filter(s => !s.endsWith(': ')).join('\n')

      await campaignApi.post({
        title: form.title,
        description: form.description || null,
        categoryId: form.categoryId,
        commissionType: form.commissionType,
        commissionValue: parseFloat(form.commissionValue) || 0,
        budget,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),
        promotionalMaterials,
        trackingBaseUrl: form.productUrl || null,
      })
      
      activityTracker.addActivity({ description: `Launched new campaign: ${form.title}`, type: 'system' })
      toast.success('Campaign launched successfully!')
      navigate('/company')
    } catch (e: any) {
      console.error('Campaign creation error:', e)
      const msg = e.message || ''
      if (msg.includes('Forbidden') || msg.includes('403')) {
        setError('🚫 ACCOUNT NOT VERIFIED: Your company profile is still under audit. You will be able to launch campaigns once we verify your documents (typically 24-48h).')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to create campaign')
      }
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFF]">
        <div className="w-10 h-10 border-2 border-[#1E3A8A]/20 border-t-[#1E3A8A] rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile || !profile.isVerified) {
    const status = (profile as any)?.status || 'Pending'
    const isRejected = status === 'Rejected'
    
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center px-6 py-20 text-center animate-in fade-in duration-700">
        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 border shadow-sm relative ${isRejected ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
           <ShieldAlert className="w-10 h-10" />
           <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-md">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
           </div>
        </div>
        <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-none mb-4">
          {isRejected ? 'Verification Rejected' : 'Verification Required'}
        </h1>
        <p className="text-slate-500 font-medium text-[16px] max-w-md mx-auto mb-10">
          {isRejected 
            ? 'Your company profile was not approved. Please review your commercial register or contact support for more information.'
            : 'Your account is currently under review by our admin team. You will be able to launch campaigns once your company profile is verified.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
           <Link to="/company" className="px-10 py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-[13px] hover:bg-[#152C6E] transition-all shadow-xl shadow-blue-900/10 active:scale-95 uppercase tracking-widest">
              Back to Dashboard
           </Link>
           {!isRejected && (
             <button onClick={() => window.location.reload()} className="px-10 py-4 border border-slate-100 bg-white text-slate-500 rounded-2xl font-black text-[13px] hover:bg-slate-50 transition-all uppercase tracking-widest active:scale-95">
                Check Status
             </button>
           )}
        </div>
        {!isRejected && <p className="mt-12 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">Typically verified within 24-48 hours</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF] font-sans pb-20">
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 py-12">
        
        {/* Figma Header Style */}
        <div className="flex items-center gap-5 mb-12">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/company')} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[26px] font-black text-slate-800 tracking-tight leading-none mb-1.5">Create New Campaign</h1>
            <p className="text-[14px] font-medium text-slate-400">Build your AI-powered marketing campaign</p>
          </div>
        </div>

        {/* Stepper (Blue Circles / Numbers) */}
        <div className="flex items-center justify-center gap-0 mb-16 relative px-10">
          {steps.map((s, i) => (
            <div key={s.name} className="flex items-center flex-1 last:flex-none relative">
              <div className="flex flex-col items-center gap-3 z-10">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-black transition-all duration-300 ${
                  i + 1 < step ? 'bg-[#1E3A8A] text-white' : 
                  i + 1 === step ? 'bg-[#1E3A8A] text-white shadow-xl shadow-blue-900/20 ring-[6px] ring-blue-50' : 
                  'bg-white text-slate-300 border-2 border-slate-100'
                }`}>
                  {i + 1 < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-[12px] font-black uppercase tracking-wider ${i + 1 <= step ? 'text-[#1E3A8A]' : 'text-slate-300'}`}>{s.name}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-[2px] flex-1 mx-4 -mt-7 ${i + 1 < step ? 'bg-[#1E3A8A]' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[40px] border border-slate-100 p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-100">{error}</div>}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#1E3A8A]" />
                </div>
                <div>
                  <h2 className="text-[20px] font-black text-slate-800">Basic Information</h2>
                  <p className="text-[14px] text-slate-400 font-medium">Enter your campaign details</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Campaign Name *</label>
                  <input
                    type="text" required placeholder="e.g., Summer Campaign 2026"
                    className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20 focus:ring-0 outline-none transition-all font-medium placeholder:text-slate-300"
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Campaign Description *</label>
                  <textarea
                    required rows={4} placeholder="Explain the product/service details and campaign goals..."
                    className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20 focus:ring-0 outline-none transition-all font-medium placeholder:text-slate-300 resize-none"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Category *</label>
                    <select
                      required className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20 focus:ring-0 outline-none transition-all font-medium appearance-none"
                      value={form.categoryId || ''} onChange={e => setForm({...form, categoryId: parseInt(e.target.value)})}
                    >
                      <option value="">Select a category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Product/Service URL *</label>
                    <div className="relative group">
                      <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#1E3A8A] transition-colors" />
                      <input
                        type="url" required placeholder="https://example.com/product"
                        className="w-full pl-12 pr-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20 focus:ring-0 outline-none transition-all font-medium"
                        value={form.productUrl} onChange={e => setForm({...form, productUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Budget & Commission */}
          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[20px] font-black text-slate-800">Budget & Commission</h2>
                  <p className="text-[14px] text-slate-400 font-medium">Set your budget and commission structure</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Total Budget *</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[20px]">$</span>
                    <input
                      type="number" min="0" required placeholder="10000"
                      className="w-full pl-12 pr-6 py-5 rounded-xl border border-slate-100 bg-slate-50/10 text-slate-900 focus:border-[#1E3A8A]/20 focus:ring-0 outline-none transition-all font-black text-[20px] tracking-tight"
                      value={form.totalBudget} onChange={e => setForm({...form, totalBudget: e.target.value})}
                    />
                  </div>
                  <p className="text-[12px] text-slate-400 font-bold mt-2 ml-1 uppercase tracking-wider">Total campaign budget in USD</p>
                </div>

                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-4 ml-1">Commission Type *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      type="button" onClick={() => setForm({...form, commissionType: 'Percentage'})}
                      className={`p-6 rounded-[28px] border-2 transition-all flex flex-col items-center gap-4 group ${
                        form.commissionType === 'Percentage' ? 'border-[#1E3A8A] bg-blue-50/30 ring-4 ring-blue-50' : 'border-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${form.commissionType === 'Percentage' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-300'}`}>
                        <Target className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-[15px] font-black text-slate-800">Percentage</p>
                        <p className="text-[12px] font-medium text-slate-400 mt-0.5">Of sale value</p>
                      </div>
                    </button>
                    <button
                      type="button" onClick={() => setForm({...form, commissionType: 'Fixed'})}
                      className={`p-6 rounded-[28px] border-2 transition-all flex flex-col items-center gap-4 group ${
                        form.commissionType === 'Fixed' ? 'border-[#1E3A8A] bg-blue-50/30 ring-4 ring-blue-50' : 'border-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${form.commissionType === 'Fixed' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-300'}`}>
                        <Gift className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-[15px] font-black text-slate-800">Fixed Amount</p>
                        <p className="text-[12px] font-medium text-slate-400 mt-0.5">Per sale</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Commission Value *</label>
                  <div className="relative group">
                    <input
                      type="number" min="0" required placeholder={form.commissionType === 'Percentage' ? '15' : '50'}
                      className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 font-bold focus:border-[#1E3A8A]/20 outline-none"
                      value={form.commissionValue} onChange={e => setForm({...form, commissionValue: e.target.value})}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[15px] font-black text-slate-300 group-focus-within:text-[#1E3A8A]">
                      {form.commissionType === 'Percentage' ? '%' : 'USD'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Campaign Duration *</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group flex-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Start Date</p>
                      <Calendar className="absolute left-4 top-[35px] w-4 h-4 text-slate-300 group-focus-within:text-[#1E3A8A]" />
                      <input
                        type="date" required
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-600 font-medium focus:border-[#1E3A8A]/20 outline-none transition-all"
                        value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                      />
                    </div>
                    <div className="relative group flex-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 ml-1">End Date</p>
                      <Calendar className="absolute left-4 top-[35px] w-4 h-4 text-slate-300 group-focus-within:text-[#1E3A8A]" />
                      <input
                        type="date" required min={form.startDate}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 outline-none transition-all shadow-sm"
                        value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Requirements */}
          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Users className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-[20px] font-black text-slate-800">Requirements & Criteria</h2>
                  <p className="text-[14px] text-slate-400 font-medium">Set affiliate selection criteria</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Target Age Range *</label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="number" min="1" max="99" required placeholder="From (e.g. 18)"
                        className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20 outline-none transition-all placeholder:text-[13px]"
                        value={form.targetAudience.split('-')[0]?.trim() || ''}
                        onChange={e => {
                          const max = form.targetAudience.split('-')[1]?.trim() || '';
                          setForm({...form, targetAudience: `${e.target.value} - ${max}`})
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">Y/O</span>
                    </div>
                    <span className="text-slate-300 font-black">-</span>
                    <div className="relative flex-1">
                      <input
                        type="number" min="1" max="99" required placeholder="To (e.g. 35)"
                        className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20 outline-none transition-all placeholder:text-[13px]"
                        value={form.targetAudience.split('-')[1]?.trim() || ''}
                        onChange={e => {
                          const min = form.targetAudience.split('-')[0]?.trim() || '';
                          setForm({...form, targetAudience: `${min} - ${e.target.value}`})
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">Y/O</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Minimum Followers</label>
                  <input
                    type="number" min="0" placeholder="1000"
                    className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 focus:border-[#1E3A8A]/20"
                    value={form.minFollowers} onChange={e => setForm({...form, minFollowers: e.target.value})}
                  />
                  <p className="text-[11px] text-slate-400 font-bold mt-2 ml-1 uppercase tracking-widest">Leave empty if no minimum required</p>
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-4 ml-1">Allowed Platforms *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {platforms.map(p => (
                      <button
                        key={p.name} type="button" onClick={() => togglePlatform(p.name)}
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border text-[14px] font-black transition-all ${
                          form.allowedPlatforms.includes(p.name)
                            ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl shadow-blue-900/15 scale-[1.02]'
                            : 'bg-white border-slate-50 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <p.icon className={`w-4 h-4 ${form.allowedPlatforms.includes(p.name) ? 'text-white' : 'text-slate-300'}`} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-700 mb-3 ml-1">Additional Notes</label>
                  <textarea
                    rows={4} placeholder="Any additional information or requirements for affiliates..."
                    className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50/20 text-slate-900 resize-none min-h-[100px] focus:border-[#1E3A8A]/20 outline-none"
                    value={form.additionalNotes} onChange={e => setForm({...form, additionalNotes: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-16 pt-8 border-t border-slate-50">
            <button
              type="button" onClick={() => step > 1 ? setStep(step - 1) : navigate('/company')}
              className="px-10 py-4 rounded-xl border border-slate-100 font-black text-[13px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all uppercase tracking-widest active:scale-95"
            >
              Back
            </button>
            <button
              type="submit" disabled={loading}
              className="px-14 py-4 rounded-xl bg-[#1E3A8A] text-white font-black text-[13px] hover:bg-[#152C6E] hover:-translate-y-0.5 transition-all shadow-xl shadow-blue-900/10 active:scale-95 disabled:opacity-50 uppercase tracking-[0.15em]"
            >
              {loading ? 'Processing...' : (step < 3 ? 'Next' : 'Launch Campaign')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
