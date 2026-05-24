import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { appointmentService, doctorService } from '../../services/api'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

export default function AppointmentNewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')

  const { register, handleSubmit, setValue } = useForm()

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.list().then(r => r.data)
  })

  const { data: slotsData } = useQuery({
    queryKey: ['slots', selectedDoctor, selectedDate],
    queryFn: () => doctorService.getSlots(selectedDoctor!, selectedDate).then(r => r.data),
    enabled: !!selectedDoctor && !!selectedDate
  })

  const onSubmit = async (data: any) => {
    if (!selectedSlot) return toast.error('Please select a time slot')
    setLoading(true)
    try {
      const res = await appointmentService.create({
        ...data,
        patient_id: parseInt(data.patient_id),
        doctor_id: selectedDoctor,
        appointment_date: selectedDate,
        appointment_time: selectedSlot
      })
      toast.success(`Appointment booked! Token: ${res.data.token_number}`)
      navigate('/appointments')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/appointments')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-sm text-gray-500">Schedule a patient consultation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          {/* Patient */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Patient ID *</label>
            <input {...register('patient_id', { required: true })} type="number"
              className={inputCls} placeholder="Enter patient ID" />
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Doctor *</label>
            <select className={`${inputCls} bg-white`}
              onChange={e => setSelectedDoctor(parseInt(e.target.value))}>
              <option value="">Select doctor</option>
              {doctors?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} — {d.specialization} (₹{d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date *</label>
            <input type="date" className={inputCls}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setSelectedDate(e.target.value)} />
          </div>

          {/* Slots */}
          {slotsData?.slots && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Available Slots <span className="text-gray-400 font-normal ml-1">
                  ({slotsData.slots.filter((s: any) => s.available).length} available)
                </span>
              </label>
              <div className="grid grid-cols-6 gap-2">
                {slotsData.slots.map((slot: any) => (
                  <button key={slot.time} type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`py-2 text-xs rounded-lg border transition
                      ${!slot.available ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' :
                        selectedSlot === slot.time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                    {slot.time}
                  </button>
                ))}
              </div>
              {slotsData.message && (
                <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2">
                  {slotsData.message}
                </p>
              )}
            </div>
          )}

          {/* Type & Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Type</label>
              <select {...register('appointment_type')} className={`${inputCls} bg-white`}>
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="procedure">Procedure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <input {...register('reason')} className={inputCls} placeholder="Reason for visit" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/appointments')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading || !selectedSlot}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
            <Calendar size={16} />
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
