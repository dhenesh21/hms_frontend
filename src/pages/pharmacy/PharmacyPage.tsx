import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { pharmacyService } from '../../services/api'
import { Pill, AlertTriangle, Plus, Search, ShoppingCart, Package, Undo2, ArrowLeftRight, SlidersHorizontal, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

const ALERT_COLORS: Record<string, string> = {
  out_of_stock: 'bg-red-100 text-red-700 border-red-200',
  low_stock: 'bg-amber-100 text-amber-700 border-amber-200',
  expiring_soon: 'bg-orange-100 text-orange-700 border-orange-200',
  expired: 'bg-red-900 text-white border-red-900',
}

const RETURN_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function PharmacyPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'dashboard' | 'inventory' | 'dispense' | 'purchase' | 'alerts' | 'returns' | 'transfers' | 'adjustments'>('dashboard')
  const [search, setSearch] = useState('')
  const [selectedDrug, setSelectedDrug] = useState<any>(null)
  const [dispenseItems, setDispenseItems] = useState<any[]>([])
  const { register, setValue, watch, handleSubmit, reset } = useForm()
  const drugForm = useForm()
  const stockForm = useForm()
  const poForm = useForm()

  const returnForm = useForm<any>({ defaultValues: { direction: 'from_patient' } })
  const transferForm = useForm()
  const adjustForm = useForm()
  const [returnDrugId, setReturnDrugId] = useState('')
  const [transferDrugId, setTransferDrugId] = useState('')
  const [adjustDrugId, setAdjustDrugId] = useState('')

  const { data: stats } = useQuery({ queryKey: ['pharmacy-stats'], queryFn: () => pharmacyService.getDashboard().then(r => r.data) })
  const { data: drugs } = useQuery({ queryKey: ['drugs', search], queryFn: () => pharmacyService.listDrugs({ search: search || undefined }).then(r => r.data) })
  const { data: alerts } = useQuery({ queryKey: ['pharmacy-alerts'], queryFn: () => pharmacyService.getAlerts().then(r => r.data) })
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => pharmacyService.listSuppliers().then(r => r.data) })
  const { data: pos } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => pharmacyService.listPOs().then(r => r.data) })

  const { data: allDrugsForPicker } = useQuery({ queryKey: ['drugs-all'], queryFn: () => pharmacyService.listDrugs().then(r => r.data), enabled: ['returns', 'transfers', 'adjustments'].includes(tab) })
  const { data: returnStock } = useQuery({ queryKey: ['drug-stock', returnDrugId], queryFn: () => pharmacyService.getDrugStock(parseInt(returnDrugId)).then(r => r.data), enabled: !!returnDrugId })
  const { data: transferStock } = useQuery({ queryKey: ['drug-stock', transferDrugId], queryFn: () => pharmacyService.getDrugStock(parseInt(transferDrugId)).then(r => r.data), enabled: !!transferDrugId })
  const { data: adjustStockList } = useQuery({ queryKey: ['drug-stock', adjustDrugId], queryFn: () => pharmacyService.getDrugStock(parseInt(adjustDrugId)).then(r => r.data), enabled: !!adjustDrugId })

  const { data: returns } = useQuery({ queryKey: ['drug-returns'], queryFn: () => pharmacyService.listReturns().then(r => r.data), enabled: tab === 'returns' })
  const { data: transfers } = useQuery({ queryKey: ['drug-transfers'], queryFn: () => pharmacyService.listTransfers().then(r => r.data), enabled: tab === 'transfers' })
  const { data: adjustments } = useQuery({ queryKey: ['stock-adjustments'], queryFn: () => pharmacyService.listAdjustments().then(r => r.data), enabled: tab === 'adjustments' })

  const createDrug = useMutation({
    mutationFn: (d: any) => pharmacyService.createDrug(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drugs'] }); drugForm.reset(); toast.success('Drug added to master') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add drug')
  })

  const addStock = useMutation({
    mutationFn: (d: any) => pharmacyService.addStock(cleanPayload({ ...d, drug_id: parseInt(d.drug_id), quantity_received: parseInt(d.quantity_received), purchase_price: parseFloat(d.purchase_price), sale_price: parseFloat(d.sale_price) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drugs'] }); stockForm.reset(); toast.success('Stock added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add stock')
  })

  const dispense = useMutation({
    mutationFn: (d: any) => pharmacyService.dispense(cleanPayload(d)),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['drugs'] }); setDispenseItems([]); reset(); toast.success(`Dispensed: ${res.data.dispense_number}`) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to dispense')
  })

  const requestReturn = useMutation({
    mutationFn: (d: any) => pharmacyService.requestReturn(cleanPayload({
      ...d,
      drug_id: parseInt(d.drug_id),
      stock_id: d.stock_id ? parseInt(d.stock_id) : undefined,
      dispense_item_id: d.dispense_item_id ? parseInt(d.dispense_item_id) : undefined,
      supplier_id: d.supplier_id ? parseInt(d.supplier_id) : undefined,
      quantity: parseInt(d.quantity),
    })),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['drug-returns'] }); returnForm.reset({ direction: 'from_patient' }); setReturnDrugId(''); toast.success(`Return requested: ${res.data.return_number}`) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to request return')
  })
  const approveReturn = useMutation({
    mutationFn: (id: number) => pharmacyService.approveReturn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drug-returns'] }); qc.invalidateQueries({ queryKey: ['drugs'] }); toast.success('Return approved') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to approve return')
  })
  const rejectReturn = useMutation({
    mutationFn: (id: number) => pharmacyService.rejectReturn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drug-returns'] }); toast.success('Return rejected') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to reject return')
  })

  const transferStockMutation = useMutation({
    mutationFn: (d: any) => pharmacyService.transferStock(cleanPayload({
      ...d,
      stock_id: parseInt(d.stock_id),
      quantity: parseInt(d.quantity),
      from_branch_id: d.from_branch_id ? parseInt(d.from_branch_id) : undefined,
      to_branch_id: d.to_branch_id ? parseInt(d.to_branch_id) : undefined,
    })),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['drug-transfers'] }); qc.invalidateQueries({ queryKey: ['drug-stock'] }); transferForm.reset(); setTransferDrugId(''); toast.success(`Transfer done: ${res.data.transfer_number}`) },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to transfer stock')
  })

  const adjustStockMutation = useMutation({
    mutationFn: (d: any) => pharmacyService.adjustStock(cleanPayload({
      ...d,
      stock_id: parseInt(d.stock_id),
      new_quantity: parseInt(d.new_quantity),
    })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-adjustments'] }); qc.invalidateQueries({ queryKey: ['drug-stock'] }); adjustForm.reset(); setAdjustDrugId(''); toast.success('Stock adjusted') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to adjust stock')
  })

  const addDispenseItem = (drug: any) => {
    if (!dispenseItems.find(i => i.drug_id === drug.id)) {
      setDispenseItems(prev => [...prev, {
        drug_id: drug.id, drug_name: drug.brand_name,
        quantity: 1, unit_price: 0, tax_percent: 0,
        discount_percent: 0, dosage_instructions: ''
      }])
    }
  }

  const updateDispenseItem = (idx: number, field: string, value: any) => {
    setDispenseItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const totalDispense = dispenseItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Pharmacy</h1>
          <p className="text-sm text-gray-500">Drug inventory · Dispensing · Purchase orders</p></div>
        <div className="flex gap-2">
          {alerts && alerts.length > 0 && (
            <button onClick={() => setTab('alerts')} className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-200">
              <AlertTriangle size={15} /> {alerts.length} Alerts
            </button>
          )}
          <button onClick={() => setTab('dispense')} className="flex items-center gap-2 btn-primary">
            <Plus size={16} /> Dispense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Drugs', value: stats?.total_drugs, color: 'text-blue-600' },
          { label: 'Low Stock', value: stats?.low_stock_count, color: 'text-amber-600' },
          { label: 'Expiring (90d)', value: stats?.expiring_soon, color: 'text-orange-600' },
          { label: "Today's Dispense", value: stats?.today_dispense, color: 'text-green-600' },
          { label: "Today's Revenue", value: `₹${(stats?.today_revenue || 0).toLocaleString()}`, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 tabs" style={{padding:0}}>
        {(['dashboard', 'inventory', 'dispense', 'purchase', 'returns', 'transfers', 'adjustments', 'alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${tab === t ? 'tab active' : 'tab'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Drug to Master</h2>
            <form onSubmit={drugForm.handleSubmit(d => createDrug.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Drug Code *</label>
                  <input {...drugForm.register('drug_code', { required: true })} className={inputCls} placeholder="PCM500" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Brand Name *</label>
                  <input {...drugForm.register('brand_name', { required: true })} className={inputCls} placeholder="Crocin" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Generic Name *</label>
                  <input {...drugForm.register('generic_name', { required: true })} className={inputCls} placeholder="Paracetamol" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Strength</label>
                  <input {...drugForm.register('strength')} className={inputCls} placeholder="500mg" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Category *</label>
                  <select {...drugForm.register('category', { required: true })} className={`${inputCls} bg-white`}>
                    {['analgesic', 'antibiotic', 'antihypertensive', 'antidiabetic', 'gastrointestinal', 'respiratory', 'vitamin', 'iv_fluid', 'other'].map(c => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Formulation *</label>
                  <select {...drugForm.register('formulation', { required: true })} className={`${inputCls} bg-white`}>
                    {['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'iv_solution', 'powder'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Unit</label>
                  <input {...drugForm.register('unit')} defaultValue="tablet" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Reorder Level</label>
                  <input {...drugForm.register('reorder_level')} type="number" defaultValue="10" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Tax %</label>
                  <input {...drugForm.register('tax_percent')} type="number" defaultValue="12" className={inputCls} /></div>
              </div>
              <button type="submit" className="w-full py-2 btn-primary">Add Drug</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Stock (Batch Entry)</h2>
            <form onSubmit={stockForm.handleSubmit(d => addStock.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Drug ID *</label>
                  <input {...stockForm.register('drug_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Batch Number *</label>
                  <input {...stockForm.register('batch_number', { required: true })} className={inputCls} placeholder="BT2024001" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Expiry Date *</label>
                  <input {...stockForm.register('expiry_date', { required: true })} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Quantity *</label>
                  <input {...stockForm.register('quantity_received', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Purchase Price ₹</label>
                  <input {...stockForm.register('purchase_price', { required: true })} type="number" step="0.01" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Sale Price ₹</label>
                  <input {...stockForm.register('sale_price', { required: true })} type="number" step="0.01" className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Shelf Location</label>
                <input {...stockForm.register('location')} className={inputCls} placeholder="Rack A-3" /></div>
              <button type="submit" className="w-full py-2 btn-primary">Add Stock</button>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" placeholder="Search by brand, generic name or drug code..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['Code', 'Brand Name', 'Generic', 'Category', 'Formulation', 'Stock', 'Status', 'Expiry'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {drugs?.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDrug(d)}>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{d.drug_code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.brand_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.generic_name}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{d.category?.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{d.formulation}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{d.total_stock} <span className="text-xs font-normal text-gray-400">{d.unit}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.is_low_stock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {d.is_low_stock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{d.nearest_expiry ? format(new Date(d.nearest_expiry), 'MMM yyyy') : '—'}</td>
                  </tr>
                ))}
                {!drugs?.length && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No drugs found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPENSE */}
      {tab === 'dispense' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input placeholder="Search drug to add..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {drugs?.filter((d: any) => d.total_stock > 0).map((d: any) => (
                  <div key={d.id} onClick={() => addDispenseItem(d)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.brand_name} <span className="text-gray-400 text-xs font-normal">({d.strength})</span></p>
                      <p className="text-xs text-gray-400">{d.generic_name} • Stock: {d.total_stock}</p>
                    </div>
                    <Plus size={15} className="text-blue-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {dispenseItems.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Dispense Items</h3>
                {dispenseItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 bg-gray-50 p-3 rounded-lg items-center">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-800">{item.drug_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-0.5">Qty</label>
                      <input type="number" value={item.quantity} min="1"
                        onChange={e => updateDispenseItem(idx, 'quantity', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-0.5">Price ₹</label>
                      <input type="number" step="0.01" value={item.unit_price}
                        onChange={e => updateDispenseItem(idx, 'unit_price', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-sm font-semibold text-gray-800">₹{(item.quantity * item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Dispense Details</h3>
              <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                <PatientSearchInput inputCls={inputCls} onChange={(id) => setValue("patient_id", id)} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Source</label>
                <CustomSelect value={watch('prescription_source') || ''} onChange={v => setValue('prescription_source', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "opd", label: "OPD" }, { value: "ipd", label: "IPD" }, { value: "external", label: "External" }]} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">OPD Visit ID</label>
                <input {...register('opd_visit_id')} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Payment Mode</label>
                <CustomSelect value={watch('payment_mode') || ''} onChange={v => setValue('payment_mode', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "cash", label: "Cash" }, { value: "card", label: "Card" }, { value: "upi", label: "UPI" }, { value: "credit", label: "Credit" }]} /></div>
            </div>
            {dispenseItems.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between text-sm font-semibold mb-3">
                  <span>Net Total</span><span className="text-green-600">₹{totalDispense.toFixed(2)}</span>
                </div>
                <button onClick={handleSubmit(d => {
                  const patient_id = parseInt(d.patient_id)
                  if (!d.patient_id || isNaN(patient_id)) return toast.error('Please select a patient')
                  dispense.mutate(cleanPayload({
                    ...d, patient_id,
                    opd_visit_id: d.opd_visit_id ? parseInt(d.opd_visit_id) : undefined,
                    items: dispenseItems
                  }))
                })} className="w-full py-2.5 btn-primary font-medium">
                  Dispense ({dispenseItems.length} item{dispenseItems.length > 1 ? 's' : ''})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS */}
      {tab === 'purchase' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-700">Purchase Orders</h2></div>
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['PO No.', 'Supplier', 'Date', 'Items', 'Total', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {pos?.map((po: any) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{po.po_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{po.supplier_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(po.order_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{po.items?.length} drugs</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{po.total_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{po.status}</span></td>
                  </tr>
                ))}
                {!pos?.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No purchase orders</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Suppliers</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {suppliers?.map((s: any) => (
                <div key={s.id} className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.phone} • {s.supplier_code}</p>
                </div>
              ))}
              {!suppliers?.length && <p className="text-center text-gray-400 text-sm py-4">No suppliers added</p>}
            </div>
          </div>
        </div>
      )}

      {/* DRUG RETURNS (item 101) */}
      {tab === 'returns' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Undo2 size={14} /> Request Return</h2>
            <form onSubmit={returnForm.handleSubmit(d => requestReturn.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Direction *</label>
                <div className="flex bg-gray-50 rounded-lg p-1">
                  {[{ v: 'from_patient', l: 'From Patient' }, { v: 'to_supplier', l: 'To Supplier' }].map(o => (
                    <button key={o.v} type="button" onClick={() => returnForm.setValue('direction', o.v)}
                      className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-md transition ${returnForm.watch('direction') === o.v ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500'}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Drug *</label>
                <select value={returnDrugId} onChange={e => { setReturnDrugId(e.target.value); returnForm.setValue('drug_id', e.target.value); returnForm.setValue('stock_id', '') }} className={`${inputCls} bg-white`}>
                  <option value="">— Select Drug —</option>
                  {allDrugsForPicker?.map((d: any) => <option key={d.id} value={d.id}>{d.brand_name} ({d.drug_code})</option>)}
                </select></div>
              {returnDrugId && (
                <div><label className="block text-xs text-gray-500 mb-1">Batch</label>
                  <select {...returnForm.register('stock_id')} className={`${inputCls} bg-white`}>
                    <option value="">— Select Batch (optional) —</option>
                    {returnStock?.map((s: any) => <option key={s.id} value={s.id}>{s.batch_number} — {s.quantity_available} avail, exp {format(new Date(s.expiry_date), 'MMM yyyy')}</option>)}
                  </select></div>
              )}
              {returnForm.watch('direction') === 'from_patient' && (
                <div><label className="block text-xs text-gray-500 mb-1">Dispense Item ID *</label>
                  <input {...returnForm.register('dispense_item_id', { required: returnForm.watch('direction') === 'from_patient' })} type="number" className={inputCls} placeholder="From the dispense record" /></div>
              )}
              {returnForm.watch('direction') === 'to_supplier' && (
                <div><label className="block text-xs text-gray-500 mb-1">Supplier *</label>
                  <select {...returnForm.register('supplier_id', { required: returnForm.watch('direction') === 'to_supplier' })} className={`${inputCls} bg-white`}>
                    <option value="">— Select Supplier —</option>
                    {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Quantity *</label>
                  <input {...returnForm.register('quantity', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Reason *</label>
                  <input {...returnForm.register('reason', { required: true })} className={inputCls} placeholder="Damaged / Unused / Expired" /></div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center">Submit Return Request</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Return Requests</h2>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {returns?.map((r: any) => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{r.return_number}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${RETURN_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{r.direction.replace('_', ' ')} · Qty {r.quantity}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>
                  {r.status === 'requested' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => approveReturn.mutate(r.id)} className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100"><CheckCircle size={12} /> Approve</button>
                      <button onClick={() => rejectReturn.mutate(r.id)} className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"><XCircle size={12} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
              {!returns?.length && <p className="text-center text-gray-400 text-sm py-8">No return requests yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* DRUG TRANSFER (item 102) */}
      {tab === 'transfers' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><ArrowLeftRight size={14} /> Transfer Stock</h2>
            <form onSubmit={transferForm.handleSubmit(d => transferStockMutation.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Drug *</label>
                <select value={transferDrugId} onChange={e => { setTransferDrugId(e.target.value); transferForm.setValue('stock_id', '') }} className={`${inputCls} bg-white`}>
                  <option value="">— Select Drug —</option>
                  {allDrugsForPicker?.map((d: any) => <option key={d.id} value={d.id}>{d.brand_name} ({d.drug_code})</option>)}
                </select></div>
              {transferDrugId && (
                <div><label className="block text-xs text-gray-500 mb-1">Batch *</label>
                  <select {...transferForm.register('stock_id', { required: true })} className={`${inputCls} bg-white`}>
                    <option value="">— Select Batch —</option>
                    {transferStock?.map((s: any) => <option key={s.id} value={s.id}>{s.batch_number} — {s.quantity_available} avail{s.location ? ` @ ${s.location}` : ''}</option>)}
                  </select></div>
              )}
              <div><label className="block text-xs text-gray-500 mb-1">To Location *</label>
                <input {...transferForm.register('to_location', { required: true })} className={inputCls} placeholder="Ward Pharmacy / ICU Store" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">From Branch ID</label>
                  <input {...transferForm.register('from_branch_id')} type="number" className={inputCls} placeholder="Optional" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">To Branch ID</label>
                  <input {...transferForm.register('to_branch_id')} type="number" className={inputCls} placeholder="Optional — cross-branch" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Quantity *</label>
                  <input {...transferForm.register('quantity', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Reason</label>
                  <input {...transferForm.register('reason')} className={inputCls} placeholder="Optional" /></div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center">Transfer Stock</button>
              <p className="text-xs text-gray-400">Same-branch transfer just moves location on the batch; cross-branch splits into a new batch at the destination.</p>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Transfers</h2>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {transfers?.map((t: any) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">{t.transfer_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.from_location || '—'} → {t.to_location} · Qty {t.quantity}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              ))}
              {!transfers?.length && <p className="text-center text-gray-400 text-sm py-8">No transfers yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT (item 103) */}
      {tab === 'adjustments' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><SlidersHorizontal size={14} /> Adjust Stock</h2>
            <form onSubmit={adjustForm.handleSubmit(d => adjustStockMutation.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Drug *</label>
                <select value={adjustDrugId} onChange={e => { setAdjustDrugId(e.target.value); adjustForm.setValue('stock_id', '') }} className={`${inputCls} bg-white`}>
                  <option value="">— Select Drug —</option>
                  {allDrugsForPicker?.map((d: any) => <option key={d.id} value={d.id}>{d.brand_name} ({d.drug_code})</option>)}
                </select></div>
              {adjustDrugId && (
                <div><label className="block text-xs text-gray-500 mb-1">Batch *</label>
                  <select {...adjustForm.register('stock_id', { required: true })} className={`${inputCls} bg-white`}>
                    <option value="">— Select Batch —</option>
                    {adjustStockList?.map((s: any) => <option key={s.id} value={s.id}>{s.batch_number} — currently {s.quantity_available}</option>)}
                  </select></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Reason *</label>
                  <select {...adjustForm.register('reason', { required: true })} className={`${inputCls} bg-white`}>
                    {['damage', 'wastage', 'theft_loss', 'expiry_write_off', 'stock_count_correction'].map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">New Quantity *</label>
                  <input {...adjustForm.register('new_quantity', { required: true })} type="number" className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea {...adjustForm.register('notes')} rows={2} className={inputCls} /></div>
              <button type="submit" className="btn-primary w-full justify-center">Apply Adjustment</button>
              <p className="text-xs text-gray-400">"Expiry write-off" also deactivates the batch so it drops out of sellable stock.</p>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Adjustment History</h2>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {adjustments?.map((a: any) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 capitalize">{a.reason.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{a.quantity_before} → {a.quantity_after}</p>
                  </div>
                  {a.notes && <p className="text-xs text-gray-400 mt-0.5">{a.notes}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(a.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              ))}
              {!adjustments?.length && <p className="text-center text-gray-400 text-sm py-8">No adjustments recorded yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* ALERTS */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{alerts?.length ?? 0} active alerts</p>
          {alerts?.map((a: any, idx: number) => (
            <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${ALERT_COLORS[a.alert_type]}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{a.brand_name} <span className="font-normal opacity-70">({a.generic_name})</span></p>
                  <p className="text-xs opacity-70 font-mono">{a.drug_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold capitalize">{a.alert_type.replace(/_/g, ' ')}</p>
                {a.alert_type === 'low_stock' || a.alert_type === 'out_of_stock' ? (
                  <p className="text-xs opacity-70">Stock: {a.current_stock} / Reorder: {a.reorder_level}</p>
                ) : (
                  <p className="text-xs opacity-70">{a.days_to_expiry < 0 ? 'EXPIRED' : `${a.days_to_expiry} days left`} • {a.nearest_expiry ? format(new Date(a.nearest_expiry), 'dd MMM yyyy') : ''}</p>
                )}
              </div>
            </div>
          ))}
          {!alerts?.length && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Pill size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">No stock alerts — everything looks good!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
