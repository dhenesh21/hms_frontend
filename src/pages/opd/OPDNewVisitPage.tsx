import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { opdService, patientService, doctorService } from '../../services/api'
import { ArrowLeft, Plus, Trash2, Save, Stethoscope } from 'lucide-react'

function Label({ children }: any) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
}

export default function OPDNewVisitPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')

  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      patient_id: '',
      doctor_id: '',
      prescriptions: [{ drug_name: '', dosage: '', frequency: '', duration_days: 7, route: 'oral', quantity: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'prescriptions' })

  const { data: patients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientService.list({ search: patientSearch, size: 10 }).then(r => r.data.patients),
    enabled: patientSearch.length > 1
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.list().then(r => r.data)
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        patient_id: parseInt(data.patient_id),
        doctor_id: parseInt(data.doctor_id),
        prescriptions: data.prescriptions.filter((p: any) => p.drug_name)
      }
      const res = await opdService.createVisit(payload)
      toast.success(`OPD Visit created: ${res.data.visit_number}`)
      navigate(`/opd/visits/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create visit')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
  const textareaCls = `${inputCls} resize-none`

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/opd')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New OPD Visit</h1>
          <p className="text-sm text-gray-500">Create outpatient consultation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Patient & Doctor */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Stethoscope size={16} /> Patient & Doctor
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patient Search</Label>
              <input type="text" value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                className={inputCls} placeholder="Type name or UHID..." />
              {patients && patients.length > 0 && patientSearch && (
                <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {patients.map((p: any) => (
                    <div key={p.id} onClick={() => { setPatientSearch(`${p.first_name} ${p.last_name} (${p.uhid})`) }}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                      {p.first_name} {p.last_name}
                      <span className="text-gray-400 ml-2 font-mono text-xs">{p.uhid}</span>
                    </div>
                  ))}
                </div>
              )}
              <input type="hidden" {...register('patient_id', { required: true })} />
              <Label>Patient ID (from UHID lookup)</Label>
              <input {...register('patient_id', { required: true })} className={inputCls} placeholder="Patient ID" type="number" />
            </div>
            <div>
              <Label>Attending Doctor *</Label>
              <select {...register('doctor_id', { required: true })} className={`${inputCls} bg-white`}>
                <option value="">Select doctor</option>
                {doctors?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.full_name} — {d.specialization}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Vitals</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'temperature', label: 'Temp (°F)', placeholder: '98.6' },
              { name: 'pulse_rate', label: 'Pulse (bpm)', placeholder: '72' },
              { name: 'blood_pressure_systolic', label: 'BP Sys (mmHg)', placeholder: '120' },
              { name: 'blood_pressure_diastolic', label: 'BP Dia (mmHg)', placeholder: '80' },
              { name: 'oxygen_saturation', label: 'SpO2 (%)', placeholder: '98' },
              { name: 'respiratory_rate', label: 'RR (/min)', placeholder: '16' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <Label>{label}</Label>
                <input {...register(name as any)} type="number" step="0.1" placeholder={placeholder}
                  className={inputCls} />
              </div>
            ))}
            <div>
              <Label>Height (cm)</Label>
              <input {...register('height_cm')} type="number" placeholder="170" className={inputCls} />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <input {...register('weight_kg')} type="number" placeholder="65" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Consultation */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Consultation Notes</h2>
          {[
            { name: 'chief_complaint', label: 'Chief Complaint' },
            { name: 'history_of_present_illness', label: 'History of Present Illness' },
            { name: 'physical_examination', label: 'Physical Examination' },
            { name: 'clinical_notes', label: 'Clinical Notes' },
          ].map(({ name, label }) => (
            <div key={name}>
              <Label>{label}</Label>
              <textarea {...register(name as any)} rows={2} className={textareaCls} placeholder={label} />
            </div>
          ))}
        </div>

        {/* Diagnosis */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Diagnosis & Plan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Diagnosis</Label>
              <input {...register('primary_diagnosis')} className={inputCls} placeholder="Diagnosis" />
            </div>
            <div>
              <Label>Secondary Diagnosis</Label>
              <input {...register('secondary_diagnosis')} className={inputCls} placeholder="If any" />
            </div>
          </div>
          <div>
            <Label>Treatment Plan</Label>
            <textarea {...register('treatment_plan')} rows={2} className={textareaCls} placeholder="Plan of action" />
          </div>
          <div>
            <Label>Advice</Label>
            <textarea {...register('advice')} rows={2} className={textareaCls} placeholder="Advice to patient" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('follow_up_required')} id="followup" />
              <label htmlFor="followup" className="text-sm text-gray-700">Follow-up required</label>
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <input type="date" {...register('follow_up_date')} className={inputCls} />
            </div>
            <div>
              <Label>Referred To</Label>
              <input {...register('referred_to')} className={inputCls} placeholder="Specialist / Dept" />
            </div>
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Prescriptions</h2>
            <button type="button" onClick={() => append({ drug_name: '', dosage: '', frequency: '', duration_days: 7, route: 'oral', quantity: 0 })}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              <Plus size={14} /> Add Drug
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-6 gap-2 items-end">
                <div className="col-span-2">
                  <Label>Drug Name</Label>
                  <input {...register(`prescriptions.${idx}.drug_name`)} className={inputCls} placeholder="e.g. Paracetamol" />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <input {...register(`prescriptions.${idx}.dosage`)} className={inputCls} placeholder="500mg" />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <select {...register(`prescriptions.${idx}.frequency`)} className={`${inputCls} bg-white`}>
                    <option value="">Select</option>
                    <option value="1-0-0">Once daily (morning)</option>
                    <option value="0-0-1">Once daily (night)</option>
                    <option value="1-0-1">Twice daily</option>
                    <option value="1-1-1">Thrice daily</option>
                    <option value="SOS">SOS</option>
                  </select>
                </div>
                <div>
                  <Label>Days</Label>
                  <input {...register(`prescriptions.${idx}.duration_days`)} type="number" className={inputCls} placeholder="5" />
                </div>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <Label>Route</Label>
                    <select {...register(`prescriptions.${idx}.route`)} className={`${inputCls} bg-white`}>
                      <option value="oral">Oral</option>
                      <option value="iv">IV</option>
                      <option value="im">IM</option>
                      <option value="topical">Topical</option>
                      <option value="sublingual">Sublingual</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => remove(idx)}
                    className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-end">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/opd')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Visit'}
          </button>
        </div>
      </form>
    </div>
  )
}
