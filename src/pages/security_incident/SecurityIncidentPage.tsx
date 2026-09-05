import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { securityIncidentService } from '../../services/api'
import { AlertOctagon, Shield, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Report Incident', 'All Incidents']

const SEVERITY_COLORS: Record<string, string> = { low: '#6B7280', medium: '#D97706', high: '#C2410C', critical: '#DC2626' }
const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  reported: { bg: '#F3F4F6', text: '#4B5563' },
  under_investigation: { bg: '#FFFBEB', text: '#D97706' },
  resolved: { bg: '#F0FDF4', text: '#15803D' },
  closed: { bg: '#F5F3FF', text: '#7C3AED' },
}

export default function SecurityIncidentPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [investigateModal, setInvestigateModal] = useState<number | null>(null)
  const form = useForm<any>({ defaultValues: { incident_type: 'other', severity: 'medium' } })
  const investigateForm = useForm<any>()

  const { data: dashboard } = useQuery({
    queryKey: ['sec-dashboard'],
    queryFn: () => securityIncidentService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: incidents } = useQuery({
    queryKey: ['sec-incidents'],
    queryFn: () => securityIncidentService.list().then(r => r.data),
    enabled: tab === 2,
  })

  const reportIncident = useMutation({
    mutationFn: (d: any) => securityIncidentService.report(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sec-dashboard'] })
      form.reset({ incident_type: 'other', severity: 'medium' })
      toast.success('Incident reported')
      setTab(2)
    },
    onError: () => toast.error('Failed to report incident'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => securityIncidentService.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sec-incidents', 'sec-dashboard'] })
      toast.success('Status updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Update failed'),
  })

  const resolveIncident = useMutation({
    mutationFn: (d: any) => securityIncidentService.update(investigateModal!, { status: 'resolved', ...d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sec-incidents', 'sec-dashboard'] })
      investigateForm.reset()
      setInvestigateModal(null)
      toast.success('Incident resolved')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to resolve'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Security Incidents</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Physical security incident reporting & investigation</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Open Incidents', value: dashboard?.open_incidents ?? 0, icon: AlertOctagon, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Critical Open', value: dashboard?.critical_open ?? 0, icon: Shield, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'This Month', value: dashboard?.incidents_this_month ?? 0, icon: TrendingUp, color: '#7C3AED', bg: '#F5F3FF' },
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
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Report Security Incident</h2>
          <form onSubmit={form.handleSubmit(d => reportIncident.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <CustomSelect value={form.watch('incident_type') || 'other'} onChange={v => form.setValue('incident_type', String(v))}
                options={[{ value: 'theft', label: 'Theft' }, { value: 'violence', label: 'Violence' }, { value: 'unauthorized_access', label: 'Unauthorized Access' }, { value: 'vandalism', label: 'Vandalism' }, { value: 'fire_safety', label: 'Fire Safety' }, { value: 'suspicious_activity', label: 'Suspicious Activity' }, { value: 'other', label: 'Other' }]} />
              <CustomSelect value={form.watch('severity') || 'medium'} onChange={v => form.setValue('severity', String(v))}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
            </div>
            <input {...form.register('location', { required: true })} className={inputCls} placeholder="Location *" />
            <textarea {...form.register('description', { required: true })} className={inputCls} rows={3} placeholder="Description *" />
            <input {...form.register('persons_involved')} className={inputCls} placeholder="Persons involved (if known)" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
              <input type="checkbox" onChange={e => form.setValue('police_informed', e.target.checked ? 'yes' : 'no')} /> Police informed
            </label>
            <button type="submit" disabled={reportIncident.isPending} className="btn-primary">
              {reportIncident.isPending ? 'Reporting...' : 'Report Incident'}
            </button>
          </form>
        </div>
      )}

      {/* ALL INCIDENTS */}
      {tab === 2 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAF5FF' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Incident #</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Type</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Location</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Severity</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!incidents?.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No incidents reported</td></tr>
              )}
              {incidents?.map((i: any) => (
                <tr key={i.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{i.incident_number}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{i.incident_type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{i.location}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: SEVERITY_COLORS[i.severity] }}>{i.severity.toUpperCase()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_CONFIG[i.status]?.bg, color: STATUS_CONFIG[i.status]?.text }}>
                      {i.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {i.status === 'reported' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => updateStatus.mutate({ id: i.id, status: 'under_investigation' })}>Investigate</button>
                      )}
                      {i.status === 'under_investigation' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#15803D' }} onClick={() => setInvestigateModal(i.id)}>Resolve</button>
                      )}
                      {i.status === 'resolved' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => updateStatus.mutate({ id: i.id, status: 'closed' })}>Close</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {investigateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setInvestigateModal(null)}>
          <div className="card" style={{ width: 460, padding: 20 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Resolve Incident</h2>
            <form onSubmit={investigateForm.handleSubmit(d => resolveIncident.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...investigateForm.register('investigated_by')} className={inputCls} placeholder="Investigated By" />
              <textarea {...investigateForm.register('investigation_notes')} className={inputCls} rows={2} placeholder="Investigation notes" />
              <textarea {...investigateForm.register('resolution', { required: true })} className={inputCls} rows={2} placeholder="Resolution *" />
              <button type="submit" disabled={resolveIncident.isPending} className="btn-primary">
                {resolveIncident.isPending ? 'Saving...' : 'Resolve Incident'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
