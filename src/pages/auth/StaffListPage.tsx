import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { authService } from '../../services/api'
import { UserPlus, Search, Users } from 'lucide-react'
import { useState } from 'react'
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

export default function StaffListPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authService.listUsers().then(r => r.data)
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) =>
      authService.updateUser(id, { is_active: !is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated') }
  })

  const filtered = users?.filter((u: any) =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const roleCounts = users?.reduce((acc: any, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500">{users?.length ?? 0} registered staff members</p>
        </div>
        <Link to="/admin/staff/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <UserPlus size={16} /> Register Staff
        </Link>
      </div>

      {/* Role summary */}
      {roleCounts && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleCounts).map(([role, count]: any) => (
            <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
              <span className="capitalize">{role.replace('_', ' ')}</span>
              <span className="bg-white bg-opacity-60 px-1.5 py-0.5 rounded-full">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" placeholder="Search by name, email, ID, role..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Employee ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <Users size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No staff found</p>
                  <Link to="/admin/staff/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                    Register first staff member →
                  </Link>
                </td>
              </tr>
            ) : (
              filtered?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 font-medium">{user.employee_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{user.full_name?.[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.last_login ? format(new Date(user.last_login), 'dd MMM, HH:mm') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus.mutate({ id: user.id, is_active: user.is_active })}
                      className={`text-xs px-2.5 py-1 rounded-lg transition ${user.is_active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'}`}>
                      {user.is_active ? 'Deactivate' : 'Activate'}
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
