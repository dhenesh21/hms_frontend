import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { infectionControlService } from '../../services/api'
import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { ShieldAlert, Users, TrendingUp, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Report Incident', 'Active Isolation']

const PRECAUTION_COLORS: Record<string, string> = {
  standard: '#6B7280',
  contact: '#D97706',
  droplet: '#1D4ED8',
  airborne: '#DC2626',
  protective: '#15803D',
}

export default function InfectionControlPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [patientId, setPatientId] = useState('')
  const form = useForm<any>({ defaultValues: { source: 'unknown' } })
  const isolationForm = useForm<any>({ defaultValues: { precaution_type: 'contact' } })
  const [showIsolationForm, setShowIsolationForm] = useState(false)
  const [isolationPatientId, setIsolationPatientId] = useState('')

  const { data: dashboard } = useQuery({
    queryKey: ['ic-dashboard'],
    queryFn: () => infectionControlService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: isolations } = useQuery({
    queryKey: ['ic-isolation'],
    queryFn: () => infectionControlService.listIsolation().then(r => r.data),
    enabled: tab === 2,
  })

  const reportIncident = useMutation({
    mutationFn: (d: any) => infectionControlService.reportIncident(cleanPayload({ ...d, patient_id: parseInt(patientId) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ic-dashboard'] })
      form.reset({ source: 'unknown' })
      setPatientId('')
      toast.success('Infection incident reported')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to report incident'),
  })

  const startIsolation = useMutation({
    mutationFn: (d: any) => infectionControlService.startIsolation(cleanPayload({ ...d, patient_id: parseInt(isolationPatientId) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ic-isolation', 'ic-dashboard'] })
      isolationForm.reset({ precaution_type: 'contact' })
      setIsolationPatientId('')
      setShowIsolationForm(false)
      toast.success('Isolation precaution started')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to start isolation'),
  })

  const endIsolation = useMutation({
    mutationFn: (id: number) => infectionControlService.endIsolation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ic-isolation', 'ic-dashboard'] })
      toast.success('Isolation precaution ended')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to end isolation'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Infection Control</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Surveillance · Isolation precautions · HAI tracking</p>
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
            { label: 'Active Isolations', value: dashboard?.active_isolations ?? 0, icon: ShieldAlert, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Incidents This Month', value: dashboard?.incidents_this_month ?? 0, icon: TrendingUp, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Hospital-Acquired (Month)', value: dashboard?.hospital_acquired_this_month ?? 0, icon: ShieldAlert, color: '#C2410C', bg: '#FFF7ED' },
            { label: 'Under Investigation', value: dashboard?.under_investigation ?? 0, icon: Search, color: '#D97706', bg: '#FFFBEB' },
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

      {/* REPORT INCIDENT */}
      {tab === 1 && (
        <div className="card" style={{ maxWidth: 560, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Report Infection Incident</h2>
          <form onSubmit={form.handleSubmit(d => {
            if (!patientId) return toast.error('Please select the patient')
            reportIncident.mutate(d)
          })} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Patient *</label>
              <PatientSearchInput inputCls={inputCls} onChange={setPatientId} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Infection Type *</label>
              <input {...form.register('infection_type', { required: true })} className={inputCls} placeholder="e.g. MRSA, C. difficile, UTI" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Source</label>
              <CustomSelect value={form.watch('source') || 'unknown'} onChange={v => form.setValue('source', String(v))}
                options={[{ value: 'unknown', label: 'Unknown' }, { value: 'hospital_acquired', label: 'Hospital-Acquired' }, { value: 'community_acquired', label: 'Community-Acquired' }]} />
            </div>
            <textarea {...form.register('symptoms')} className={inputCls} rows={2} placeholder="Symptoms" />
            <button type="submit" disabled={reportIncident.isPending} className="btn-primary">
              {reportIncident.isPending ? 'Reporting...' : 'Report Incident'}
            </button>
          </form>
        </div>
      )}

      {/* ACTIVE ISOLATION */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowIsolationForm(true)}>Start Isolation</button>
          </div>

          {showIsolationForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Start Isolation Precaution</h2>
              <form onSubmit={isolationForm.handleSubmit(d => {
                if (!isolationPatientId) return toast.error('Please select the patient')
                startIsolation.mutate(d)
              })} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PatientSearchInput inputCls={inputCls} onChange={setIsolationPatientId} />
                <CustomSelect value={isolationForm.watch('precaution_type') || 'contact'} onChange={v => isolationForm.setValue('precaution_type', String(v))}
                  options={[{ value: 'standard', label: 'Standard' }, { value: 'contact', label: 'Contact' }, { value: 'droplet', label: 'Droplet' }, { value: 'airborne', label: 'Airborne' }, { value: 'protective', label: 'Protective (Reverse)' }]} />
                <textarea {...isolationForm.register('reason')} className={inputCls} rows={2} placeholder="Reason" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={startIsolation.isPending} className="btn-primary">
                    {startIsolation.isPending ? 'Starting...' : 'Start Isolation'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowIsolationForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {!isolations?.length && (
              <div className="card" style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13, gridColumn: '1/-1' }}>No active isolation precautions</div>
            )}
            {isolations?.map((i: any) => (
              <div key={i.id} className="card" style={{ padding: 16, borderLeft: `4px solid ${PRECAUTION_COLORS[i.precaution_type]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', textTransform: 'capitalize' }}>{i.precaution_type} Precautions</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>Patient #{i.patient_id} · Since {format(new Date(i.started_at), 'dd MMM, HH:mm')}</p>
                  </div>
                  <Users size={16} color={PRECAUTION_COLORS[i.precaution_type]} />
                </div>
                {i.reason && <p style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>{i.reason}</p>}
                <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => endIsolation.mutate(i.id)}>
                  End Isolation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
