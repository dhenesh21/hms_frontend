import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { facilityService } from '../../services/api'
import { Wrench, AlertTriangle, ClipboardList, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Equipment', 'Service Requests']

const EQUIP_STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  operational: { bg: '#F0FDF4', text: '#15803D' },
  under_maintenance: { bg: '#FFFBEB', text: '#D97706' },
  out_of_service: { bg: '#FEF2F2', text: '#DC2626' },
  decommissioned: { bg: '#F3F4F6', text: '#4B5563' },
}

export default function FacilityPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [showEquipForm, setShowEquipForm] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [maintenanceModal, setMaintenanceModal] = useState<number | null>(null)
  const equipForm = useForm<any>()
  const requestForm = useForm<any>({ defaultValues: { priority: 'medium' } })
  const maintenanceForm = useForm<any>({ defaultValues: { maintenance_type: 'corrective' } })

  const { data: dashboard } = useQuery({
    queryKey: ['fac-dashboard'],
    queryFn: () => facilityService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: equipment } = useQuery({
    queryKey: ['fac-equipment'],
    queryFn: () => facilityService.listEquipment().then(r => r.data),
    enabled: tab === 1,
  })
  const { data: requests } = useQuery({
    queryKey: ['fac-requests'],
    queryFn: () => facilityService.listServiceRequests().then(r => r.data),
    enabled: tab === 2,
  })

  const registerEquipment = useMutation({
    mutationFn: (d: any) => facilityService.registerEquipment(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fac-equipment', 'fac-dashboard'] })
      equipForm.reset()
      setShowEquipForm(false)
      toast.success('Equipment registered')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to register equipment'),
  })

  const logMaintenance = useMutation({
    mutationFn: (d: any) => facilityService.logMaintenance(maintenanceModal!, cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fac-equipment', 'fac-dashboard'] })
      maintenanceForm.reset({ maintenance_type: 'corrective' })
      setMaintenanceModal(null)
      toast.success('Maintenance logged — equipment back to operational')
    },
    onError: () => toast.error('Failed to log maintenance'),
  })

  const markUnderMaintenance = useMutation({
    mutationFn: (id: number) => facilityService.updateEquipment(id, { status: 'under_maintenance' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fac-equipment', 'fac-dashboard'] })
      toast.success('Marked under maintenance')
    },
    onError: () => toast.error('Failed to update'),
  })

  const createRequest = useMutation({
    mutationFn: (d: any) => facilityService.createServiceRequest(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fac-requests', 'fac-dashboard'] })
      requestForm.reset({ priority: 'medium' })
      setShowRequestForm(false)
      toast.success('Service request created')
    },
    onError: () => toast.error('Failed to create request'),
  })

  const resolveRequest = useMutation({
    mutationFn: (id: number) => facilityService.updateServiceRequest(id, { status: 'resolved' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fac-requests', 'fac-dashboard'] })
      toast.success('Request resolved')
    },
    onError: () => toast.error('Failed to update'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Facility & Equipment</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Biomedical equipment · Facility service requests</p>
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
            { label: 'Total Equipment', value: dashboard?.total_equipment ?? 0, icon: ClipboardList, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Under Maintenance', value: dashboard?.under_maintenance ?? 0, icon: Wrench, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Out of Service', value: dashboard?.out_of_service ?? 0, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Open Requests', value: dashboard?.open_requests ?? 0, icon: ClipboardList, color: '#1D4ED8', bg: '#EFF6FF' },
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

      {/* EQUIPMENT */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowEquipForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Register Equipment
            </button>
          </div>

          {showEquipForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Register Equipment</h2>
              <form onSubmit={equipForm.handleSubmit(d => registerEquipment.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input {...equipForm.register('asset_code', { required: true })} className={inputCls} placeholder="Asset Code (unique)" />
                <input {...equipForm.register('name', { required: true })} className={inputCls} placeholder="Equipment Name" />
                <input {...equipForm.register('category')} className={inputCls} placeholder="Category (e.g. Ventilator)" />
                <input {...equipForm.register('department')} className={inputCls} placeholder="Department" />
                <input {...equipForm.register('manufacturer')} className={inputCls} placeholder="Manufacturer" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={registerEquipment.isPending} className="btn-primary">
                    {registerEquipment.isPending ? 'Registering...' : 'Register'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowEquipForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {equipment?.map((e: any) => (
              <div key={e.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{e.name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{e.asset_code} · {e.department || '—'}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, height: 'fit-content', background: EQUIP_STATUS_CONFIG[e.status]?.bg, color: EQUIP_STATUS_CONFIG[e.status]?.text }}>
                    {e.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {e.status === 'operational' && (
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => markUnderMaintenance.mutate(e.id)}>Flag for Maintenance</button>
                  )}
                  {e.status === 'under_maintenance' && (
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => setMaintenanceModal(e.id)}>Log Maintenance Done</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICE REQUESTS */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowRequestForm(true)}>New Request</button>
          </div>

          {showRequestForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>New Facility Service Request</h2>
              <form onSubmit={requestForm.handleSubmit(d => createRequest.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input {...requestForm.register('category', { required: true })} className={inputCls} placeholder="Category (e.g. Electrical, Plumbing)" />
                <textarea {...requestForm.register('description', { required: true })} className={inputCls} rows={2} placeholder="Description" />
                <input {...requestForm.register('location')} className={inputCls} placeholder="Location" />
                <CustomSelect value={requestForm.watch('priority') || 'medium'} onChange={v => requestForm.setValue('priority', String(v))}
                  options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={createRequest.isPending} className="btn-primary">
                    {createRequest.isPending ? 'Creating...' : 'Create Request'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowRequestForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Request #</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Priority</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!requests?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No service requests</td></tr>
                )}
                {requests?.map((r: any) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{r.request_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{r.category}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: r.priority === 'critical' ? '#DC2626' : '#374151', fontWeight: r.priority === 'critical' ? 700 : 400 }}>{r.priority}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{r.status}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {(r.status === 'open' || r.status === 'in_progress') && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => resolveRequest.mutate(r.id)}>Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {maintenanceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setMaintenanceModal(null)}>
          <div className="card" style={{ width: 420, padding: 20 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Log Maintenance</h2>
            <form onSubmit={maintenanceForm.handleSubmit(d => logMaintenance.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CustomSelect value={maintenanceForm.watch('maintenance_type') || 'corrective'} onChange={v => maintenanceForm.setValue('maintenance_type', String(v))}
                options={[{ value: 'preventive', label: 'Preventive' }, { value: 'corrective', label: 'Corrective' }, { value: 'calibration', label: 'Calibration' }]} />
              <textarea {...maintenanceForm.register('description', { required: true })} className={inputCls} rows={2} placeholder="Description" />
              <input {...maintenanceForm.register('performed_by')} className={inputCls} placeholder="Performed By (technician/vendor)" />
              <input {...maintenanceForm.register('cost')} type="number" step="0.01" className={inputCls} placeholder="Cost" />
              <button type="submit" disabled={logMaintenance.isPending} className="btn-primary">
                {logMaintenance.isPending ? 'Saving...' : 'Save & Restore Operational'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
