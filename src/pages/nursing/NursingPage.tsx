import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nursingService } from '../../services/api'
import { HeartPulse, Plus, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// nursingService real methods:
// getDashboard(admissionId), getPendingDoses(admissionId), getAssessments(admissionId, type?),
// getCarePlans(admissionId), createMAR(data), recordAdministration(data), createAssessment(data)
// createCarePlan(data), listHandovers(), createHandover(data)

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  routine: { label: 'Routine', cls: 'badge-gray' },
  urgent:  { label: 'Urgent',  cls: 'badge-amber' },
  stat:    { label: 'STAT',    cls: 'badge-red' },
}

export default function NursingPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'handovers' | 'mar' | 'assessments'>('handovers')
  const [admissionId, setAdmissionId] = useState('')

  // Handovers don't need admissionId
  const { data: handovers } = useQuery({
    queryKey: ['nursing-handovers'],
    queryFn: () => nursingService.listHandovers().then((r: any) => r.data)
  })

  // MAR & assessments need an admission ID
  const { data: pendingDoses } = useQuery({
    queryKey: ['nursing-doses', admissionId],
    queryFn: () => nursingService.getPendingDoses(Number(admissionId)).then((r: any) => r.data),
    enabled: !!admissionId && activeTab === 'mar'
  })

  const { data: assessments } = useQuery({
    queryKey: ['nursing-assessments', admissionId],
    queryFn: () => nursingService.getAssessments(Number(admissionId)).then((r: any) => r.data),
    enabled: !!admissionId && activeTab === 'assessments'
  })

  const receiveHandover = useMutation({
    mutationFn: (id: number) => nursingService.receiveHandover(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nursing-handovers'] }); toast.success('Handover received') }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nursing</h1>
          <p className="page-subtitle">Handovers, MAR & patient assessments</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> New Handover</button>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['handovers', 'mar', 'assessments'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'handovers' ? 'Handovers' : t === 'mar' ? 'MAR (Doses)' : 'Assessments'}
          </button>
        ))}
      </div>

      {/* Admission ID input for MAR / Assessments */}
      {(activeTab === 'mar' || activeTab === 'assessments') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, maxWidth: 420 }}>
          <input
            placeholder="Enter Admission ID..."
            value={admissionId}
            onChange={e => setAdmissionId(e.target.value)}
            className="input"
          />
          <button className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '9px 16px' }}
            onClick={() => qc.invalidateQueries()}>
            Load
          </button>
        </div>
      )}

      {/* Handovers Tab */}
      {activeTab === 'handovers' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Shift</th><th>From Nurse</th><th>To Nurse</th>
              <th>Ward</th><th>Date</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {!(handovers?.length) ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No handovers found</td></tr>
              ) : (handovers || []).map((h: any) => (
                <tr key={h.id}>
                  <td>
                    <span className={`badge ${h.shift === 'morning' ? 'badge-amber' : h.shift === 'evening' ? 'badge-blue' : 'badge-indigo'}`}
                      style={{ textTransform: 'capitalize' }}>
                      {h.shift}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{h.from_nurse_name || '—'}</td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{h.to_nurse_name || 'Unassigned'}</td>
                  <td><span className="badge badge-purple" style={{ fontSize: 10 }}>{h.ward_name || '—'}</span></td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>
                    {h.handover_time ? format(new Date(h.handover_time), 'dd MMM HH:mm') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${h.is_received ? 'badge-green' : 'badge-amber'}`}>
                      {h.is_received ? 'Received' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {!h.is_received && (
                      <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => receiveHandover.mutate(h.id)}>
                        Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MAR Tab */}
      {activeTab === 'mar' && admissionId && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Medicine</th><th>Dose</th><th>Route</th>
              <th>Scheduled</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {!(pendingDoses?.length) ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No pending doses</td></tr>
              ) : (pendingDoses || []).map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{d.drug_name}</td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{d.dose} {d.unit}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{d.route}</span></td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>
                    {d.scheduled_time ? format(new Date(d.scheduled_time), 'HH:mm') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${d.is_administered ? 'badge-green' : 'badge-amber'}`}>
                      {d.is_administered ? 'Given' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {!d.is_administered && (
                      <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}>
                        Administer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessments Tab */}
      {activeTab === 'assessments' && admissionId && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Type</th><th>Nurse</th><th>Date</th><th>Notes</th>
            </tr></thead>
            <tbody>
              {!(assessments?.length) ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No assessments found</td></tr>
              ) : (assessments || []).map((a: any) => (
                <tr key={a.id}>
                  <td><span className="badge badge-teal" style={{ textTransform: 'capitalize', fontSize: 11 }}>{a.assessment_type?.replace('_', ' ')}</span></td>
                  <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{a.nurse_name || '—'}</td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>
                    {a.assessed_at ? format(new Date(a.assessed_at), 'dd MMM HH:mm') : '—'}
                  </td>
                  <td style={{ color: '#374151', fontSize: 13, maxWidth: 300 }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.notes || '—'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(activeTab === 'mar' || activeTab === 'assessments') && !admissionId && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#C4B5FD' }}>
          <p style={{ fontSize: 14 }}>Enter an Admission ID above to load data</p>
        </div>
      )}
    </div>
  )
}
