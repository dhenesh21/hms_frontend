import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Users, UserPlus, Building2, Shield, Stethoscope,
  HeartPulse, ClipboardList, FlaskConical, Pill,
  Calculator, MoreHorizontal, ChevronLeft, Settings
} from 'lucide-react'

const MENU = [
  {
    group: 'User Management',
    items: [
      { to: '/admin/users', icon: Users, label: 'All Users' },
      { to: '/admin/users/new', icon: UserPlus, label: 'Register Staff' },
      { to: '/admin/departments', icon: Building2, label: 'Departments' },
      { to: '/admin/roles', icon: Shield, label: 'Roles' },
    ]
  },
  {
    group: 'HR Management',
    items: [
      { to: '/admin/staff/doctors', icon: Stethoscope, label: 'Doctors' },
      { to: '/admin/staff/nurses', icon: HeartPulse, label: 'Nurses' },
      { to: '/admin/staff/receptionists', icon: ClipboardList, label: 'Receptionists' },
      { to: '/admin/staff/lab', icon: FlaskConical, label: 'Lab Technicians' },
      { to: '/admin/staff/pharmacists', icon: Pill, label: 'Pharmacists' },
      { to: '/admin/staff/accountants', icon: Calculator, label: 'Accountants' },
      { to: '/admin/staff/others', icon: MoreHorizontal, label: 'Other Staff' },
    ]
  }
]

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition
  ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`

export default function AdminLayout() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <div className="flex h-full">
      {/* Admin Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ChevronLeft size={14} /> Back to HMS
          </button>
          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Settings size={16} className="text-blue-600" /> Admin Panel
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.full_name}</p>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {MENU.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} end className={linkCls}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  )
}
