import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patientService } from '../../services/api'
import { ArrowLeft, Edit, Calendar, Stethoscope, Phone, MapPin, Heart, Shield } from 'lucide-react'
import { format } from 'date-fns'

const TABS = ['Overview', 'Medical History', 'Prescriptions', 'Lab Reports', 'Billing', 'Documents']

function InfoBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="info-label">{label}</p>
      <p className="info-value">{value || '—'}</p>
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.get(Number(id)).then(r => r.data)
  })
  const { data: history } = useQuery({
    queryKey: ['patient-history', id],
    queryFn: () => patientService.history(Number(id)).then(r => r.data)
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#A78BFA' }}>
      Loading patient...
    </div>
  )
  if (!patient) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#C4B5FD' }}>
      Patient not found
    </div>
  )

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Back */}
      <button onClick={() => navigate('/patients')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B5CF6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Patients
      </button>

      {/* Patient Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 20,
        color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, border: '2px solid rgba(255,255,255,0.3)'
          }}>
            {patient.first_name?.[0]}{patient.last_name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              {patient.first_name} {patient.last_name}
            </h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
                {patient.uhid}
              </span>
              {age && <span style={{ fontSize: 12, opacity: 0.8 }}>{age} years · {patient.gender}</span>}
              {patient.blood_group && (
                <span style={{ fontSize: 12, background: 'rgba(239,68,68,0.3)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
                  🩸 {patient.blood_group}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/appointments/new?patient_id=${patient.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)'
              }}>
              <Calendar size={14} /> Book Appointment
            </Link>
            <Link to={`/opd/new?patient_id=${patient.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
                background: '#fff', color: '#7C3AED',
              }}>
              <Stethoscope size={14} /> OPD Visit
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Left: Tabs */}
        <div>
          <div className="tabs" style={{ marginBottom: 20 }}>
            {TABS.map((t, i) => (
              <button key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
                {t}
              </button>
            ))}
          </div>

          {tab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <p className="section-title" style={{ marginBottom: 16 }}>Personal Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <InfoBlock label="Full Name" value={`${patient.first_name} ${patient.last_name}`} />
                  <InfoBlock label="Date of Birth" value={patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd MMM yyyy') : null} />
                  <InfoBlock label="Phone" value={patient.phone} />
                  <InfoBlock label="Email" value={patient.email} />
                  <InfoBlock label="Address" value={patient.address} />
                  <InfoBlock label="Emergency Contact" value={patient.emergency_contact_phone} />
                </div>
              </div>

              {/* OPD History */}
              <div className="card">
                <div className="section-header">
                  <p className="section-title">Recent Visits</p>
                  <Link to={`/opd?patient_id=${patient.id}`} style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
                </div>
                {(history?.opd_visits || []).slice(0, 4).map((v: any) => (
                  <div key={v.id} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '12px 0', borderBottom: '1px solid #F3F0FF'
                  }}>
                    <div style={{ width: 40, minWidth: 40, textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED', lineHeight: 1 }}>
                        {v.visit_date ? format(new Date(v.visit_date), 'd') : '—'}
                      </p>
                      <p style={{ fontSize: 10, color: '#A78BFA' }}>
                        {v.visit_date ? format(new Date(v.visit_date), 'MMM') : ''}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{v.doctor_name}</p>
                      <p style={{ fontSize: 12, color: '#8B5CF6' }}>{v.department}</p>
                      {v.chief_complaint && <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{v.chief_complaint}</p>}
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>OPD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="card">
              <p className="section-title" style={{ marginBottom: 16 }}>Medical History</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Allergies</p>
                  {(patient.allergies?.length > 0) ? (
                    patient.allergies.map((a: string, i: number) => (
                      <span key={i} className="badge badge-red" style={{ marginRight: 4, marginBottom: 4 }}>{a}</span>
                    ))
                  ) : <p style={{ fontSize: 13, color: '#A78BFA' }}>No known allergies</p>}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Chronic Diseases</p>
                  {(patient.chronic_diseases?.length > 0) ? (
                    patient.chronic_diseases.map((d: string, i: number) => (
                      <span key={i} className="badge badge-amber" style={{ marginRight: 4, marginBottom: 4 }}>{d}</span>
                    ))
                  ) : <p style={{ fontSize: 13, color: '#A78BFA' }}>None recorded</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Contact Info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Phone, label: patient.phone || '—' },
                { icon: MapPin, label: patient.address || '—' },
                { icon: Shield, label: `Emergency: ${patient.emergency_contact_phone || '—'}` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color="#7C3AED" />
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.4, marginTop: 4 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Insurance</p>
            {patient.insurance_provider ? (
              <div>
                <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{patient.insurance_provider}</p>
                <p style={{ fontSize: 12, color: '#A78BFA', marginTop: 4 }}>{patient.insurance_policy_number}</p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#C4B5FD' }}>No insurance on file</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
