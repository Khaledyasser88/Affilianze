import { useEffect, useState } from 'react'
import { companyApi, marketerApi } from '../../api/client'
import { Check, Shield, RefreshCw, Search, Info, X, Globe, FileText, Phone, Mail, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { dataUtils } from '../../utils/dataUtils'
export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'pending-companies' | 'all-companies' | 'verified-companies' | 'pending-marketers'>('pending-companies')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pending-companies') {
        const res = await companyApi.getadminpending({ pageSize: 50 }) as any
        const arr = res?.data?.items || res?.data || res?.items || []
        setData(dataUtils.filterTestEntities(Array.isArray(arr) ? arr : []))
      } else if (activeTab === 'all-companies') {
        const res = await companyApi.getadminall({ PageSize: 50 }) as any
        const arr = res?.data?.items || res?.data || res?.items || []
        setData(dataUtils.filterTestEntities(Array.isArray(arr) ? arr : []))
      } else if (activeTab === 'verified-companies') {
        const res = await companyApi.getadminverified({ pageSize: 50 }) as any
        const arr = res?.data?.items || res?.data || res?.items || []
        setData(dataUtils.filterTestEntities(Array.isArray(arr) ? arr : []))
      } else if (activeTab === 'pending-marketers') {
        const res = await marketerApi.getadminpendingverification({ pageSize: 50 }) as any
        const arr = res?.data?.items || res?.data || res?.items || []
        setData(dataUtils.filterTestEntities(Array.isArray(arr) ? arr : []))
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  const approveCompany = async (id: number) => {
    try { 
      await companyApi.postapprove(id, { note: 'Approved via Admin' } as any)
      toast.success('Company approved')
      setSelectedUser(null)
      loadData() 
    } catch (e: any) { toast.error(e.message || 'Error approving company') }
  }

  const rejectCompany = async (id: number) => {
    try { 
      await companyApi.postreject(id, { note: 'Rejected via Admin' } as any)
      toast.success('Company rejected')
      setSelectedUser(null)
      loadData() 
    } catch (e: any) { toast.error(e.message || 'Error rejecting company') }
  }

  const verifyCompany = async (id: number) => {
    try { await companyApi.putverify(id); toast.success('Company verified'); loadData() }
    catch (e: any) { toast.error(e.message || 'Error verifying') }
  }

  const toggleSuspendCompany = async (id: number, isSuspended: boolean) => {
    try {
      if (isSuspended) await companyApi.putreactivate(id)
      else await companyApi.putsuspend(id, { reason: 'Suspended via Admin' } as any)
      toast.success(`Company ${isSuspended ? 'reactivated' : 'suspended'}`)
      loadData()
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const verifyMarketer = async (id: number) => {
    try { await marketerApi.putverify(id); toast.success('Marketer verified'); loadData(); setSelectedUser(null); }
    catch (e: any) { toast.error(e.message || 'Error verifying') }
  }

  const unverifyMarketer = async (id: number) => {
    try { await marketerApi.putunverify(id); toast.success('Marketer verification revoked'); loadData(); setSelectedUser(null); }
    catch (e: any) { toast.error(e.message || 'Error revoking verification') }
  }

  const editMarketerScore = async (id: number, currentScore: number = 0) => {
    const raw = prompt('Enter new performance score (e.g. 0-100):', currentScore.toString())
    if (!raw) return
    const score = parseInt(raw, 10)
    if (isNaN(score)) return toast.error('Invalid score number')
    try { await marketerApi.putperformancescore(id, { score } as any); toast.success('Score updated'); loadData() }
    catch (e: any) { toast.error(e.message || 'Error updating score') }
  }

  return (
    <div className="space-y-6 py-6 animate-in fade-in max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text"
               placeholder="Search by name, email, or ID..."
               className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-[13px] font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all outline-none"
               onChange={(e) => {
                 const term = e.target.value.toLowerCase();
                 // Simple client-side filtering for the current view
                 if (!term) {
                   loadData(); // Reset
                   return;
                 }
                 setData(prev => prev.filter(u => 
                   (u.name || u.campanyName || u.fullName || '').toLowerCase().includes(term) ||
                   (u.email || u.contactEmail || '').toLowerCase().includes(term)
                 ));
               }}
             />
          </div>
          <div className="text-right">
            <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none mb-2">User Management</h1>
            <p className="text-slate-400 font-medium">Review and verify platform participants</p>
          </div>
        </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-100">
        {[
          { id: 'pending-companies', label: 'Pending Companies' },
          { id: 'all-companies', label: 'All Companies' },
          { id: 'verified-companies', label: 'Verified Companies' },
          { id: 'pending-marketers', label: 'Pending Marketers' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-6 py-3 text-[13px] font-black whitespace-nowrap rounded-t-2xl transition-all border-b-2 uppercase tracking-widest ${
              activeTab === t.id 
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin" />
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Fetching data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold text-sm">No pending items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5 border-b border-slate-50">Identity</th>
                  <th className="px-8 py-5 border-b border-slate-50">Status</th>
                  <th className="px-8 py-5 border-b border-slate-50 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item: any, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-[#1E3A8A] overflow-hidden">
                            {item.logoUrl || item.profilePictureUrl ? (
                              <img 
                                src={item.logoUrl || item.profilePictureUrl} 
                                className="w-full h-full object-cover" 
                                alt=""
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
                                }}
                              />
                            ) : (
                              <Building2 className="w-5 h-5" />
                            )}
                          </div>
                         <div>
                          <div className="font-black text-slate-900 text-[15px]">{item.name || item.campanyName || item.fullName || 'Unknown'}</div>
                          <div className="text-[12px] font-medium text-slate-400">{item.email || item.contactEmail || '-'}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {item.isVerified || item.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Check className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                          <Shield className="w-3 h-3" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setSelectedUser(item)}
                        className="p-2.5 rounded-xl text-slate-300 hover:text-[#1E3A8A] hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                        title="View Details"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
             <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#1E3A8A]">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Company Audit</h3>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{selectedUser.campanyName || 'Profile Details'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px]">
                        <Mail className="w-3.5 h-3.5 text-slate-300" /> {selectedUser.contactEmail || selectedUser.email || 'N/A'}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px]">
                        <Phone className="w-3.5 h-3.5 text-slate-300" /> {selectedUser.phoneNumber || 'N/A'}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website</p>
                      <a href={selectedUser.website} target="_blank" className="flex items-center gap-2 text-[#1E3A8A] font-bold text-[13px] hover:underline">
                        <Globe className="w-3.5 h-3.5" /> {selectedUser.website || 'No website provided'}
                      </a>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax ID</p>
                      <p className="text-slate-700 font-bold text-[13px]">{selectedUser.taxId || 'N/A'}</p>
                   </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Verification Document</p>
                   {selectedUser.commercialRegister ? (
                     <a 
                       href={selectedUser.commercialRegister} 
                       target="_blank" 
                       className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#1E3A8A] transition-all group"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E3A8A]">
                           <FileText className="w-5 h-5" />
                         </div>
                         <span className="text-[13px] font-black text-slate-700">Commercial Register.pdf</span>
                       </div>
                       <button className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Download</button>
                     </a>
                   ) : (
                     <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic text-[12px]">
                        <FileText className="w-5 h-5 opacity-30" /> No document uploaded
                     </div>
                   )}
                </div>

                <div className="flex gap-4 pt-4">
                  {activeTab === 'pending-companies' ? (
                    <>
                      <button 
                        onClick={() => rejectCompany(selectedUser.id)}
                        className="flex-1 py-4 px-6 rounded-2xl border border-rose-100 text-rose-500 font-black text-[13px] hover:bg-rose-50 transition-all uppercase tracking-widest active:scale-95"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => approveCompany(selectedUser.id)}
                        className="flex-[2] py-4 px-6 rounded-2xl bg-[#1E3A8A] text-white font-black text-[13px] shadow-xl shadow-blue-900/20 hover:bg-[#152C6E] transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Approve Partner
                      </button>
                    </>
                  ) : (
                    <>
                      {activeTab === 'pending-marketers' ? (
                        <>
                          {!selectedUser.isVerified ? (
                            <button 
                              onClick={() => verifyMarketer(selectedUser.id)}
                              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-black text-[13px] hover:bg-emerald-700 transition-all uppercase tracking-widest active:scale-95"
                            >
                              Verify User
                            </button>
                          ) : (
                            <button 
                              onClick={() => unverifyMarketer(selectedUser.id)}
                              className="flex-1 py-4 px-6 rounded-2xl bg-amber-600 text-white font-black text-[13px] hover:bg-amber-700 transition-all uppercase tracking-widest active:scale-95"
                            >
                              Revoke Verification
                            </button>
                          )}
                          <button 
                            onClick={() => editMarketerScore(selectedUser.id, selectedUser.performanceScore)}
                            className="flex-1 py-4 px-6 rounded-2xl border border-blue-600 text-blue-600 font-black text-[13px] hover:bg-blue-50 transition-all uppercase tracking-widest active:scale-95"
                          >
                            Edit Score
                          </button>
                        </>
                      ) : (
                        <>
                          {!selectedUser.isVerified && (
                            <button 
                              onClick={() => verifyCompany(selectedUser.id)}
                              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-black text-[13px] hover:bg-emerald-700 transition-all uppercase tracking-widest active:scale-95"
                            >
                              Verify Company
                            </button>
                          )}
                          <button 
                             onClick={() => toggleSuspendCompany(selectedUser.id, selectedUser.isSuspended)}
                             className={`flex-1 py-4 px-6 rounded-2xl font-black text-[13px] transition-all uppercase tracking-widest active:scale-95 ${
                                selectedUser.isSuspended ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600 hover:bg-red-100'
                             }`}
                          >
                            {selectedUser.isSuspended ? 'Reactivate' : 'Suspend Account'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
