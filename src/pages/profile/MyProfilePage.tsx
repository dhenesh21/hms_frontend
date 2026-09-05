import { useAuthStore } from '../../store/authStore'
import { uploadService } from '../../services/api'
import PhotoUpload from '../../components/ui/PhotoUpload'
import { User, Mail, Phone, Building2, Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MyProfilePage() {
  const { user, setUser } = useAuthStore()

  if (!user) return null

  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: 4 }}>My Profile</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 24 }}>View and update your profile photo</p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 32 }}>
        {/* Photo */}
        <PhotoUpload
          currentUrl={user.photo_url}
          name={user.full_name}
          size={100}
          onUpload={(file) => uploadService.userPhoto(user.id, file).then(r => r.data)}
          onDelete={() => uploadService.deleteUserPhoto(user.id)}
          onSuccess={(url) => setUser({ ...user, photo_url: url || null })}
        />

        {/* Info */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: User, label: 'Full Name', value: user.full_name },
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Phone, label: 'Phone', value: user.phone || '—' },
            { icon: Building2, label: 'Department', value: user.department || '—' },
            { icon: Shield, label: 'Role', value: user.role },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#FAFAFF', borderRadius: 10, border: '1px solid #EDE9FE' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color="#7C3AED" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: 14, color: '#1E1B4B', margin: 0, fontWeight: 600, textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <Link to="/profile/mfa" style={{ width: '100%', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: '#FAFAFF', borderRadius: 10, border: '1px solid #EDE9FE', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user.mfa_enabled ? <ShieldCheck size={18} color="#15803D" /> : <ShieldOff size={18} color="#9CA3AF" />}
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Two-Factor Authentication</p>
                <p style={{ fontSize: 14, color: '#1E1B4B', margin: 0, fontWeight: 600 }}>{user.mfa_enabled ? 'Enabled' : 'Not enabled — set up now'}</p>
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 700 }}>Manage →</span>
          </div>
        </Link>

        <p style={{ fontSize: 11, color: '#C4B5FD', textAlign: 'center' }}>
          To update name, email, phone or department — contact your administrator
        </p>
      </div>
    </div>
  )
}
