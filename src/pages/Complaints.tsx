import { useEffect, useState } from 'react'
import { AlertCircle, FileText, User, Briefcase } from 'lucide-react'
// Assume these exist in client.ts
import { complaintApi } from '../api/client'
import type { ComplaintDto } from '../api/client'

export default function Complaints() {
  const [complaintsFiled, setComplaintsFiled] = useState<ComplaintDto[]>([])
  const [complaintsReceived, setComplaintsReceived] = useState<ComplaintDto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'filed' | 'received'>('filed')

  useEffect(() => {
    async function fetchComplaints() {
      setLoading(true)
      try {
        // Fetch complaints filed by user
        const filedRes = await (complaintApi.getmy as any)()
        const filedData = filedRes?.data || filedRes?.items || []
        setComplaintsFiled(Array.isArray(filedData) ? filedData : (Array.isArray(filedRes) ? filedRes : []))
        
        // Fetch complaints against user
        const receivedRes = await (complaintApi.getagainstme as any)()
        const receivedData = receivedRes?.data || receivedRes?.items || []
        setComplaintsReceived(Array.isArray(receivedData) ? receivedData : (Array.isArray(receivedRes) ? receivedRes : []))
      } catch (err) {
        console.error("Failed to fetch complaints", err)
      } finally {
        setLoading(false)
      }
    }
    fetchComplaints()
  }, [])

  const currentList = activeTab === 'filed' ? complaintsFiled : complaintsReceived

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" /> Resolution Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your disputes and complaints</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('filed')}
          className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'filed'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Filed by Me ({complaintsFiled.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'received'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Received ({complaintsReceived.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mb-4" />
          Loading Resolution Center records...
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-gray-300" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">No complaints found</h3>
          <p className="text-sm text-gray-500">You don't have any records in this section.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((complaint, i) => (
            <div key={complaint.id || i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-900 text-[15px]">{complaint.subject || 'Dispute Case'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Filed on: {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider
                  ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                    complaint.status === 'Open' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'}`}>
                  {complaint.status || 'Pending'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed mb-4">
                {complaint.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <User className="w-3.5 h-3.5" />
                  Opponent: <span className="font-bold">{activeTab === 'filed' ? complaint.defendantName : complaint.complainantName}</span>
                </div>
                {complaint.campaignTitle && (
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                    <Briefcase className="w-3.5 h-3.5" />
                    Campaign: {complaint.campaignTitle}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
