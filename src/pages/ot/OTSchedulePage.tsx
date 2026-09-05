import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { otService } from '../../services/api'
import { DoctorSearchInput } from '../../components/ui/DoctorSearchInput'
import { ArrowLeft, Save, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import { printConsentForm } from '../../utils/print'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "input"

export default function OTSchedulePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, watch } = useForm()

  const { data: theatres } = useQuery({
    queryKey: ['ot-theatres'],
    queryFn: () => otService.listTheatres().then(r => r.data)
  })

  const onSubmit = async (data: any) => {
    if (!data.primary_surgeon_id || isNaN(parseInt(data.primary_surgeon_id))) {
      return toast.error('Please select the primary surgeon')
    }
    setLoading(true)
    try {
      const payload = cleanPayload({
        ...data,
        patient_id: parseInt(data.patient_id),
        ot_id: parseInt(data.ot_id),
        primary_surgeon_id: parseInt(data.primary_surgeon_id),
        anesthesiologist_id: data.anesthesiologist_id ? parseInt(data.anesthesiologist_id) : undefined,
        assistant_surgeon_ids: [],
      })
      const res = await otService.scheduleSurgery(payload)
      toast.success(`Surgery scheduled: ${res.data.surgery_number}`)
      navigate('/ot')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Scheduling failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{width:"100%"}}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ot')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Schedule Surgery</h1>
          <p className="page-subtitle">Book an operation theatre slot</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient & OT */}
        <div className="card space-y-4">
          <h2 className="section-title">Patient & Theatre</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
              <input {...register('patient_id', { required: true })} type="number" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">IPD Admission ID (if admitted)</label>
              <input {...register('ipd_admission_id')} type="number" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Operation Theatre *</label>
              <select {...register('ot_id', { required: true })} className={`${inputCls} bg-white`}>
                <option value="">Select OT</option>
                {theatres?.filter((t: any) => t.is_active !== false).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.ot_number} — {t.name} ({t.ot_type || 'General'}){t.status !== 'available' ? ` · currently ${String(t.status).replace('_', ' ')}` : ''}
                  </option>
                ))}
              </select>
              {theatres && theatres.filter((t: any) => t.is_active !== false).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ No operation theatres configured. Add theatres from the backend.</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Surgery Type</label>
              <CustomSelect value={watch('surgery_type') || ''} onChange={v => setValue('surgery_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "elective", label: "Elective" }, { value: "emergency", label: "Emergency" }, { value: "diagnostic", label: "Diagnostic" }]} />
            </div>
          </div>
        </div>

        {/* Procedure */}
        <div className="card space-y-4">
          <h2 className="section-title">Procedure Details</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Procedure Name *</label>
            <input {...register('procedure_name', { required: true })} className={inputCls}
              placeholder="e.g. Laparoscopic Cholecystectomy" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ICD Procedure Code</label>
              <input {...register('icd_procedure_code')} className={inputCls} placeholder="51.23" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Anesthesia Type</label>
              <CustomSelect value={watch('anesthesia_type') || ''} onChange={v => setValue('anesthesia_type', String(v))} placeholder="Select" options={[{ value: '', label: 'Select' }, { value: "general", label: "General" }, { value: "local", label: "Local" }, { value: "regional", label: "Regional" }, { value: "spinal", label: "Spinal" }, { value: "epidural", label: "Epidural" }, { value: "sedation", label: "Sedation" }]} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pre-Op Diagnosis</label>
            <textarea {...register('pre_op_diagnosis')} rows={2} className={inputCls} placeholder="Diagnosis before surgery" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pre-Op Notes</label>
            <textarea {...register('pre_op_notes')} rows={2} className={inputCls} placeholder="Special instructions, patient prep..." />
          </div>
        </div>

        {/* Scheduling */}
        <div className="card space-y-4">
          <h2 className="section-title">Schedule</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date *</label>
              <input {...register('surgery_date', { required: true })} type="date" className={inputCls}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Time *</label>
              <input {...register('scheduled_start_time', { required: true })} type="time" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Time (Est.)</label>
              <input {...register('scheduled_end_time')} type="time" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Surgical Team */}
        <div className="card space-y-4">
          <h2 className="section-title">Surgical Team</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Primary Surgeon *</label>
              <DoctorSearchInput inputCls={inputCls} onSelect={(id) => setValue('primary_surgeon_id', String(id))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Anesthesiologist</label>
              <DoctorSearchInput inputCls={inputCls} onSelect={(id) => setValue('anesthesiologist_id', String(id))} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/ot')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-purple-50/30">Cancel</button>
          <button type="button"
            onClick={() => printConsentForm({ patient_name: 'Patient', patient_uhid: '—', procedure: watch('procedure_name') || 'Surgery', doctor_name: '—', type: 'surgery' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1.5px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer' }}>
            <Printer size={14} /> Consent Form
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
            <Save size={16} />
            {loading ? 'Scheduling...' : 'Schedule Surgery'}
          </button>
        </div>
      </form>
    </div>
  )
}
