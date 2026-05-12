import { useEffect, useState } from 'react'
import { paymentApi } from '../../api/client'
import { DollarSign, Check, X, RefreshCw, TrendingUp, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminFinancials() {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'reports'>('withdrawals')
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [reports, setReports] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'withdrawals') {
        const res = await paymentApi.getadminwithdrawals({ PageSize: 50 })
        // Paged result has data in .data
        const items = (res as any)?.data || (res as any)?.items || (Array.isArray(res) ? res : []);
        setWithdrawals(Array.isArray(items) ? items : []);
      } else {
        const res = await paymentApi.getadminfinancialreports()
        setReports((res as any)?.data || res)
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

  const approveWithdrawal = async (id: number) => {
    const transactionId = prompt("Enter Transaction ID (optional):") || undefined
    try {
      await paymentApi.postadminwithdrawalsapprove(id, { adminNotes: 'Approved via Admin', transactionId } as any)
      toast.success('Withdrawal approved')
      loadData()
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  const rejectWithdrawal = async (id: number) => {
    const reason = prompt("Rejection Reason:") || "Rejected via Admin"
    try {
      await paymentApi.postadminwithdrawalsreject(id, { reason } as any)
      toast.success('Withdrawal rejected')
      loadData()
    } catch (e: any) { toast.error(e.message || 'Error occurred') }
  }

  return (
    <div className="space-y-6 py-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financials</h1>
          <p className="text-gray-500 mt-1">Manage withdrawals and view financial reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 text-sm font-bold whitespace-nowrap rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'withdrawals' 
              ? 'border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50' 
              : 'border-transparent text-gray-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Withdrawals
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-bold whitespace-nowrap rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'reports' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' 
              : 'border-transparent text-gray-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          Financial Reports
        </button>
      </div>

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin" /></div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ShieldAlert className="w-12 h-12 mb-3 text-gray-200" />
              <p>No pending withdrawals.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100">Marketer</th>
                    <th className="p-4 font-bold border-b border-gray-100">Amount</th>
                    <th className="p-4 font-bold border-b border-gray-100">Method</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map((w, i) => {
                    const status = w.status || 'Pending';
                    const statusStyle = status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                      status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                      'bg-amber-50 text-amber-700 border-amber-100';

                    return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{w.marketerName || `Marketer ID: ${w.marketerId}`}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{new Date(w.createdAt || Date.now()).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900 tracking-tight">${w.amount?.toLocaleString() || 0}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-[13px] font-bold text-slate-700">{w.paymentMethod?.bankName || w.paymentMethod?.paypalEmail || w.paymentMethod?.accountDetails || 'Transfer'}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{w.paymentMethod?.type || 'Other'}</div>
                      </td>
                      <td className="p-4 text-right">
                        {status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => approveWithdrawal(w.id)} className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => rejectWithdrawal(w.id)} className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100" title="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${statusStyle}`}>
                            {status}
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          {loading ? (
             <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" /></div>
          ) : reports ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ReportCard 
                label="Total Processed" 
                value={reports.totalProcessed} 
                icon={<DollarSign className="w-5 h-5" />} 
                color="border-l-blue-600"
              />
              <ReportCard 
                label="Total Fees Earned" 
                value={reports.totalFeesEarned} 
                icon={<TrendingUp className="w-5 h-5" />} 
                color="border-l-emerald-600"
              />
              <ReportCard 
                label="Total Payouts" 
                value={reports.totalPayouts} 
                icon={<Check className="w-5 h-5" />} 
                color="border-l-purple-600"
              />
              
              <div className="md:col-span-3 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900">Period Overview</h3>
                  <div className="flex gap-4 text-xs font-medium text-gray-400">
                    <span>{reports.periodStart ? new Date(reports.periodStart).toLocaleDateString() : 'Start'}</span>
                    <span>→</span>
                    <span>{reports.periodEnd ? new Date(reports.periodEnd).toLocaleDateString() : 'End'}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Gross Revenue</span>
                    <span className="text-sm font-bold text-slate-900">${(reports.totalProcessed || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Platform Share (Commission)</span>
                    <span className="text-sm font-bold text-emerald-600">+${(reports.totalFeesEarned || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-500">Net Platform Earnings</span>
                    <span className="text-lg font-black text-slate-900">${(reports.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <DollarSign className="w-12 h-12 mb-3 text-gray-200" />
              <p>No financial data available yet for the selected period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReportCard({ label, value, icon, color }: { label: string, value: number | string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 ${color} transition-all hover:translate-y-[-2px] hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-2 text-gray-400">
        <div className="p-1.5 bg-gray-50 rounded-lg">{icon}</div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider">{label}</h3>
      </div>
      <p className="text-2xl font-black text-slate-900">${(Number(value) || 0).toLocaleString()}</p>
    </div>
  )
}
