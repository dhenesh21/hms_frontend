import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ipdService } from '../../services/api'
import { ArrowLeft, BedDouble, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

export default function IPDAdmitPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedWard, setSelectedWard] = useState<number | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const { data: wards } = useQuery({
    queryKey: ['wards'],
    queryFn: () => ipdService.listWards().then(r => r.data)
  })

  const { data: beds } = useQuery({
    queryKey: ['available-beds', selectedWard],
    queryFn: () => ipdService.getAvailableBeds(selectedWard || undefined).then(r => r.data),
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        patient_id: parseInt(data.patient_id),
        admitting_doctor_id: parseInt(data.admitting_doctor_id),
        bed_id: data.bed_id ? parseInt(data.bed_id) : undefined,
        ward_id: selectedWard || undefined,
      }
      const res = await ipdService.admit(payload)
      toast.success(`Patient admitted! ${res.data.admission_number}`)
      navigate(`/ipd/admissions/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Admission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ipd')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admit Patient</h1>
          <p className="text-sm text-gray-500">Create new IPD admission</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient & Doctor */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Patient & Doctor</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
              <input {...register('patient_id', { required: true })} type="number"
                className={inputCls} placeholder="Enter patient ID" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Admitting Doctor ID *</label>
              <input {...register('admitting_doctor_id', { required: true })} type="number"
                className={inputCls} placeholder="Doctor ID" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Admission Type</label>
              <select {...register('admission_type')} className={`${inputCls} bg-white`}>
                <option value="elective">Elective</option>
                <option value="emergency">Emergency</option>
                <option value="transfer">Transfer</option>
                <option value="day_care">Day Care</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expected Discharge Date</label>
              <input {...register('expected_discharge_date')} type="date" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Bed Allocation */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BedDouble size={16} /> Bed Allocation
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ward</label>
              <select className={`${inputCls} bg-white`}
                onChange={e => setSelectedWard(e.target.value ? parseInt(e.target.value) : null)}>
                <option value="">Select ward</option>
                {wards?.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.ward_type.replace('_', ' ')}) — {w.available_beds} beds free
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bed</label>
              <select {...register('bed_id')} className={`${inputCls} bg-white`}>
                <option value="">Select bed</option>
                {beds?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.bed_number} — {b.ward_name} ({b.bed_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available bed grid */}
          {beds && beds.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2">{beds.length} bed(s) available in selected ward</p>
              <div className="flex flex-wrap gap-2">
                {beds.slice(0, 20).map((b: any) => (
                  <div key={b.id}
                    className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700">
                    {b.bed_number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Clinical Information</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Chief Complaint</label>
            <textarea {...register('chief_complaint')} rows={2} className={inputCls}
              placeholder="Patient's chief complaint..." />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Diagnosis at Admission</label>
            <input {...register('diagnosis_at_admission')} className={inputCls}
              placeholder="Provisional diagnosis" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Transferred From</label>
            <input {...register('transferred_from')} className={inputCls}
              placeholder="Previous hospital/ward (if transfer)" />
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Insurance / TPA</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Insurance Provider</label>
              <input {...register('insurance_provider')} className={inputCls} placeholder="Star Health, Niva Bupa..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Policy Number</label>
              <input {...register('insurance_policy_number')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">TPA Name</label>
              <input {...register('tpa_name')} className={inputCls} placeholder="Medi Assist, Vidal..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/ipd')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
            <Save size={16} />
            {loading ? 'Admitting...' : 'Admit Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}
