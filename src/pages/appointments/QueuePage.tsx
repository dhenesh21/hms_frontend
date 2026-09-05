import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentService, doctorService } from '../../services/api'
import { Users, Clock, CheckCircle, RefreshCw, Monitor } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  scheduled:   { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  confirmed:   { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  in_progress: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  completed:   { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  cancelled:   { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  no_show:     { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
}

export default function QueuePage() {
  const qc = useQueryClient()
  const [selectedDoctor, setSelectedDoctor] = useState<number | ''>('')
  const [displayMode, setDisplayMode] = useState<'manage' | 'display'>('manage')

  const { data: queueData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['queue-today', selectedDoctor],
    queryFn: () => appointmentService.getQueue(selectedDoctor || undefined).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors-queue'],
    queryFn: () => doctorService.list({ size: 100 }).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      appointmentService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue-today'] }); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status')
  })

  const queue = queueData?.queue || []
  const doctorList = Array.isArray(doctors) ? doctors : doctors?.doctors || []

  const stats = {
    total: queue.length,
    waiting: queue.filter((q: any) => ['scheduled', 'confirmed'].includes(q.status)).length,
    inProgress: queue.filter((q: any) => q.status === 'in_progress').length,
    completed: queue.filter((q: any) => q.status === 'completed').length,
  }

  const currentToken = queue.find((q: any) => q.status === 'in_progress')
  const nextToken = queue.find((q: any) => ['scheduled', 'confirmed'].includes(q.status))

  if (displayMode === 'display') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1E1B4B,#4C1D95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#EDE9FE', marginBottom: 8 }}>OPD Token Display</h1>
        <p style={{ color: '#A78BFA', fontSize: 14, marginBottom: 48 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, width: '100%', maxWidth: 900, marginBottom: 48 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#A78BFA', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Now Serving</p>
            <div style={{ fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{currentToken ? String(currentToken.token_number).padStart(3, '0') : '—'}</div>
            {currentToken && <p style={{ color: '#DDD6FE', marginTop: 12, fontSize: 16 }}>{currentToken.patient_name}</p>}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#8B5CF6', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Next</p>
            <div style={{ fontSize: 96, fontWeight: 900, color: '#C4B5FD', lineHeight: 1 }}>{nextToken ? String(nextToken.token_number).padStart(3, '0') : '—'}</div>
            {nextToken && <p style={{ color: '#8B5CF6', marginTop: 12, fontSize: 16 }}>{nextToken.patient_name}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {queue.filter((q: any) => ['scheduled', 'confirmed'].includes(q.status)).map((q: any) => (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#EDE9FE' }}>{String(q.token_number).padStart(3, '0')}</p>
              <p style={{ fontSize: 10, color: '#8B5CF6', marginTop: 2 }}>{q.appointment_time}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setDisplayMode('manage')} style={{ position: 'fixed', bottom: 20, right: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 12 }}>← Back to Manage</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">OPD Queue Management</h1>
          <p style={{ color: '#8B5CF6', fontSize: 13 }}>Today's token list · Auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value ? Number(e.target.value) : '')}
            style={{ padding: '7px 12px', border: '1.5px solid #EDE9FE', borderRadius: 8, fontSize: 13, color: '#4C1D95', outline: 'none', background: '#fff' }}>
            <option value="">All Doctors</option>
            {doctorList.map((d: any) => <option key={d.id} value={d.doctor_profile_id || d.id}>{d.full_name}</option>)}
          </select>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['queue-today'] })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1.5px solid #EDE9FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setDisplayMode('display')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', cursor: 'pointer' }}>
            <Monitor size={13} /> Token Display
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Waiting', value: stats.waiting, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'In Progress', value: stats.inProgress, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Completed', value: stats.completed, color: '#059669', bg: '#ECFDF5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 11, color, fontWeight: 600, margin: '2px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? <p style={{ textAlign: 'center', padding: 40, color: '#C4B5FD' }}>Loading queue...</p>
          : queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#C4B5FD' }}>
              <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No appointments today</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#FAFAFF', borderBottom: '1px solid #EDE9FE' }}>
                {['Token', 'Time', 'Patient', 'Doctor', 'Type', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {queue.map((q: any) => {
                  const sc = STATUS_COLORS[q.status] || STATUS_COLORS.scheduled
                  return (
                    <tr key={q.id} style={{ borderBottom: '1px solid #F9F7FF' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                          {String(q.token_number || '—').padStart(3, '0')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{q.appointment_time}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>{q.patient_name}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{q.patient_phone}</p>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <p style={{ fontSize: 13, color: '#1E1B4B', margin: 0 }}>{q.doctor_name}</p>
                        <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>{q.doctor_specialization}</p>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', textTransform: 'capitalize' }}>{q.appointment_type?.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>
                          {q.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!['in_progress', 'completed', 'cancelled'].includes(q.status) && (
                            <button onClick={() => updateStatus.mutate({ id: q.id, status: 'in_progress' })}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #FDE68A', background: '#FFFBEB', color: '#D97706', cursor: 'pointer', fontWeight: 600 }}>Call In</button>
                          )}
                          {q.status === 'in_progress' && (
                            <button onClick={() => updateStatus.mutate({ id: q.id, status: 'completed' })}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle size={10} />Done
                            </button>
                          )}
                          {!['completed', 'cancelled', 'no_show'].includes(q.status) && (
                            <button onClick={() => updateStatus.mutate({ id: q.id, status: 'no_show' })}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontWeight: 600 }}>No Show</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        {queueData && <div style={{ padding: '8px 14px', background: '#FAFAFF', borderTop: '1px solid #F3F0FF', fontSize: 11, color: '#9CA3AF' }}>Last updated: {new Date(dataUpdatedAt).toLocaleTimeString('en-IN')}</div>}
      </div>
    </div>
  )
}
