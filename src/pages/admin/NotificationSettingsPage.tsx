import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notifyService, patientService } from '../../services/api'
import { Bell, Mail, MessageSquare, Send, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function NotificationSettingsPage() {
  const [tab, setTab] = useState<'config' | 'send'>('config')
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSms, setSendSms] = useState(false)
  const [sending, setSending] = useState(false)
  const [showPatients, setShowPatients] = useState(false)

  const { data: config } = useQuery({
    queryKey: ['notify-config'],
    queryFn: () => notifyService.getConfig().then(r => r.data),
  })

  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-notify', patientSearch],
    queryFn: () => patientService.list({ search: patientSearch, size: 8 }).then(r => r.data),
    enabled: patientSearch.length >= 2,
  })

  const patients = patientResults?.patients || []

  const handleSend = async () => {
    if (!selectedPatient) return toast.error('Select a patient')
    if (!message.trim()) return toast.error('Enter a message')
    setSending(true)
    try {
      const res = await notifyService.custom({
        patient_id: selectedPatient.id,
        message, subject: subject || `Message from HMS Hospital`,
        send_email: sendEmail, send_sms: sendSms,
      })
      const r = (res.data as any).results
      if (r.email || r.sms) toast.success(`Sent! Email: ${r.email ? '✓' : '✗'} · SMS: ${r.sms ? '✓' : '✗'}`)
      else toast.error('Not sent — check SMTP/SMS configuration')
      setMessage(''); setSubject(''); setSelectedPatient(null)
    } catch {
      toast.error('Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Notification Settings</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Email (SMTP) and SMS configuration · Send messages to patients</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {[['config', 'Configuration'], ['send', 'Send Message']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === k ? '2px solid #7C3AED' : '2px solid transparent', color: tab === k ? '#7C3AED' : '#9CA3AF' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Current Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Email (SMTP)', ok: config?.email_configured, detail: config?.smtp_host, icon: Mail },
                { label: 'SMS', ok: config?.sms_configured, detail: config?.sms_provider, icon: MessageSquare },
              ].map(({ label, ok, detail, icon: Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${ok ? '#A7F3D0' : '#FECACA'}`, borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: ok ? '#D1FAE5' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={ok ? '#059669' : '#DC2626'} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: ok ? '#059669' : '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {ok ? <CheckCircle size={14} /> : <XCircle size={14} />} {label}
                    </p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{detail || 'Not configured'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Guide */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 12 }}>Setup Instructions</h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Add these environment variables to your <code style={{ background: '#F5F3FF', padding: '1px 6px', borderRadius: 4, color: '#7C3AED', fontSize: 12 }}>backend/.env</code> file:</p>

            <div style={{ background: '#1E1B4B', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <pre style={{ color: '#C4B5FD', fontSize: 12, margin: 0, lineHeight: 1.8, overflowX: 'auto' }}>
{`# Email (SMTP) — Gmail example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your@gmail.com
HOSPITAL_NAME=Your Hospital Name

# SMS — Fast2SMS (India) example
SMS_API_URL=https://www.fast2sms.com/dev/bulkV2
SMS_API_KEY=your-fast2sms-api-key
SMS_SENDER_ID=HMSAPP`}
              </pre>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { title: 'Gmail App Password', steps: ['Gmail → Account Settings', 'Security → 2-Step Verification (enable)', 'App passwords → Generate', 'Use generated password in SMTP_PASSWORD'] },
                { title: 'Fast2SMS (India SMS)', steps: ['Register at fast2sms.com', 'Get API key from dashboard', 'Add API key to SMS_API_KEY', 'Top up balance for SMS credits'] },
              ].map(({ title, steps }) => (
                <div key={title} style={{ background: '#F9F7FF', border: '1px solid #EDE9FE', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95', marginBottom: 8 }}>{title}</p>
                  <ol style={{ paddingLeft: 16, margin: 0 }}>
                    {steps.map((s, i) => <li key={i} style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Send Tab */}
      {tab === 'send' && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Send Message to Patient</h3>

          {/* Patient Search */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Patient *</label>
            {selectedPatient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F5F3FF', border: '1.5px solid #7C3AED', borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                  <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>{selectedPatient.uhid} · {selectedPatient.phone}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Change</button>
              </div>
            ) : (
              <div>
                <input value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setShowPatients(true) }}
                  className={inputCls} placeholder="Search patient by name or UHID..." />
                {showPatients && patients.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 10, boxShadow: '0 8px 24px rgba(109,40,217,0.12)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                    {patients.map((p: any) => (
                      <div key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowPatients(false) }}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F9F7FF' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>{p.first_name} {p.last_name}</p>
                        <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>{p.uhid} · {p.email || 'No email'} · {p.phone || 'No phone'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Subject (Email)</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="e.g. Your appointment reminder" />
          </div>

          {/* Message */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className={inputCls} placeholder="Type your message here..." />
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{message.length}/160 chars · SMS sends first 160 chars</p>
          </div>

          {/* Channel Selection */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { key: 'email', label: 'Send Email', icon: Mail, value: sendEmail, set: setSendEmail, ok: config?.email_configured },
              { key: 'sms', label: 'Send SMS', icon: MessageSquare, value: sendSms, set: setSendSms, ok: config?.sms_configured },
            ].map(({ key, label, icon: Icon, value, set, ok }) => (
              <button key={key} onClick={() => set(!value)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1.5px solid', borderColor: value ? '#7C3AED' : '#E5E7EB', background: value ? '#F5F3FF' : '#fff', cursor: 'pointer', opacity: ok ? 1 : 0.5 }}>
                <Icon size={16} color={value ? '#7C3AED' : '#6B7280'} />
                <span style={{ fontSize: 13, fontWeight: 600, color: value ? '#7C3AED' : '#6B7280' }}>{label}</span>
                {!ok && <span style={{ fontSize: 10, color: '#EF4444' }}>(not configured)</span>}
              </button>
            ))}
          </div>

          <button onClick={handleSend} disabled={sending || !selectedPatient || !message.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', opacity: (sending || !selectedPatient || !message.trim()) ? 0.6 : 1 }}>
            <Send size={15} />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      )}
    </div>
  )
}
