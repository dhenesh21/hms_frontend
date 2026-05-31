import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Hospital, LayoutDashboard, Users, UserRound, Calendar,
  Stethoscope, BedDouble, FileText, HeartPulse, FlaskConical,
  ScanLine, ActivitySquare, Receipt, Pill, ShieldCheck,
  Briefcase, BarChart3, Settings, LogOut, Bell, Search,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { useState } from 'react'

const SIDEBAR_W = 240
const TOPBAR_H  = 60

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients',    icon: Users,            label: 'Patients' },
  { to: '/doctors',     icon: UserRound,        label: 'Doctors' },
  { to: '/appointments',icon: Calendar,         label: 'Appointments' },
  { to: '/opd',         icon: Stethoscope,      label: 'OPD' },
  { to: '/ipd',         icon: BedDouble,        label: 'IPD' },
  { to: '/emr',         icon: FileText,         label: 'EMR' },
  { to: '/nursing',     icon: HeartPulse,       label: 'Nursing' },
  { to: '/lab',         icon: FlaskConical,     label: 'Lab' },
  { to: '/radiology',   icon: ScanLine,         label: 'Radiology' },
  { to: '/ot',          icon: ActivitySquare,   label: 'OT' },
  { to: '/billing',     icon: Receipt,          label: 'Billing' },
  { to: '/pharmacy',    icon: Pill,             label: 'Pharmacy' },
  { to: '/insurance',   icon: ShieldCheck,      label: 'Insurance' },
  { to: '/hr',          icon: Briefcase,        label: 'HR & Payroll' },
  { to: '/reports',     icon: BarChart3,        label: 'Reports' },
]

const adminItems = [
  { to: '/admin/users',               label: 'All Users' },
  { to: '/admin/users/new',           label: 'Register Staff' },
  { to: '/admin/staff/doctors',       label: 'Doctors' },
  { to: '/admin/staff/nurses',        label: 'Nurses' },
  { to: '/admin/staff/receptionists', label: 'Receptionists' },
  { to: '/admin/staff/lab',           label: 'Lab Technicians' },
  { to: '/admin/staff/pharmacists',   label: 'Pharmacists' },
  { to: '/admin/staff/accountants',   label: 'Accountants' },
  { to: '/admin/staff/others',        label: 'Other Staff' },
  { to: '/admin/departments',         label: 'Departments' },
  { to: '/admin/roles',               label: 'Roles' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [adminOpen, setAdminOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F3FF' }}>

      {/* ════════════════════════════
          SIDEBAR  (fixed, left 0)
      ════════════════════════════ */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: SIDEBAR_W,
        background: '#fff',
        borderRight: '1.5px solid #EDE9FE',
        boxShadow: '2px 0 16px rgba(124,58,237,0.07)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #F3F0FF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              flexShrink: 0,
            }}>
              <Hospital size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', lineHeight: 1.2 }}>HMS</p>
              <p style={{ fontSize: 10, color: '#A78BFA', fontWeight: 500 }}>Health. Care. First.</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0 12px' }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: '#A78BFA', padding: '10px 18px 4px', textTransform: 'uppercase'
          }}>Main Menu</p>

          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#A78BFA', padding: '14px 18px 4px', textTransform: 'uppercase'
              }}>Admin</p>
              <button onClick={() => setAdminOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: 'calc(100% - 16px)', margin: '1px 8px',
                padding: '9px 12px', borderRadius: 10,
                fontSize: 13.5, fontWeight: 500, color: '#6B7280',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Settings size={17} style={{ opacity: 0.7 }} />
                  Admin Panel
                </span>
                {adminOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {adminOpen && (
                <div style={{ marginLeft: 26, borderLeft: '2px solid #EDE9FE', paddingLeft: 6 }}>
                  {adminItems.map(({ to, label }) => (
                    <NavLink key={to} to={to} style={{ textDecoration: 'none', fontSize: 12.5, padding: '6px 10px' }}
                      className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #F3F0FF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div className="avatar avatar-sm avatar-purple">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 11, color: '#A78BFA', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: '#EF4444',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseOver={e => (e.currentTarget.style.background = '#FEF2F2')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ════════════════════════════
          TOPBAR  (fixed, left=SIDEBAR_W)
      ════════════════════════════ */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: SIDEBAR_W,          /* ← exact pixel, no CSS var */
        right: 0,
        height: TOPBAR_H,
        background: '#fff',
        borderBottom: '1.5px solid #EDE9FE',
        boxShadow: '0 2px 8px rgba(124,58,237,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 99,
      }}>
        {/* Search bar — left side of topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F5F3FF',
          border: '1.5px solid #EDE9FE',
          borderRadius: 10,
          padding: '8px 16px',
          width: 340,
          transition: 'border-color 0.15s',
        }}
          onFocus={e => (e.currentTarget.style.borderColor = '#A78BFA')}
          onBlur={e  => (e.currentTarget.style.borderColor = '#EDE9FE')}>
          <Search size={15} color="#A78BFA" style={{ flexShrink: 0 }} />
          <input
            placeholder="Search patients, doctors, bills..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13.5, color: '#1E1B4B', width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Bell */}
          <button style={{
            position: 'relative', width: 38, height: 38,
            borderRadius: 10, border: '1.5px solid #EDE9FE',
            background: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#7C3AED',
          }}>
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, borderRadius: '50%',
              background: '#EF4444', border: '1.5px solid #fff',
            }} />
          </button>

          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}>{initials}</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', lineHeight: 1.2 }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 11, color: '#A78BFA', textTransform: 'capitalize' }}>
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════
          MAIN CONTENT
      ════════════════════════════ */}
      <main style={{
        marginLeft: SIDEBAR_W,      /* ← exact pixel */
        marginTop: TOPBAR_H,        /* ← exact pixel */
        flex: 1,
        minHeight: `calc(100vh - ${TOPBAR_H}px)`,
        padding: 28,
        background: '#F5F3FF',
      }}
        className="fade-in">
        {children}
      </main>

    </div>
  )
}