import { useState, useRef, useEffect } from 'react'
import {
  X, Send, ChevronDown, Instagram, Youtube, Twitter, Globe,
  Users, MapPin, Sparkles, CheckCircle2,
  Facebook, Loader2, Upload
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export interface ApplyFormData {
  pitch: string
  experienceLevel: string
  yearsExperience: string
  channels: string[]
  audienceSize: string
  audienceLocation: string
  portfolioUrl: string
  socialLink: string
  availableFrom: string
  phoneNumber: string
  cvFile?: File | null
  cvFileName?: string
  cvFileBase64?: string
}

export interface ApplyModalProps {
  campaign: {
    id: number
    title?: string | null
    commissionValue?: number
    commissionType?: string
    categoryName?: string | null
    companyName?: string | null
    description?: string | null
  }
  onClose: () => void
  onSubmit: (data: ApplyFormData) => Promise<void>
}

const CHANNELS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600' },
  { id: 'tiktok',    label: 'TikTok',    icon: Sparkles,  color: 'from-slate-900 to-slate-700' },
  { id: 'youtube',   label: 'YouTube',   icon: Youtube,   color: 'from-red-500 to-red-700' },
  { id: 'twitter',   label: 'X / Twitter', icon: Twitter, color: 'from-sky-500 to-blue-600' },
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,  color: 'from-blue-600 to-blue-800' },
  { id: 'blog',      label: 'Blog / Website', icon: Globe, color: 'from-emerald-500 to-teal-600' },
]

const AUDIENCE_SIZES = [
  'Under 1K',
  '1K – 10K',
  '10K – 50K',
  '50K – 100K',
  '100K – 500K',
  '500K+',
]

export default function ApplyModal({ campaign, onClose, onSubmit }: ApplyModalProps) {
  const { phone } = useAuth()
  const cvInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState<ApplyFormData>({
    pitch: '',
    experienceLevel: '',
    yearsExperience: '',
    channels: [],
    audienceSize: '',
    audienceLocation: '',
    portfolioUrl: '',
    socialLink: '',
    availableFrom: new Date().toISOString().split('T')[0],
    phoneNumber: phone || '',
    cvFile: null,
    cvFileName: '',
    cvFileBase64: '',
  })

  useEffect(() => {
    if (phone) {
      setForm(prev => ({ ...prev, phoneNumber: prev.phoneNumber || phone }))
    }
  }, [phone])

  const set = (field: keyof ApplyFormData, val: any) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    set('cvFileName', file.name)
    set('cvFile', file)

    const reader = new FileReader()
    reader.onloadend = () => {
      set('cvFileBase64', reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const toggleChannel = (id: string) =>
    set('channels', form.channels.includes(id)
      ? form.channels.filter(c => c !== id)
      : [...form.channels, id])

  const step1Valid = form.pitch.trim().length >= 30
  const step2Valid = form.channels.length > 0 && form.audienceSize
  const step3Valid = form.phoneNumber.trim().length >= 8 && !!form.cvFileBase64

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit(form)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const commissionLabel =
    campaign.commissionValue
      ? campaign.commissionType === 'Percentage'
        ? `${campaign.commissionValue}% per sale`
        : `EGP ${campaign.commissionValue} per action`
      : null

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        <div className="bg-white rounded-[36px] w-full max-w-md shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Application Sent!</h2>
          <p className="text-slate-500 font-medium text-[14px] leading-relaxed mb-8">
            Your application for <strong className="text-slate-900">{campaign.title}</strong> has been submitted. 
            The admin will review it and notify you soon.
          </p>
          <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-2 mb-8">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">What happens next?</p>
            {['Admin reviews your application', 'You get notified on acceptance or rejection', 'Start earning commissions after approval'].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-black text-[#1E3A8A]">{i + 1}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-600">{s}</p>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#1E3A8A] text-white font-black text-[15px] rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-[0.98]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl max-h-[95dvh] sm:max-h-[90vh] rounded-t-[36px] sm:rounded-[36px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-[#1E3A8A] to-[#0F1D45] px-8 pt-8 pb-6 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-400/20 border border-blue-400/30 rounded-full text-[10px] font-black text-blue-200 uppercase tracking-widest">
              Apply Now
            </span>
            {commissionLabel && (
              <span className="px-3 py-1 bg-emerald-400/20 border border-emerald-400/30 rounded-full text-[10px] font-black text-emerald-200 uppercase tracking-widest">
                {commissionLabel}
              </span>
            )}
          </div>

          <h2 className="text-xl font-black leading-tight pr-12">{campaign.title}</h2>
          {campaign.companyName && (
            <p className="text-blue-200 font-medium text-[13px] mt-1">{campaign.companyName}</p>
          )}

          <div className="flex items-center gap-3 mt-5">
            {(['Your Pitch', 'Channels & Reach', 'Final Details'] as const).map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                  step > i + 1 ? 'bg-emerald-400 border-emerald-400 text-white'
                  : step === i + 1 ? 'bg-white border-white text-[#1E3A8A]'
                  : 'bg-transparent border-white/30 text-white/40'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-bold hidden sm:block ${step === i + 1 ? 'text-white' : 'text-white/40'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`h-px w-4 sm:w-8 ${step > i + 1 ? 'bg-emerald-400' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-6">

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {(campaign.description || campaign.categoryName) && (
                <div className="bg-[#1E3A8A]/5 p-5 rounded-2xl border border-[#1E3A8A]/10">
                  <h3 className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Campaign Summary
                  </h3>
                  {campaign.categoryName && (
                    <span className="inline-block px-2.5 py-1 bg-white rounded-md text-[#1E3A8A] text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm border border-[#1E3A8A]/10">
                      {campaign.categoryName}
                    </span>
                  )}
                  {campaign.description && (
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-h-[120px] overflow-y-auto pr-2">
                      {campaign.description}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Why are you a great fit for this campaign? *
                </label>
                <textarea
                  value={form.pitch}
                  onChange={e => set('pitch', e.target.value)}
                  placeholder="Tell the advertiser why you'd be the perfect partner. Mention your audience, content style, previous results, or relevant experience..."
                  rows={5}
                  className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 text-[14px] text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 resize-none transition-all"
                />
                <div className="flex justify-between mt-2">
                  <p className={`text-[11px] font-medium ${form.pitch.length < 30 ? 'text-rose-400' : 'text-emerald-500'}`}>
                    {form.pitch.length < 30 ? `${30 - form.pitch.length} more characters required` : '✓ Great pitch!'}
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium">{form.pitch.length} / 800</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Experience Level *
                  </label>
                  <div className="relative">
                    <select
                      value={form.experienceLevel}
                      onChange={e => set('experienceLevel', e.target.value)}
                      className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 appearance-none bg-white transition-all"
                    >
                      <option value="">Select level...</option>
                      <option value="Entry">Entry Level (0–1 yr)</option>
                      <option value="Mid">Mid Level (1–3 yrs)</option>
                      <option value="Senior">Senior (3–6 yrs)</option>
                      <option value="Expert">Expert (6+ yrs)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Years in Affiliate Marketing
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.yearsExperience}
                    onChange={e => set('yearsExperience', e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Your Promotion Channels *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CHANNELS.map(ch => {
                    const Icon = ch.icon
                    const selected = form.channels.includes(ch.id)
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold text-[13px] transition-all active:scale-95 ${
                          selected
                            ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 text-[#1E3A8A]'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${ch.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="truncate">{ch.label}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0 text-[#1E3A8A]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Users className="inline w-3.5 h-3.5 mr-1" />
                    Your Audience Size *
                  </label>
                  <div className="relative">
                    <select
                      value={form.audienceSize}
                      onChange={e => set('audienceSize', e.target.value)}
                      className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 appearance-none bg-white transition-all"
                    >
                      <option value="">Select range...</option>
                      {AUDIENCE_SIZES.map(s => <option key={s} value={s}>{s} followers</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <MapPin className="inline w-3.5 h-3.5 mr-1" />
                    Audience Location
                  </label>
                  <input
                    type="text"
                    value={form.audienceLocation}
                    onChange={e => set('audienceLocation', e.target.value)}
                    placeholder="e.g. Egypt, KSA, UAE"
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phoneNumber}
                    onChange={e => set('phoneNumber', e.target.value)}
                    placeholder="e.g. +20 100 123 4567"
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Available to Start From
                  </label>
                  <input
                    type="date"
                    value={form.availableFrom}
                    onChange={e => set('availableFrom', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Portfolio / Previous Work URL
                </label>
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={e => set('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Your Main Social Profile Link
                </label>
                <input
                  type="url"
                  value={form.socialLink}
                  onChange={e => set('socialLink', e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Upload CV / Resume *
                </label>
                <div 
                  onClick={() => cvInputRef.current?.click()} 
                  className="border-2 border-dashed border-slate-200 hover:border-[#1E3A8A]/40 hover:bg-blue-50/10 rounded-2xl py-6 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-[13px] font-bold text-slate-600">
                    {form.cvFileName || 'Select or drop CV (PDF, DOC, DOCX)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Supported formats: .pdf, .doc, .docx (Max 5MB)</span>
                </div>
                <input 
                  type="file" 
                  ref={cvInputRef}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Application Summary</p>
                <div className="flex flex-wrap gap-2">
                  {form.channels.map(c => (
                    <span key={c} className="px-3 py-1 bg-[#1E3A8A]/8 text-[#1E3A8A] text-[11px] font-black rounded-full border border-[#1E3A8A]/15">
                      {CHANNELS.find(ch => ch.id === c)?.label}
                    </span>
                  ))}
                  {form.audienceSize && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-full border border-emerald-100">
                      {form.audienceSize} followers
                    </span>
                  )}
                  {form.experienceLevel && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[11px] font-black rounded-full border border-purple-100">
                      {form.experienceLevel}
                    </span>
                  )}
                  {form.phoneNumber && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-black rounded-full border border-blue-100">
                      📞 {form.phoneNumber}
                    </span>
                  )}
                  {form.cvFileName && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-black rounded-full border border-amber-100 truncate max-w-[200px]" title={form.cvFileName}>
                      📄 {form.cvFileName}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-slate-500 font-medium line-clamp-2">{form.pitch}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-50 flex items-center gap-3 flex-shrink-0 bg-white">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-5 py-3.5 rounded-xl border-2 border-slate-100 text-slate-600 font-black text-[13px] hover:bg-slate-50 transition-all active:scale-95"
            >
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="px-7 py-3.5 bg-[#1E3A8A] text-white font-black text-[13px] rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !step3Valid}
              className="px-7 py-3.5 bg-[#1E3A8A] text-white font-black text-[14px] rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Application</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
