import { useQuery } from '@tanstack/react-query'
import { patientDataService } from '../../services/patientApi'
import { format } from 'date-fns'

export default function PatientAppointmentsPage() {
  const { data: appts, isLoading } = useQuery({ queryKey: ['pw-appts'], queryFn: () => patientDataService.appointments().then(r => r.data) })

  const statusColor = (s: string) => s === 'completed' ? '#6B7280' : s === 'cancelled' ? '#DC2626' : '#7C3AED'

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>My Appointments</h1>
      {isLoading && <p style={{ color: '#9CA3AF' }}>Loading…</p>}
      {appts?.length === 0 && <p style={{ color: '#9CA3AF' }}>No appointments on record.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {appts?.map((a: any) => (
          <div key={a.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1E1B4B' }}>{format(new Date(a.appointment_date), 'EEEE, d MMMM yyyy')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>Doctor #{a.doctor_id}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: statusColor(a.status), background: `${statusColor(a.status)}1A` }}>
              {a.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
