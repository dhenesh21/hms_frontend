import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { billingService } from '../../services/api'
import { IndianRupee, Plus, FileText, CreditCard, TrendingUp, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  refunded: 'bg-purple-100 text-purple-700',
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

export default function BillingPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'new-bill' | 'payment'>('dashboard')
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const { register, handleSubmit, reset, watch } = useForm()
  const payForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['billing-stats'], queryFn: () => billingService.getDashboard().then(r => r.data) })
  const { data: bills } = useQuery({ queryKey: ['bills'], queryFn: () => billingService.listBills().then(r => r.data) })
  const { data: daily } = useQuery({ queryKey: ['daily-report'], queryFn: () => billingService.dailyReport().then(r => r.data) })

  const createBill = useMutation({
    mutationFn: (d: any) => billingService.createBill(d),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['bills'] }); toast.success(`Bill created: ${res.data.bill_number}`); reset(); setActiveTab('bills') }
  })

  const recordPayment = useMutation({
    mutationFn: (d: any) => billingService.recordPayment(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); payForm.reset(); setSelectedBill(null); toast.success('Payment recorded') }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Billing & Accounts</h1>
          <p className="text-sm text-gray-500">OPD · IPD · Collections · Reports</p></div>
        <button onClick={() => setActiveTab('new-bill')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> New Bill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Bills", value: stats?.today_bills, color: 'text-blue-600', prefix: '' },
          { label: "Today's Collection", value: `₹${(stats?.today_collection || 0).toLocaleString()}`, color: 'text-green-600', prefix: '' },
          { label: 'Outstanding', value: `₹${(stats?.pending_amount || 0).toLocaleString()}`, color: 'text-amber-600', prefix: '' },
          { label: 'Total Revenue', value: `₹${(stats?.total_revenue || 0).toLocaleString()}`, color: 'text-purple-600', prefix: '' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['dashboard', 'bills', 'new-bill', 'payment'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${activeTab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Today's Collection by Mode</h2>
            <div className="space-y-3">
              {daily?.by_payment_mode && Object.entries(daily.by_payment_mode).map(([mode, amount]: any) => (
                <div key={mode} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700 capitalize">{mode}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">₹{amount.toLocaleString()}</span>
                </div>
              ))}
              {!daily?.by_payment_mode && <p className="text-gray-400 text-sm text-center py-4">No transactions today</p>}
              <div className="pt-2 border-t border-gray-100 flex justify-between font-semibold text-sm">
                <span>Total</span><span className="text-green-600">₹{(daily?.total_collection || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'New Bill', action: () => setActiveTab('new-bill'), color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'Record Payment', action: () => setActiveTab('payment'), color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                { label: 'Outstanding Bills', action: () => setActiveTab('bills'), color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              ].map(({ label, action, color }) => (
                <button key={label} onClick={action} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${color}`}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BILLS LIST */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              {['Bill No.', 'Patient', 'Type', 'Total', 'Paid', 'Balance', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {bills?.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{b.bill_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{b.patient_id}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{b.bill_type}</span></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{b.gross_total?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-green-600">₹{b.paid_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-red-500">₹{b.balance_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(b.bill_date), 'dd MMM')}</td>
                  <td className="px-4 py-3">
                    {b.balance_amount > 0 && (
                      <button onClick={() => { setSelectedBill(b); setActiveTab('payment') }}
                        className="text-xs text-blue-600 hover:underline">Pay</button>
                    )}
                  </td>
                </tr>
              ))}
              {!bills?.length && <tr><td colSpan={9} className="text-center py-12 text-gray-400">No bills found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW BILL */}
      {activeTab === 'new-bill' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-3xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Create New Bill</h2>
          <form onSubmit={handleSubmit(d => createBill.mutate({
            ...d, patient_id: parseInt(d.patient_id),
            opd_visit_id: d.opd_visit_id ? parseInt(d.opd_visit_id) : undefined,
            ipd_admission_id: d.ipd_admission_id ? parseInt(d.ipd_admission_id) : undefined,
            items: [{
              item_name: d.item_name, category: d.category,
              quantity: parseFloat(d.quantity) || 1,
              unit_price: parseFloat(d.unit_price),
              tax_percent: parseFloat(d.tax_percent) || 0,
            }]
          }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                <input {...register('patient_id', { required: true })} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Bill Type *</label>
                <select {...register('bill_type', { required: true })} className={`${inputCls} bg-white`}>
                  <option value="opd">OPD</option><option value="ipd">IPD</option>
                  <option value="emergency">Emergency</option><option value="day_care">Day Care</option>
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">OPD Visit ID</label>
                <input {...register('opd_visit_id')} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">IPD Admission ID</label>
                <input {...register('ipd_admission_id')} type="number" className={inputCls} /></div>
            </div>
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-3">FIRST ITEM (add more after creating)</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Item Name *</label>
                  <input {...register('item_name', { required: true })} className={inputCls} placeholder="Consultation Fee" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select {...register('category')} className={`${inputCls} bg-white`}>
                    {['consultation', 'lab', 'radiology', 'pharmacy', 'room_charge', 'procedure', 'ot_charge', 'nursing', 'miscellaneous'].map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input {...register('quantity')} type="number" defaultValue="1" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Unit Price ₹ *</label>
                  <input {...register('unit_price', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Tax %</label>
                  <input {...register('tax_percent')} type="number" defaultValue="0" className={inputCls} /></div>
              </div>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea {...register('notes')} rows={2} className={inputCls} /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveTab('bills')} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Bill</button>
            </div>
          </form>
        </div>
      )}

      {/* PAYMENT */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Record Payment</h2>
          {selectedBill && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-800">{selectedBill.bill_number}</p>
              <p className="text-xs text-blue-600">Balance: ₹{selectedBill.balance_amount?.toLocaleString()}</p>
            </div>
          )}
          <form onSubmit={payForm.handleSubmit(d => recordPayment.mutate({
            ...d,
            bill_id: selectedBill?.id || parseInt(d.bill_id),
            patient_id: selectedBill?.patient_id || parseInt(d.patient_id),
            amount: parseFloat(d.amount)
          }))} className="space-y-4">
            {!selectedBill && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Bill ID *</label>
                  <input {...payForm.register('bill_id', { required: !selectedBill })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                  <input {...payForm.register('patient_id', { required: !selectedBill })} type="number" className={inputCls} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Amount ₹ *</label>
                <input {...payForm.register('amount', { required: true })} type="number" step="0.01"
                  defaultValue={selectedBill?.balance_amount} className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Payment Mode *</label>
                <select {...payForm.register('payment_mode', { required: true })} className={`${inputCls} bg-white`}>
                  {['cash', 'card', 'upi', 'neft', 'cheque', 'insurance'].map(m => <option key={m} value={m} className="capitalize">{m.toUpperCase()}</option>)}
                </select></div>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Transaction Reference</label>
              <input {...payForm.register('transaction_reference')} className={inputCls} placeholder="UPI ref / Card last 4 / Cheque no" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea {...payForm.register('notes')} rows={2} className={inputCls} /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setSelectedBill(null); setActiveTab('bills') }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Record Payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
