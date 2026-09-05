import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { emergencyService } from '../../services/api'
import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { Siren, Users, AlertTriangle, FileWarning, Activity, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Active Queue', 'Register Patient', 'MLC Register']

const TRIAGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  level_1_resuscitation: { label: 'L1 - Resuscitation', bg: '#FEF2F2', text: '#DC2626' },
  level_2_emergent: { label: 'L2 - Emergent', bg: '#FFF7ED', text: '#C2410C' },
  level_3_urgent: { label: 'L3 - Urgent', bg: '#FFFBEB', text: '#D97706' },
  level_4_less_urgent: { label: 'L4 - Less Urgent', bg: '#F0FDF4', text: '#15803D' },
  level_5_non_urgent: { label: 'L5 - Non Urgent', bg: '#EFF6FF', text: '#1D4ED8' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  waiting: { label: 'Waiting', bg: '#F3F4F6', text: '#4B5563' },
  in_triage: { label: 'In Triage', bg: '#FFFBEB', text: '#D97706' },
  in_treatment: { label: 'In Treatment', bg: '#EFF6FF', text: '#1D4ED8' },
  admitted: { label: 'Admitted', bg: '#F0FDF4', text: '#15803D' },
  discharged: { label: 'Discharged', bg: '#F5F3FF', text: '#7C3AED' },
  referred_out: { label: 'Referred Out', bg: '#FFF7ED', text: '#C2410C' },
  deceased: { label: 'Deceased', bg: '#F3F4F6', text: '#374151' },
  left_without_treatment: { label: 'LWOT', bg: '#FEF2F2', text: '#DC2626' },
}

export default function EmergencyPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const regForm = useForm<any>({ defaultValues: { arrival_mode: 'walk_in', is_mlc: false, is_trauma: false, police_informed: false } })

  const { data: dashboard } = useQuery({
    queryKey: ['er-dashboard'],
    queryFn: () => emergencyService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: activeQueue } = useQuery({
    queryKey: ['er-active'],
    queryFn: () => emergencyService.activeQueue().then(r => r.data),
    enabled: tab === 1,
    refetchInterval: 15000,
  })
  const { data: mlcCases } = useQuery({
    queryKey: ['er-mlc'],
    queryFn: () => emergencyService.mlcRegister().then(r => r.data),
    enabled: tab === 3,
  })

  const registerVisit = useMutation({
    mutationFn: (d: any) => {
      const payload = cleanPayload({
        ...d,
        patient_id: parseInt(selectedPatientId),
      })
      // Only send triage if a level was actually selected - an empty/partial
      // triage object would fail backend validation (triage_level required).
      if (!payload.triage?.triage_level) {
        delete payload.triage
      }
      return emergencyService.registerVisit(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['er-dashboard', 'er-active', 'er-mlc'] })
      regForm.reset()
      setSelectedPatientId('')
      toast.success('Patient registered in ER')
      setTab(1)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Registration failed'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => emergencyService.updateVisit(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['er-dashboard', 'er-active'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Update failed'),
  })

  const isMlc = regForm.watch('is_mlc')

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Emergency</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>ER registration · Triage · MLC / Accident register</p>
      </div>

      {(dashboard?.critical_active ?? 0) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 16 }}>
          <AlertTriangle size={16} color="#DC2626" />
          <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
            {dashboard.critical_active} critical (Level 1) patient{dashboard.critical_active > 1 ? 's' : ''} in ER right now
          </p>
        </div>
      )}

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
            { label: 'Visits Today', value: dashboard?.total_visits_today ?? 0, icon: Users, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Active in ER', value: dashboard?.active_in_er ?? 0, icon: Activity, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Critical (L1)', value: dashboard?.critical_active ?? 0, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'MLC Cases Today', value: dashboard?.mlc_cases_today ?? 0, icon: FileWarning, color: '#C2410C', bg: '#FFF7ED' },
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

      {/* ACTIVE QUEUE */}
      {tab === 1 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>ER #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Arrival</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Complaint</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>MLC</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!activeQueue?.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No active ER patients</td></tr>
              )}
              {activeQueue?.map((v: any) => (
                <tr key={v.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{v.er_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>
                    <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                    {format(new Date(v.arrival_time), 'HH:mm, dd MMM')}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 220 }}>{v.chief_complaint}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[v.status]?.bg, color: STATUS_CONFIG[v.status]?.text }}>
                      {STATUS_CONFIG[v.status]?.label || v.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {v.is_mlc && <FileWarning size={14} color="#DC2626" />}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {v.status !== 'in_treatment' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => updateStatus.mutate({ id: v.id, status: 'in_treatment' })}>
                          Treat
                        </button>
                      )}
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }}
                        onClick={() => updateStatus.mutate({ id: v.id, status: 'discharged' })}>
                        Discharge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REGISTER PATIENT */}
      {tab === 2 && (
        <div className="card" style={{ maxWidth: 640, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Register ER Patient</h2>
          <form onSubmit={regForm.handleSubmit(d => {
            if (!selectedPatientId) return toast.error('Please select a patient')
            registerVisit.mutate(d)
          })} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Patient *</label>
              <PatientSearchInput inputCls={inputCls} onChange={setSelectedPatientId} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Chief Complaint *</label>
              <input {...regForm.register('chief_complaint', { required: true })} className={inputCls} placeholder="e.g. Chest pain, breathlessness" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Arrival Mode</label>
                <CustomSelect value={regForm.watch('arrival_mode') || ''} onChange={v => regForm.setValue('arrival_mode', String(v))}
                  options={[{ value: 'walk_in', label: 'Walk-in' }, { value: 'ambulance', label: 'Ambulance' }, { value: 'police', label: 'Police' }, { value: 'referred', label: 'Referred' }, { value: 'brought_dead', label: 'Brought Dead' }]} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Brought By</label>
                <input {...regForm.register('brought_by')} className={inputCls} placeholder="Name / relation / service" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...regForm.register('is_trauma')} /> Trauma case
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...regForm.register('is_mlc')} /> Medico-Legal Case (MLC)
              </label>
            </div>

            {isMlc && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>Incident Type</label>
                    <input {...regForm.register('incident_type')} className={inputCls} placeholder="e.g. RTA, Assault, Fall" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>FIR Number</label>
                    <input {...regForm.register('fir_number')} className={inputCls} placeholder="FIR / case number" />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#991B1B' }}>
                  <input type="checkbox" {...regForm.register('police_informed')} /> Police informed
                </label>
                <input {...regForm.register('police_station')} className={inputCls} placeholder="Police station name" />
              </div>
            )}

            <div style={{ borderTop: '1px solid #F3F0FF', paddingTop: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}>Initial Triage (optional, can be added later)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Triage Level</label>
                  <CustomSelect value={regForm.watch('triage.triage_level') || ''} onChange={v => regForm.setValue('triage.triage_level', String(v))}
                    placeholder="— Not triaged yet —"
                    options={[{ value: '', label: '— Not triaged yet —' }, ...Object.entries(TRIAGE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))]} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Pulse Rate</label>
                  <input {...regForm.register('triage.pulse_rate')} type="number" className={inputCls} placeholder="bpm" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>BP Systolic</label>
                  <input {...regForm.register('triage.blood_pressure_systolic')} type="number" className={inputCls} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>SpO2 (%)</label>
                  <input {...regForm.register('triage.oxygen_saturation')} type="number" step="0.1" className={inputCls} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={registerVisit.isPending} className="btn-primary" style={{ marginTop: 4 }}>
              <Siren size={14} style={{ marginRight: 6 }} />
              {registerVisit.isPending ? 'Registering...' : 'Register ER Patient'}
            </button>
          </form>
        </div>
      )}

      {/* MLC REGISTER */}
      {tab === 3 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>ER #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Date</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Incident Type</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Police Station</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>FIR No.</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!mlcCases?.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No MLC cases recorded</td></tr>
              )}
              {mlcCases?.map((v: any) => (
                <tr key={v.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{v.er_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(v.arrival_time), 'dd MMM yyyy')}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{v.incident_type || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{v.police_station || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{v.fir_number || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[v.status]?.bg, color: STATUS_CONFIG[v.status]?.text }}>
                      {STATUS_CONFIG[v.status]?.label || v.status}
                    </span>
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
