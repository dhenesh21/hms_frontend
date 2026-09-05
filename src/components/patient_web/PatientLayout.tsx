import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { isPatientLoggedIn, patientLogout } from '../../services/patientApi'
import { LogOut } from 'lucide-react'

export function PatientProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isPatientLoggedIn()) return <Navigate to="/patient/login" replace />
  return <>{children}</>
}

const NAV = [
  { to: '/patient/home', label: 'Home' },
  { to: '/patient/appointments', label: 'Appointments' },
  { to: '/patient/records', label: 'Records' },
  { to: '/patient/billing', label: 'Bills' },
  { to: '/patient/telemedicine', label: 'Video Consult' },
  { to: '/patient/feedback', label: 'Feedback' },
]

export default function PatientLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <span style={{ fontWeight: 800, color: '#7C3AED', fontSize: 16 }}>My Health Portal</span>
            <nav style={{ display: 'flex', gap: 4 }}>
              {NAV.map(n => (
                <Link key={n.to} to={n.to}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    color: location.pathname === n.to ? '#7C3AED' : '#6B7280',
                    background: location.pathname === n.to ? '#F5F3FF' : 'transparent',
                  }}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <button onClick={() => { patientLogout(); navigate('/patient/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <Outlet />
      </div>
    </div>
  )
}
