import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ambulanceService } from '../../services/api'
import { Truck, Fuel, Wrench, Plus, Navigation, PhoneCall } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Fleet', 'Active Trips', 'Request Trip']

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: 'Available', bg: '#F0FDF4', text: '#15803D' },
  on_trip: { label: 'On Trip', bg: '#EFF6FF', text: '#1D4ED8' },
  maintenance: { label: 'Maintenance', bg: '#FFFBEB', text: '#D97706' },
  out_of_service: { label: 'Out of Service', bg: '#FEF2F2', text: '#DC2626' },
  requested: { label: 'Requested', bg: '#F3F4F6', text: '#4B5563' },
  dispatched: { label: 'Dispatched', bg: '#EFF6FF', text: '#1D4ED8' },
  in_progress: { label: 'In Progress', bg: '#F5F3FF', text: '#7C3AED' },
  completed: { label: 'Completed', bg: '#F0FDF4', text: '#15803D' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
}

export default function AmbulancePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const vehicleForm = useForm<any>({ defaultValues: { vehicle_type: 'basic_life_support' } })
  const tripForm = useForm<any>({ defaultValues: { trip_type: 'emergency_pickup' } })
  const fuelForm = useForm<any>()
  const [fuelVehicleId, setFuelVehicleId] = useState<number | null>(null)

  const { data: dashboard } = useQuery({
    queryKey: ['amb-dashboard'],
    queryFn: () => ambulanceService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: vehicles } = useQuery({
    queryKey: ['amb-vehicles'],
    queryFn: () => ambulanceService.listVehicles().then(r => r.data),
  })
  const { data: activeTrips } = useQuery({
    queryKey: ['amb-active-trips'],
    queryFn: () => ambulanceService.activeTrips().then(r => r.data),
    enabled: tab === 2,
    refetchInterval: 15000,
  })
  const availableVehicles = vehicles?.filter((v: any) => v.status === 'available') || []

  const createVehicle = useMutation({
    mutationFn: (d: any) => ambulanceService.createVehicle(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amb-vehicles', 'amb-dashboard'] })
      vehicleForm.reset({ vehicle_type: 'basic_life_support' })
      setShowVehicleForm(false)
      toast.success('Vehicle added')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to add vehicle'),
  })

  const requestTrip = useMutation({
    mutationFn: (d: any) => ambulanceService.requestTrip(cleanPayload({ ...d, vehicle_id: parseInt(d.vehicle_id) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amb-dashboard', 'amb-active-trips', 'amb-vehicles'] })
      tripForm.reset({ trip_type: 'emergency_pickup' })
      toast.success('Trip requested')
      setTab(2)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to request trip'),
  })

  const dispatchTrip = useMutation({
    mutationFn: (id: number) => ambulanceService.dispatchTrip(id, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amb-active-trips'] })
      toast.success('Trip dispatched')
    },
    onError: () => toast.error('Dispatch failed'),
  })

  const completeTrip = useMutation({
    mutationFn: (id: number) => ambulanceService.completeTrip(id, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amb-active-trips', 'amb-vehicles', 'amb-dashboard'] })
      toast.success('Trip completed')
    },
    onError: () => toast.error('Failed to complete trip'),
  })

  const cancelTrip = useMutation({
    mutationFn: (id: number) => ambulanceService.cancelTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amb-active-trips', 'amb-vehicles', 'amb-dashboard'] })
      toast.success('Trip cancelled')
    },
    onError: () => toast.error('Failed to cancel trip'),
  })

  const addFuelLog = useMutation({
    mutationFn: (d: any) => ambulanceService.addFuelLog(cleanPayload({ ...d, vehicle_id: fuelVehicleId })),
    onSuccess: () => {
      fuelForm.reset()
      setFuelVehicleId(null)
      toast.success('Fuel log added')
    },
    onError: () => toast.error('Failed to add fuel log'),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Ambulance</h1>
          <p style={{ color: '#8B5CF6', fontSize: 13 }}>Fleet · Trips · Fuel & Maintenance</p>
        </div>
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
            { label: 'Total Vehicles', value: dashboard?.total_vehicles ?? 0, icon: Truck, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Available', value: dashboard?.available ?? 0, icon: Truck, color: '#15803D', bg: '#F0FDF4' },
            { label: 'On Trip', value: dashboard?.on_trip ?? 0, icon: Navigation, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'In Maintenance', value: dashboard?.in_maintenance ?? 0, icon: Wrench, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Trips Today', value: dashboard?.trips_today ?? 0, icon: PhoneCall, color: '#C2410C', bg: '#FFF7ED' },
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

      {/* FLEET */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowVehicleForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Add Vehicle
            </button>
          </div>

          {showVehicleForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Add Vehicle</h2>
              <form onSubmit={vehicleForm.handleSubmit(d => createVehicle.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input {...vehicleForm.register('vehicle_number', { required: true })} className={inputCls} placeholder="Vehicle Number (e.g. TN-38-AB-1234)" />
                <CustomSelect value={vehicleForm.watch('vehicle_type') || 'basic_life_support'} onChange={v => vehicleForm.setValue('vehicle_type', String(v))}
                  options={[{ value: 'basic_life_support', label: 'Basic Life Support' }, { value: 'advanced_life_support', label: 'Advanced Life Support' }, { value: 'patient_transport', label: 'Patient Transport' }, { value: 'neonatal', label: 'Neonatal' }]} />
                <input {...vehicleForm.register('make_model')} className={inputCls} placeholder="Make / Model" />
                <input {...vehicleForm.register('year')} type="number" className={inputCls} placeholder="Year" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={createVehicle.isPending} className="btn-primary">
                    {createVehicle.isPending ? 'Adding...' : 'Add Vehicle'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowVehicleForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {vehicles?.map((v: any) => (
              <div key={v.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>{v.vehicle_number}</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{v.make_model || '—'} {v.year ? `(${v.year})` : ''}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[v.status]?.bg, color: STATUS_CONFIG[v.status]?.text }}>
                    {STATUS_CONFIG[v.status]?.label || v.status}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
                  {v.location_updated_at ? `GPS updated ${format(new Date(v.location_updated_at), 'HH:mm, dd MMM')}` : 'No GPS data yet'}
                </p>
                <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setFuelVehicleId(v.id)}>
                  <Fuel size={12} style={{ marginRight: 4, display: 'inline' }} /> Log Fuel
                </button>
              </div>
            ))}
          </div>

          {fuelVehicleId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setFuelVehicleId(null)}>
              <div className="card" style={{ width: 400, padding: 20 }} onClick={e => e.stopPropagation()}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Log Fuel Fill-up</h2>
                <form onSubmit={fuelForm.handleSubmit(d => addFuelLog.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input {...fuelForm.register('liters', { required: true })} type="number" step="0.1" className={inputCls} placeholder="Liters" />
                  <input {...fuelForm.register('cost', { required: true })} type="number" step="0.01" className={inputCls} placeholder="Cost (₹)" />
                  <input {...fuelForm.register('odometer_reading')} type="number" className={inputCls} placeholder="Odometer Reading" />
                  <button type="submit" disabled={addFuelLog.isPending} className="btn-primary">
                    {addFuelLog.isPending ? 'Saving...' : 'Save'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE TRIPS */}
      {tab === 2 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Trip #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Pickup</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Requested</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!activeTrips?.length && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No active trips</td></tr>
              )}
              {activeTrips?.map((t: any) => (
                <tr key={t.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{t.trip_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 200 }}>{t.pickup_location}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(t.requested_at), 'HH:mm, dd MMM')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[t.status]?.bg, color: STATUS_CONFIG[t.status]?.text }}>
                      {STATUS_CONFIG[t.status]?.label || t.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.status === 'requested' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => dispatchTrip.mutate(t.id)}>Dispatch</button>
                      )}
                      {(t.status === 'dispatched' || t.status === 'in_progress') && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => completeTrip.mutate(t.id)}>Complete</button>
                      )}
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#DC2626' }} onClick={() => cancelTrip.mutate(t.id)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUEST TRIP */}
      {tab === 3 && (
        <div className="card" style={{ maxWidth: 560, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Request Ambulance Trip</h2>
          <form onSubmit={tripForm.handleSubmit(d => requestTrip.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Vehicle *</label>
              <select {...tripForm.register('vehicle_id', { required: true })} className={inputCls}>
                <option value="">— Select available vehicle —</option>
                {availableVehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type.replace(/_/g, ' ')})</option>
                ))}
              </select>
              {availableVehicles.length === 0 && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>No vehicles currently available</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Trip Type</label>
              <CustomSelect value={tripForm.watch('trip_type') || 'emergency_pickup'} onChange={v => tripForm.setValue('trip_type', String(v))}
                options={[{ value: 'emergency_pickup', label: 'Emergency Pickup' }, { value: 'hospital_transfer', label: 'Hospital Transfer' }, { value: 'discharge_transport', label: 'Discharge Transport' }, { value: 'other', label: 'Other' }]} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Pickup Location *</label>
              <input {...tripForm.register('pickup_location', { required: true })} className={inputCls} placeholder="Address / landmark" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Drop Location</label>
              <input {...tripForm.register('drop_location')} className={inputCls} placeholder="Destination (optional)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input {...tripForm.register('caller_name')} className={inputCls} placeholder="Caller Name" />
              <input {...tripForm.register('caller_phone')} className={inputCls} placeholder="Caller Phone" />
            </div>
            <button type="submit" disabled={requestTrip.isPending || availableVehicles.length === 0} className="btn-primary">
              {requestTrip.isPending ? 'Requesting...' : 'Request Trip'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
