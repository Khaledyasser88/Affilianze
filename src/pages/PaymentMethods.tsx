import { useState, useEffect } from 'react'
import { Plus, Landmark, Wallet, ShieldCheck, Trash2, CreditCard } from 'lucide-react'
import { paymentApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function PaymentMethods() {
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMethods()
  }, [])

  async function loadMethods() {
    setLoading(true)
    try {
      const res = await paymentApi.getpaymentmethods()
      setMethods(res?.data || [])
    } catch {
      setError('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return
    try {
      await paymentApi.deletepaymentmethod(id)
      setMethods(methods.filter(m => m.id !== id))
    } catch {
      alert('Failed to delete payment method')
    }
  }

  const { name } = useAuth()

  const handleAddDemo = async () => {
    try {
      await paymentApi.postpaymentmethod({
        type: 'Ewallet',
        accountDetails: '010' + Math.floor(Math.random() * 90000000 + 10000000),
        accountHolderName: name || 'Valued Partner',
        setAsDefault: methods.length === 0
      })
      loadMethods()
    } catch {
      alert('Failed to add method')
    }
  }

  const getIcon = (type: string) => {
    if (type?.toLowerCase().includes('bank')) return Landmark
    if (type?.toLowerCase().includes('wallet')) return Wallet
    return CreditCard
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Methods</h1>
          <p className="text-sm text-gray-500 mt-1">Manage where you receive your campaign earnings</p>
        </div>
        <button 
          onClick={handleAddDemo}
          className="bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#152C6E] transition-all shadow-lg shadow-blue-900/10 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Add New Method
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-4 text-sm font-medium">{error}</div>}

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading methods...
          </div>
        ) : methods.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No payment methods added yet</p>
          </div>
        ) : methods.map((method) => {
          const Icon = getIcon(method.category || method.accountType || '')
          return (
          <div key={method.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center`}>
                <Icon className={`w-7 h-7 text-[#1E3A8A]`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-slate-900 text-base">{method.accountType || 'Payment Method'}</h3>
                  {method.isDefault && (
                    <span className="bg-blue-50 text-[#1E3A8A] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-100">Primary</span>
                  )}
                </div>
                <p className="text-[13px] text-slate-900 font-medium">{method.provider}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{method.accountNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleDelete(method.id)}
                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )})}
      </div>

      <div className="mt-12 bg-slate-50/50 rounded-3xl p-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Secure Payments</h2>
            <p className="text-sm text-gray-500">Your financial information is encrypted and never stored on our servers.</p>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-slate-900 text-sm mb-2">Withdrawal Speed</h3>
             <p className="text-xs text-gray-500 leading-relaxed font-medium">Bank transfers usually take 2-3 business days. Mobile wallets and InstaPay are typically instant after approval.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-slate-900 text-sm mb-2">Transaction Fees</h3>
             <p className="text-xs text-gray-500 leading-relaxed font-medium">Affilianze doesn't charge withdrawal fees. However, your bank or provider may apply its own processing fees.</p>
          </div>
        </div>
      </div>
    </div>
  )
}


