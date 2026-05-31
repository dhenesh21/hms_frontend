import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { opdService } from '../../services/api'
import { Plus, Search, Clock, CheckCircle, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  waiting:     { label: 'Waiting',     cls: 'badge-amber' },
  in_progress: { label: 'In Progress', cls: 'badge-blue' },
  completed:   { label: 'Completed',   cls: 'badge-green' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-red' },
}

export default function OPDListPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const { data: visits, isLoading } = useQuery({
    queryKey: ['opd-visits', date, status],
    queryFn: () => opdService.listVisits({ visit_date: date, status: status || undefined }).then(r => r.data)
  })

  const { data: stats } = useQuery({
    queryKey: ['opd-dashboard'],
    queryFn: () => opdService.getDashboard().then(r => r.data)
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD — Outpatient</h1>
          <p className="page-subtitle">Today's visits & consultations</p>
        </div>
        <Link to="/opd/new" className="btn-primary"><Plus size={15} /> New Visit</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: "Today's Visits", value: stats?.today_visits ?? 0, color: '#7C3AED', bg: '#EDE9FE' },
          { label: 'Waiting', value: stats?.pending_consultations ?? 0, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Completed', value: stats?.completed_today ?? 0, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Follow-ups', value: stats?.today_follow_ups ?? 0, color: '#2563EB', bg: '#DBEAFE' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 14, padding: '14px 16px', border: `1px solid ${bg}` }}>
            <p style={{ fontSize: 11.5, color: color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: color, marginTop: 4 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Search patient name, UHID..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 40 }} />
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input" style={{ width: 170 }} />
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr>
            <th>Token</th><th>Patient</th><th>Doctor</th>
            <th>Dept</th><th>Type</th><th>Status</th><th>Time</th>
          </tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#A78BFA' }}>Loading...</td></tr>
            ) : (visits || []).filter((v: any) =>
              !search || v.patient_name?.toLowerCase().includes(search.toLowerCase())
            ).map((v: any) => (
              <tr key={v.id} onClick={() => navigate(`/opd/${v.id}`)}>
                <td>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>{v.token_number || v.id}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div className="avatar avatar-sm avatar-purple">{v.patient_name?.[0] || 'P'}</div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{v.patient_name}</p>
                      <p style={{ fontSize: 11, color: '#A78BFA', fontFamily: 'monospace' }}>{v.patient_uhid}</p>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#4C1D95', fontWeight: 600, fontSize: 13 }}>{v.doctor_name || '—'}</td>
                <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{v.department || 'General'}</span></td>
                <td><span className={`badge ${v.visit_type === 'follow_up' ? 'badge-teal' : 'badge-purple'}`} style={{ fontSize: 10, textTransform: 'capitalize' }}>{v.visit_type?.replace('_', ' ') || 'Consultation'}</span></td>
                <td><span className={`badge ${STATUS_CONFIG[v.status]?.cls || 'badge-gray'}`}>{STATUS_CONFIG[v.status]?.label || v.status}</span></td>
                <td style={{ color: '#6B7280', fontSize: 12 }}>{v.visit_time ? v.visit_time.slice(0, 5) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
