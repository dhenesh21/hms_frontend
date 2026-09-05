import { useQuery } from '@tanstack/react-query'
import { patientDataService } from '../../services/patientApi'
import { Video } from 'lucide-react'
import { format } from 'date-fns'

export default function PatientTelemedicinePage() {
  const { data: consults } = useQuery({ queryKey: ['pw-consults'], queryFn: () => patientDataService.consultations().then(r => r.data) })

  const statusColor = (s: string) => s === 'in_progress' ? '#059669' : s === 'scheduled' ? '#7C3AED' : s === 'cancelled' ? '#DC2626' : '#6B7280'

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 16 }}>Video Consultations</h1>
      {consults?.length === 0 && <p style={{ color: '#9CA3AF' }}>No consultations scheduled.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {consults?.map((c: any) => (
          <div key={c.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Video size={16} color="#7C3AED" /> {c.is_second_opinion ? 'Second Opinion' : 'Virtual Consultation'}
              </span>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: statusColor(c.status), background: `${statusColor(c.status)}1A` }}>
                {c.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 10px' }}>{format(new Date(c.scheduled_at), 'EEE, d MMM yyyy • h:mm a')}</p>
            {c.reason_for_consult && <p style={{ fontSize: 13, margin: '0 0 10px' }}>{c.reason_for_consult}</p>}
            {(c.status === 'scheduled' || c.status === 'in_progress') && (
              c.meeting_link
                ? <a href={c.meeting_link} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>Join consultation</a>
                : <p style={{ fontSize: 12, color: '#D97706', background: '#FEF3C7', padding: 10, borderRadius: 8 }}>Meeting link is being set up — check back shortly.</p>
            )}
            {c.consultation_notes && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: '0 0 4px' }}>Doctor's notes:</p>
                <p style={{ fontSize: 13, margin: 0 }}>{c.consultation_notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
