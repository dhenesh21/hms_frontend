import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { authService } from '../../services/api'
import { UserPlus, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  doctor: 'bg-blue-100 text-blue-700',
  nurse: 'bg-green-100 text-green-700',
  receptionist: 'bg-amber-100 text-amber-700',
  pharmacist: 'bg-purple-100 text-purple-700',
  lab_technician: 'bg-teal-100 text-teal-700',
  radiologist: 'bg-indigo-100 text-indigo-700',
  accountant: 'bg-orange-100 text-orange-700',
  hr: 'bg-pink-100 text-pink-700',
}

export default function UsersListPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

const { data: users = [], isLoading, error, refetch } = useQuery({
  queryKey: ['users'],
queryFn: async () => {
  try {
    console.log('[Query] Calling listUsers API...')
    const response = await authService.listUsers()
    console.log('[Query] Users returned:', response?.length || 0)  // ✅ response is already array
    return response || []  // ✅ directly return
  } catch (err) {
    console.error('[Query] Error fetching users:', err)
    return []
  }
},
  staleTime: 0,  // ✅ Always treat as stale
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: true,  // ✅ Refetch on tab focus
  refetchOnMount: true,  // ✅ Refetch on page load
})

  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: any) => authService.updateUser(id, { is_active: !is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated') }
  })

  const filtered = users?.filter((u: any) => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_id?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roles = [...new Set(users?.map((u: any) => u.role) || [])]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-500">{users?.length ?? 0} total staff members</p>
        </div>
        <Link to="/admin/users/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <UserPlus size={16} /> Register Staff
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Search by name, email, employee ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Roles</option>
          {roles.map((r: any) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Emp ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Action'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-14">
                  <Users size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 text-sm">No staff found</p>
                  <Link to="/admin/users/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                    Register first staff →
                  </Link>
                </td>
              </tr>
            ) : (
              filtered?.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-600">{u.employee_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-700">{u.full_name?.[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.last_login ? format(new Date(u.last_login), 'dd MMM, HH:mm') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus.mutate({ id: u.id, is_active: u.is_active })}
                      className={`text-xs px-2.5 py-1 rounded-lg transition font-medium
                        ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
