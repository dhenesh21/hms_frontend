import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { otService } from '../../services/api'
import { ActivitySquare, Plus, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

// otService real methods:
// listTheatres(), createTheatre(data), updateTheatreStatus(id, status),
// scheduleSurgery(data), listSurgeries(params?), todaySurgeries(),
// getSurgery(id), updateSurgery(id, data), completePreOp(id, checklist),
// addConsumable(data), getConsumables(surgeryId), getDashboard()

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled:   { label: 'Scheduled',   cls: 'badge-blue' },
  in_progress: { label: 'In Progress', cls: 'badge-amber' },
  completed:   { label: 'Completed',   cls: 'badge-green' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-red' },
  postponed:   { label: 'Postponed',   cls: 'badge-gray' },
}

export default function OTPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'theatres'>('today')

  const { data: stats }    = useQuery({ queryKey: ['ot-stats'],    queryFn: () => otService.getDashboard().then((r: any) => r.data) })
  const { data: today }    = useQuery({ queryKey: ['ot-today'],    queryFn: () => otService.todaySurgeries().then((r: any) => r.data) })
  const { data: all }      = useQuery({ queryKey: ['ot-all'],      queryFn: () => otService.listSurgeries().then((r: any) => r.data), enabled: activeTab === 'all' })
  const { data: theatres } = useQuery({ queryKey: ['ot-theatres'], queryFn: () => otService.listTheatres().then((r: any) => r.data), enabled: activeTab === 'theatres' })

  const surgeries = activeTab === 'today' ? today : all

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operation Theatre</h1>
          <p className="page-subtitle">OT schedule, surgeries & theatre management</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> Schedule Surgery</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Today's Surgeries", value: stats?.today_surgeries ?? today?.length ?? 0, cls: 'stat-icon-purple' },
          { label: 'In Progress',       value: stats?.in_progress ?? 0,    cls: 'stat-icon-amber' },
          { label: 'Completed',         value: stats?.completed_today ?? 0, cls: 'stat-icon-green' },
          { label: 'OT Theatres',       value: stats?.total_ots ?? 0,       cls: 'stat-icon-blue' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['today', 'all', 'theatres'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'today' ? "Today's List" : t === 'all' ? 'All Surgeries' : 'Theatres'}
          </button>
        ))}
      </div>

      {/* Surgery list (today or all) */}
      {(activeTab === 'today' || activeTab === 'all') && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Patient</th><th>Procedure</th><th>Surgeon</th>
              <th>Anaesthesiologist</th><th>Theatre</th><th>Time</th><th>Status</th>
            </tr></thead>
            <tbody>
              {!(surgeries?.length) ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>
                  {activeTab === 'today' ? 'No surgeries scheduled today' : 'No surgeries found'}
                </td></tr>
              ) : (surgeries || []).map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm avatar-purple">{s.patient_name?.[0] || 'P'}</div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{s.patient_name}</p>
                        <p style={{ fontSize: 11, color: '#A78BFA', fontFamily: 'monospace' }}>{s.patient_uhid}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontWeight: 600, color: '#4C1D95', fontSize: 13 }}>{s.procedure_name}</p>
                    {s.diagnosis && <p style={{ fontSize: 11, color: '#A78BFA' }}>{s.diagnosis}</p>}
                  </td>
                  <td style={{ color: '#374151', fontSize: 13, fontWeight: 500 }}>{s.surgeon_name || '—'}</td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{s.anaesthesiologist_name || s.anesthesiologist_name || '—'}</td>
                  <td>
                    <span className="badge badge-indigo" style={{ fontSize: 10 }}>
                      {s.theatre_name || `OT-${s.theatre_id}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="#A78BFA" />
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        {s.scheduled_start ? format(new Date(s.scheduled_start), 'HH:mm') : s.scheduled_time ? s.scheduled_time.slice(0,5) : '—'}
                        {s.duration_minutes && ` (${s.duration_minutes}m)`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CONFIG[s.status]?.cls || 'badge-gray'}`}>
                      {STATUS_CONFIG[s.status]?.label || s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Theatres tab */}
      {activeTab === 'theatres' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {!(theatres?.length) ? (
            <p style={{ color: '#C4B5FD', fontSize: 13 }}>No theatres found</p>
          ) : (theatres || []).map((t: any) => (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ActivitySquare size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{t.name}</p>
                  <span className={`badge ${
                    t.status === 'available' ? 'badge-green'
                    : t.status === 'occupied' ? 'badge-red'
                    : 'badge-gray'
                  }`} style={{ fontSize: 10, textTransform: 'capitalize' }}>
                    {t.status || 'Available'}
                  </span>
                </div>
              </div>
              {t.location && <p style={{ fontSize: 12, color: '#A78BFA' }}>📍 {t.location}</p>}
              {t.type && <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textTransform: 'capitalize' }}>{t.type}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
