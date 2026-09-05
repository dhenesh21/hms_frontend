import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { billingService } from '../../services/api'
import { IndianRupee, Plus, FileText, CreditCard, TrendingUp, Clock, Search, Package, Undo2, Trash2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import { printBill } from '../../utils/print'
import CustomSelect from '../../components/ui/CustomSelect'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  refunded: 'bg-purple-100 text-purple-700',
}

const REFUND_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  reversed: 'bg-gray-100 text-gray-600',
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function BillingPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'new-bill' | 'payment' | 'packages' | 'refunds'>('dashboard')
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [refundBillId, setRefundBillId] = useState('')
  const { register, setValue, watch, handleSubmit, reset } = useForm()
  const payForm = useForm()
  const packageForm = useForm()
  const lineItemForm = useForm()
  const refundForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['billing-stats'], queryFn: () => billingService.getDashboard().then(r => r.data) })
  const { data: bills } = useQuery({ queryKey: ['bills'], queryFn: () => billingService.listBills().then(r => r.data) })
  const { data: daily } = useQuery({ queryKey: ['daily-report'], queryFn: () => billingService.dailyReport().then(r => r.data) })

  // PACKAGES
  const { data: packages } = useQuery({ queryKey: ['packages'], queryFn: () => billingService.listPackages().then(r => r.data), enabled: activeTab === 'packages' })
  const { data: services } = useQuery({ queryKey: ['billing-services'], queryFn: () => billingService.listServices().then(r => r.data), enabled: activeTab === 'packages' })
  const { data: lineItems } = useQuery({
    queryKey: ['package-line-items', selectedPackage?.id],
    queryFn: () => billingService.listPackageLineItems(selectedPackage.id).then(r => r.data),
    enabled: !!selectedPackage,
  })

  // REFUNDS
  const { data: refunds } = useQuery({ queryKey: ['refunds'], queryFn: () => billingService.listRefunds().then(r => r.data), enabled: activeTab === 'refunds' })
  const { data: refundBillPayments } = useQuery({
    queryKey: ['bill-payments', refundBillId],
    queryFn: () => billingService.getPayments(parseInt(refundBillId)).then(r => r.data),
    enabled: !!refundBillId && !isNaN(parseInt(refundBillId)),
  })

  const createBill = useMutation({
    mutationFn: (d: any) => billingService.createBill(cleanPayload(d)),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['bills'] }); toast.success(`Bill created: ${res.data.bill_number}`); reset(); setActiveTab('bills') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create bill')
  })

  const recordPayment = useMutation({
    mutationFn: (d: any) => billingService.recordPayment(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); payForm.reset(); setSelectedBill(null); toast.success('Payment recorded') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to record payment')
  })

  const createPackage = useMutation({
    mutationFn: (d: any) => billingService.createPackage(cleanPayload({
      ...d,
      total_price: parseFloat(d.total_price),
      validity_days: parseInt(d.validity_days) || 30,
      inclusions: d.inclusions ? String(d.inclusions).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); packageForm.reset(); toast.success('Package created') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create package')
  })

  const addLineItem = useMutation({
    mutationFn: (d: any) => billingService.addPackageLineItem(cleanPayload({
      ...d, package_id: selectedPackage.id,
      service_id: parseInt(d.service_id),
      quantity: parseInt(d.quantity) || 1,
      package_price: parseFloat(d.package_price),
    })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['package-line-items', selectedPackage?.id] }); lineItemForm.reset(); toast.success('Line item added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add line item')
  })

  const removeLineItem = useMutation({
    mutationFn: (id: number) => billingService.removePackageLineItem(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['package-line-items', selectedPackage?.id] }); toast.success('Line item removed') },
  })

  const requestRefund = useMutation({
    mutationFn: (d: any) => billingService.requestRefund(cleanPayload({ ...d, original_payment_id: parseInt(d.original_payment_id), amount: parseFloat(d.amount) })),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['refunds'] })
      refundForm.reset(); setRefundBillId('')
      toast.success(`Refund requested: ${res.data.refund_number}`)
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to request refund')
  })

  const approveRefund = useMutation({
    mutationFn: (id: number) => billingService.approveRefund(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['refunds'] }); qc.invalidateQueries({ queryKey: ['bills'] }); toast.success('Refund approved') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to approve refund')
  })

  const rejectRefund = useMutation({
    mutationFn: (id: number) => billingService.rejectRefund(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['refunds'] }); toast.success('Refund rejected') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to reject refund')
  })

  const reverseRefund = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => billingService.reverseRefund(id, { reversal_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['refunds'] }); qc.invalidateQueries({ queryKey: ['bills'] }); toast.success('Refund reversed') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to reverse refund')
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Billing & Accounts</h1>
          <p className="text-sm text-gray-500">OPD · IPD · Collections · Reports</p></div>
        <button onClick={() => setActiveTab('new-bill')}
          className="flex items-center gap-2 btn-primary">
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
      <div className="flex gap-1 tabs" style={{padding:0}}>
        {(['dashboard', 'bills', 'new-bill', 'payment', 'packages', 'refunds'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${activeTab === t ? 'tab active' : 'tab'}`}>
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => printBill(b)}
                        style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                        🖨 Print
                      </button>
                      {b.balance_amount > 0 && (
                        <button onClick={() => { setSelectedBill(b); setActiveTab('payment') }}
                          style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>Pay</button>
                      )}
                    </div>
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
          <form onSubmit={handleSubmit(d => {
            const patient_id = parseInt(d.patient_id)
            if (!d.patient_id || isNaN(patient_id)) return toast.error('Please select a patient')
            createBill.mutate(cleanPayload({
              ...d, patient_id,
              opd_visit_id: d.opd_visit_id ? parseInt(d.opd_visit_id) : undefined,
              ipd_admission_id: d.ipd_admission_id ? parseInt(d.ipd_admission_id) : undefined,
              items: [{
                item_name: d.item_name, category: d.category,
                quantity: parseFloat(d.quantity) || 1,
                unit_price: parseFloat(d.unit_price),
                tax_percent: parseFloat(d.tax_percent) || 0,
              }]
            }))
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                <PatientSearchInput inputCls={inputCls} onChange={(id) => setValue("patient_id", id)} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Bill Type *</label>
                <CustomSelect value={watch('bill_type') || ''} onChange={v => setValue('bill_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "opd", label: "OPD" }, { value: "ipd", label: "IPD" }, { value: "emergency", label: "Emergency" }, { value: "day_care", label: "Day Care" }]} /></div>
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
              <button type="submit" className="px-5 py-2 btn-primary">Create Bill</button>
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
          <form onSubmit={payForm.handleSubmit(d => {
            const bill_id = selectedBill?.id || parseInt(d.bill_id)
            const patient_id = selectedBill?.patient_id || parseInt(d.patient_id)
            if (!selectedBill) {
              if (!d.bill_id || isNaN(bill_id)) return toast.error('Please enter a Bill ID')
              if (!d.patient_id || isNaN(patient_id)) return toast.error('Please select a patient')
            }
            recordPayment.mutate(cleanPayload({
              ...d, bill_id, patient_id,
              amount: parseFloat(d.amount)
            }))
          })} className="space-y-4">
            {!selectedBill && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Bill ID *</label>
                  <input {...payForm.register('bill_id', { required: !selectedBill })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                  <PatientSearchInput inputCls={inputCls} onChange={(id) => payForm.setValue('patient_id', id)} /></div>
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
              <button type="submit" className="px-5 py-2 text-sm btn-primary">Record Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* PACKAGES (items 142-143) */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Package size={14} /> New Package</h2>
            <form onSubmit={packageForm.handleSubmit(d => createPackage.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Package Code *</label>
                  <input {...packageForm.register('package_code', { required: true })} className={inputCls} placeholder="PKG-MAT-01" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Total Price ₹ *</label>
                  <input {...packageForm.register('total_price', { required: true })} type="number" className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Package Name *</label>
                <input {...packageForm.register('package_name', { required: true })} className={inputCls} placeholder="Normal Delivery Package" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea {...packageForm.register('description')} rows={2} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Validity (days)</label>
                  <input {...packageForm.register('validity_days')} type="number" defaultValue={30} className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Inclusions (comma-separated)</label>
                  <input {...packageForm.register('inclusions')} className={inputCls} placeholder="Room, Delivery, Nursing" /></div>
              </div>
              <button type="submit" className="px-5 py-2 btn-primary w-full">Create Package</button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">ALL PACKAGES</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {packages?.map((p: any) => (
                  <button key={p.id} onClick={() => setSelectedPackage(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${selectedPackage?.id === p.id ? 'bg-violet-50 border border-violet-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                    <span className="text-gray-700">{p.package_name} <span className="text-gray-400">({p.package_code})</span></span>
                    <span className="font-medium text-gray-800">₹{p.total_price?.toLocaleString()}</span>
                  </button>
                ))}
                {!packages?.length && <p className="text-center text-gray-400 text-sm py-4">No packages yet</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            {!selectedPackage ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={32} className="mb-2 text-gray-200" />
                <p className="text-sm">Select a package to manage its line items</p>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-gray-700 mb-1">{selectedPackage.package_name}</h2>
                <p className="text-xs text-gray-400 mb-4">{selectedPackage.package_code} · Validity {selectedPackage.validity_days} days</p>

                <form onSubmit={lineItemForm.handleSubmit(d => addLineItem.mutate(d))} className="space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select {...lineItemForm.register('service_id', { required: true })} className={`${inputCls} bg-white`} style={{ margin: 0 }}>
                      <option value="">— Select Service —</option>
                      {services?.map((s: any) => <option key={s.id} value={s.id}>{s.service_name} (₹{s.unit_price})</option>)}
                    </select>
                    <input {...lineItemForm.register('package_price', { required: true })} type="number" placeholder="Package Price ₹" className={inputCls} style={{ margin: 0 }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <input {...lineItemForm.register('quantity')} type="number" defaultValue={1} placeholder="Qty" className={inputCls} style={{ margin: 0 }} />
                    <label className="flex items-center gap-2 text-xs text-gray-500">
                      <input type="checkbox" {...lineItemForm.register('is_optional')} /> Optional item
                    </label>
                  </div>
                  <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-1">
                    <Plus size={12} /> Add Line Item
                  </button>
                </form>

                <div className="space-y-1.5">
                  {lineItems?.map((li: any) => {
                    const svc = services?.find((s: any) => s.id === li.service_id)
                    return (
                      <div key={li.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="text-gray-700">{svc?.service_name || `Service #${li.service_id}`} × {li.quantity} {li.is_optional && <span className="text-xs text-amber-600">(optional)</span>}</p>
                          <p className="text-xs text-gray-400">Package ₹{li.package_price} {li.standalone_price ? `· Standalone ₹${li.standalone_price}` : ''}</p>
                        </div>
                        <button onClick={() => removeLineItem.mutate(li.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    )
                  })}
                  {!lineItems?.length && <p className="text-center text-gray-400 text-sm py-6">No line items yet</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* REFUNDS (items 146-149) */}
      {activeTab === 'refunds' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Undo2 size={14} /> Request Refund</h2>
            <form onSubmit={refundForm.handleSubmit(d => requestRefund.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Bill ID *</label>
                <input value={refundBillId} onChange={e => { setRefundBillId(e.target.value); refundForm.setValue('original_payment_id', '') }}
                  type="number" className={inputCls} placeholder="Enter bill ID to load its payments" /></div>

              {refundBillId && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Original Payment *</label>
                  <select {...refundForm.register('original_payment_id', { required: true })} className={`${inputCls} bg-white`}>
                    <option value="">— Select Payment —</option>
                    {refundBillPayments?.filter((p: any) => !p.is_refund).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.payment_number} — ₹{p.amount} ({p.payment_mode})</option>
                    ))}
                  </select>
                  {refundBillPayments && !refundBillPayments.filter((p: any) => !p.is_refund).length && (
                    <p className="text-xs text-gray-400 mt-1">No payments found for this bill</p>
                  )}
                </div>
              )}

              <div><label className="block text-xs text-gray-500 mb-1">Refund Amount ₹ *</label>
                <input {...refundForm.register('amount', { required: true })} type="number" step="0.01" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Reason *</label>
                <textarea {...refundForm.register('reason', { required: true })} rows={2} className={inputCls} placeholder="Why is this being refunded?" /></div>
              <button type="submit" className="px-5 py-2 btn-primary w-full">Submit Refund Request</button>
              <p className="text-xs text-gray-400">Requesting doesn't move money — a separate approval step does that.</p>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Refund Requests</h2>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {refunds?.map((r: any) => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{r.refund_number}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${REFUND_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Bill #{r.bill_id} · ₹{r.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {r.status === 'requested' && (
                      <>
                        <button onClick={() => approveRefund.mutate(r.id)}
                          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100">
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => rejectRefund.mutate(r.id)}
                          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100">
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button onClick={() => { const reason = window.prompt('Reason for reversing this refund?'); if (reason) reverseRefund.mutate({ id: r.id, reason }) }}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100">
                        <RotateCcw size={12} /> Reverse
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!refunds?.length && <p className="text-center text-gray-400 text-sm py-8">No refund requests yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
