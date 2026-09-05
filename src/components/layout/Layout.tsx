import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import {
  Hospital, LayoutDashboard, Users, UserRound, Calendar,
  Stethoscope, BedDouble, FileText, HeartPulse, FlaskConical, Activity,
  ScanLine, ActivitySquare, Receipt, Pill, ShieldCheck, ShieldAlert,
  Briefcase, BarChart3, Settings, LogOut, Bell, Search, Building2,
  ChevronDown, ChevronUp, UserCircle, Droplets, Siren, Truck, Baby, Snowflake, Sparkles, UserCheck, Wrench, AlertOctagon, Package,
  ClipboardList, FileSignature, ListChecks, History, Syringe, BedSingle, HeartHandshake, Video, Globe2, MessageSquareWarning,
  Droplet, Brain, Ribbon, GitMerge, BookMarked, Database, Share2, FileCode, KeyRound, Monitor, CreditCard, Boxes,
  FileBarChart, LineChart, BookUser

} from 'lucide-react'
import { useState, useRef, useEffect } from "react"

const SIDEBAR_W = 260
const TOPBAR_H = 64

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/doctors', icon: UserRound, label: 'Doctors' },
  { to: '/doctors/availability', icon: Calendar, label: 'Doctor Availability' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/opd', icon: Stethoscope, label: 'OPD' },
  { to: '/emergency', icon: Siren, label: 'Emergency' },
  { to: '/ipd', icon: BedDouble, label: 'IPD' },
  { to: '/critical-care', icon: Activity, label: 'Critical Care' },
  { to: '/ambulance', icon: Truck, label: 'Ambulance' },
  { to: '/birth-register', icon: Baby, label: 'Birth Register' },
  { to: '/mortuary', icon: Snowflake, label: 'Mortuary' },
  { to: '/housekeeping', icon: Sparkles, label: 'Housekeeping' },
  { to: '/infection-control', icon: ShieldAlert, label: 'Infection Control' },
  { to: '/front-desk', icon: UserCheck, label: 'Front Desk' },
  { to: '/cssd', icon: Package, label: 'CSSD' },
  { to: '/facility', icon: Wrench, label: 'Facility & Equipment' },
  { to: '/security-incidents', icon: AlertOctagon, label: 'Security Incidents' },
  { to: '/cpoe', icon: ClipboardList, label: 'CPOE / Orders' },
  { to: '/consent', icon: FileSignature, label: 'Consent Management' },
  { to: '/clinical-forms', icon: FileText, label: 'Clinical Forms' },
  { to: '/care-plans', icon: ListChecks, label: 'Care Plans' },
  { to: '/clinical-timeline', icon: History, label: 'Clinical Timeline' },
  { to: '/cds', icon: ShieldAlert, label: 'Clinical Decision Support' },
  { to: '/anesthesia', icon: Syringe, label: 'Anesthesia' },
  { to: '/recovery-room', icon: BedSingle, label: 'Recovery Room' },
  { to: '/physiotherapy', icon: Activity, label: 'Physiotherapy' },
  { to: '/pain-management', icon: Activity, label: 'Pain Management' },
  { to: '/palliative-care', icon: HeartHandshake, label: 'Palliative Care' },
  { to: '/telemedicine', icon: Video, label: 'Telemedicine' },
  { to: '/preventive-health', icon: HeartPulse, label: 'Preventive Health' },
  { to: '/family', icon: Users, label: 'Family / Proxy' },
  { to: '/patient-category', icon: Globe2, label: 'International / Corporate' },
  { to: '/doctor-portal', icon: UserRound, label: 'Doctor Portal' },
  { to: '/nurse-portal', icon: HeartPulse, label: 'Nurse Portal' },
  { to: '/nurse-roster', icon: ClipboardList, label: 'Nurse Ward Roster' },
  { to: '/patient-portal-admin', icon: MessageSquareWarning, label: 'Patient Grievances' },
  { to: '/dialysis', icon: Droplet, label: 'Dialysis' },
  { to: '/mental-health', icon: Brain, label: 'Mental Health' },
  { to: '/fertility', icon: Baby, label: 'Fertility / IVF' },
  { to: '/oncology', icon: Ribbon, label: 'Oncology' },
  { to: '/transplant', icon: HeartPulse, label: 'Transplant' },
  { to: '/mpi', icon: GitMerge, label: 'Master Patient Index' },
  { to: '/provider-registry', icon: Users, label: 'Provider Registry' },
  { to: '/facility-registry', icon: Building2, label: 'Facility Registry' },
  { to: '/terminology', icon: BookMarked, label: 'Terminology' },
  { to: '/data-governance', icon: Database, label: 'Data Governance' },
  { to: '/fhir', icon: Share2, label: 'FHIR' },
  { to: '/hl7', icon: FileCode, label: 'HL7 v2' },
  { to: '/data-exchange', icon: ShieldCheck, label: 'Data Exchange' },
  { to: '/identity-provider', icon: KeyRound, label: 'Identity Provider (SSO)' },
  { to: '/dicom', icon: Monitor, label: 'DICOM / PACS' },
  { to: '/payment-gateway', icon: CreditCard, label: 'Payment Gateway' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/nursing', icon: HeartPulse, label: 'Nursing' },
  { to: '/lab', icon: FlaskConical, label: 'Lab' },
  { to: '/radiology', icon: ScanLine, label: 'Radiology' },
  { to: '/report-templates', icon: FileBarChart, label: 'Report Templates' },
  { to: '/analytics', icon: LineChart, label: 'Analytics' },
  { to: '/staff-directory', icon: BookUser, label: 'Staff Directory' },
  { to: '/ot', icon: ActivitySquare, label: 'OT' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/pharmacy', icon: Pill, label: 'Pharmacy' },
  { to: '/insurance', icon: ShieldCheck, label: 'Insurance' },
  { to: '/hr', icon: Briefcase, label: 'HR & Payroll' },
  { to: '/accounts', icon: Receipt, label: 'Accounts' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/medical-coding', icon: FileCode, label: 'Medical Coding & RCM' },
  { to: '/organization-settings', icon: Building2, label: 'Organization Settings' },
  { to: '/blood-bank', icon: Droplets, label: 'Blood Bank' },
  { to: '/queue', icon: Users, label: 'OPD Queue' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
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
  { to: '/admin/facilities', label: 'Facility Management' },
  { to: '/admin/settings', label: 'Hospital Settings' },
  { to: '/admin/notifications', label: 'Notification Settings' },
]

function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<any>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/notifications', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).then(r => r.json()).then(setData).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = data?.count || 0
  const PRIORITY_COLORS: Record<string, string> = {
    error: '#FEF2F2', warning: '#FFFBEB', info: '#F0F9FF'
  }
  const PRIORITY_DOT: Record<string, string> = {
    error: '#EF4444', warning: '#F59E0B', info: '#3B82F6'
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'relative', width: 38, height: 38,
        borderRadius: 10, border: '1.5px solid #EDE9FE',
        background: open ? '#F5F3FF' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#7C3AED',
      }}>
        <Bell size={16} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
            background: '#EF4444', border: '2px solid #fff',
            fontSize: 10, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{count}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0, width: 340,
          background: '#fff', border: '1.5px solid #EDE9FE',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(109,40,217,0.12)',
          zIndex: 9999, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F0FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>Notifications</span>
            {count > 0 && <span style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{count} alerts</span>}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {data?.notifications?.length > 0 ? data.notifications.map((n: any) => (
              <div key={n.id} style={{
                padding: '10px 16px', borderBottom: '1px solid #F9F7FF',
                background: PRIORITY_COLORS[n.priority] || '#fff', cursor: 'pointer',
              }} onClick={() => { navigate(n.link); setOpen(false) }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[n.priority] || '#6B7280', flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{n.message}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#C4B5FD', fontSize: 13 }}>
                <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p>All clear — no alerts</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  useSessionTimeout()
  const [adminOpen, setAdminOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div style={{ background: '#F8F7FF', minHeight: '100vh' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: SIDEBAR_W,
        background: '#ffffff',
        borderRight: '1px solid #EDE9FE',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          height: TOPBAR_H,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #EDE9FE',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
            marginRight: 12,
            flexShrink: 0,
          }}>
            <Hospital size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', lineHeight: 1.2, margin: 0 }}>HMS</p>
            <p style={{ fontSize: 10, color: '#A78BFA', fontWeight: 500, margin: 0 }}>Health. Care. First.</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: '#C4B5FD', padding: '8px 20px 6px',
            textTransform: 'uppercase', margin: 0,
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
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                color: '#C4B5FD', padding: '16px 20px 6px',
                textTransform: 'uppercase', margin: 0,
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
                    <NavLink key={to} to={to} end style={{ textDecoration: 'none' }}
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
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F0FF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {user?.photo_url ? (
              <img src={`http://127.0.0.1:8000${user.photo_url}`} alt={user.full_name}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EDE9FE', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
              }}>{initials}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 11, color: '#A78BFA', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: '#7C3AED',
            background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 2
          }}
            onMouseOver={e => (e.currentTarget.style.background = '#F5F3FF')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
            <UserCircle size={15} />
            My Profile
          </button>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: '#EF4444',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
            onMouseOver={e => (e.currentTarget.style.background = '#FEF2F2')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── TOPBAR ── */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: SIDEBAR_W,
        right: 0,
        height: TOPBAR_H,
        background: '#ffffff',
        borderBottom: '1px solid #EDE9FE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F8F7FF',
          border: '1.5px solid #EDE9FE',
          borderRadius: 12,
          padding: '9px 16px',
          width: 320,
        }}>
          <Search size={15} color="#A78BFA" style={{ flexShrink: 0 }} />
          <input
            placeholder="Search patients, doctors, bills..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13.5, color: '#1E1B4B', width: '100%',
              fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontSize: 10, color: '#C4B5FD', background: '#EDE9FE',
            padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
          }}>⌘K</kbd>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.photo_url ? (
              <img src={`http://127.0.0.1:8000${user.photo_url}`} alt={user.full_name}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EDE9FE', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>{initials}</div>
            )}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', lineHeight: 1.2, margin: 0 }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 11, color: '#A78BFA', margin: 0, textTransform: 'capitalize' }}>
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      {/* <main style={{
        marginLeft: SIDEBAR_W,
        paddingTop: TOPBAR_H,
        minHeight: '100vh',
        background: '#F8F7FF',
        padding: `${TOPBAR_H}px 28px 28px 28px`,
      }}> */}
      <main style={{
        position: 'absolute',
        top: TOPBAR_H,
        left: SIDEBAR_W,
        right: 0,
        minHeight: `calc(100vh - ${TOPBAR_H}px)`,
        padding: '28px 28px',
        background: '#F8F7FF',
      }}>
        {children}
      </main>

    </div>
  )
}
