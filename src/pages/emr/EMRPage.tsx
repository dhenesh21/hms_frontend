import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { emrService } from '../../services/api'
import { Search, Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default function EMRPage() {
  const [search, setSearch] = useState('')
  const [patientId, setPatientId] = useState<number | null>(null)

  // emrService uses getFullEMR(patientId) — show search to pick patient first
  const { data: emr } = useQuery({
    queryKey: ['emr', patientId],
    queryFn: () => emrService.getFullEMR(patientId!).then((r: any) => r.data),
    enabled: !!patientId
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">EMR — Electronic Medical Records</h1>
          <p className="page-subtitle">Search a patient to view their full medical record</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 500 }}>
        <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          placeholder="Enter Patient ID to load EMR..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && search) setPatientId(Number(search)) }}
          className="input" style={{ paddingLeft: 40 }}
        />
        <button className="btn-primary"
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '5px 14px', fontSize: 12 }}
          onClick={() => search && setPatientId(Number(search))}>
          Load
        </button>
      </div>

      {emr && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Allergies */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Allergies</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(emr.allergies || []).length === 0
                ? <p style={{ color: '#C4B5FD', fontSize: 13 }}>No known allergies</p>
                : (emr.allergies || []).map((a: any, i: number) => (
                  <span key={i} className="badge badge-red">{a.allergen} — {a.reaction}</span>
                ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Conditions / Diagnoses</p>
            <div className="table-wrapper" style={{ marginTop: 0 }}>
              <table>
                <thead><tr><th>Condition</th><th>ICD Code</th><th>Status</th><th>Since</th></tr></thead>
                <tbody>
                  {(emr.conditions || []).map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{c.condition_name}</td>
                      <td style={{ fontFamily: 'monospace', color: '#7C3AED', fontSize: 12 }}>{c.icd_code || '—'}</td>
                      <td><span className={`badge ${c.is_active ? 'badge-amber' : 'badge-green'}`}>{c.is_active ? 'Active' : 'Resolved'}</span></td>
                      <td style={{ color: '#6B7280', fontSize: 12 }}>{c.diagnosed_date ? format(new Date(c.diagnosed_date), 'dd MMM yyyy') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medications */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Current Medications</p>
            <div className="table-wrapper" style={{ marginTop: 0 }}>
              <table>
                <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Route</th><th>Since</th></tr></thead>
                <tbody>
                  {(emr.medications || []).map((m: any) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{m.drug_name}</td>
                      <td style={{ color: '#374151', fontSize: 13 }}>{m.dose} {m.unit}</td>
                      <td style={{ color: '#374151', fontSize: 13 }}>{m.frequency}</td>
                      <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{m.route}</span></td>
                      <td style={{ color: '#6B7280', fontSize: 12 }}>{m.start_date ? format(new Date(m.start_date), 'dd MMM yyyy') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Family History */}
          {emr.family_history?.length > 0 && (
            <div className="card">
              <p className="section-title" style={{ marginBottom: 14 }}>Family History</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {emr.family_history.map((f: any, i: number) => (
                  <span key={i} className="badge badge-purple">{f.relationship}: {f.condition}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!patientId && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#C4B5FD' }}>
          <p style={{ fontSize: 14 }}>Enter a Patient ID above and press Enter or click Load</p>
        </div>
      )}
    </div>
  )
}
