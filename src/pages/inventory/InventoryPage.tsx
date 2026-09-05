import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { inventoryService } from '../../services/api'
import { Package, ShoppingCart, TrendingDown, ArrowRightLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Items & Vendors', 'Purchase Orders', 'Receive (GRN)', 'Stock & Movements']

export default function InventoryPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showVendorForm, setShowVendorForm] = useState(false)
  const [showPOForm, setShowPOForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [grnPO, setGrnPO] = useState<any>(null)

  const itemForm = useForm<any>({ defaultValues: { category: 'consumable', unit: 'piece' } })
  const vendorForm = useForm<any>()
  const poForm = useForm<any>({ defaultValues: { items: [{ item_id: '', quantity_ordered: 1, unit_price: 0 }] } })
  const { fields, append, remove } = useFieldArray({ control: poForm.control, name: 'items' })
  const grnForm = useForm<any>()
  const movementForm = useForm<any>({ defaultValues: { movement_type: 'issue' } })

  const { data: dashboard } = useQuery({
    queryKey: ['inv-dashboard'],
    queryFn: () => inventoryService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: items } = useQuery({
    queryKey: ['inv-items'],
    queryFn: () => inventoryService.listItems().then(r => r.data),
  })
  const { data: vendors } = useQuery({
    queryKey: ['inv-vendors'],
    queryFn: () => inventoryService.listVendors().then(r => r.data),
    enabled: tab === 1 || tab === 2,
  })
  const { data: pos } = useQuery({
    queryKey: ['inv-pos'],
    queryFn: () => inventoryService.listPOs().then(r => r.data),
    enabled: tab === 2 || tab === 3,
  })
  const { data: stock } = useQuery({
    queryKey: ['inv-stock'],
    queryFn: () => inventoryService.listStock().then(r => r.data),
    enabled: tab === 4,
  })
  const { data: movements } = useQuery({
    queryKey: ['inv-movements'],
    queryFn: () => inventoryService.listMovements().then(r => r.data),
    enabled: tab === 4,
  })

  const itemMap = Object.fromEntries((items || []).map((i: any) => [i.id, i]))

  const createItem = useMutation({
    mutationFn: (d: any) => inventoryService.createItem(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-items', 'inv-dashboard'] })
      itemForm.reset({ category: 'consumable', unit: 'piece' })
      setShowItemForm(false)
      toast.success('Item created')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to create item'),
  })

  const createVendor = useMutation({
    mutationFn: (d: any) => inventoryService.createVendor(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-vendors'] })
      vendorForm.reset()
      setShowVendorForm(false)
      toast.success('Vendor created')
    },
    onError: () => toast.error('Failed to create vendor'),
  })

  const createPO = useMutation({
    mutationFn: (d: any) => inventoryService.createPO(cleanPayload({
      ...d,
      vendor_id: parseInt(d.vendor_id),
      items: d.items.map((i: any) => ({ item_id: parseInt(i.item_id), quantity_ordered: parseInt(i.quantity_ordered), unit_price: parseFloat(i.unit_price) })),
    })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-pos', 'inv-dashboard'] })
      poForm.reset({ items: [{ item_id: '', quantity_ordered: 1, unit_price: 0 }] })
      setShowPOForm(false)
      toast.success('Purchase order created')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to create PO'),
  })

  const receiveGRN = useMutation({
    mutationFn: (d: any) => inventoryService.receiveGRN(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-pos', 'inv-stock', 'inv-dashboard'] })
      grnForm.reset()
      setGrnPO(null)
      toast.success('Goods received')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to receive goods'),
  })

  const recordMovement = useMutation({
    mutationFn: (d: any) => inventoryService.recordMovement(cleanPayload({ ...d, item_id: parseInt(d.item_id), quantity: parseInt(d.quantity) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-stock', 'inv-movements', 'inv-dashboard'] })
      movementForm.reset({ movement_type: 'issue' })
      setShowMovementForm(false)
      toast.success('Movement recorded')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to record movement'),
  })

  const movementType = movementForm.watch('movement_type')

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Inventory</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Items · Vendors · Purchase Orders · Stock Movements</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Total Items', value: dashboard?.total_items ?? 0, icon: Package, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Open Purchase Orders', value: dashboard?.open_purchase_orders ?? 0, icon: ShoppingCart, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Low Stock Items', value: dashboard?.low_stock_items ?? 0, icon: TrendingDown, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Movements Today', value: dashboard?.movements_today ?? 0, icon: ArrowRightLeft, color: '#15803D', bg: '#F0FDF4' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#1E1B4B' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ITEMS & VENDORS */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>Items</h3>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowItemForm(true)}><Plus size={12} style={{ marginRight: 4, display: 'inline' }} />Add Item</button>
            </div>
            {showItemForm && (
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <form onSubmit={itemForm.handleSubmit(d => createItem.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input {...itemForm.register('item_code', { required: true })} className={inputCls} placeholder="Item Code (unique)" />
                  <input {...itemForm.register('name', { required: true })} className={inputCls} placeholder="Item Name" />
                  <CustomSelect value={itemForm.watch('category') || 'consumable'} onChange={v => itemForm.setValue('category', String(v))}
                    options={[{ value: 'consumable', label: 'Consumable' }, { value: 'asset', label: 'Asset' }, { value: 'stationery', label: 'Stationery' }, { value: 'general', label: 'General' }]} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input {...itemForm.register('unit')} className={inputCls} placeholder="Unit (box/piece)" />
                    <input {...itemForm.register('reorder_level')} type="number" className={inputCls} placeholder="Reorder Level" />
                  </div>
                  <button type="submit" disabled={createItem.isPending} className="btn-primary">Add</button>
                </form>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {items?.map((i: any) => (
                <div key={i.id} className="card" style={{ padding: 10, fontSize: 12 }}>
                  <strong>{i.name}</strong> <span style={{ color: '#9CA3AF' }}>({i.item_code}) · {i.unit} · reorder@{i.reorder_level}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>Vendors</h3>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowVendorForm(true)}><Plus size={12} style={{ marginRight: 4, display: 'inline' }} />Add Vendor</button>
            </div>
            {showVendorForm && (
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <form onSubmit={vendorForm.handleSubmit(d => createVendor.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input {...vendorForm.register('name', { required: true })} className={inputCls} placeholder="Vendor Name" />
                  <input {...vendorForm.register('contact_person')} className={inputCls} placeholder="Contact Person" />
                  <input {...vendorForm.register('phone')} className={inputCls} placeholder="Phone" />
                  <button type="submit" disabled={createVendor.isPending} className="btn-primary">Add</button>
                </form>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {vendors?.map((v: any) => (
                <div key={v.id} className="card" style={{ padding: 10, fontSize: 12 }}>
                  <strong>{v.name}</strong> <span style={{ color: '#9CA3AF' }}>{v.contact_person ? `· ${v.contact_person}` : ''} {v.phone ? `· ${v.phone}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowPOForm(true)}>New Purchase Order</button>
          </div>

          {showPOForm && (
            <div className="card" style={{ maxWidth: 620, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Create Purchase Order</h2>
              <form onSubmit={poForm.handleSubmit(d => createPO.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select {...poForm.register('vendor_id', { required: true })} className={inputCls}>
                  <option value="">— Select vendor —</option>
                  {vendors?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>

                {fields.map((field, idx) => (
                  <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <select {...poForm.register(`items.${idx}.item_id`, { required: true })} className={inputCls}>
                      <option value="">— Item —</option>
                      {items?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <input {...poForm.register(`items.${idx}.quantity_ordered`, { required: true })} type="number" className={inputCls} placeholder="Qty" />
                    <input {...poForm.register(`items.${idx}.unit_price`, { required: true })} type="number" step="0.01" className={inputCls} placeholder="Unit Price" />
                    {fields.length > 1 && <button type="button" onClick={() => remove(idx)}><Trash2 size={14} color="#DC2626" /></button>}
                  </div>
                ))}
                <button type="button" className="btn-ghost" style={{ fontSize: 12, alignSelf: 'flex-start' }} onClick={() => append({ item_id: '', quantity_ordered: 1, unit_price: 0 })}>
                  <Plus size={12} style={{ marginRight: 4, display: 'inline' }} />Add Line Item
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={createPO.isPending} className="btn-primary">
                    {createPO.isPending ? 'Creating...' : 'Create PO'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowPOForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>PO #</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Order Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Items</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {!pos?.length && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No purchase orders yet</td></tr>
                )}
                {pos?.map((po: any) => (
                  <tr key={po.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{po.po_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(po.order_date), 'dd MMM yyyy')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{po.items?.length ?? 0} line items</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: po.status === 'received' ? '#F0FDF4' : po.status === 'partially_received' ? '#FFFBEB' : '#EFF6FF', color: po.status === 'received' ? '#15803D' : po.status === 'partially_received' ? '#D97706' : '#1D4ED8' }}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECEIVE (GRN) */}
      {tab === 3 && (
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>PO #</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pos?.filter((po: any) => po.status === 'sent' || po.status === 'partially_received').map((po: any) => (
                  <tr key={po.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{po.po_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{po.status.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { setGrnPO(po); grnForm.reset({ po_id: po.id, items: po.items.map((i: any) => ({ po_item_id: i.id, item_id: i.item_id, quantity_received: i.quantity_ordered - i.quantity_received })) }) }}>
                        Receive Goods
                      </button>
                    </td>
                  </tr>
                ))}
                {!pos?.filter((po: any) => po.status === 'sent' || po.status === 'partially_received').length && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No pending purchase orders to receive</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {grnPO && (
            <div className="card" style={{ maxWidth: 560, padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Receive Goods — {grnPO.po_number}</h2>
              <form onSubmit={grnForm.handleSubmit(d => receiveGRN.mutate({
                ...d,
                items: d.items.map((i: any) => ({ ...i, quantity_received: parseInt(i.quantity_received) })).filter((i: any) => i.quantity_received > 0),
              }))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {grnPO.items.map((poItem: any, idx: number) => (
                  <div key={poItem.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{itemMap[poItem.item_id]?.name || `Item #${poItem.item_id}`} (remaining: {poItem.quantity_ordered - poItem.quantity_received})</span>
                    <input {...grnForm.register(`items.${idx}.quantity_received`)} type="number" className={inputCls} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={receiveGRN.isPending} className="btn-primary">
                    {receiveGRN.isPending ? 'Receiving...' : 'Confirm Receipt'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setGrnPO(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* STOCK & MOVEMENTS */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowMovementForm(true)}>Record Movement</button>
          </div>

          {showMovementForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Record Stock Movement</h2>
              <form onSubmit={movementForm.handleSubmit(d => recordMovement.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select {...movementForm.register('item_id', { required: true })} className={inputCls}>
                  <option value="">— Select item —</option>
                  {items?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <CustomSelect value={movementType || 'issue'} onChange={v => movementForm.setValue('movement_type', String(v))}
                  options={[{ value: 'issue', label: 'Issue (to department)' }, { value: 'transfer', label: 'Transfer (between locations)' }, { value: 'return', label: 'Return (to store)' }, { value: 'adjustment', label: 'Adjustment (stock count)' }]} />
                <input {...movementForm.register('quantity', { required: true })} type="number" className={inputCls} placeholder={movementType === 'adjustment' ? 'Quantity (use negative to remove)' : 'Quantity'} />
                {(movementType === 'issue' || movementType === 'transfer') && (
                  <input {...movementForm.register('from_location')} className={inputCls} placeholder="From Location (default: Central Store)" />
                )}
                {(movementType === 'transfer' || movementType === 'return' || movementType === 'adjustment') && (
                  <input {...movementForm.register('to_location')} className={inputCls} placeholder="To Location (default: Central Store)" />
                )}
                {movementType === 'issue' && (
                  <input {...movementForm.register('department')} className={inputCls} placeholder="Department" />
                )}
                <textarea {...movementForm.register('reason')} className={inputCls} rows={2} placeholder="Reason (optional)" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={recordMovement.isPending} className="btn-primary">
                    {recordMovement.isPending ? 'Saving...' : 'Record Movement'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowMovementForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Current Stock</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {stock?.map((s: any) => (
                  <div key={s.id} className="card" style={{ padding: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{itemMap[s.item_id]?.name || `Item #${s.item_id}`} <span style={{ color: '#9CA3AF' }}>@ {s.location}</span></span>
                    <strong style={{ color: itemMap[s.item_id] && s.quantity_available <= itemMap[s.item_id].reorder_level ? '#DC2626' : '#1E1B4B' }}>{s.quantity_available}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Recent Movements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {movements?.map((m: any) => (
                  <div key={m.id} className="card" style={{ padding: 10, fontSize: 12 }}>
                    <strong>{m.movement_type}</strong> · {itemMap[m.item_id]?.name || `Item #${m.item_id}`} · Qty: {m.quantity}
                    <div style={{ color: '#9CA3AF', fontSize: 11 }}>{format(new Date(m.moved_at), 'HH:mm, dd MMM')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
