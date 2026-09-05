import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { patientAuthService } from '../../services/patientApi'
import { Calendar, Folder, Receipt, Video, Star } from 'lucide-react'

export default function PatientHomePage() {
  const { data: me } = useQuery({ queryKey: ['pw-me'], queryFn: () => patientAuthService.me().then(r => r.data) })

  const cards = [
    { to: '/patient/appointments', icon: Calendar, label: 'Appointments', color: '#7C3AED' },
    { to: '/patient/records', icon: Folder, label: 'Health Records', color: '#0EA5E9' },
    { to: '/patient/billing', icon: Receipt, label: 'Bills', color: '#059669' },
    { to: '/patient/telemedicine', icon: Video, label: 'Video Consult', color: '#DC2626' },
    { to: '/patient/feedback', icon: Star, label: 'Feedback & Grievances', color: '#F59E0B' },
  ]

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', borderRadius: 16, padding: 24, marginBottom: 24, color: '#fff',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Hello, Patient #{me?.patient_id ?? '…'} 👋</h1>
        <p style={{ opacity: 0.85, fontSize: 13, marginTop: 4 }}>Manage your health records & appointments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {cards.map(c => (
          <Link key={c.to} to={c.to} className="card" style={{ padding: 20, textDecoration: 'none', display: 'block' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <c.icon size={20} color={c.color} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>{c.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
