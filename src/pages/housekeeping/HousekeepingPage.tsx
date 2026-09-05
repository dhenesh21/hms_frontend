import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { housekeepingService, ipdService } from '../../services/api'
import { Sparkles, Shirt, Trash2, ClipboardCheck, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Cleaning Tasks', 'Linen', 'Waste']

const TASK_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#F3F4F6', text: '#4B5563' },
  in_progress: { label: 'In Progress', bg: '#FFFBEB', text: '#D97706' },
  completed: { label: 'Completed', bg: '#F0FDF4', text: '#15803D' },
  verified: { label: 'Verified', bg: '#F5F3FF', text: '#7C3AED' },
}

export default function HousekeepingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showLinenForm, setShowLinenForm] = useState(false)
  const [showWasteForm, setShowWasteForm] = useState(false)
  const taskForm = useForm<any>({ defaultValues: { task_type: 'routine' } })
  const linenForm = useForm<any>()
  const wasteForm = useForm<any>({ defaultValues: { waste_type: 'general' } })

  const { data: dashboard } = useQuery({
    queryKey: ['hk-dashboard'],
    queryFn: () => housekeepingService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: wards } = useQuery({
    queryKey: ['hk-wards'],
    queryFn: () => ipdService.listWards().then(r => r.data),
  })
  const { data: tasks } = useQuery({
    queryKey: ['hk-tasks'],
    queryFn: () => housekeepingService.pendingTasks().then(r => r.data),
    enabled: tab === 1,
  })
  const { data: linenLogs } = useQuery({
    queryKey: ['hk-linen'],
    queryFn: () => housekeepingService.listLinen().then(r => r.data),
    enabled: tab === 2,
  })
  const { data: wasteLogs } = useQuery({
    queryKey: ['hk-waste'],
    queryFn: () => housekeepingService.listWaste().then(r => r.data),
    enabled: tab === 3,
  })

  const createTask = useMutation({
    mutationFn: (d: any) => housekeepingService.createTask(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hk-tasks', 'hk-dashboard'] })
      taskForm.reset({ task_type: 'routine' })
      setShowTaskForm(false)
      toast.success('Cleaning task created')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to create task'),
  })

  const startTask = useMutation({
    mutationFn: (id: number) => housekeepingService.startTask(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hk-tasks'] }); toast.success('Task started') },
    onError: () => toast.error('Failed to start task'),
  })

  const completeTask = useMutation({
    mutationFn: (id: number) => housekeepingService.completeTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hk-tasks', 'hk-dashboard'] })
      toast.success('Task completed — bed is now available')
    },
    onError: () => toast.error('Failed to complete task'),
  })

  const sendLinen = useMutation({
    mutationFn: (d: any) => housekeepingService.sendLinen(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hk-linen', 'hk-dashboard'] })
      linenForm.reset()
      setShowLinenForm(false)
      toast.success('Linen log created')
    },
    onError: () => toast.error('Failed to log linen'),
  })

  const receiveLinen = useMutation({
    mutationFn: ({ id, quantity }: any) => housekeepingService.receiveLinen(id, { quantity_received: quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hk-linen', 'hk-dashboard'] })
      toast.success('Linen received')
    },
    onError: () => toast.error('Failed to mark received'),
  })

  const logWaste = useMutation({
    mutationFn: (d: any) => housekeepingService.logWaste(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hk-waste', 'hk-dashboard'] })
      wasteForm.reset({ waste_type: 'general' })
      setShowWasteForm(false)
      toast.success('Waste log created')
    },
    onError: () => toast.error('Failed to log waste'),
  })

  const disposeWaste = useMutation({
    mutationFn: ({ id, method }: any) => housekeepingService.disposeWaste(id, { disposal_method: method }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hk-waste', 'hk-dashboard'] })
      toast.success('Waste marked disposed')
    },
    onError: () => toast.error('Failed to mark disposed'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Housekeeping</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Cleaning tasks · Linen · Waste management</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {[
            { label: 'Pending Tasks', value: dashboard?.pending_tasks ?? 0, icon: ClipboardCheck, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Beds Awaiting Cleaning', value: dashboard?.beds_awaiting_cleaning ?? 0, icon: Sparkles, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Pending Linen Returns', value: dashboard?.pending_linen_returns ?? 0, icon: Shirt, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Pending Waste Disposal', value: dashboard?.pending_waste_disposal ?? 0, icon: Trash2, color: '#C2410C', bg: '#FFF7ED' },
            { label: 'Biomedical Waste Pending', value: dashboard?.biomedical_waste_pending ?? 0, icon: Trash2, color: '#DC2626', bg: '#FEF2F2' },
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

      {/* CLEANING TASKS */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowTaskForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> New Task
            </button>
          </div>

          {showTaskForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Create Cleaning Task</h2>
              <form onSubmit={taskForm.handleSubmit(d => createTask.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CustomSelect value={taskForm.watch('task_type') || 'routine'} onChange={v => taskForm.setValue('task_type', String(v))}
                  options={[{ value: 'routine', label: 'Routine' }, { value: 'discharge_cleaning', label: 'Discharge Cleaning' }, { value: 'deep_cleaning', label: 'Deep Cleaning' }, { value: 'spill_response', label: 'Spill Response' }]} />
                <select {...taskForm.register('ward_id')} className={inputCls}>
                  <option value="">— Select ward (optional) —</option>
                  {wards?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input {...taskForm.register('area_name')} className={inputCls} placeholder="Area name (e.g. Corridor, OT-2) if not ward/bed" />
                <textarea {...taskForm.register('notes')} className={inputCls} rows={2} placeholder="Notes" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={createTask.isPending} className="btn-primary">
                    {createTask.isPending ? 'Creating...' : 'Create Task'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowTaskForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Scheduled</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!tasks?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No pending cleaning tasks</td></tr>
                )}
                {tasks?.map((t: any) => (
                  <tr key={t.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{t.task_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{t.area_name || (t.bed_id ? `Bed #${t.bed_id}` : t.ward_id ? `Ward #${t.ward_id}` : '—')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(t.scheduled_at), 'HH:mm, dd MMM')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: TASK_STATUS_CONFIG[t.status]?.bg, color: TASK_STATUS_CONFIG[t.status]?.text }}>
                        {TASK_STATUS_CONFIG[t.status]?.label || t.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {t.status === 'pending' && (
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => startTask.mutate(t.id)}>Start</button>
                        )}
                        {t.status === 'in_progress' && (
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => completeTask.mutate(t.id)}>Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LINEN */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowLinenForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Send Linen
            </button>
          </div>

          {showLinenForm && (
            <div className="card" style={{ maxWidth: 420, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Send Linen to Laundry</h2>
              <form onSubmit={linenForm.handleSubmit(d => sendLinen.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select {...linenForm.register('ward_id')} className={inputCls}>
                  <option value="">— Select ward (optional) —</option>
                  {wards?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input {...linenForm.register('item_name', { required: true })} className={inputCls} placeholder="Item (e.g. Bedsheet)" />
                <input {...linenForm.register('quantity_sent', { required: true })} type="number" className={inputCls} placeholder="Quantity" />
                <CustomSelect value={linenForm.watch('is_soiled') || 'normal'} onChange={v => linenForm.setValue('is_soiled', String(v))}
                  options={[{ value: 'normal', label: 'Normal' }, { value: 'soiled', label: 'Soiled' }, { value: 'infected', label: 'Infected' }]} />
                <button type="submit" disabled={sendLinen.isPending} className="btn-primary">
                  {sendLinen.isPending ? 'Sending...' : 'Send Linen'}
                </button>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Item</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Sent Qty</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Received Qty</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!linenLogs?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No linen logs yet</td></tr>
                )}
                {linenLogs?.map((l: any) => (
                  <tr key={l.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{l.item_name} <span style={{ color: '#9CA3AF', fontSize: 11 }}>({l.is_soiled})</span></td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{l.quantity_sent}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{l.quantity_received ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: l.received_at ? '#F0FDF4' : '#FFFBEB', color: l.received_at ? '#15803D' : '#D97706' }}>
                        {l.received_at ? 'Received' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {!l.received_at && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => {
                            const qty = prompt('Quantity received?', String(l.quantity_sent))
                            if (qty) receiveLinen.mutate({ id: l.id, quantity: parseInt(qty) })
                          }}>
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WASTE */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowWasteForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Log Waste
            </button>
          </div>

          {showWasteForm && (
            <div className="card" style={{ maxWidth: 420, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Log Waste Collection</h2>
              <form onSubmit={wasteForm.handleSubmit(d => logWaste.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select {...wasteForm.register('ward_id')} className={inputCls}>
                  <option value="">— Select ward (optional) —</option>
                  {wards?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <CustomSelect value={wasteForm.watch('waste_type') || 'general'} onChange={v => wasteForm.setValue('waste_type', String(v))}
                  options={[{ value: 'general', label: 'General' }, { value: 'biomedical', label: 'Biomedical' }, { value: 'sharps', label: 'Sharps' }, { value: 'hazardous', label: 'Hazardous' }]} />
                <input {...wasteForm.register('weight_kg')} type="number" step="0.1" className={inputCls} placeholder="Weight (kg)" />
                <button type="submit" disabled={logWaste.isPending} className="btn-primary">
                  {logWaste.isPending ? 'Logging...' : 'Log Waste'}
                </button>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Weight</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Collected</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!wasteLogs?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No waste logs yet</td></tr>
                )}
                {wasteLogs?.map((w: any) => (
                  <tr key={w.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: w.waste_type === 'biomedical' || w.waste_type === 'hazardous' ? '#DC2626' : '#374151', fontWeight: w.waste_type === 'biomedical' ? 700 : 400 }}>
                      {w.waste_type}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{w.weight_kg ? `${w.weight_kg} kg` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(w.collected_at), 'HH:mm, dd MMM')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: w.disposed_at ? '#F0FDF4' : '#FFFBEB', color: w.disposed_at ? '#15803D' : '#D97706' }}>
                        {w.disposed_at ? 'Disposed' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {!w.disposed_at && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => {
                            const method = prompt('Disposal method?', 'Incineration via licensed vendor')
                            if (method) disposeWaste.mutate({ id: w.id, method })
                          }}>
                          Mark Disposed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
