import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { cssdService } from '../../services/api'
import { Package, CheckCircle, XCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Receive Items', 'Active Cycles']

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  received: { label: 'Received', bg: '#F3F4F6', text: '#4B5563' },
  washing: { label: 'Washing', bg: '#EFF6FF', text: '#1D4ED8' },
  sterilizing: { label: 'Sterilizing', bg: '#FFFBEB', text: '#D97706' },
  quality_check: { label: 'Quality Check', bg: '#F5F3FF', text: '#7C3AED' },
  ready: { label: 'Ready', bg: '#F0FDF4', text: '#15803D' },
  dispatched: { label: 'Dispatched', bg: '#F0FDF4', text: '#15803D' },
  failed: { label: 'Failed', bg: '#FEF2F2', text: '#DC2626' },
}

export default function CSSDPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const form = useForm<any>({ defaultValues: { method: 'autoclave', quantity: 1 } })

  const { data: dashboard } = useQuery({
    queryKey: ['cssd-dashboard'],
    queryFn: () => cssdService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: cycles } = useQuery({
    queryKey: ['cssd-active'],
    queryFn: () => cssdService.activeCycles().then(r => r.data),
    enabled: tab === 2,
    refetchInterval: 15000,
  })

  const receiveItems = useMutation({
    mutationFn: (d: any) => cssdService.receiveItems(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cssd-active', 'cssd-dashboard'] })
      form.reset({ method: 'autoclave', quantity: 1 })
      toast.success('Items received')
      setTab(2)
    },
    onError: () => toast.error('Failed to receive items'),
  })

  const startSterilization = useMutation({
    mutationFn: (id: number) => cssdService.startSterilization(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cssd-active'] }); toast.success('Sterilization started') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const qualityCheck = useMutation({
    mutationFn: ({ id, passed }: any) => cssdService.qualityCheck(id, { passed }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cssd-active', 'cssd-dashboard'] })
      toast.success(vars.passed ? 'Quality check passed' : 'Quality check failed - cycle flagged')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const dispatch = useMutation({
    mutationFn: ({ id, to }: any) => cssdService.dispatch(id, { dispatched_to: to }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cssd-active', 'cssd-dashboard'] })
      toast.success('Dispatched')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">CSSD</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Central Sterile Services · Instrument sterilization tracking</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'In Process', value: dashboard?.in_process ?? 0, icon: Package, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Ready for Dispatch', value: dashboard?.ready_for_dispatch ?? 0, icon: CheckCircle, color: '#15803D', bg: '#F0FDF4' },
            { label: 'Failed Cycles', value: dashboard?.failed_cycles ?? 0, icon: XCircle, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Dispatched Today', value: dashboard?.dispatched_today ?? 0, icon: Send, color: '#7C3AED', bg: '#F5F3FF' },
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

      {/* RECEIVE ITEMS */}
      {tab === 1 && (
        <div className="card" style={{ maxWidth: 480, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Receive Dirty Instruments</h2>
          <form onSubmit={form.handleSubmit(d => receiveItems.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input {...form.register('item_set_name', { required: true })} className={inputCls} placeholder="Item Set Name (e.g. General Surgery Set A)" />
            <input {...form.register('source_department')} className={inputCls} placeholder="Source Department (e.g. OT-1)" />
            <input {...form.register('quantity')} type="number" className={inputCls} placeholder="Quantity" />
            <CustomSelect value={form.watch('method') || 'autoclave'} onChange={v => form.setValue('method', String(v))}
              options={[{ value: 'autoclave', label: 'Autoclave' }, { value: 'eto', label: 'ETO' }, { value: 'plasma', label: 'Plasma' }, { value: 'dry_heat', label: 'Dry Heat' }, { value: 'chemical', label: 'Chemical' }]} />
            <input {...form.register('batch_indicator_number')} className={inputCls} placeholder="Biological Indicator Batch # (optional)" />
            <button type="submit" disabled={receiveItems.isPending} className="btn-primary">
              {receiveItems.isPending ? 'Receiving...' : 'Receive Items'}
            </button>
          </form>
        </div>
      )}

      {/* ACTIVE CYCLES */}
      {tab === 2 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Cycle #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Item Set</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Received</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!cycles?.length && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No active sterilization cycles</td></tr>
              )}
              {cycles?.map((c: any) => (
                <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{c.cycle_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{c.item_set_name}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(c.received_at), 'HH:mm, dd MMM')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[c.status]?.bg, color: STATUS_CONFIG[c.status]?.text }}>
                      {STATUS_CONFIG[c.status]?.label || c.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.status === 'received' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => startSterilization.mutate(c.id)}>Start Sterilizing</button>
                      )}
                      {c.status === 'sterilizing' && (
                        <>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => qualityCheck.mutate({ id: c.id, passed: true })}>Pass</button>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#DC2626' }} onClick={() => qualityCheck.mutate({ id: c.id, passed: false })}>Fail</button>
                        </>
                      )}
                      {c.status === 'ready' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => {
                            const to = prompt('Dispatch to?', c.source_department || '')
                            if (to) dispatch.mutate({ id: c.id, to })
                          }}>
                          Dispatch
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
