import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { criticalCareService, ipdService } from '../../services/api'
import { HeartPulse, Wind, Activity, Users, Plus, ArrowDownCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const UNIT_TABS = [
  { key: 'icu', label: 'ICU' },
  { key: 'ccu', label: 'CCU' },
  { key: 'nicu', label: 'NICU' },
]

export default function CriticalCarePage() {
  const qc = useQueryClient()
  const [unit, setUnit] = useState('icu')
  const [showAdmitForm, setShowAdmitForm] = useState(false)
  const [roundPatient, setRoundPatient] = useState<any>(null)
  const admitForm = useForm<any>({ defaultValues: { unit_type: 'icu', code_status: 'full_code' } })
  const roundForm = useForm<any>()

  const { data: dashboard } = useQuery({
    queryKey: ['cc-dashboard'],
    queryFn: () => criticalCareService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: activePatients } = useQuery({
    queryKey: ['cc-active', unit],
    queryFn: () => criticalCareService.list({ unit_type: unit, active_only: true }).then(r => r.data),
    refetchInterval: 20000,
  })
  const { data: eligibleAdmissions } = useQuery({
    queryKey: ['ipd-active-for-cc'],
    queryFn: () => ipdService.getActiveAdmissions().then(r => r.data),
    enabled: showAdmitForm,
  })
  const { data: rounds } = useQuery({
    queryKey: ['cc-rounds', roundPatient?.id],
    queryFn: () => criticalCareService.listRounds(roundPatient.id).then(r => r.data),
    enabled: !!roundPatient,
  })

  const admitMutation = useMutation({
    mutationFn: (d: any) => criticalCareService.admit(cleanPayload({ ...d, ipd_admission_id: parseInt(d.ipd_admission_id) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-dashboard', 'cc-active'] })
      admitForm.reset({ unit_type: unit, code_status: 'full_code' })
      setShowAdmitForm(false)
      toast.success('Patient admitted to critical care')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Admission failed'),
  })

  const stepDownMutation = useMutation({
    mutationFn: ({ id, notes }: any) => criticalCareService.stepDown(id, { step_down_notes: notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-dashboard', 'cc-active'] })
      toast.success('Patient stepped down')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Step-down failed'),
  })

  const addRoundMutation = useMutation({
    mutationFn: (d: any) => criticalCareService.addRound(roundPatient.id, cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-rounds', roundPatient.id] })
      roundForm.reset()
      toast.success('Round recorded')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to record round'),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Critical Care</h1>
          <p style={{ color: '#8B5CF6', fontSize: 13 }}>ICU · CCU · NICU monitoring</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAdmitForm(true); admitForm.reset({ unit_type: unit, code_status: 'full_code' }) }}>
          <Plus size={14} style={{ marginRight: 6 }} /> Admit to Critical Care
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {UNIT_TABS.map(u => (
          <div key={u.key} className="card" style={{ padding: 16, cursor: 'pointer', border: unit === u.key ? '2px solid #7C3AED' : '1px solid #E5E7EB' }} onClick={() => setUnit(u.key)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartPulse size={17} color="#7C3AED" />
              </div>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{u.label} Active</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#1E1B4B' }}>{dashboard?.by_unit?.[u.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
          <Users size={14} /> {dashboard?.total_active ?? 0} total active
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
          <Wind size={14} /> {dashboard?.on_ventilator ?? 0} on ventilator
        </div>
      </div>

      {showAdmitForm && (
        <div className="card" style={{ maxWidth: 560, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Admit to Critical Care</h2>
          <form onSubmit={admitForm.handleSubmit(d => admitMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>IPD Admission *</label>
              <select {...admitForm.register('ipd_admission_id', { required: true })} className={inputCls}>
                <option value="">— Select admitted patient —</option>
                {eligibleAdmissions?.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.admission_number} — {a.patient_name || `Patient #${a.patient_id}`}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Unit</label>
                <CustomSelect value={admitForm.watch('unit_type') || 'icu'} onChange={v => admitForm.setValue('unit_type', String(v))}
                  options={[{ value: 'icu', label: 'ICU' }, { value: 'ccu', label: 'CCU' }, { value: 'nicu', label: 'NICU' }]} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Code Status</label>
                <CustomSelect value={admitForm.watch('code_status') || 'full_code'} onChange={v => admitForm.setValue('code_status', String(v))}
                  options={[{ value: 'full_code', label: 'Full Code' }, { value: 'dnr', label: 'DNR' }, { value: 'dni', label: 'DNI' }, { value: 'comfort_care', label: 'Comfort Care' }]} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Admission Reason *</label>
              <textarea {...admitForm.register('admission_reason', { required: true })} className={inputCls} rows={2} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...admitForm.register('on_ventilator')} /> On Ventilator
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...admitForm.register('central_line')} /> Central Line
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...admitForm.register('urinary_catheter')} /> Catheter
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={admitMutation.isPending} className="btn-primary">
                {admitMutation.isPending ? 'Admitting...' : 'Admit'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowAdmitForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAF5FF' }}>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Admitted</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Reason</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Code Status</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Support</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!activePatients?.length && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No active {unit.toUpperCase()} patients</td></tr>
            )}
            {activePatients?.map((p: any) => (
              <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(p.admitted_at), 'HH:mm, dd MMM')}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 220 }}>{p.admission_reason}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: p.code_status === 'full_code' ? '#F0FDF4' : '#FEF2F2', color: p.code_status === 'full_code' ? '#15803D' : '#DC2626' }}>
                    {p.code_status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.on_ventilator && <span title="On Ventilator"><Wind size={14} color="#1D4ED8" /></span>}
                    {p.central_line && <span title="Central Line"><Activity size={14} color="#C2410C" /></span>}
                  </div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setRoundPatient(p)}>
                      Rounds
                    </button>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }}
                      onClick={() => stepDownMutation.mutate({ id: p.id, notes: 'Stepped down to general ward' })}>
                      <ArrowDownCircle size={12} style={{ marginRight: 3, display: 'inline' }} />
                      Step Down
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {roundPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setRoundPatient(null)}>
          <div className="card" style={{ width: 560, maxHeight: '85vh', overflowY: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Monitoring Rounds — {roundPatient.admission_reason}</h2>
            <form onSubmit={roundForm.handleSubmit(d => addRoundMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F3F0FF' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <input {...roundForm.register('heart_rate')} type="number" className={inputCls} placeholder="HR (bpm)" />
                <input {...roundForm.register('blood_pressure_systolic')} type="number" className={inputCls} placeholder="BP Sys" />
                <input {...roundForm.register('oxygen_saturation')} type="number" step="0.1" className={inputCls} placeholder="SpO2 %" />
              </div>
              {roundPatient.on_ventilator && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input {...roundForm.register('ventilator_mode')} className={inputCls} placeholder="Vent Mode" />
                  <input {...roundForm.register('fio2_percent')} type="number" className={inputCls} placeholder="FiO2 %" />
                  <input {...roundForm.register('peep')} type="number" step="0.1" className={inputCls} placeholder="PEEP" />
                </div>
              )}
              <input {...roundForm.register('inotropes')} className={inputCls} placeholder="Inotropes / vasopressors (drug + dose)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input {...roundForm.register('sedation_score')} type="number" className={inputCls} placeholder="Sedation (RASS)" />
                <input {...roundForm.register('gcs_score')} type="number" className={inputCls} placeholder="GCS" />
              </div>
              <button type="submit" disabled={addRoundMutation.isPending} className="btn-primary">
                {addRoundMutation.isPending ? 'Saving...' : 'Add Round'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!rounds?.length && <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>No rounds recorded yet</p>}
              {rounds?.map((r: any) => (
                <div key={r.id} style={{ padding: 10, background: '#FAF5FF', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>{format(new Date(r.recorded_at), 'HH:mm, dd MMM')}</div>
                  <div style={{ color: '#6B7280' }}>
                    HR {r.heart_rate ?? '—'} · BP {r.blood_pressure_systolic ?? '—'}/{r.blood_pressure_diastolic ?? '—'} · SpO2 {r.oxygen_saturation ?? '—'}%
                    {r.inotropes && <div>Inotropes: {r.inotropes}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => setRoundPatient(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
