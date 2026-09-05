import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { patientAuthService, PATIENT_TOKEN_KEY, PATIENT_ID_KEY } from '../../services/patientApi'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PatientRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ uhid: '', phone: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await patientAuthService.register({
        uhid: form.uhid, phone: form.phone, password: form.password,
        email: form.email || undefined,
      })
      localStorage.setItem(PATIENT_TOKEN_KEY, res.data.access_token)
      localStorage.setItem(PATIENT_ID_KEY, String(res.data.patient_id))
      navigate('/patient/home')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: 20 }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', marginBottom: 4 }}>Create your account</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>You must be a registered hospital patient — enter your UHID exactly as on your hospital card.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} className={inputCls} placeholder="Hospital UHID" required />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="Registered phone number" required />
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="Email (optional)" />
          <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" className={inputCls} placeholder="Create password" required />
          <input value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} type="password" className={inputCls} placeholder="Confirm password" required />
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
          Already have an account? <Link to="/patient/login" style={{ color: '#7C3AED', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
