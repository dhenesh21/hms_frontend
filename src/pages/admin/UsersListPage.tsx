import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/api'
import { Link } from 'react-router-dom'
import { Search, Plus, UserCheck, Shield } from 'lucide-react'
import { format } from 'date-fns'

export default function UsersListPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => adminService.listUsers({ search: search || undefined, role: roleFilter || undefined }).then(r => r.data)
  })

  const ROLE_COLORS: Record<string, string> = {
    admin: 'badge-red', doctor: 'badge-purple', nurse: 'badge-teal',
    receptionist: 'badge-blue', lab_technician: 'badge-amber',
    pharmacist: 'badge-green', accountant: 'badge-indigo',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Staff</h1>
          <p className="page-subtitle">{users?.length ?? 0} registered users</p>
        </div>
        <Link to="/admin/users/new" className="btn-primary"><Plus size={15} /> Register Staff</Link>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Search by name, email, role..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 40 }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select">
          <option value="">All Roles</option>
          {['admin','doctor','nurse','receptionist','lab_technician','pharmacist','accountant'].map(r => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr>
            <th>User</th><th>Email</th><th>Role</th>
            <th>Department</th><th>Joined</th><th>Status</th>
          </tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#A78BFA' }}>Loading...</td></tr>
            ) : (users || []).map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm avatar-purple">
                      {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{u.full_name}</p>
                      <p style={{ fontSize: 11, color: '#A78BFA', fontFamily: 'monospace' }}>#{u.id}</p>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#374151', fontSize: 13 }}>{u.email}</td>
                <td>
                  <span className={`badge ${ROLE_COLORS[u.role] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                    {u.role?.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ color: '#6B7280', fontSize: 13 }}>{u.department || '—'}</td>
                <td style={{ color: '#6B7280', fontSize: 12 }}>
                  {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '—'}
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
