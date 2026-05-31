import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { patientService } from '../../services/api'
import { Search, Plus, ChevronRight, Filter } from 'lucide-react'

const bloodColors: Record<string, string> = {
  'A+': 'badge-red', 'A-': 'badge-red', 'B+': 'badge-amber', 'B-': 'badge-amber',
  'AB+': 'badge-purple', 'AB-': 'badge-purple', 'O+': 'badge-green', 'O-': 'badge-green',
}

export default function PatientListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => patientService.list({ search: search || undefined, page, size: 20 }).then(r => r.data),
    placeholderData: (prev) => prev
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{data?.total ?? 0} registered patients</p>
        </div>
        <Link to="/patients/new" className="btn-primary">
          <Plus size={15} /> New Patient
        </Link>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" placeholder="Search by name, UHID, phone..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input" style={{ paddingLeft: 40 }}
          />
        </div>
        <button className="btn-secondary"><Filter size={15} /> Filter</button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Patient</th><th>UHID</th><th>Age / Gender</th>
              <th>Blood</th><th>Phone</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#A78BFA' }}>
                <div style={{ fontSize: 13 }}>Loading patients...</div>
              </td></tr>
            ) : data?.patients?.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#C4B5FD' }}>
                No patients found
              </td></tr>
            ) : (
              data?.patients?.map((p: any) => {
                const age = p.date_of_birth
                  ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
                  : null
                return (
                  <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm avatar-purple">
                          {p.first_name[0]}{p.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13.5 }}>
                            {p.first_name} {p.last_name}
                          </p>
                          {p.email && <p style={{ fontSize: 11.5, color: '#A78BFA' }}>{p.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>{p.uhid}</span></td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{age ? `${age} yrs` : '—'} · <span style={{ textTransform: 'capitalize' }}>{p.gender}</span></td>
                    <td>
                      {p.blood_group
                        ? <span className={`badge ${bloodColors[p.blood_group] || 'badge-gray'}`}>{p.blood_group}</span>
                        : <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ color: '#374151', fontSize: 13 }}>{p.phone}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td><ChevronRight size={15} color="#C4B5FD" /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {data && data.total > 20 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid #F3F0FF'
          }}>
            <p style={{ fontSize: 12, color: '#A78BFA' }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total} patients
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
