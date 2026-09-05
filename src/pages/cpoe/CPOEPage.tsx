import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { cpoeService, patientService, doctorService } from '../../services/api'
import { ClipboardList, Plus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const ORDER_TYPES = ['lab', 'radiology', 'medication', 'nursing', 'procedure', 'diet', 'consultation', 'blood_bank', 'other']

export default function CPOEPage() {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState('')
  const [queueType, setQueueType] = useState('lab')
  const form = useForm<any>({ defaultValues: { priority: 'routine', order_type: 'lab' } })

  const { data: patients } = useQuery({ queryKey: ['patients-all'], queryFn: () => patientService.list({ limit: 200 }).then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorService.list({ limit: 200 }).then(r => r.data) })
  const { data: myOrders } = useQuery({
    queryKey: ['cpoe-orders', patientId],
    queryFn: () => cpoeService.listOrders({ patient_id: patientId }).then(r => r.data),
    enabled: !!patientId,
  })
  const { data: queue } = useQuery({
    queryKey: ['cpoe-queue', queueType],
    queryFn: () => cpoeService.getQueue(queueType).then(r => r.data),
    refetchInterval: 20000,
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => cpoeService.createOrder(cleanPayload({
      ...d, patient_id: parseInt(d.patient_id), ordering_doctor_id: parseInt(d.ordering_doctor_id),
    })),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cpoe-orders', 'cpoe-queue'] })
      form.reset({ priority: 'routine', order_type: form.getValues('order_type') })
      const alerts = res.data?.safety_check_result
      if (alerts?.allergy) toast.error(`Allergy alert: ${alerts.allergy.matched_allergens?.join(', ')}`)
      if (alerts?.cds_alerts?.length) alerts.cds_alerts.forEach((a: any) => toast(a.message, { icon: '⚠️' }))
      if (!alerts) toast.success('Order placed')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to place order'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => cpoeService.updateOrder(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cpoe-orders', 'cpoe-queue'] }); toast.success('Order updated') },
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">CPOE — Clinical Orders</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Computerized order entry across lab, radiology, pharmacy, nursing & more</p>
      </div>

      <div className="card" style={{ maxWidth: 640, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Place New Order</h2>
        <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Patient *</label>
              <select {...form.register('patient_id', { required: true })} className={inputCls}>
                <option value="">— Select patient —</option>
                {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Ordering Doctor *</label>
              <select {...form.register('ordering_doctor_id', { required: true })} className={inputCls}>
                <option value="">— Select doctor —</option>
                {doctors?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name || d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Order Type</label>
              <CustomSelect value={form.watch('order_type')} onChange={v => form.setValue('order_type', String(v))}
                options={ORDER_TYPES.map(t => ({ value: t, label: t.replace('_', ' ') }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Priority</label>
              <CustomSelect value={form.watch('priority')} onChange={v => form.setValue('priority', String(v))}
                options={[{ value: 'routine', label: 'Routine' }, { value: 'urgent', label: 'Urgent' }, { value: 'stat', label: 'STAT' }]} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Item / Test / Drug Name *</label>
            <input {...form.register('item_name', { required: true })} className={inputCls} placeholder="e.g. CBC, Metronidazole 400mg, Chest X-ray" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Instructions</label>
            <textarea {...form.register('instructions')} className={inputCls} rows={2} />
          </div>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Placing…' : 'Place Order'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Orders by Patient</h3>
          <select value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} style={{ marginBottom: 12 }}>
            <option value="">— Select patient to view orders —</option>
            {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.uhid} — {p.first_name} {p.last_name}</option>)}
          </select>
          {myOrders?.map((o: any) => (
            <div key={o.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{o.item_name}</span>
                <span style={{ color: '#8B5CF6' }}>{o.status}</span>
              </div>
              <div style={{ color: '#9CA3AF' }}>{o.order_type} · {o.priority} · {format(new Date(o.created_at), 'dd MMM HH:mm')}</div>
              {o.safety_check_result && (
                <div style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertTriangle size={12} /> Safety alert on this order
                </div>
              )}
              {!['completed', 'cancelled'].includes(o.status) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['acknowledged', 'in_progress', 'completed', 'cancelled'].map(s => (
                    <button key={s} onClick={() => updateMutation.mutate({ id: o.id, status: s })}
                      style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff' }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}><ClipboardList size={14} style={{ marginRight: 6, display: 'inline' }} />Department Queue</h3>
            <CustomSelect value={queueType} onChange={v => setQueueType(String(v))}
              options={ORDER_TYPES.map(t => ({ value: t, label: t.replace('_', ' ') }))} />
          </div>
          {queue?.length ? queue.map((o: any) => (
            <div key={o.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{o.item_name}</span>
                <span style={{ color: o.priority === 'stat' ? '#DC2626' : '#8B5CF6', fontWeight: 700 }}>{o.priority}</span>
              </div>
              <div style={{ color: '#9CA3AF' }}>Patient #{o.patient_id} · {o.status}</div>
            </div>
          )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>Nothing pending in this queue.</p>}
        </div>
      </div>
    </div>
  )
}
