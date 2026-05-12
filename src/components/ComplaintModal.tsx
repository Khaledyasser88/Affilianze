import { useState } from 'react'
import { X, Send, AlertCircle } from 'lucide-react'
import { complaintApi } from '../api/client'
import toast from 'react-hot-toast'

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  defendantId: number;
  defendantName: string;
  campaignId?: number;
  campaignTitle?: string;
}

export default function ComplaintModal({ isOpen, onClose, defendantId, defendantName, campaignId, campaignTitle }: ComplaintModalProps) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (description.length < 20) {
      toast.error('Description must be at least 20 characters')
      return
    }
    setLoading(true)
    try {
      await complaintApi.post({
        defendantId,
        campaignId,
        subject: subject || (campaignTitle ? `Issue with ${campaignTitle}` : 'Report Issue'),
        description,
        evidence: ''
      })
      toast.success('Complaint submitted successfully')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-black text-slate-900">Report an Issue</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Subject</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Payment Issue, Misleading Content"
              className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl text-[15px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Details for {defendantName}</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue..."
              className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl text-[15px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:bg-white transition-all resize-none"
              required
            />
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Minimum 20 characters required.</p>
          </div>

          <div className="pt-2">
            <button 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[15px] hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Submit Report</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
