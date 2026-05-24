import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patientService } from '../../services/api'
import { ArrowLeft, Edit, Calendar, Stethoscope, User, Phone, MapPin, Heart, Shield } from 'lucide-react'
import { format } from 'date-fns'

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value || '—'}</span>
    </div>
  )
}

const TABS = ['Overview', 'OPD History', 'Admissions', 'Appointments']

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
    <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  )

  if (!patient) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Patient not found</div>
  )

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const bloodGroupColors: Record<string, string> = {
    'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-100 text-red-700',
    'B+': 'bg-orange-100 text-orange-700', 'B-': 'bg-orange-100 text-orange-700',
    'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-100 text-purple-700',
    'O+': 'bg-green-100 text-green-700', 'O-': 'bg-green-100 text-green-700',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/patients')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-gray-500 font-mono">{patient.uhid}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/appointments/new?patient_id=${patient.id}`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <Calendar size={15} /> Book Appointment
          </Link>
          <Link to={`/opd/new?patient_id=${patient.id}`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Stethoscope size={15} /> OPD Visit
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-xl font-bold">{patient.first_name[0]}</span>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow label="Age / Gender"
              value={`${age ? age + ' yrs' : '—'} / ${patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}`} />
            <InfoRow label="Date of Birth"
              value={patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd MMM yyyy') : '—'} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Marital Status"
              value={patient.marital_status ? patient.marital_status.charAt(0).toUpperCase() + patient.marital_status.slice(1) : undefined} />
          </div>
          <div className="flex flex-col gap-2 items-end">
            {patient.blood_group && (
              <Badge label={patient.blood_group} color={bloodGroupColors[patient.blood_group] || 'bg-gray-100 text-gray-600'} />
            )}
            <Badge label={patient.is_active ? 'Active' : 'Inactive'}
              color={patient.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'OPD Visits', value: history?.opd_visits ?? 0, icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
          { label: 'Admissions', value: history?.admissions ?? 0, icon: Heart, color: 'text-red-600 bg-red-50' },
          { label: 'Appointments', value: history?.appointments ?? 0, icon: Calendar, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2
                ${tab === i ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Overview */}
          {tab === 0 && (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone size={13} /> Contact
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Email" value={patient.email} />
                  <InfoRow label="Address" value={patient.address} />
                  <InfoRow label="City / State" value={[patient.city, patient.state].filter(Boolean).join(', ')} />
                  <InfoRow label="Pincode" value={patient.pincode} />
                </div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6 flex items-center gap-2">
                  <User size={13} /> Emergency Contact
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Name" value={patient.emergency_contact_name} />
                  <InfoRow label="Phone" value={patient.emergency_contact_phone} />
                  <InfoRow label="Relation" value={patient.emergency_contact_relation} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Heart size={13} /> Medical Info
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Allergies" value={patient.allergies} />
                  <InfoRow label="Chronic Conditions" value={patient.chronic_conditions} />
                  <InfoRow label="Insurance Provider" value={patient.insurance_provider} />
                  <InfoRow label="Policy Number" value={patient.insurance_policy_number} />
                </div>
              </div>
            </div>
          )}

          {/* OPD History */}
          {tab === 1 && (
            <div>
              {history?.visits?.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No OPD visits yet</p>
              ) : (
                <div className="space-y-2">
                  {history?.visits?.map((v: any) => (
                    <Link key={v.id} to={`/opd/visits/${v.id}`}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-blue-50 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.primary_diagnosis || 'No diagnosis recorded'}</p>
                        <p className="text-xs text-gray-400 font-mono">{v.visit_number} • {format(new Date(v.visit_date), 'dd MMM yyyy')}</p>
                      </div>
                      <Badge label={v.status} color="bg-blue-100 text-blue-700" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admissions */}
          {tab === 2 && (
            <div>
              {history?.admissions_list?.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No admissions yet</p>
              ) : (
                <div className="space-y-2">
                  {history?.admissions_list?.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 font-mono">{a.admission_number}</p>
                        <p className="text-xs text-gray-400">{format(new Date(a.admission_date), 'dd MMM yyyy')}</p>
                      </div>
                      <Badge label={a.status}
                        color={a.status === 'admitted' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointments */}
          {tab === 3 && (
            <div className="text-center text-gray-400 py-8">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p>Appointment history coming soon</p>
              <Link to={`/appointments/new?patient_id=${patient.id}`}
                className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                Book new appointment →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
