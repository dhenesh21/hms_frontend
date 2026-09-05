import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { mortuaryService } from '../../services/api'
import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { Snowflake, Stethoscope, FileCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Register Death', 'In Storage']

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  in_storage: { label: 'In Storage', bg: '#EFF6FF', text: '#1D4ED8' },
  in_postmortem: { label: 'In Postmortem', bg: '#FFFBEB', text: '#D97706' },
  released: { label: 'Released', bg: '#F0FDF4', text: '#15803D' },
}

export default function MortuaryPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [patientId, setPatientId] = useState('')
  const [actionModal, setActionModal] = useState<{ type: 'postmortem' | 'release' | 'certificate'; recordId: number } | null>(null)
  const form = useForm<any>({ defaultValues: { death_source: 'ipd', is_mlc: false, postmortem_required: false } })
  const actionForm = useForm<any>()

  const { data: dashboard } = useQuery({
    queryKey: ['mortuary-dashboard'],
    queryFn: () => mortuaryService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: inStorage } = useQuery({
    queryKey: ['mortuary-storage'],
    queryFn: () => mortuaryService.inStorage().then(r => r.data),
    enabled: tab === 2,
  })

  const registerDeath = useMutation({
    mutationFn: (d: any) => mortuaryService.registerDeath(cleanPayload({ ...d, patient_id: parseInt(patientId) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mortuary-dashboard', 'mortuary-storage'] })
      form.reset({ death_source: 'ipd', is_mlc: false, postmortem_required: false })
      setPatientId('')
      toast.success('Death registered')
      setTab(2)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Registration failed'),
  })

  const startPostmortem = useMutation({
    mutationFn: (id: number) => mortuaryService.startPostmortem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mortuary-storage', 'mortuary-dashboard'] })
      toast.success('Postmortem started')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to start postmortem'),
  })

  const completePostmortem = useMutation({
    mutationFn: (d: any) => mortuaryService.completePostmortem(actionModal!.recordId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mortuary-storage', 'mortuary-dashboard'] })
      actionForm.reset()
      setActionModal(null)
      toast.success('Postmortem completed')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to complete postmortem'),
  })

  const releaseBody = useMutation({
    mutationFn: (d: any) => mortuaryService.release(actionModal!.recordId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mortuary-storage', 'mortuary-dashboard'] })
      actionForm.reset()
      setActionModal(null)
      toast.success('Body released')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Release failed'),
  })

  const issueCertificate = useMutation({
    mutationFn: (d: any) => mortuaryService.issueCertificate(actionModal!.recordId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mortuary-storage', 'mortuary-dashboard'] })
      actionForm.reset()
      setActionModal(null)
      toast.success('Certificate issued')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to issue certificate'),
  })

  const isMlc = form.watch('is_mlc')

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Mortuary</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Death register · Body storage · Postmortem · Release</p>
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
            { label: 'In Storage', value: dashboard?.in_storage ?? 0, icon: Snowflake, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'In Postmortem', value: dashboard?.in_postmortem ?? 0, icon: Stethoscope, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Deaths Today', value: dashboard?.deaths_today ?? 0, icon: AlertTriangle, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Pending Certificates', value: dashboard?.pending_certificates ?? 0, icon: FileCheck, color: '#C2410C', bg: '#FFF7ED' },
            { label: 'MLC Pending PM', value: dashboard?.mlc_pending_postmortem ?? 0, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
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

      {/* REGISTER DEATH */}
      {tab === 1 && (
        <div className="card" style={{ maxWidth: 560, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Register Death</h2>
          <form onSubmit={form.handleSubmit(d => {
            if (!patientId) return toast.error('Please select the patient')
            registerDeath.mutate(d)
          })} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Patient *</label>
              <PatientSearchInput inputCls={inputCls} onChange={setPatientId} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Death Source</label>
              <CustomSelect value={form.watch('death_source') || 'ipd'} onChange={v => form.setValue('death_source', String(v))}
                options={[{ value: 'ipd', label: 'IPD' }, { value: 'emergency', label: 'Emergency' }, { value: 'brought_dead', label: 'Brought Dead' }, { value: 'other', label: 'Other' }]} />
            </div>
            <textarea {...form.register('cause_of_death')} className={inputCls} rows={2} placeholder="Cause of death" />
            <input {...form.register('storage_unit')} className={inputCls} placeholder="Storage unit (e.g. Freezer 1)" />
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...form.register('is_mlc')} /> Medico-Legal Case (MLC)
              </label>
              {isMlc && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                  <input type="checkbox" {...form.register('postmortem_required')} /> Postmortem Required
                </label>
              )}
            </div>
            <button type="submit" disabled={registerDeath.isPending} className="btn-primary">
              {registerDeath.isPending ? 'Registering...' : 'Register Death'}
            </button>
          </form>
        </div>
      )}

      {/* IN STORAGE */}
      {tab === 2 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Mortuary #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Date of Death</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Storage</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>MLC</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!inStorage?.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No bodies currently in storage</td></tr>
              )}
              {inStorage?.map((r: any) => (
                <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{r.mortuary_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(r.date_of_death), 'HH:mm, dd MMM')}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{r.storage_unit || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{r.is_mlc && <AlertTriangle size={14} color="#DC2626" />}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[r.body_status]?.bg, color: STATUS_CONFIG[r.body_status]?.text }}>
                      {STATUS_CONFIG[r.body_status]?.label || r.body_status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.postmortem_required && !r.postmortem_done && r.body_status === 'in_storage' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => startPostmortem.mutate(r.id)}>
                          Start PM
                        </button>
                      )}
                      {r.body_status === 'in_postmortem' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setActionModal({ type: 'postmortem', recordId: r.id })}>
                          Complete PM
                        </button>
                      )}
                      {(!r.postmortem_required || r.postmortem_done) && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => setActionModal({ type: 'release', recordId: r.id })}>
                          Release
                        </button>
                      )}
                      {!r.death_certificate_issued && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#1D4ED8' }} onClick={() => setActionModal({ type: 'certificate', recordId: r.id })}>
                          Cert
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

      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setActionModal(null)}>
          <div className="card" style={{ width: 420, padding: 20 }} onClick={e => e.stopPropagation()}>
            {actionModal.type === 'postmortem' && (
              <>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Complete Postmortem</h2>
                <form onSubmit={actionForm.handleSubmit(d => completePostmortem.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input {...actionForm.register('postmortem_doctor', { required: true })} className={inputCls} placeholder="Forensic Doctor Name" />
                  <textarea {...actionForm.register('postmortem_findings')} className={inputCls} rows={3} placeholder="Findings" />
                  <button type="submit" disabled={completePostmortem.isPending} className="btn-primary">
                    {completePostmortem.isPending ? 'Saving...' : 'Complete Postmortem'}
                  </button>
                </form>
              </>
            )}
            {actionModal.type === 'release' && (
              <>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Release Body</h2>
                <form onSubmit={actionForm.handleSubmit(d => releaseBody.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input {...actionForm.register('released_to', { required: true })} className={inputCls} placeholder="Released To (Name)" />
                  <input {...actionForm.register('released_relation')} className={inputCls} placeholder="Relation (e.g. Son, Spouse)" />
                  <button type="submit" disabled={releaseBody.isPending} className="btn-primary">
                    {releaseBody.isPending ? 'Releasing...' : 'Release Body'}
                  </button>
                </form>
              </>
            )}
            {actionModal.type === 'certificate' && (
              <>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Issue Death Certificate</h2>
                <form onSubmit={actionForm.handleSubmit(d => issueCertificate.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input {...actionForm.register('death_certificate_number', { required: true })} className={inputCls} placeholder="Certificate Number" />
                  <button type="submit" disabled={issueCertificate.isPending} className="btn-primary">
                    {issueCertificate.isPending ? 'Issuing...' : 'Issue Certificate'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
