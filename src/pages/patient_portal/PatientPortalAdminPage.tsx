import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientPortalService } from '../../services/api'
import { MessageSquareWarning } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PatientPortalAdminPage() {
  const qc = useQueryClient()
  const { data: grievances } = useQuery({ queryKey: ['grievances'], queryFn: () => patientPortalService.listAllGrievances().then(r => r.data) })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => patientPortalService.updateGrievance(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grievances'] }); toast.success('Grievance updated') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Patient Portal — Grievance Triage</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Staff-side view of grievances submitted by patients through their own portal login</p>
      <p style={{ color: '#D97706', fontSize: 11, marginBottom: 20 }}>
        ⚠ The patient-facing self-service screens (registration, login, my-appointments, my-bills, feedback) run on a
        separate patient-scoped auth token and are a distinct app surface from this staff dashboard — not shown here.
        This page is only the staff-side grievance triage queue.
      </p>

      <div className="card" style={{ padding: 16, maxWidth: 700 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><MessageSquareWarning size={14} style={{ marginRight: 6, display: 'inline' }} />Grievances</h3>
        {grievances?.length ? grievances.map((g: any) => (
          <div key={g.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{g.subject}</span>
              <span style={{ color: '#8B5CF6' }}>{g.status}</span>
            </div>
            <p style={{ color: '#6B7280', margin: '4px 0' }}>{g.description}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['in_progress', 'resolved', 'closed'].map(s => (
                <button key={s} onClick={() => updateStatus.mutate({ id: g.id, status: s })}
                  style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff' }}>{s}</button>
              ))}
            </div>
          </div>
        )) : <p style={{ color: '#9CA3AF', fontSize: 12 }}>No grievances raised.</p>}
      </div>
    </div>
  )
}
