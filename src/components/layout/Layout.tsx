import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Hospital, LayoutDashboard, Users, UserRound, Calendar,
  Stethoscope,  BedDouble, FileText, HeartPulse, FlaskConical, ScanLine, ActivitySquare,
  Receipt, Pill, ShieldCheck, Briefcase, BarChart3, Settings, LogOut, ChevronRight, Bell, ChevronDown, ChevronUp
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/doctors', icon: UserRound, label: 'Doctors' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/opd', icon: Stethoscope, label: 'OPD' },
  { to: '/ipd', icon: BedDouble, label: 'IPD' },
  { to: '/emr', icon: FileText, label: 'EMR' },
  { to: '/nursing', icon: HeartPulse, label: 'Nursing' },
  { to: '/lab', icon: FlaskConical, label: 'Lab' },
  { to: '/radiology', icon: ScanLine, label: 'Radiology' },
  { to: '/ot', icon: ActivitySquare, label: 'OT' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/pharmacy', icon: Pill, label: 'Pharmacy' },
  { to: '/insurance', icon: ShieldCheck, label: 'Insurance' },
  { to: '/hr', icon: Briefcase, label: 'HR' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const adminItems = [
  { to: '/admin/users', label: 'All Users' },
  { to: '/admin/users/new', label: 'Register Staff' },
  { to: '/admin/staff/doctors', label: 'Doctors' },
  { to: '/admin/staff/nurses', label: 'Nurses' },
  { to: '/admin/staff/receptionists', label: 'Receptionists' },
  { to: '/admin/staff/lab', label: 'Lab Technicians' },
  { to: '/admin/staff/pharmacists', label: 'Pharmacists' },
  { to: '/admin/staff/accountants', label: 'Accountants' },
  { to: '/admin/staff/others', label: 'Other Staff' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/roles', label: 'Roles' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [adminOpen, setAdminOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">HMS Portal</p>
              <p className="text-xs text-gray-400">v1.0</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* Admin Section — only for admin role */}
          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <Settings size={18} />
                  <span>Admin Panel</span>
                </div>
                {adminOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {adminOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-blue-100 pl-3">
                  {adminItems.map(({ to, label }) => (
                    <NavLink key={to} to={to}
                      className={({ isActive }) =>
                        `block px-2 py-1.5 rounded-lg text-xs transition
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`
                      }>
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 text-xs font-bold">
                {user?.full_name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 w-full px-2 py-1.5 rounded hover:bg-red-50 transition">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
