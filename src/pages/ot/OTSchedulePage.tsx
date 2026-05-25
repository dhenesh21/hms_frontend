import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { otService } from '../../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

export default function OTSchedulePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const { data: theatres } = useQuery({
    queryKey: ['ot-theatres'],
    queryFn: () => otService.listTheatres().then(r => r.data)
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        patient_id: parseInt(data.patient_id),
        ot_id: parseInt(data.ot_id),
        primary_surgeon_id: parseInt(data.primary_surgeon_id),
        anesthesiologist_id: data.anesthesiologist_id ? parseInt(data.anesthesiologist_id) : undefined,
        assistant_surgeon_ids: [],
      }
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ot')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schedule Surgery</h1>
          <p className="text-sm text-gray-500">Book an operation theatre slot</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient & OT */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Patient & Theatre</h2>
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
                {theatres?.filter((t: any) => t.status === 'available').map((t: any) => (
                  <option key={t.id} value={t.id}>{t.ot_number} — {t.name} ({t.ot_type || 'General'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Surgery Type</label>
              <select {...register('surgery_type')} className={`${inputCls} bg-white`}>
                <option value="elective">Elective</option>
                <option value="emergency">Emergency</option>
                <option value="diagnostic">Diagnostic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Procedure */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Procedure Details</h2>
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
              <select {...register('anesthesia_type')} className={`${inputCls} bg-white`}>
                <option value="">Select</option>
                <option value="general">General</option>
                <option value="local">Local</option>
                <option value="regional">Regional</option>
                <option value="spinal">Spinal</option>
                <option value="epidural">Epidural</option>
                <option value="sedation">Sedation</option>
              </select>
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
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Schedule</h2>
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
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Surgical Team</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Primary Surgeon (Doctor ID) *</label>
              <input {...register('primary_surgeon_id', { required: true })} type="number" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Anesthesiologist (Doctor ID)</label>
              <input {...register('anesthesiologist_id')} type="number" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/ot')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
            <Save size={16} />
            {loading ? 'Scheduling...' : 'Schedule Surgery'}
          </button>
        </div>
      </form>
    </div>
  )
}
