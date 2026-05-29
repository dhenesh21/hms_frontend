import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { authService } from '../../../services/api'
import { UserPlus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface StaffRolePageProps {
  role: string
  title: string
  color: string
  description: string
}

export default function StaffRolePage({ role, title, color, description }: StaffRolePageProps) {
  const qc = useQueryClient()

  // ✅ FIX: Better query configuration with automatic refetch
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await authService.listUsers()
        return response || []
      } catch (err) {
        console.error('Error fetching users:', err)
        return []
      }
    },
    staleTime: 0, // ✅ Treat data as stale immediately
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 mins
    refetchOnWindowFocus: true, // ✅ Refetch when tab gets focus
    refetchOnMount: true, // ✅ Always refetch on component mount
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, is_active }: any) => authService.updateUser(id, { is_active: !is_active }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Status updated') 
    }
  })

  const filtered = users.filter((u: any) => u.role === role)
  const active = filtered.filter((u: any) => u.is_active).length || 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ Manual Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <Link to="/admin/users/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            <UserPlus size={16} /> Add {title.replace('s','')}
          </Link>
        </div>
      </div>

      {/* ✅ Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Error loading staff data. 
            <button onClick={() => refetch()} className="ml-2 underline font-bold hover:text-red-900">
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: filtered.length, cls: 'text-gray-800' },
          { label: 'Active', value: active, cls: 'text-green-600' },
          { label: 'Inactive', value: filtered.length - active, cls: 'text-red-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Emp ID', 'Name', 'Email', 'Department', 'Phone', 'Status', 'Joined', 'Action'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-14">
                  <p className="text-gray-400 text-sm">No {title.toLowerCase()} registered yet</p>
                  <Link to="/admin/users/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                    + Add first {title.replace('s', '').toLowerCase()} →
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-600">{u.employee_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                        <span className="text-xs font-bold">{u.full_name?.[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus.mutate({ id: u.id, is_active: u.is_active })}
                      disabled={toggleStatus.isPending}
                      className={`text-xs px-2.5 py-1 rounded-lg transition font-medium disabled:opacity-50
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