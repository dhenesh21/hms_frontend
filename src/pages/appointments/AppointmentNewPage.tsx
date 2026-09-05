import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { appointmentService, doctorService, patientService, billingService } from '../../services/api'
import { ArrowLeft, Calendar, Search, IndianRupee } from 'lucide-react'
import { DoctorSearchInput } from '../../components/ui/DoctorSearchInput'
import CustomSelect from '../../components/ui/CustomSelect'

export default function AppointmentNewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [selectedDoctorData, setSelectedDoctorData] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showPatientList, setShowPatientList] = useState(false)
  const [apptType, setApptType] = useState('consultation')

  const { register, setValue, watch, handleSubmit } = useForm()

  // Patient search
  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-appt', patientSearch],
    queryFn: () => patientService.list({ search: patientSearch, size: 10 }).then((r: any) => r.data),
    enabled: patientSearch.length >= 2
  })

  // Doctor details (for fee)
  const { data: doctorDetails } = useQuery({
    queryKey: ['doctor-detail', selectedDoctor],
    queryFn: () => doctorService.get(selectedDoctor!).then((r: any) => r.data),
    enabled: !!selectedDoctor
  })

  // Time slots — skip if API fails, allow manual booking
  const { data: slotsData, isError: slotsError } = useQuery({
    queryKey: ['slots', selectedDoctor, selectedDate],
    queryFn: () => doctorService.getSlots(selectedDoctor!, selectedDate).then((r: any) => r.data),
    enabled: !!selectedDoctor && !!selectedDate,
    retry: false
  })

  const onSubmit = async (data: any) => {
    if (!selectedPatient) return toast.error('Please select a patient')
    if (!selectedDoctor) return toast.error('Please select a doctor')
    if (!selectedDate) return toast.error('Please select a date')
    setLoading(true)
    try {
      const res = await appointmentService.create({
        ...data,
        appointment_type: apptType,
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor,
        appointment_date: selectedDate,
        appointment_time: selectedSlot || '09:00'
      })

      // Auto-create consultation bill if doctor has a fee set
      const fee = doctorDetails?.consultation_fee || selectedDoctorData?.consultation_fee || 0
      if (fee > 0) {
        try {
          await billingService.createBill({
            patient_id: selectedPatient.id,
            bill_type: 'opd',
            items: [{
              item_name: `Consultation — ${selectedDoctorData?.full_name || 'Doctor'}`,
              category: 'consultation',
              quantity: 1,
              unit_price: fee,
              tax_percent: 0,
            }],
            notes: `Auto-generated for Appointment ${res.data.appointment_number}`
          })
          toast.success(`Appointment booked! Token: ${res.data.token_number} · Bill ₹${fee} created`)
        } catch {
          toast.success(`Appointment booked! Token: ${res.data.token_number}`)
        }
      } else {
        toast.success(`Appointment booked! Token: ${res.data.token_number}`)
      }
      navigate('/appointments')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const patients = patientResults?.patients || []
  const consultationFee = doctorDetails?.consultation_fee || selectedDoctorData?.consultation_fee || 0
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }
  const dividerStyle = { marginTop: 20, paddingTop: 20, borderTop: '1px solid #F3F0FF' }

  return (
    <div>
      <button onClick={() => navigate('/appointments')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B5CF6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Appointments
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Book Appointment</h1>
        <p className="page-subtitle">Schedule a patient consultation</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card">
          <p className="section-title" style={{ marginBottom: 16 }}>Appointment Details</p>

          {/* Patient + Doctor — 2 col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Patient */}
          <div>
            <label style={labelStyle}>Patient *</label>
            {selectedPatient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F3FF', borderRadius: 12, border: '1.5px solid #C4B5FD' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p style={{ fontSize: 12, color: '#8B5CF6' }}>{selectedPatient.uhid} · {selectedPatient.phone}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
                  style={{ fontSize: 12, color: '#DC2626', background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
                  Change
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input placeholder="Search patient by name, UHID or phone..."
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true) }}
                  onFocus={() => setShowPatientList(true)}
                  onBlur={() => setTimeout(() => setShowPatientList(false), 200)}
                  className="input" style={{ paddingLeft: 38 }} />
                {showPatientList && patientSearch.length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 12, boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 4, overflow: 'hidden' }}>
                    {patients.length === 0
                      ? <div style={{ padding: '16px', textAlign: 'center', color: '#A78BFA', fontSize: 13 }}>No patients found</div>
                      : patients.map((p: any) => (
                        <div key={p.id} onMouseDown={() => { setSelectedPatient(p); setShowPatientList(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F0FF' }}
                          onMouseOver={e => (e.currentTarget.style.background = '#F5F3FF')}
                          onMouseOut={e => (e.currentTarget.style.background = '#fff')}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#7C3AED' }}>
                            {p.first_name?.[0]}{p.last_name?.[0]}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{p.first_name} {p.last_name}</p>
                            <p style={{ fontSize: 11, color: '#A78BFA' }}>{p.uhid} · {p.phone}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label style={labelStyle}>Doctor *</label>
            <DoctorSearchInput
              inputCls="input"
              placeholder="Search doctor by name..."
              onSelect={(id, doctor) => {
                setSelectedDoctor(id || null)
                setSelectedDoctorData(doctor || null)
                setSelectedSlot('')
              }}
            />
            {selectedDoctor && consultationFee > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                <IndianRupee size={13} style={{ color: '#059669' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
                  Consultation Fee: ₹{consultationFee} — Bill will be auto-created on confirm
                </span>
              </div>
            )}
            {selectedDoctor && consultationFee === 0 && (
              <p style={{ fontSize: 11, color: '#A78BFA', marginTop: 6 }}>No consultation fee set for this doctor</p>
            )}
          </div>
          </div>{/* end 2-col grid */}

          {/* Date */}
          {selectedDoctor && (
            <div style={dividerStyle}>
              <p className="section-title" style={{ marginBottom: 16 }}>Date & Time</p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  Appointment Date *
                </label>
                <input type="date" className="input"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setSelectedDate(e.target.value); setSelectedSlot('') }}
                  style={{ maxWidth: 240 }} />
              </div>

              {/* Slots */}
              {selectedDate && !slotsError && slotsData?.slots && (
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>
                    Available Slots ({slotsData.slots.filter((s: any) => s.available).length} free)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                    {slotsData.slots.map((slot: any) => (
                      <button key={slot.time} type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        style={{
                          padding: '8px 4px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1.5px solid',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          borderColor: !slot.available ? '#E5E7EB' : selectedSlot === slot.time ? '#7C3AED' : '#DDD6FE',
                          background: !slot.available ? '#F9FAFB' : selectedSlot === slot.time ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : '#fff',
                          color: !slot.available ? '#D1D5DB' : selectedSlot === slot.time ? '#fff' : '#4C1D95',
                        }}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* If slots API fails — manual time input */}
              {selectedDate && (slotsError || !slotsData) && (
                <div>
                  <label style={labelStyle}>
                    Appointment Time
                  </label>
                  <input type="time" className="input"
                    style={{ maxWidth: 200 }}
                    onChange={e => setSelectedSlot(e.target.value)} />
                  <p style={{ fontSize: 11, color: '#A78BFA', marginTop: 4 }}>
                    Enter time manually (slots not configured for this doctor)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div style={dividerStyle}>
            <p className="section-title" style={{ marginBottom: 16 }}>Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Appointment Type</label>
                <CustomSelect
                  value={apptType}
                  onChange={v => setApptType(String(v))}
                  options={[
                    { value: 'consultation', label: 'Consultation' },
                    { value: 'follow_up', label: 'Follow-up' },
                    { value: 'emergency', label: 'Emergency' },
                    { value: 'procedure', label: 'Procedure' },
                  ]}
                />
              </div>
              <div>
                <label style={labelStyle}>Reason</label>
                <input {...register('reason')} className="input" placeholder="Reason for visit" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={() => navigate('/appointments')} className="btn-secondary">Cancel</button>
          <button type="submit"
            disabled={loading || !selectedPatient || !selectedDoctor || !selectedDate}
            className="btn-primary"
            style={{ opacity: (loading || !selectedPatient || !selectedDoctor || !selectedDate) ? 0.6 : 1 }}>
            <Calendar size={15} />
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
