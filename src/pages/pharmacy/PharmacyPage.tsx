import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { pharmacyService } from '../../services/api'
import { Pill, AlertTriangle, Plus, Search, ShoppingCart, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

const ALERT_COLORS: Record<string, string> = {
  out_of_stock: 'bg-red-100 text-red-700 border-red-200',
  low_stock: 'bg-amber-100 text-amber-700 border-amber-200',
  expiring_soon: 'bg-orange-100 text-orange-700 border-orange-200',
  expired: 'bg-red-900 text-white border-red-900',
}

export default function PharmacyPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'dashboard' | 'inventory' | 'dispense' | 'purchase' | 'alerts'>('dashboard')
  const [search, setSearch] = useState('')
  const [selectedDrug, setSelectedDrug] = useState<any>(null)
  const [dispenseItems, setDispenseItems] = useState<any[]>([])
  const { register, handleSubmit, reset } = useForm()
  const drugForm = useForm()
  const stockForm = useForm()
  const poForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['pharmacy-stats'], queryFn: () => pharmacyService.getDashboard().then(r => r.data) })
  const { data: drugs } = useQuery({ queryKey: ['drugs', search], queryFn: () => pharmacyService.listDrugs({ search: search || undefined }).then(r => r.data) })
  const { data: alerts } = useQuery({ queryKey: ['pharmacy-alerts'], queryFn: () => pharmacyService.getAlerts().then(r => r.data) })
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => pharmacyService.listSuppliers().then(r => r.data) })
  const { data: pos } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => pharmacyService.listPOs().then(r => r.data) })

  const createDrug = useMutation({
    mutationFn: (d: any) => pharmacyService.createDrug(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drugs'] }); drugForm.reset(); toast.success('Drug added to master') }
  })

  const addStock = useMutation({
    mutationFn: (d: any) => pharmacyService.addStock({ ...d, drug_id: parseInt(d.drug_id), quantity_received: parseInt(d.quantity_received), purchase_price: parseFloat(d.purchase_price), sale_price: parseFloat(d.sale_price) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drugs'] }); stockForm.reset(); toast.success('Stock added') }
  })

  const dispense = useMutation({
    mutationFn: (d: any) => pharmacyService.dispense(d),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['drugs'] }); setDispenseItems([]); reset(); toast.success(`Dispensed: ${res.data.dispense_number}`) }
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
          <button onClick={() => setTab('dispense')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
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
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['dashboard', 'inventory', 'dispense', 'purchase', 'alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Drug</button>
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
              <button type="submit" className="w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">Add Stock</button>
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
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
                <input {...register('patient_id', { required: true })} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Source</label>
                <select {...register('prescription_source')} className={`${inputCls} bg-white`}>
                  <option value="opd">OPD</option><option value="ipd">IPD</option><option value="external">External</option>
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">OPD Visit ID</label>
                <input {...register('opd_visit_id')} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Payment Mode</label>
                <select {...register('payment_mode')} className={`${inputCls} bg-white`}>
                  <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="credit">Credit</option>
                </select></div>
            </div>
            {dispenseItems.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between text-sm font-semibold mb-3">
                  <span>Net Total</span><span className="text-green-600">₹{totalDispense.toFixed(2)}</span>
                </div>
                <button onClick={handleSubmit(d => dispense.mutate({
                  ...d, patient_id: parseInt(d.patient_id),
                  opd_visit_id: d.opd_visit_id ? parseInt(d.opd_visit_id) : undefined,
                  items: dispenseItems
                }))} className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
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
