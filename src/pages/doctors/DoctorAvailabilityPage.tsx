import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorService } from '../../services/api'
import { Clock, IndianRupee, Calendar, Check, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import PhotoUpload from '../../components/ui/PhotoUpload'
import { uploadService } from '../../services/api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function DoctorAvailabilityPage() {
  const qc = useQueryClient()
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [fee, setFee] = useState('')
  const [duration, setDuration] = useState('15')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [isAvailable, setIsAvailable] = useState(true)

  const { data: doctors } = useQuery({
    queryKey: ['doctors-avail', search],
    queryFn: () => doctorService.list({ search, size: 20 }).then(r => r.data),
  })

  const updateProfile = useMutation({
    mutationFn: (data: any) => doctorService.updateProfile(selectedDoctor.doctor_profile_id || selectedDoctor.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors-avail'] }); toast.success('Availability updated!') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Update failed')
  })

  const setBulkRoster = useMutation({
    mutationFn: (days: any[]) => doctorService.setBulkRoster(selectedDoctor.doctor_profile_id || selectedDoctor.id, days),
    onSuccess: () => { toast.success('Schedule saved!') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to save schedule')
  })

  const selectDoctor = (doc: any) => {
    setSelectedDoctor(doc)
    setFee(String(doc.consultation_fee || ''))
    setDuration(String(doc.consultation_duration_minutes || '15'))
    setSelectedDays(doc.available_days || [])
    setIsAvailable(doc.is_available !== false)
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const handleSave = () => {
    if (!selectedDoctor) return toast.error('Select a doctor first')
    // Update profile (fee, duration, availability)
    updateProfile.mutate({
      consultation_fee: parseFloat(fee) || 0,
      consultation_duration_minutes: parseInt(duration) || 15,
      is_available: isAvailable,
      available_days: selectedDays,
    })
    // Set weekly schedule
    if (selectedDays.length > 0) {
      const rosterDays = selectedDays.map(day => ({
        day_of_week: day.toLowerCase(),
        start_time: startTime,
        end_time: endTime,
        slot_duration: parseInt(duration) || 15,
        max_appointments: Math.floor(
          (parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) -
           parseInt(startTime.split(':')[0]) * 60 - parseInt(startTime.split(':')[1])) /
          (parseInt(duration) || 15)
        ),
        is_active: true,
      }))
      setBulkRoster.mutate(rosterDays)
    }
  }

  const doctorList = Array.isArray(doctors) ? doctors : doctors?.doctors || []

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Doctor Availability & Fees</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Set consultation fee, working days, and time slots</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

        {/* Doctor List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F0FF' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className={inputCls} placeholder="Search doctor..." />
          </div>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {doctorList.map((doc: any) => (
              <div key={doc.id} onClick={() => selectDoctor(doc)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F9F7FF',
                  background: selectedDoctor?.id === doc.id ? '#F5F3FF' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                <PhotoUpload
                  currentUrl={doc.photo_url}
                  name={doc.full_name}
                  size={38}
                  editable={false}
                  onUpload={() => Promise.resolve({ photo_url: '' })}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.full_name}</p>
                  <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>{doc.specialization || doc.department}</p>
                </div>
                {doc.is_available !== false && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, marginLeft: 'auto' }} />
                )}
              </div>
            ))}
            {doctorList.length === 0 && (
              <p style={{ textAlign: 'center', color: '#C4B5FD', padding: 32, fontSize: 13 }}>No doctors found</p>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {selectedDoctor ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Doctor Info */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <PhotoUpload
                currentUrl={selectedDoctor.photo_url}
                name={selectedDoctor.full_name}
                size={60}
                onUpload={(file) => uploadService.doctorPhoto(selectedDoctor.doctor_profile_id || selectedDoctor.id, file).then(r => r.data)}
                onSuccess={(url) => setSelectedDoctor({ ...selectedDoctor, photo_url: url })}
              />
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>{selectedDoctor.full_name}</h2>
                <p style={{ fontSize: 13, color: '#8B5CF6', margin: '2px 0 0' }}>{selectedDoctor.specialization} · {selectedDoctor.department}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Available</span>
                <button onClick={() => setIsAvailable(v => !v)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: isAvailable ? '#7C3AED' : '#E5E7EB', position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, transition: 'left 0.2s',
                    left: isAvailable ? 23 : 3,
                  }} />
                </button>
              </div>
            </div>

            {/* Fee & Duration */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Consultation Settings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>
                    <IndianRupee size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Consultation Fee (₹)
                  </label>
                  <input type="number" value={fee} onChange={e => setFee(e.target.value)}
                    className={inputCls} placeholder="500" min={0} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Slot Duration (minutes)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[10, 15, 20, 30].map(d => (
                      <button key={d} type="button" onClick={() => setDuration(String(d))}
                        style={{
                          flex: 1, padding: '8px 4px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                          border: '1.5px solid', cursor: 'pointer',
                          borderColor: duration === String(d) ? '#7C3AED' : '#E5E7EB',
                          background: duration === String(d) ? '#F5F3FF' : '#fff',
                          color: duration === String(d) ? '#7C3AED' : '#6B7280',
                        }}>
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Working Days */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
                <Calendar size={15} style={{ display: 'inline', marginRight: 6, color: '#7C3AED' }} />
                Working Days
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {DAYS.map(day => {
                  const active = selectedDays.includes(day)
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      style={{
                        padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                        border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                        borderColor: active ? '#7C3AED' : '#E5E7EB',
                        background: active ? '#7C3AED' : '#fff',
                        color: active ? '#fff' : '#6B7280',
                      }}>
                      {active && <Check size={11} style={{ display: 'inline', marginRight: 4 }} />}
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                </div>
              </div>

              {selectedDays.length > 0 && startTime && endTime && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: 12, color: '#059669', margin: 0, fontWeight: 500 }}>
                    ✓ {Math.floor(
                      (parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) -
                       parseInt(startTime.split(':')[0]) * 60 - parseInt(startTime.split(':')[1])) /
                      (parseInt(duration) || 15)
                    )} slots/day · {selectedDays.length} days/week · {startTime} – {endTime}
                  </p>
                </div>
              )}
            </div>

            {/* Save */}
            <button onClick={handleSave}
              disabled={updateProfile.isPending || setBulkRoster.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}>
              <Save size={16} />
              {(updateProfile.isPending || setBulkRoster.isPending) ? 'Saving...' : 'Save Availability & Fee'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <Calendar size={40} style={{ color: '#DDD6FE', marginBottom: 12 }} />
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Select a doctor to manage their availability</p>
          </div>
        )}
      </div>
    </div>
  )
}
