import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { appointmentService } from '../../services/api'
import { Plus, Calendar, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled:   { label: 'Scheduled',   cls: 'badge-blue' },
  confirmed:   { label: 'Confirmed',   cls: 'badge-indigo' },
  in_progress: { label: 'In Progress', cls: 'badge-amber' },
  completed:   { label: 'Completed',   cls: 'badge-green' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-red' },
  no_show:     { label: 'No Show',     cls: 'badge-gray' },
}

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  consultation: { label: 'Consultation', cls: 'badge-purple' },
  follow_up:    { label: 'Follow-up',    cls: 'badge-teal' },
  emergency:    { label: 'Emergency',    cls: 'badge-red' },
  procedure:    { label: 'Procedure',    cls: 'badge-amber' },
}

export default function AppointmentListPage() {
  const qc = useQueryClient()
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState('')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', dateFilter, statusFilter],
    queryFn: () => appointmentService.list({
      appointment_date: dateFilter || undefined,
      status: statusFilter || undefined
    }).then(r => r.data)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      appointmentService.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Status updated')
    }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{appointments?.length ?? 0} appointments today</p>
        </div>
        <Link to="/appointments/new" className="btn-primary">
          <Plus size={15} /> New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Calendar size={15} color="#A78BFA" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="date" value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="input" style={{ paddingLeft: 38, width: 170 }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select">
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Patient</th><th>Doctor</th>
              <th>Type</th><th>Time</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#A78BFA' }}>Loading...</td></tr>
            ) : !appointments?.length ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#C4B5FD' }}>No appointments</td></tr>
            ) : appointments.map((a: any) => (
              <tr key={a.id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#A78BFA' }}>#{a.id}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div className="avatar avatar-sm avatar-blue">
                      {a.patient_name?.[0] || 'P'}
                    </div>
                    <span style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{a.patient_name || '—'}</span>
                  </div>
                </td>
                <td style={{ color: '#4C1D95', fontSize: 13, fontWeight: 500 }}>{a.doctor_name || '—'}</td>
                <td>
                  {a.appointment_type && (
                    <span className={`badge ${TYPE_CONFIG[a.appointment_type]?.cls || 'badge-gray'}`}>
                      {TYPE_CONFIG[a.appointment_type]?.label || a.appointment_type}
                    </span>
                  )}
                </td>
                <td style={{ color: '#374151', fontSize: 13 }}>
                  {a.appointment_time ? a.appointment_time.slice(0, 5) : '—'}
                </td>
                <td>
                  <span className={`badge ${STATUS_CONFIG[a.status]?.cls || 'badge-gray'}`}>
                    {STATUS_CONFIG[a.status]?.label || a.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.status === 'scheduled' && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#16A34A' }}
                        onClick={() => updateStatus.mutate({ id: a.id, status: 'confirmed' })}>
                        Confirm
                      </button>
                    )}
                    {(a.status === 'scheduled' || a.status === 'confirmed') && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#DC2626' }}
                        onClick={() => updateStatus.mutate({ id: a.id, status: 'cancelled' })}>
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
