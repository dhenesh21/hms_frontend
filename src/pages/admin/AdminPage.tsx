import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminService } from '../../services/api'
import { Users, Shield, Key, FileText, Settings, CheckCircle, XCircle, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
const TABS = ['Dashboard', 'Users', 'Roles & Permissions', 'Audit Logs', 'Settings']

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  doctor: 'bg-blue-100 text-blue-700',
  nurse: 'bg-green-100 text-green-700',
  receptionist: 'bg-amber-100 text-amber-700',
  pharmacist: 'bg-purple-100 text-purple-700',
  lab_technician: 'bg-teal-100 text-teal-700',
  accountant: 'bg-orange-100 text-orange-700',
}

export default function AdminPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const { register, handleSubmit, reset } = useForm()
  const roleForm = useForm()
  const permForm = useForm()
  const settingForm = useForm()

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminService.getDashboard().then(r => r.data) })
  const { data: users } = useQuery({ queryKey: ['admin-users', search], queryFn: () => adminService.listUsers({ search: search || undefined }).then(r => r.data) })
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => adminService.listRoles().then(r => r.data) })
  const { data: permissions } = useQuery({ queryKey: ['permissions'], queryFn: () => adminService.listPermissions().then(r => r.data) })
  const { data: rolePerms } = useQuery({ queryKey: ['role-perms', selectedRole?.id], enabled: !!selectedRole, queryFn: () => adminService.getRolePermissions(selectedRole.id).then(r => r.data) })
  const { data: auditLogs } = useQuery({ queryKey: ['audit-logs'], enabled: tab === 3, queryFn: () => adminService.getAuditLogs({ limit: 100 }).then(r => r.data) })
  const { data: settings } = useQuery({ queryKey: ['settings'], enabled: tab === 4, queryFn: () => adminService.listSettings().then(r => r.data) })

  const toggleStatus = useMutation({
    mutationFn: (id: number) => adminService.toggleUserStatus(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status updated') }
  })

  const createRole = useMutation({
    mutationFn: (d: any) => adminService.createRole(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); roleForm.reset(); toast.success('Role created') }
  })

  const createPerm = useMutation({
    mutationFn: (d: any) => adminService.createPermission(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions'] }); permForm.reset(); toast.success('Permission created') }
  })

  const updateRolePerms = useMutation({
    mutationFn: ({ roleId, permIds }: any) => adminService.updateRolePermissions(roleId, { permission_ids: permIds, granted: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role-perms'] }); toast.success('Permissions updated') }
  })

  const createSetting = useMutation({
    mutationFn: (d: any) => adminService.createSetting(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); settingForm.reset(); toast.success('Setting saved') }
  })

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: any) => adminService.updateSetting(key, { value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Setting updated') }
  })

  const grantedPermIds = rolePerms?.granted_permissions?.map((p: any) => p.id) || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin & RBAC</h1>
          <p className="text-sm text-gray-500">Users · Roles · Permissions · Audit · Settings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: stats?.total_users, color: 'text-blue-600' },
          { label: 'Active Users', value: stats?.active_users, color: 'text-green-600' },
          { label: 'Inactive', value: stats?.inactive_users, color: 'text-red-500' },
          { label: 'Roles', value: stats?.total_roles, color: 'text-purple-600' },
          { label: "Today's Logins", value: stats?.today_logins, color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition
              ${tab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Users by Role</h2>
            <div className="space-y-2">
              {stats?.users_by_role && Object.entries(stats.users_by_role).map(([role, count]: any) => (
                <div key={role} className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'} capitalize`}>{role.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-semibold text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Audit Activity</h2>
            <div className="space-y-2">
              {stats?.recent_audit?.map((log: any, i: number) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{log.action}</p>
                    <p className="text-xs text-gray-400">{log.module} • {log.created_at ? format(new Date(log.created_at), 'dd MMM, HH:mm') : '—'}</p>
                  </div>
                </div>
              ))}
              {!stats?.recent_audit?.length && <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" placeholder="Search by name, email, employee ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['Emp ID','Name','Email','System Role','Dept','Status','Last Login','Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{u.employee_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{u.full_name?.[0]}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'} capitalize`}>{u.role?.replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.department || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{u.last_login ? format(new Date(u.last_login), 'dd MMM, HH:mm') : 'Never'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus.mutate(u.id)}
                        className={`text-xs px-2 py-1 rounded-lg ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!users?.length && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLES & PERMISSIONS */}
      {tab === 2 && (
        <div className="grid grid-cols-3 gap-4">
          {/* Create Role */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Create Role</h2>
            <form onSubmit={roleForm.handleSubmit(d => createRole.mutate(d))} className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Role Name *</label>
                <input {...roleForm.register('name', { required: true })} className={inputCls} placeholder="ward_manager" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Display Name *</label>
                <input {...roleForm.register('display_name', { required: true })} className={inputCls} placeholder="Ward Manager" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea {...roleForm.register('description')} rows={2} className={inputCls} /></div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create Role</button>
            </form>

            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">All Roles</h3>
              <div className="space-y-1.5">
                {roles?.map((r: any) => (
                  <button key={r.id} onClick={() => setSelectedRole(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition
                      ${selectedRole?.id === r.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                    <span>{r.display_name}</span>
                    {r.is_system && <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">system</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">Permissions — {selectedRole.display_name}</h2>
                  <button onClick={() => {
                    const allIds = permissions?.map((p: any) => p.id) || []
                    updateRolePerms.mutate({ roleId: selectedRole.id, permIds: allIds })
                  }} className="text-xs text-blue-600 hover:underline">Grant All</button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {permissions && (() => {
                    const byModule: Record<string, any[]> = {}
                    permissions.forEach((p: any) => { byModule[p.module] = [...(byModule[p.module] || []), p] })
                    return Object.entries(byModule).map(([module, perms]) => (
                      <div key={module}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2 px-2">{module}</p>
                        <div className="grid grid-cols-2 gap-1">
                          {perms.map((p: any) => {
                            const granted = grantedPermIds.includes(p.id)
                            return (
                              <label key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition text-sm
                                ${granted ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-transparent hover:border-gray-200'}`}>
                                <input type="checkbox" defaultChecked={granted}
                                  onChange={e => {
                                    const newIds = e.target.checked
                                      ? [...grantedPermIds, p.id]
                                      : grantedPermIds.filter((id: number) => id !== p.id)
                                    updateRolePerms.mutate({ roleId: selectedRole.id, permIds: newIds })
                                  }} className="rounded" />
                                <span className={granted ? 'text-green-700' : 'text-gray-600'}>{p.display_name || `${p.resource} ${p.action}`}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Shield size={40} className="mx-auto mb-3 opacity-30" />
                <p>Select a role to manage permissions</p>
              </div>
            )}

            {/* Create Permission */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 mb-3">Add Permission</h3>
              <form onSubmit={permForm.handleSubmit(d => createPerm.mutate(d))} className="grid grid-cols-4 gap-2">
                <input {...permForm.register('module', { required: true })} className={inputCls} placeholder="Module (e.g. billing)" />
                <input {...permForm.register('resource', { required: true })} className={inputCls} placeholder="Resource (e.g. bills)" />
                <select {...permForm.register('action', { required: true })} className={`${inputCls} bg-white`}>
                  {['create','read','update','delete','approve','export'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button type="submit" className="py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS */}
      {tab === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Audit Logs ({auditLogs?.length ?? 0})</h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50"><tr>
                {['Time','User ID','Action','Module','Resource','IP','Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{format(new Date(log.created_at), 'dd MMM, HH:mm:ss')}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{log.user_id || '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{log.action}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{log.module || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{log.resource_id ? `#${log.resource_id}` : '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{log.ip_address || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!auditLogs?.length && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No audit logs</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 4 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add System Setting</h2>
            <form onSubmit={settingForm.handleSubmit(d => createSetting.mutate(d))} className="grid grid-cols-4 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Key *</label>
                <input {...settingForm.register('key', { required: true })} className={inputCls} placeholder="hospital_name" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Value *</label>
                <input {...settingForm.register('value', { required: true })} className={inputCls} placeholder="City Hospital" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Category</label>
                <select {...settingForm.register('category')} className={`${inputCls} bg-white`}>
                  {['general','billing','pharmacy','notifications','security','compliance'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select></div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['Key','Value','Category','Description','Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {settings?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{s.key}</td>
                    <td className="px-4 py-3">
                      <input defaultValue={s.value} onBlur={e => {
                        if (e.target.value !== s.value) updateSetting.mutate({ key: s.key, value: e.target.value })
                      }} className="px-2 py-1 border border-gray-200 rounded text-sm w-full focus:ring-1 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{s.category}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{s.description || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{s.display_name || s.key}</td>
                  </tr>
                ))}
                {!settings?.length && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No settings configured</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
