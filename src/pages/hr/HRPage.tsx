import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hrService } from '../../services/api'
import { Briefcase, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'

// hrService real methods:
// listDepartments(), createDepartment(data), listDesignations(deptId?),
// createDesignation(data), listStaff(params?), getStaff(id), createStaff(data),
// updateStaff(id, data), markAttendance(data), bulkAttendance(data),
// getAttendance(params?), getAttendanceSummary(staffId, month, year),
// applyLeave(data), listLeaves(params?), approveLeave(id, data),
// getLeaveBalance(staffId), listHolidays(params?), createHoliday(data),
// generatePayroll(data), getDashboard()

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'leaves' | 'departments'>('staff')
  const [search, setSearch] = useState('')

  const { data: stats }       = useQuery({ queryKey: ['hr-stats'],       queryFn: () => hrService.getDashboard().then((r: any) => r.data) })
  const { data: staff }       = useQuery({ queryKey: ['hr-staff'],       queryFn: () => hrService.listStaff().then((r: any) => r.data) })
  const { data: attendance }  = useQuery({ queryKey: ['hr-attendance'],  queryFn: () => hrService.getAttendance().then((r: any) => r.data), enabled: activeTab === 'attendance' })
  const { data: leaves }      = useQuery({ queryKey: ['hr-leaves'],      queryFn: () => hrService.listLeaves().then((r: any) => r.data), enabled: activeTab === 'leaves' })
  const { data: departments } = useQuery({ queryKey: ['hr-departments'], queryFn: () => hrService.listDepartments().then((r: any) => r.data), enabled: activeTab === 'departments' })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">HR & Payroll</h1>
          <p className="page-subtitle">Staff management, attendance & leaves</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> Add Staff</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Staff',   value: stats?.total_staff ?? 0,   cls: 'stat-icon-purple' },
          { label: 'Present Today', value: stats?.present_today ?? 0, cls: 'stat-icon-green' },
          { label: 'On Leave',      value: stats?.on_leave ?? 0,      cls: 'stat-icon-amber' },
          { label: 'Departments',   value: stats?.total_departments ?? 0, cls: 'stat-icon-blue' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['staff', 'attendance', 'leaves', 'departments'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Search bar for staff & attendance */}
      {(activeTab === 'staff' || activeTab === 'attendance') && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Search staff name..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 40 }} />
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Employee</th><th>Role</th><th>Department</th>
              <th>Phone</th><th>Joined</th><th>Status</th>
            </tr></thead>
            <tbody>
              {!(staff?.length) ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No staff found</td></tr>
              ) : (staff || []).filter((s: any) =>
                !search || s.full_name?.toLowerCase().includes(search.toLowerCase())
              ).map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm avatar-purple">
                        {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{s.full_name}</p>
                        <p style={{ fontSize: 11, color: '#A78BFA', fontFamily: 'monospace' }}>EMP-{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                      {s.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{s.department || '—'}</td>
                  <td style={{ color: '#6B7280', fontSize: 13 }}>{s.phone || '—'}</td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>
                    {s.created_at ? format(new Date(s.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Employee</th><th>Date</th><th>Check In</th>
              <th>Check Out</th><th>Hours</th><th>Status</th>
            </tr></thead>
            <tbody>
              {!(attendance?.length) ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No attendance records</td></tr>
              ) : (attendance || []).filter((a: any) =>
                !search || a.staff_name?.toLowerCase().includes(search.toLowerCase())
              ).map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm avatar-teal">{a.staff_name?.[0] || 'E'}</div>
                      <span style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{a.staff_name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#374151', fontSize: 13 }}>
                    {a.date ? format(new Date(a.date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}>{a.check_in_time || '—'}</td>
                  <td style={{ color: '#DC2626', fontWeight: 600, fontSize: 13 }}>{a.check_out_time || '—'}</td>
                  <td style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>
                    {a.total_hours ? `${a.total_hours}h` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      a.status === 'present' ? 'badge-green'
                      : a.status === 'absent' ? 'badge-red'
                      : a.status === 'late' ? 'badge-amber'
                      : 'badge-gray'
                    }`} style={{ textTransform: 'capitalize' }}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Employee</th><th>Leave Type</th><th>From</th>
              <th>To</th><th>Days</th><th>Reason</th><th>Status</th>
            </tr></thead>
            <tbody>
              {!(leaves?.length) ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No leave requests</td></tr>
              ) : (leaves || []).map((l: any) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm avatar-blue">{l.staff_name?.[0] || 'E'}</div>
                      <span style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{l.staff_name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-blue" style={{ fontSize: 11, textTransform: 'capitalize' }}>{l.leave_type?.replace('_', ' ')}</span></td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{l.start_date ? format(new Date(l.start_date), 'dd MMM yyyy') : '—'}</td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{l.end_date ? format(new Date(l.end_date), 'dd MMM yyyy') : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>{l.days ?? '—'}</td>
                  <td style={{ color: '#6B7280', fontSize: 12, maxWidth: 200 }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</p>
                  </td>
                  <td>
                    <span className={`badge ${
                      l.status === 'approved' ? 'badge-green'
                      : l.status === 'rejected' ? 'badge-red'
                      : 'badge-amber'
                    }`} style={{ textTransform: 'capitalize' }}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          <div className="card" style={{
            border: '2px dashed #DDD6FE', background: '#FAFAFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 100, cursor: 'pointer', gap: 8
          }}>
            <Plus size={18} color="#A78BFA" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>Add Department</span>
          </div>
          {(departments || []).map((d: any) => (
            <div key={d.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 14
                }}>
                  {d.name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{d.name}</p>
                  {d.head_name && <p style={{ fontSize: 11, color: '#A78BFA' }}>Head: {d.head_name}</p>}
                </div>
              </div>
              {d.description && (
                <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{d.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
