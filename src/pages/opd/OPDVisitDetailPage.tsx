import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { opdService } from '../../services/api'
import { ArrowLeft, Thermometer, Heart, Wind, Droplets, Activity, Pill } from 'lucide-react'
import { format } from 'date-fns'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-50">{title}</h2>
      {children}
    </div>
  )
}

function DataItem({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

function VitalCard({ icon: Icon, label, value, unit, normal }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
      <Icon size={18} className="text-blue-500 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">
          {value != null ? `${value} ${unit}` : '—'}
        </p>
      </div>
    </div>
  )
}

export default function OPDVisitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: visit, isLoading } = useQuery({
    queryKey: ['opd-visit', id],
    queryFn: () => opdService.getVisit(Number(id)).then(r => r.data)
  })

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading visit...</div>
  if (!visit) return <div className="text-center py-20 text-gray-400">Visit not found</div>

  const STATUS_COLORS: Record<string, string> = {
    waiting: 'bg-amber-100 text-amber-700',
    in_consultation: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    referred: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/opd')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{visit.visit_number}</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(visit.visit_date), 'dd MMM yyyy, hh:mm a')}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[visit.status] || 'bg-gray-100 text-gray-600'}`}>
          {visit.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Vitals */}
      <Section title="Vitals">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <VitalCard icon={Thermometer} label="Temperature" value={visit.temperature} unit="°F" />
          <VitalCard icon={Heart} label="Pulse" value={visit.pulse_rate} unit="bpm" />
          <VitalCard icon={Activity} label="Blood Pressure"
            value={visit.blood_pressure_systolic && visit.blood_pressure_diastolic
              ? `${visit.blood_pressure_systolic}/${visit.blood_pressure_diastolic}` : null}
            unit="mmHg" />
          <VitalCard icon={Droplets} label="SpO2" value={visit.oxygen_saturation} unit="%" />
          <VitalCard icon={Wind} label="Resp. Rate" value={visit.respiratory_rate} unit="/min" />
          <VitalCard icon={Activity} label="Height" value={visit.height_cm} unit="cm" />
          <VitalCard icon={Activity} label="Weight" value={visit.weight_kg} unit="kg" />
          <VitalCard icon={Activity} label="BMI" value={visit.bmi} unit="" />
        </div>
      </Section>

      {/* Consultation */}
      <Section title="Consultation Notes">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <DataItem label="Chief Complaint" value={visit.chief_complaint} />
            <DataItem label="History of Present Illness" value={visit.history_of_present_illness} />
            <DataItem label="Past Medical History" value={visit.past_medical_history} />
          </div>
          <div className="space-y-4">
            <DataItem label="Physical Examination" value={visit.physical_examination} />
            <DataItem label="Clinical Notes" value={visit.clinical_notes} />
          </div>
        </div>
      </Section>

      {/* Diagnosis */}
      <Section title="Diagnosis & Plan">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Primary Diagnosis</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{visit.primary_diagnosis || '—'}</p>
            </div>
            <DataItem label="Secondary Diagnosis" value={visit.secondary_diagnosis} />
            <DataItem label="Treatment Plan" value={visit.treatment_plan} />
          </div>
          <div className="space-y-4">
            <DataItem label="Advice" value={visit.advice} />
            <DataItem label="Diet Advice" value={visit.diet_advice} />
            <DataItem label="Activity Advice" value={visit.activity_advice} />
            {visit.referred_to && (
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-400">Referred To</p>
                <p className="text-sm font-medium text-purple-800 mt-0.5">{visit.referred_to}</p>
                {visit.referral_notes && <p className="text-xs text-purple-600 mt-1">{visit.referral_notes}</p>}
              </div>
            )}
          </div>
        </div>

        {visit.follow_up_required && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Follow-up on {visit.follow_up_date ? format(new Date(visit.follow_up_date), 'dd MMM yyyy') : 'TBD'}
              </p>
              {visit.follow_up_notes && <p className="text-xs text-green-600 mt-0.5">{visit.follow_up_notes}</p>}
            </div>
          </div>
        )}
      </Section>

      {/* Prescriptions */}
      {visit.prescriptions?.length > 0 && (
        <Section title={`Prescriptions (${visit.prescriptions.length})`}>
          <div className="space-y-2">
            {visit.prescriptions.map((p: any, idx: number) => (
              <div key={p.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Pill size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-900">{p.drug_name}</p>
                    {p.generic_name && <p className="text-xs text-gray-400">{p.generic_name}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dosage / Freq</p>
                    <p className="text-sm text-gray-700">{p.dosage} — {p.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Duration / Route</p>
                    <p className="text-sm text-gray-700">{p.duration_days} days • {p.route}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium
                  ${p.is_dispensed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.is_dispensed ? 'Dispensed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
