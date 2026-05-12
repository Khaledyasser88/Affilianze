import { useState } from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { complaintApi } from '../../api/client'
import { toast } from 'react-hot-toast'
import Modal from '../Common/Modal'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (notif: any) => void
  campaignId?: number
  defendantId?: number
}

export default function SupportModal({ isOpen, onClose, onSuccess, campaignId, defendantId }: SupportModalProps) {
  const [loading, setLoading] = useState(false)
  const [isCustomSubject, setIsCustomSubject] = useState(false)
  const [form, setForm] = useState({
    subject: 'Payment Issue',
    description: ''
  })

  const SUBJECT_OPTIONS = [
    'Payment Issue',
    'Campaign Issue',
    'Technical Support',
    'Account Verification',
    'Report User/Activity',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject || !form.description) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const payload: any = { ...form }
      if (campaignId) payload.campaignId = campaignId
      payload.defendantId = defendantId || 1 // Fallback to Admin ID 1 for general support

      await complaintApi.post(payload)
      
      const newNotif = {
        id: Date.now(),
        title: 'Complaint Submitted',
        message: `Your report about "${form.subject}" has been successfully received and sent to the administration.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'System'
      }

      // Persist locally
      const existing = JSON.parse(localStorage.getItem('local_notifications') || '[]')
      const updated = [newNotif, ...existing].slice(0, 10)
      localStorage.setItem('local_notifications', JSON.stringify(updated))

      if (onSuccess) {
        onSuccess(newNotif)
      }

      toast.success('Your report has been submitted. Our team will review it shortly.')
      setForm({ subject: '', description: '' })
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report a Problem">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-[12px] text-amber-800 font-medium leading-relaxed">
            Please provide as much detail as possible. Our support team typically responds within 24-48 hours.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="block text-[12px] font-black text-slate-900 uppercase tracking-widest">Subject</label>
            <select
              value={isCustomSubject ? 'Other' : (SUBJECT_OPTIONS.includes(form.subject) ? form.subject : 'Other')}
              onChange={e => {
                if (e.target.value === 'Other') {
                  setIsCustomSubject(true)
                  setForm({ ...form, subject: '' })
                } else {
                  setIsCustomSubject(false)
                  setForm({ ...form, subject: e.target.value })
                }
              }}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-[14px] focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="" disabled>Select a subject...</option>
              {SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === 'Other' ? 'Other (Write your own)' : opt}</option>)}
            </select>
            
            {isCustomSubject && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <input 
                  type="text" 
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Type your specific subject here..."
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[14px] focus:border-[#1E3A8A]/30 focus:ring-4 focus:ring-[#1E3A8A]/5 outline-none transition-all font-medium shadow-sm placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-black text-slate-900 uppercase tracking-widest mb-2">Detailed Description</label>
            <textarea 
              rows={5}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Please describe the issue in detail..."
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-[14px] focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:bg-[#152C6E] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
