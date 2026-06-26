import { useState, useEffect } from 'react'
import { 
  User, Shield, Bell, CreditCard, Lock, Camera, Trash2, 
  CheckCircle2,
  ShieldCheck, Eye, EyeOff, Clock, Monitor, 
  ExternalLink, Mail, AlertCircle,
  Database, FileText, Fingerprint, Smartphone, Landmark,
  Brain, Star, Award
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { marketerApi, accountApi, notificationApi, companyApi } from '../api/client'
import * as Types from '../api/client'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { activityTracker } from '../utils/activityTracker'
import { analyzeCVWithAI, submitPersonalityTest } from '../utils/aiService'

const countries = ['Egypt', 'Saudi Arabia', 'UAE', 'USA', 'UK', 'Germany', 'France']
const timezones = ['Africa/Cairo (UTC+2)', 'Asia/Riyadh (UTC+3)', 'Europe/London (UTC+0)', 'America/New_York (UTC-5)']
const egyptGovernorates = [
  'Cairo', 'Alexandria', 'Giza', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum', 'Gharbia', 
  'Ismailia', 'Menofia', 'Minya', 'Qalyubia', 'New Valley', 'Sharqia', 'Suez', 
  'Aswan', 'Assiut', 'Beni Suef', 'Damietta', 'Kafr El Sheikh', 'Matrouh', 
  'Port Said', 'North Sinai', 'South Sinai', 'Qena', 'Sohag', 'Luxor'
].sort()

export default function Settings() {
  const { avatar, name, email, phone, role, updateProfile } = useAuth()
  
  const roleTabs = [
    { key: 'Account', icon: User, label: role?.toLowerCase() === 'company' ? 'Business Profile' : 'Account' },
    ...(role?.toLowerCase() !== 'company' && role?.toLowerCase() !== 'admin' ? [{ key: 'Growth', icon: Brain, label: 'Growth & personality' }] : []),
    { key: 'Security', icon: Shield, label: 'Security' },
    { key: 'Notifications', icon: Bell, label: 'Notifications' },
    { key: 'Payment', icon: CreditCard, label: 'Payment' },
    { key: 'Privacy', icon: Lock, label: 'Privacy' },
  ]

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('affiliance_active_tab') || 'Account'
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`affiliance_profile_draft_${email}`) || localStorage.getItem('affiliance_profile_draft')
    if (saved) { try { return JSON.parse(saved) } catch {} }
    return {
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      phone: phone || '', city: 'Cairo', bio: '',
      email: email || '', country: 'Egypt', timezone: 'Africa/Cairo (UTC+2)',
      instagram: '', twitter: '', linkedin: '', facebook: '',
      niche: '', skillsExtracted: '', cvPath: '', nationalIdPath: ''
    }
  })

  const [companyProfile, setCompanyProfile] = useState<Types.UpdateCompanyDto>(() => {
    const saved = localStorage.getItem(`affiliance_company_draft_${email}`) || localStorage.getItem('affiliance_company_draft')
    if (saved) { try { return JSON.parse(saved) } catch {} }
    return { campanyName: name || '', address: '', phoneNumber: phone || '', website: '', description: '', contactEmail: email || '' }
  })

  const [testResult, setTestResult] = useState<Types.PersonalityTestResultDto | null>(null)
  const [isTakingTest, setIsTakingTest] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const saved = localStorage.getItem(`affiliance_test_progress_${email}`) || localStorage.getItem('affiliance_test_progress')
    return saved ? parseInt(saved) : 0
  })
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem(`affiliance_test_answers_${email}`) || localStorage.getItem('affiliance_test_answers')
    if (saved) { try { return JSON.parse(saved) } catch {} }
    return {}
  })

  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [showAiReview, setShowAiReview] = useState(false)

  const [privacyVisibility, setPrivacyVisibility] = useState(() => {
    const saved = localStorage.getItem(`affiliance_privacy_visibility_${email}`) || localStorage.getItem('affiliance_privacy_visibility')
    if (saved) { try { return JSON.parse(saved) } catch {} }
    return { public: true, earnings: true, campaigns: true, dms: true }
  })

  const [payoutPrefs, setPayoutPrefs] = useState(() => {
    const saved = localStorage.getItem(`affiliance_payout_prefs_${email}`) || localStorage.getItem('affiliance_payout_prefs')
    if (saved) { try { return JSON.parse(saved) } catch {} }
    return { minAmount: '$100.00', frequency: 'Monthly (Last Day)', automatic: true }
  })

  useEffect(() => { localStorage.setItem('affiliance_active_tab', activeTab) }, [activeTab])
  useEffect(() => { if (email) localStorage.setItem(`affiliance_payout_prefs_${email}`, JSON.stringify(payoutPrefs)) }, [payoutPrefs, email])
  useEffect(() => { if (email) localStorage.setItem(`affiliance_privacy_visibility_${email}`, JSON.stringify(privacyVisibility)) }, [privacyVisibility, email])
  useEffect(() => { if (email) localStorage.setItem(`affiliance_profile_draft_${email}`, JSON.stringify(profile)) }, [profile, email])
  useEffect(() => { if (email) localStorage.setItem(`affiliance_company_draft_${email}`, JSON.stringify(companyProfile)) }, [companyProfile, email])
  useEffect(() => {
    if (email) {
      localStorage.setItem(`affiliance_test_answers_${email}`, JSON.stringify(testAnswers))
      localStorage.setItem(`affiliance_test_progress_${email}`, String(currentQuestion))
    }
  }, [testAnswers, currentQuestion, email])

  const questions = [
    { id: 1, text: "I prefer working alone rather than in a team." },
    { id: 2, text: "I enjoy taking risks when it comes to campaign strategies." },
    { id: 3, text: "I am highly organized and follow a strict schedule." },
    { id: 4, text: "I find it easy to connect with new people and brands." },
    { id: 5, text: "I prefer detailed analytics over creative concepts." },
    { id: 6, text: "I am comfortable handling high-pressure deadlines." },
    { id: 7, text: "I prioritize long-term brand relationships over quick wins." },
    { id: 8, text: "I enjoy learning new marketing tools and platforms." },
    { id: 9, text: "I am confident in my ability to negotiate better deals." },
    { id: 10, text: "I think visual aesthetics are the most important part of a campaign." },
    { id: 11, text: "I can adapt quickly when a campaign goal changes at the last minute." },
    { id: 12, text: "I prefer to follow a proven marketing playbook rather than experimenting." },
    { id: 13, text: "I enjoy mentoring others and sharing my marketing knowledge." },
    { id: 14, text: "I find it easier to focus on tasks when I have a lot of structure." },
    { id: 15, text: "I feel energized by brainstorming new campaign ideas." },
    { id: 16, text: "I like to set ambitious goals and pursue them aggressively." },
    { id: 17, text: "I pay close attention to how my target audience responds to content." },
    { id: 18, text: "I prefer spending time on practical execution rather than planning." },
    { id: 19, text: "I enjoy finding creative ways to solve marketing challenges." },
    { id: 20, text: "I trust my intuition when choosing influencer partnerships." },
    { id: 21, text: "I am comfortable navigating complex stakeholder requirements." },
    { id: 22, text: "I prefer wide-reaching campaigns over highly targeted ones." },
    { id: 23, text: "I am motivated by performance metrics and clear KPIs." },
    { id: 24, text: "I prefer a relaxed work environment with less pressure." },
    { id: 25, text: "I enjoy taking responsibility for difficult decisions." },
    { id: 26, text: "I usually plan my week in advance and stick to it." },
    { id: 27, text: "I am excited by campaigns that require inventing new formats." },
    { id: 28, text: "I prefer consistent routines over sudden schedule changes." },
    { id: 29, text: "I like to review campaign performance data thoroughly." },
    { id: 30, text: "I often take the lead when coordinating with brands and partners." },
    { id: 31, text: "I appreciate clear guidelines more than vague creative freedom." },
    { id: 32, text: "I enjoy working with people who have different styles than mine." },
    { id: 33, text: "I find it easy to stay calm under tight delivery deadlines." },
    { id: 34, text: "I prefer following through on a few strong ideas instead of many small ones." },
    { id: 35, text: "I enjoy collecting feedback to improve my campaigns." },
    { id: 36, text: "I feel driven to achieve more than expected in every campaign." },
    { id: 37, text: "I prefer trusting data over gut instinct when making decisions." },
    { id: 38, text: "I am quick to start projects even if the plan is not perfect." },
    { id: 39, text: "I enjoy collaborating with creative teams on campaign direction." },
    { id: 40, text: "I am energized when I see a campaign deliver strong results." }
  ]

  useEffect(() => {
    if (name || email || phone) {
      setProfile((prev: any) => ({
        ...prev,
        firstName: prev.firstName || name?.split(' ')[0] || '',
        lastName: prev.lastName || name?.split(' ').slice(1).join(' ') || '',
        fullName: name || prev.fullName || '',
        email:    email || prev.email || '',
        phone:    phone || prev.phone || ''
      }))
    }
  }, [name, email, phone])

  useEffect(() => {
    if (name || email || phone) {
      setCompanyProfile((prev: any) => ({
        ...prev,
        campanyName: prev.campanyName || name || '',
        contactEmail: email || prev.contactEmail || '',
        phoneNumber: prev.phoneNumber || phone || ''
      }))
    }
  }, [name, email, phone])

  const [notifs, setNotifs] = useState(() => {
    const saved = localStorage.getItem(`affiliance_notifs_draft_${email}`) || localStorage.getItem('affiliance_notifs_draft')
    if (saved) { try { return JSON.parse(saved) } catch {} }
    return {
      campaigns: { email: true, push: true }, 
      updates: { email: true, push: false },
      earnings: { email: true, push: true }, 
      payments: { email: true, push: true }, // New section for WithdrawalStatus
      messages: { email: true, push: true },
      marketing: { email: false, push: false },
      quietHours: { enabled: false, start: '22:00', end: '08:00' }
    }
  })

  useEffect(() => { if (email) localStorage.setItem(`affiliance_notifs_draft_${email}`, JSON.stringify(notifs)) }, [notifs, email])

  const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: (val: boolean) => void }) => (
    <button onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${enabled ? 'bg-green-500' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${enabled ? 'left-7' : 'left-1'}`} />
    </button>
  )

  useEffect(() => {
    async function load() {
      try {
        if (role?.toLowerCase() !== 'company') {
          const mProfile = await marketerApi.getmyprofile().catch(() => null)
          if (mProfile) {
            let social = { instagram: '', twitter: '', linkedin: '', facebook: '' }
            if (mProfile.socialLinks) { try { social = JSON.parse(mProfile.socialLinks) } catch {} }
            const serverFirstName = mProfile.firstName || (mProfile as any).fullName?.split(' ')[0] || ''
            const serverLastName = mProfile.lastName || (mProfile as any).fullName?.split(' ').slice(1).join(' ') || ''
            setProfile((prev: any) => ({
              ...prev,
              firstName: serverFirstName || prev.firstName || '',
              lastName: serverLastName || prev.lastName || '',
              phone: (mProfile as any).phoneNumber || prev.phone || '',
              bio: mProfile.bio ?? prev.bio ?? '',
              niche: mProfile.niche ?? prev.niche ?? '',
              skillsExtracted: mProfile.skillsExtracted ?? prev.skillsExtracted ?? '',
              cvPath: mProfile.cvPath ?? prev.cvPath ?? '',
              nationalIdPath: mProfile.nationalIdPath ?? prev.nationalIdPath ?? '',
              instagram: social.instagram ?? prev.instagram ?? '',
              twitter: social.twitter ?? prev.twitter ?? '',
              linkedin: social.linkedin ?? prev.linkedin ?? '',
              facebook: social.facebook ?? prev.facebook ?? ''
            }))
          }
          const test = await marketerApi.getmypersonalitytest().catch((err: any) => {
            if (typeof err?.message === 'string' && err.message.includes('Personality test not completed')) {
              return null
            }
            console.error('Personality test fetch failed:', err)
            return null
          })
          if (test) setTestResult(test)
        } else if (role?.toLowerCase() === 'company') {
          const cProfile = await companyApi.getmyprofile().catch(() => null)
          if (cProfile) {
            setCompanyProfile((prev: any) => ({
              ...prev,
              campanyName: cProfile.campanyName || prev.campanyName || '',
              address: cProfile.address ?? prev.address ?? '',
              phoneNumber: cProfile.phoneNumber || prev.phoneNumber || '',
              website: cProfile.website ?? prev.website ?? '',
              description: cProfile.description ?? prev.description ?? '',
              contactEmail: cProfile.contactEmail || prev.contactEmail || ''
            }))
          }
        }
        const prefs = await notificationApi.getpreferences().catch(() => null)
        if (prefs) {
          const loadedNotifs = { ...notifs }
          
          // Map backend preferences to UI state
          if (Array.isArray(prefs)) {
            prefs.forEach(p => {
              if (p.notificationType === 'CampaignUpdate') loadedNotifs.campaigns = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'System') loadedNotifs.updates = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'NewEarning') loadedNotifs.earnings = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'WithdrawalStatus') loadedNotifs.payments = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'Custom') loadedNotifs.messages = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
            })
          } else if ((prefs as any).data && Array.isArray((prefs as any).data)) {
            (prefs as any).data.forEach((p: any) => {
              if (p.notificationType === 'CampaignUpdate') loadedNotifs.campaigns = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'System') loadedNotifs.updates = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'NewEarning') loadedNotifs.earnings = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'WithdrawalStatus') loadedNotifs.payments = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
              if (p.notificationType === 'Custom') loadedNotifs.messages = { email: !!p.isEmailEnabled, push: !!p.isPushEnabled }
            })
          }

          // Handle Quiet Hours
          const data = (prefs as any).data || prefs
          setNotifs((prev: any) => ({
            ...loadedNotifs,
            quietHours: {
              enabled: data.quietHoursEnabled ?? prev.quietHours.enabled,
              start: data.quietHoursStart ?? prev.quietHours.start,
              end: data.quietHoursEnd ?? prev.quietHours.end,
            }
          }))
        }
      } catch (err) { console.error('Failed to load settings:', err) }
    }
    load()
  }, [role])

  const handleSaveBasic = async () => {
    setLoading(true)
    try {
      if (role?.toLowerCase() !== 'company') {
        // ✅ إرسال كل حقل على حدة للـ backend لضمان الحفظ
        await Promise.all([
          marketerApi.putmyprofile({
            bio: profile.bio,
            niche: profile.niche,
            socialLinks: JSON.stringify({
              instagram: profile.instagram,
              twitter: profile.twitter,
              linkedin: profile.linkedin,
              facebook: profile.facebook
            }),
            skillsExtracted: profile.skillsExtracted
          }),
          // إرسال الـ bio و niche و skills بشكل منفصل كذلك (endpoints إضافية)
          profile.bio ? marketerApi.putmybio(profile.bio).catch(() => null) : Promise.resolve(),
          profile.niche ? marketerApi.putmyniche(profile.niche).catch(() => null) : Promise.resolve(),
          profile.skillsExtracted ? marketerApi.putmyskills(profile.skillsExtracted).catch(() => null) : Promise.resolve(),
          marketerApi.putmysociallinks(JSON.stringify({
            instagram: profile.instagram,
            twitter: profile.twitter,
            linkedin: profile.linkedin,
            facebook: profile.facebook
          })).catch(() => null),
        ])
        // ✅ تحديث AuthContext بالاسم والتليفون — يحفظهم في localStorage تلقائياً
        await updateProfile({ name: `${profile.firstName} ${profile.lastName}`.trim(), phone: profile.phone })
      } else if (role?.toLowerCase() === 'company') {
        await companyApi.putmyprofile({
          campanyName: companyProfile.campanyName,
          address: companyProfile.address,
          phoneNumber: companyProfile.phoneNumber,
          website: companyProfile.website,
          description: companyProfile.description,
          contactEmail: companyProfile.contactEmail
        })
        await updateProfile({ name: companyProfile.campanyName || '', phone: companyProfile.phoneNumber || '' })
      }
      toast.success('Profile updated successfully!')
      activityTracker.addActivity({ description: 'Updated profile information', type: 'system' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally { setLoading(false) }
  }

  const handleSubmitTest = async () => {
    if (Object.keys(testAnswers).length < questions.length) { toast.error('Please answer all questions first'); return }
    setLoading(true)
    try {
      const res = await submitPersonalityTest(testAnswers)
      setTestResult(res)
      setIsTakingTest(false)
      toast.success('Test submitted successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit test')
    } finally { setLoading(false) }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    try {
      // Map UI state to Backend NotificationTypes
      const internalMapping: Record<string, Types.NotificationType[]> = {
        campaigns: ['CampaignUpdate'],
        updates: ['System'],
        earnings: ['NewEarning'],
        payments: ['WithdrawalStatus'],
        messages: ['System'], // Using System instead of Custom if Custom is not available
      }

      const promises: Promise<any>[] = []
      
      // Update each type based on its UI category
      Object.entries(internalMapping).forEach(([uiKey, types]) => {
        const uiData = (notifs as any)[uiKey]
        types.forEach(type => {
          promises.push(notificationApi.putpreferences({
            notificationType: type,
            isEmailEnabled: uiData.email,
            isPushEnabled: uiData.push,
            isInAppEnabled: true
          }))
        })
      })

      // Handle Quiet Hours if backend supports it (the audit showed it returns it in getpreferences)
      // Since putpreferences doesn't strictly take quiet hours in the DTO I saw, 
      // but maybe there's a separate endpoint or it's part of a general update?
      // Actually, looking at the audit, getpreferences returns quiet hours.
      // If there's no setquietours endpoint, we'll stick to types for now.

      await Promise.all(promises)
      toast.success('Notification preferences updated!')
      activityTracker.addActivity({ description: 'Updated notification preferences', type: 'system' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notifications')
    } finally { setLoading(false) }
  }

  const inputGroupClass = "space-y-2"
  const labelClass = "text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1"
  const inputClass = "w-full border border-gray-100 bg-slate-50 rounded-2xl px-6 py-4 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all placeholder:text-gray-300"
  const cardClass = "bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 p-6 md:p-10 shadow-sm"

  return (
    <div className="max-w-[1000px] mx-auto pb-20">
      <div className="mb-10 px-4 md:px-0 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-[28px] md:text-[32px] font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-gray-400 font-medium text-[14px] md:text-[15px] mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100/40 p-1.5 rounded-[24px] w-full md:w-fit mb-12 animate-in fade-in slide-in-from-left-4 duration-500 delay-100 border border-slate-200/50 backdrop-blur-sm overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {roleTabs.map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-3 px-6 md:px-8 py-3.5 rounded-[20px] text-[13px] font-black transition-all duration-300 flex-shrink-0 ${
              activeTab === tab.key ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 scale-[1.02]' : 'text-gray-400 hover:text-slate-600 hover:bg-slate-200/30'}`}>
            <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.key ? 'text-[#1E3A8A]' : 'text-gray-300'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        {activeTab === 'Account' && (
          <>
            {/* Profile Picture */}
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">{role?.toLowerCase() === 'company' ? 'Company Logo' : 'Profile Picture'}</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 text-center md:text-left">
                <div className="relative group shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-[120px] h-[120px] rounded-[40px] object-cover ring-4 ring-slate-50 shadow-xl transition-transform group-hover:scale-[1.02]" />
                  ) : (
                    <div className="w-[120px] h-[120px] rounded-[40px] bg-[#FBBF24] flex items-center justify-center text-[40px] font-black text-white shadow-xl">
                      {role?.toLowerCase() === 'company' ? (companyProfile.campanyName?.[0] || 'C') : (profile.fullName.split(' ').map((n: string) => n[0]).join('') || 'U')}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1E3A8A] border-4 border-white text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#152C6E] hover:scale-110 transition-all">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        e.target.value = ''
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const img = new Image()
                          img.onload = () => {
                            const canvas = document.createElement('canvas')
                            const MAX = 128; let w = img.width, h = img.height
                            if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX } } else { if (h > MAX) { w *= MAX/h; h = MAX } }
                            canvas.width = w; canvas.height = h
                            canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
                            updateProfile({ avatar: dataUrl, avatarFile: file })
                            toast.success(`${role?.toLowerCase() === 'company' ? 'Logo' : 'Picture'} updated!`)
                          }
                          img.src = reader.result as string
                        }
                        reader.readAsDataURL(file)
                      }
                    }} />
                  </label>
                </div>
                <div className="space-y-4">
                  <p className="text-[14px] text-gray-500 font-medium max-w-[240px] md:max-w-[200px] leading-relaxed mx-auto md:mx-0">
                    Upload your brand {role?.toLowerCase() === 'company' ? 'logo' : 'identity'}. Recommended size is 256x256px.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <label className="px-6 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-900 text-[13px] font-black hover:bg-white hover:border-blue-200 transition-all cursor-pointer">
                      Upload Photo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          e.target.value = ''
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            const img = new Image()
                            img.onload = () => {
                              const canvas = document.createElement('canvas')
                              const MAX = 128; let w = img.width, h = img.height
                              if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX } } else { if (h > MAX) { w *= MAX/h; h = MAX } }
                              canvas.width = w; canvas.height = h
                              canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
                              updateProfile({ avatar: canvas.toDataURL('image/jpeg', 0.6), avatarFile: file })
                              toast.success('Updated successfully')
                            }
                            img.src = reader.result as string
                          }
                          reader.readAsDataURL(file)
                        }
                      }} />
                    </label>
                    <button onClick={() => { updateProfile({ avatar: '' }); toast.success('Removed successfully') }}
                      className="w-11 h-11 rounded-xl border border-red-50 text-red-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">{role?.toLowerCase() === 'company' ? 'Company Details' : 'Basic Information'}</h3>
              
              {role?.toLowerCase() === 'company' ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className={inputGroupClass}><label className={labelClass}>Company Name</label><input value={companyProfile.campanyName || ''} onChange={e => setCompanyProfile({...companyProfile, campanyName: e.target.value})} className={inputClass} placeholder="Affiliance AI" /></div>
                  <div className={inputGroupClass}><label className={labelClass}>Contact Email</label><input value={companyProfile.contactEmail || ''} onChange={e => setCompanyProfile({...companyProfile, contactEmail: e.target.value})} className={inputClass} placeholder="contact@company.com" /></div>
                  <div className={inputGroupClass}><label className={labelClass}>Website URL</label><input value={companyProfile.website || ''} onChange={e => setCompanyProfile({...companyProfile, website: e.target.value})} className={inputClass} placeholder="https://example.com" /></div>
                  <div className={inputGroupClass}><label className={labelClass}>Phone Number</label><input value={companyProfile.phoneNumber || ''} onChange={e => setCompanyProfile({...companyProfile, phoneNumber: e.target.value})} className={inputClass} placeholder="+20 123 456 7890" /></div>
                  <div className={inputGroupClass + " md:col-span-2"}><label className={labelClass}>Office Address</label><input value={companyProfile.address || ''} onChange={e => setCompanyProfile({...companyProfile, address: e.target.value})} className={inputClass} placeholder="123 Business St, Cairo, Egypt" /></div>
                  <div className={inputGroupClass + " md:col-span-2"}><label className={labelClass}>Company Description</label><textarea value={companyProfile.description || ''} onChange={e => setCompanyProfile({...companyProfile, description: e.target.value})} rows={4} className={inputClass + " resize-none py-6"} placeholder="About your company..." /></div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className={inputGroupClass}>
                    <label className={labelClass}>First Name</label>
                    <input value={profile.firstName || ''} onChange={e => setProfile({...profile, firstName: e.target.value})} className={inputClass} placeholder="Ahmed" />
                  </div>
                  <div className={inputGroupClass}>
                    <label className={labelClass}>Last Name</label>
                    <input value={profile.lastName || ''} onChange={e => setProfile({...profile, lastName: e.target.value})} className={inputClass} placeholder="Hassan" />
                  </div>
                  <div className={inputGroupClass}>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <input disabled value={profile.email || ''} className={inputClass + " opacity-60 bg-slate-100 cursor-not-allowed pr-28"} />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                      </div>
                    </div>
                  </div>
                  <div className={inputGroupClass}><label className={labelClass}>Phone Number</label><input value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className={inputClass} /></div>
                  <div className={inputGroupClass}><label className={labelClass}>Country</label><select value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})} className={inputClass + " appearance-none"}>{countries.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className={inputGroupClass}>
                    <label className={labelClass}>City / Governorate</label>
                    <select value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} className={inputClass + " appearance-none"}>
                      <option value="">Select Governorate</option>
                      {egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className={inputGroupClass}><label className={labelClass}>Timezone</label><select value={profile.timezone} onChange={e => setProfile({...profile, timezone: e.target.value})} className={inputClass + " appearance-none"}>{timezones.map((t: string) => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className={inputGroupClass + " md:col-span-2"}>
                    <label className={labelClass}>Bio & Experience</label>
                    <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={4} className={inputClass + " resize-none py-6"} placeholder="Tell brands why they should work with you..." />
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[11px] text-gray-300 font-bold uppercase tracking-widest leading-none">Min 20 characters recommended</p>
                      <p className="text-[11px] text-gray-400 font-black">{profile.bio.length}/500</p>
                    </div>
                  </div>
                  <div className={inputGroupClass + " md:col-span-2"}><label className={labelClass}>Top Niches (comma separated)</label><input value={profile.niche} onChange={e => setProfile({...profile, niche: e.target.value})} className={inputClass} placeholder="e.g. Technology, Fashion, Finance" /></div>
                  <div className={inputGroupClass + " md:col-span-2"}><label className={labelClass}>Skills (comma separated)</label><input value={profile.skillsExtracted} onChange={e => setProfile({...profile, skillsExtracted: e.target.value})} className={inputClass} placeholder="e.g. Content Creation, SEO, Social Media Marketing" /></div>

                  {/* ✅ AI Suggestions Card */}
                  {showAiReview && aiSuggestions && (
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-[32px] p-8 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Brain className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="text-[18px] font-black text-slate-900">AI Profile Suggestions</h4>
                            <p className="text-sm text-slate-500 font-medium">Review and apply extracted information from your CV</p>
                          </div>
                        </div>
                        <button onClick={() => setShowAiReview(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {aiSuggestions.fullName && (
                          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Full Name</span>
                            <p className="text-[15px] font-bold text-slate-800">{aiSuggestions.fullName}</p>
                          </div>
                        )}
                        {aiSuggestions.niche && (
                          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Suggested Niches</span>
                            <p className="text-[15px] font-bold text-slate-800">{aiSuggestions.niche}</p>
                          </div>
                        )}
                        {aiSuggestions.bio && (
                          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 md:col-span-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Generated Bio</span>
                            <p className="text-[14px] font-medium text-slate-700 leading-relaxed italic">"{aiSuggestions.bio}"</p>
                          </div>
                        )}
                        {aiSuggestions.skills && (
                          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 md:col-span-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Extracted Skills</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aiSuggestions.skills.split(',').map((skill: string) => (
                                <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-lg uppercase tracking-wider">{skill.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <button onClick={() => {
                          const extractedName = (aiSuggestions.fullName || '').toLowerCase().trim();
                          const profileFirst = (profile.firstName || '').toLowerCase().trim();
                          const profileLast = (profile.lastName || '').toLowerCase().trim();

                          if (profileFirst && profileLast && extractedName) {
                            const hasFirst = extractedName.includes(profileFirst);
                            const hasLast = extractedName.includes(profileLast);
                            
                            if (!hasFirst || !hasLast) {
                              toast.error("Name Conflict: The name extracted from the CV does not match your profile name. Please update your CV or Profile correctly.", { 
                                duration: 6000,
                                id: 'name-conflict'
                              });
                              return;
                            }
                          }

                          setProfile((prev: any) => ({
                            ...prev,
                            firstName: aiSuggestions.fullName?.split(' ')[0] || prev.firstName,
                            lastName: aiSuggestions.fullName?.split(' ').slice(1).join(' ') || prev.lastName,
                            bio: aiSuggestions.bio || prev.bio,
                            niche: aiSuggestions.niche || prev.niche,
                            skillsExtracted: aiSuggestions.skills || prev.skillsExtracted
                          }))
                          setShowAiReview(false)
                          toast.success('Profile updated with AI suggestions!')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[13px] hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Apply All Suggestions
                        </button>
                        <button onClick={() => setShowAiReview(false)} className="px-8 py-3.5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-[13px] hover:bg-slate-50 transition-all">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ✅ Verification Documents */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-[14px] font-black text-slate-900 border-b border-slate-100 pb-2 mb-4">Verification Documents</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* CV Upload */}
                      <div className="p-5 border border-slate-100 rounded-2xl bg-white flex flex-col items-center justify-center text-center">
                        <FileText className="w-8 h-8 text-[#1E3A8A] mb-3" />
                        <h5 className="font-bold text-slate-900 mb-1">Resume / CV</h5>
                        <p className="text-xs text-gray-400 mb-4">{profile.cvPath ? 'Uploaded' : 'No CV uploaded yet'}</p>
                        <label className={`text-sm font-black text-[#1E3A8A] bg-blue-50 px-5 py-2 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors ${isAnalyzingCV ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isAnalyzingCV ? 'AI Analyzing...' : (profile.cvPath ? 'Replace CV' : 'Upload CV')}
                          <input type="file" className="hidden" accept=".pdf" disabled={isAnalyzingCV}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              e.target.value = ''
                              // Clear old AI suggestions and review state
                              setAiSuggestions(null)
                              setShowAiReview(false)
                              toast.loading('Uploading CV...', { id: 'cv-upload' })
                              try {
                                const formData = new FormData()
                                formData.append('file', file)
                                // ✅ .catch(() => {}) so that if Backend fails, the analysis continues
                                await marketerApi.putmycv(formData).catch(() => {})
                                toast.success('CV uploaded!', { id: 'cv-upload' })
                                setProfile((prev: any) => ({...prev, cvPath: 'uploaded'}))

                                // ✅ AI Analysis
                                setIsAnalyzingCV(true)
                                toast.loading('AI is analyzing your CV...', { id: 'ai-analysis' })
                                try {
                                  const analysis = await analyzeCVWithAI(file)
                                  setAiSuggestions(analysis)
                                  setShowAiReview(true)
                                  toast.success('AI Analysis complete! Review the suggestions below.', { id: 'ai-analysis', duration: 8000 })
                                } catch (aiErr: any) {
                                  toast.error(`AI Analysis failed: ${aiErr?.message || 'Try again'}`, { id: 'ai-analysis' })
                                } finally {
                                  setIsAnalyzingCV(false)
                                }
                              } catch (err) {
                                toast.error('Failed to upload CV', { id: 'cv-upload' })
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* National ID Upload */}
                      <div className="p-5 border border-slate-100 rounded-2xl bg-white flex flex-col items-center justify-center text-center">
                        <Shield className="w-8 h-8 text-emerald-600 mb-3" />
                        <h5 className="font-bold text-slate-900 mb-1">National ID</h5>
                        <p className="text-xs text-gray-400 mb-4">{profile.nationalIdPath ? 'Uploaded' : 'No ID uploaded yet'}</p>
                        <label className="text-sm font-black text-emerald-700 bg-emerald-50 px-5 py-2 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
                          {profile.nationalIdPath ? 'Replace ID' : 'Upload ID'}
                          <input type="file" className="hidden" accept="image/*,.pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              e.target.value = ''
                              toast.loading('Uploading National ID...', { id: 'id-upload' })
                              try {
                                const formData = new FormData()
                                formData.append('file', file)
                                // ✅ .catch(() => {}) so that if Backend fails, it doesn't stop the process
                                await marketerApi.putmynationalid(formData).catch(() => {})
                                toast.success('National ID uploaded!', { id: 'id-upload' })
                                setProfile({...profile, nationalIdPath: 'uploaded'})
                              } catch (err) {
                                toast.error('Failed to upload ID', { id: 'id-upload' })
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-[14px] font-black text-slate-900 border-b border-slate-100 pb-2 mb-4 mt-6">Social Links</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input value={profile.instagram} onChange={e => setProfile({...profile, instagram: e.target.value})} className={inputClass} placeholder="Instagram URL" />
                      <input value={profile.twitter} onChange={e => setProfile({...profile, twitter: e.target.value})} className={inputClass} placeholder="Twitter / X URL" />
                      <input value={profile.linkedin} onChange={e => setProfile({...profile, linkedin: e.target.value})} className={inputClass} placeholder="LinkedIn URL" />
                      <input value={profile.facebook} onChange={e => setProfile({...profile, facebook: e.target.value})} className={inputClass} placeholder="Facebook URL" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex justify-end">
                <button onClick={handleSaveBasic} disabled={loading} className="bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:bg-[#152C6E] active:scale-95 transition-all disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/30 rounded-[32px] border border-red-100/50 p-10 mt-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-[18px] font-black text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-[14px] text-gray-500 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-white border border-red-100 text-red-600 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-red-50 transition-all active:scale-95">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </>
        )}

        {/* Growth Tab */}
        {activeTab === 'Growth' && role?.toLowerCase() !== 'company' && role?.toLowerCase() !== 'admin' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={cardClass}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-[#FBBF24] rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-amber-200">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-[20px] font-black text-slate-900">Career Growth & Personality</h3>
                  <p className="text-[14px] text-gray-400 font-medium">Understand your professional DNA and get matched with better campaigns.</p>
                </div>
              </div>

              {testResult && !isTakingTest ? (
                <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100">
                  <div className="flex flex-col md:flex-row gap-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="w-6 h-6 text-blue-600" />
                        <h4 className="text-[18px] font-black text-[#1E3A8A] tracking-tight">Your Result: {testResult.personalityType || 'The Strategist'}</h4>
                      </div>
                      <p className="text-[14px] text-slate-600 font-medium leading-relaxed mb-6">{testResult.description || "You excel at identifying long-term trends and building authentic relationships."}</p>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">DNA Score</p>
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-[20px] font-black text-slate-900">{testResult.personalityScore || 85}%</span>
                          </div>
                        </div>
                        <div className="w-[1px] h-10 bg-blue-100" />
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Tested</p>
                          <p className="text-[15px] font-bold text-slate-700">{testResult.testDate ? new Date(testResult.testDate).toLocaleDateString() : 'Jan 24, 2025'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                      <button onClick={() => setIsTakingTest(true)} className="px-8 py-3.5 bg-white text-[#1E3A8A] border border-blue-100 rounded-2xl font-black text-[13px] hover:shadow-lg transition-all active:scale-95">Retake Test</button>
                    </div>
                  </div>
                </div>
              ) : isTakingTest ? (
                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Question {currentQuestion + 1} of {questions.length}</span>
                    <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
                    </div>
                  </div>
                  <h4 className="text-[18px] font-bold text-slate-900 mb-10 leading-snug">{questions[currentQuestion].text}</h4>
                  <div className="space-y-3 mb-12">
                    {[{val:1,label:'Strongly Disagree'},{val:2,label:'Disagree'},{val:3,label:'Neutral'},{val:4,label:'Agree'},{val:5,label:'Strongly Agree'}].map((opt) => (
                      <button key={opt.val} onClick={() => {
                        setTestAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: opt.val }))
                        if (currentQuestion < questions.length - 1) setTimeout(() => setCurrentQuestion(prev => prev + 1), 200)
                      }} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${testAnswers[questions[currentQuestion].id] === opt.val ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-300'}`}>
                        <span className="font-bold text-[14px]">{opt.label}</span>
                        {testAnswers[questions[currentQuestion].id] === opt.val && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(prev => prev - 1)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 disabled:opacity-30">Previous</button>
                    {currentQuestion === questions.length - 1 ? (
                      <button onClick={handleSubmitTest} disabled={loading || !testAnswers[questions[currentQuestion].id]} className="px-10 py-3.5 bg-green-600 text-white rounded-2xl font-black text-[13px] hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50">{loading ? 'Submitting...' : 'Finish & See Result'}</button>
                    ) : (
                      <button disabled={!testAnswers[questions[currentQuestion].id]} onClick={() => setCurrentQuestion(prev => prev + 1)} className="px-10 py-3.5 bg-[#1E3A8A] text-white rounded-2xl font-black text-[13px] hover:bg-[#152C6E] transition-all disabled:opacity-50">Next</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-slate-50 border border-slate-100 rounded-[32px] text-center">
                  <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-sm"><Brain className="w-10 h-10 text-blue-500" /></div>
                  <h4 className="text-[22px] font-black text-slate-900 mb-3">Discover Your Marketer Persona</h4>
                  <p className="text-gray-400 text-[14px] font-medium max-w-sm mx-auto mb-10 leading-relaxed">Take our quick 2-minute professional DNA test to help us recommend campaigns that match your style.</p>
                  <button onClick={() => setIsTakingTest(true)} className="px-12 py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:bg-[#152C6E] active:scale-95 transition-all">Start Persona Test</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'Security' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">Change Password</h3>
              <div className="max-w-[400px] space-y-5">
                {[{label:'Current Password',field:'current' as const,placeholder:'Enter current password'},{label:'New Password',field:'new' as const,placeholder:'Enter new password'},{label:'Confirm New Password',field:'confirm' as const,placeholder:'Confirm new password'}].map(({ label, field, placeholder }) => (
                  <div key={field} className={inputGroupClass}>
                    <label className={labelClass}>{label}</label>
                    <div className="relative">
                      <input type={showPasswords[field] ? 'text' : 'password'} value={passwords[field]} onChange={e => setPasswords({...passwords, [field]: e.target.value})}
                        className="w-full border border-gray-100 bg-slate-50/50 rounded-xl px-5 py-3.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all placeholder:text-gray-300" placeholder={placeholder} />
                      <button onClick={() => setShowPasswords({...showPasswords, [field]: !showPasswords[field]})} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-slate-600 transition-colors">
                        {showPasswords[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={async () => {
                  if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match')
                  if (passwords.new.length < 8) return toast.error('Password too short')
                  setLoading(true)
                  try { await accountApi.postChangePassword({ currentPassword: passwords.current, newPassword: passwords.new }); toast.success('Password updated!'); setPasswords({ current: '', new: '', confirm: '' }) }
                  catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
                  finally { setLoading(false) }
                }} disabled={loading} className="bg-[#1E3A8A] text-white px-8 py-3.5 rounded-xl font-black text-[13px] shadow-lg hover:bg-[#152C6E] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />{loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[18px] font-black text-slate-900">Two-Factor Authentication</h3>
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100">Not Enabled</span>
              </div>
              <p className="text-[14px] text-gray-400 font-medium mb-8">Add an extra layer of security to your account</p>
              <button className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold text-[14px] hover:border-blue-200 hover:text-[#1E3A8A] hover:bg-blue-50/30 transition-all">
                <Fingerprint className="w-5 h-5" /> Enable 2FA
              </button>
            </div>
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">Active Sessions</h3>
              <div className="space-y-3">
                {[{device:'Current Device',details:'Cairo, Egypt • Chrome on Windows',status:'Active',icon:Monitor},{device:'iPhone 14 Pro',details:'Cairo, Egypt • Safari on iOS',lastSeen:'2 hours ago',status:'Revoke',icon:Smartphone}].map((session, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100/50 group hover:border-blue-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#1E3A8A] shadow-sm"><session.icon className="w-6 h-6" /></div>
                      <div><p className="text-[14px] font-black text-slate-900">{session.device}</p><p className="text-[12px] text-gray-400 font-medium mt-0.5">{session.details} {(session as any).lastSeen && `• Last active: ${(session as any).lastSeen}`}</p></div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${session.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-white text-red-500 border border-red-50 hover:bg-red-50'}`}>{session.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">Recent Login Activity</h3>
              <div className="space-y-4">
                {[{date:'Jan 16, 2025 - 09:30 AM',loc:'Cairo, Egypt • Chrome on Windows',status:'Success'},{date:'Jan 15, 2025 - 02:15 PM',loc:'Cairo, Egypt • Safari on iOS',status:'Success'},{date:'Jan 14, 2025 - 10:45 AM',loc:'Cairo, Egypt • Chrome on Windows',status:'Success'},{date:'Jan 13, 2025 - 08:20 PM',loc:'Unknown Location • Chrome on Windows',status:'Failed'}].map((activity, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${activity.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div><p className="text-[14px] font-bold text-slate-800">{activity.date}</p><p className="text-[12px] text-gray-400 font-medium mt-0.5">{activity.loc}</p></div>
                    </div>
                    {activity.status === 'Failed' && <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">Failed</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'Notifications' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={cardClass}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center shrink-0"><Mail className="w-6 h-6" /></div>
                <div><h3 className="text-[18px] font-black text-slate-900">Email Notifications</h3><p className="text-[13px] text-gray-400 font-medium">Receive updates and alerts via your email address.</p></div>
              </div>
              <div className="space-y-1">
                {[
                  {id:'campaigns',label:'New Campaign Opportunities',icon:AlertCircle},
                  {id:'updates',label:'Campaign Updates',icon:Clock},
                  {id:'earnings',label:'Earnings & Payments',icon:CreditCard},
                  {id:'payments',label:'Withdrawal Status',icon:CreditCard},
                  {id:'messages',label:'New Messages',icon:Mail},
                  {id:'marketing',label:'Marketing & Promotions',icon:Bell}
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-5 border-b border-gray-50 last:border-0 group">
                    <div className="flex items-center gap-4"><item.icon className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" /><span className="text-[14px] font-bold text-slate-700">{item.label}</span></div>
                    <Toggle enabled={(notifs as any)[item.id].email} onChange={(val) => setNotifs({...notifs, [item.id]: { ...(notifs as any)[item.id], email: val }})} />
                  </div>
                ))}
              </div>
            </div>
            <div className={cardClass}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0"><Smartphone className="w-6 h-6" /></div>
                <div><h3 className="text-[18px] font-black text-slate-900">Push Notifications</h3><p className="text-[13px] text-gray-400 font-medium">Receive real-time alerts on your browser or mobile device.</p></div>
              </div>
              <div className="space-y-1">
                {[
                  {id:'campaigns',label:'New Campaign Opportunities',icon:AlertCircle},
                  {id:'updates',label:'Campaign Updates',icon:Clock},
                  {id:'earnings',label:'Earnings & Payments',icon:CreditCard},
                  {id:'payments',label:'Withdrawal Status',icon:CreditCard},
                  {id:'messages',label:'New Messages',icon:Mail}
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-5 border-b border-gray-50 last:border-0 group">
                    <div className="flex items-center gap-4"><item.icon className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" /><span className="text-[14px] font-bold text-slate-700">{item.label}</span></div>
                    <Toggle enabled={(notifs as any)[item.id].push} onChange={(val) => setNotifs({...notifs, [item.id]: { ...(notifs as any)[item.id], push: val }})} />
                  </div>
                ))}
              </div>
            </div>
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0"><Clock className="w-6 h-6" /></div>
                  <div><h3 className="text-[18px] font-black text-slate-900">Quiet Hours</h3><p className="text-[13px] text-gray-400 font-medium">Automatically mute notifications during specific times.</p></div>
                </div>
                <Toggle enabled={notifs.quietHours.enabled} onChange={(val) => setNotifs({...notifs, quietHours: { ...notifs.quietHours, enabled: val }})} />
              </div>
              <div className={`grid grid-cols-2 gap-6 transition-all duration-500 ${notifs.quietHours.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                <div className={inputGroupClass}><label className={labelClass}>Start Time</label><select value={notifs.quietHours.start} onChange={e => setNotifs({...notifs, quietHours: { ...notifs.quietHours, start: e.target.value }})} className={inputClass + " appearance-none"}>{Array.from({ length: 24 }).map((_, i) => <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{String(i).padStart(2,'0')}:00</option>)}</select></div>
                <div className={inputGroupClass}><label className={labelClass}>End Time</label><select value={notifs.quietHours.end} onChange={e => setNotifs({...notifs, quietHours: { ...notifs.quietHours, end: e.target.value }})} className={inputClass + " appearance-none"}>{Array.from({ length: 24 }).map((_, i) => <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{String(i).padStart(2,'0')}:00</option>)}</select></div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleSaveNotifications} disabled={loading} className="bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:bg-[#152C6E] active:scale-95 transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save Preferences'}</button>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'Payment' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#152C6E] rounded-[24px] md:rounded-[32px] p-6 md:p-10 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md"><CreditCard className="w-5 h-5 text-white" /></div><h3 className="text-[20px] font-black tracking-tight">Payment Methods</h3></div>
                  <p className="text-blue-100/70 text-[14px] font-medium leading-relaxed max-w-[400px]">Manage your bank accounts, mobile wallets, and payout methods.</p>
                </div>
                <button onClick={() => navigate('/profile', { state: { activeTab: 'payments' } })} className="bg-white text-[#1E3A8A] px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group shadow-xl active:scale-95">
                  Manage Methods <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-10"><Landmark className="w-80 h-80" /></div>
            </div>
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">Payout Preferences</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className={inputGroupClass}><label className={labelClass}>Minimum Payout Amount</label><select value={payoutPrefs.minAmount} onChange={e => setPayoutPrefs({ ...payoutPrefs, minAmount: e.target.value })} className={inputClass + " appearance-none"}><option>$50.00 (Minimum)</option><option>$100.00</option><option>$250.00</option><option>$500.00</option></select></div>
                <div className={inputGroupClass}><label className={labelClass}>Payout Frequency</label><select value={payoutPrefs.frequency} onChange={e => setPayoutPrefs({ ...payoutPrefs, frequency: e.target.value })} className={inputClass + " appearance-none"}><option>Weekly (Every Monday)</option><option>Bi-Weekly (1st & 15th)</option><option>Monthly (Last Day)</option></select></div>
                <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-[24px] bg-slate-50/50 border border-slate-100 mt-2">
                  <div className="flex items-center gap-4"><div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0"><Clock className="w-6 h-6" /></div><div><p className="text-[15px] font-black text-slate-900">Automatic Payouts</p><p className="text-[12px] text-gray-400 font-medium">Funds will be sent automatically when balance reaches minimum.</p></div></div>
                  <Toggle enabled={payoutPrefs.automatic} onChange={(val) => { setPayoutPrefs({ ...payoutPrefs, automatic: val }); toast.success(`Automatic Payouts ${val ? 'enabled' : 'disabled'}`) }} />
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <button onClick={() => { toast.promise(new Promise(resolve => setTimeout(resolve, 800)), { loading: 'Saving...', success: 'Saved!', error: 'Failed' }) }} className="bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-[#152C6E] active:scale-95 transition-all">Save Preferences</button>
              </div>
            </div>
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-10">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0"><Shield className="w-6 h-6" /></div>
                <div>
                  <div className="flex items-center gap-3"><h3 className="text-[18px] font-black text-slate-900">Tax Information</h3><span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Required</span></div>
                  <p className="text-[13px] text-gray-400 font-medium mt-1">Please provide your tax details to ensure timely payments.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className={inputGroupClass}><label className={labelClass}>Tax ID / National ID</label><input className={inputClass} placeholder="Enter your ID number" /></div>
                <div className={inputGroupClass}><label className={labelClass}>Tax Residency Country</label><select className={inputClass + " appearance-none"}>{countries.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-[20px] p-6 mt-10"><p className="text-[12px] text-amber-700 font-semibold leading-relaxed">Important: Tax information must match the legal owner of the account.</p></div>
              <div className="mt-10 flex justify-end"><button className="bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-[#152C6E] active:scale-95 transition-all">Update Tax Info</button></div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'Privacy' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">Profile Visibility</h3>
              <div className="space-y-2">
                {[{id:'public',label:'Public Profile',desc:'Allow anyone to see your profile and performance score.'},{id:'earnings',label:'Show Earnings',desc:'Display your total earnings on your public profile.'},{id:'campaigns',label:'Show Active Campaigns',desc:'List your currently joined campaigns publicly.'},{id:'dms',label:'Allow Direct Messages',desc:'Enable brands to contact you directly via chat.'}].map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-gray-50 last:border-0">
                    <div className="space-y-1"><p className="text-[15px] font-black text-slate-900">{item.label}</p><p className="text-[13px] text-gray-400 font-medium">{item.desc}</p></div>
                    <Toggle enabled={(privacyVisibility as any)[item.id]} onChange={(val) => { setPrivacyVisibility({ ...privacyVisibility, [item.id]: val }); toast.success(`${item.label} ${val ? 'enabled' : 'disabled'}`) }} />
                  </div>
                ))}
              </div>
            </div>
            <div className={cardClass}>
              <h3 className="text-[18px] font-black text-slate-900 mb-8">Data & Privacy</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[{label:'Download My Data',icon:Database,desc:'Get a copy of your info.'},{label:'Privacy Policy',icon:FileText,desc:'Read our terms of service.'},{label:'Data Protection',icon:Fingerprint,desc:'How we secure your data.'}].map((item, i) => (
                  <button key={i} className="flex flex-col items-start p-8 rounded-[28px] bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all group text-left">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform"><item.icon className="w-5 h-5 text-[#1E3A8A]" /></div>
                    <p className="text-[15px] font-black text-slate-900 mb-1">{item.label}</p><p className="text-[12px] text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className={cardClass}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6" /></div>
                <div><h3 className="text-[18px] font-black text-slate-900">Cookie Preferences</h3><p className="text-[13px] text-gray-400 font-medium">Manage how we use cookies to improve your experience.</p></div>
              </div>
              <div className="space-y-2">
                {[{label:'Essential Cookies',desc:'Required for the website to function properly.',essential:true},{label:'Analytics Cookies',desc:'Help us understand how visitors interact with the website.',essential:false},{label:'Marketing Cookies',desc:'Used to track visitors across websites to display relevant ads.',essential:false}].map((cookie, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-gray-50 last:border-0">
                    <div className="space-y-1"><p className="text-[15px] font-black text-slate-900">{cookie.label}</p><p className="text-[13px] text-gray-400 font-medium">{cookie.desc}</p></div>
                    {cookie.essential ? <div className="px-4 py-1.5 bg-slate-100 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full">Always On</div> : <Toggle enabled={i === 1} onChange={() => {}} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
