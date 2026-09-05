import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorService, uploadService } from '../../services/api'
import { Search, Plus, Star, Clock, Calendar, X, Check, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/ui/CustomSelect'
import PhotoUpload from '../../components/ui/PhotoUpload'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_ROSTER = DAYS.slice(0, 6).map(day => ({
  day_of_week: day,
  start_time: '09:00',
  end_time: '17:00',
  max_patients: 20,
  enabled: true,
}))

export default function DoctorListPage() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [rosterDoctor, setRosterDoctor] = useState<any>(null)
  const [rosterDays, setRosterDays] = useState(DEFAULT_ROSTER)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, dept],
    queryFn: () => doctorService.list({ search: search || undefined, department: dept || undefined }).then(r => r.data)
  })

  // Load existing roster when modal opens
  const { data: existingRoster } = useQuery({
    queryKey: ['roster', rosterDoctor?.id],
    queryFn: () => doctorService.getRoster(rosterDoctor.id).then((r: any) => r.data),
    enabled: !!rosterDoctor,
  })

  useEffect(() => {
    if (existingRoster && existingRoster.length > 0) {
      const updated = DEFAULT_ROSTER.map(d => {
        const found = existingRoster.find((r: any) => r.day_of_week === d.day_of_week)
        return found
          ? { ...d, start_time: found.start_time, end_time: found.end_time, max_patients: found.max_patients, enabled: found.is_active }
          : { ...d, enabled: false }
      })
      setRosterDays(updated)
    }
  }, [existingRoster])

  const saveMutation = useMutation({
    mutationFn: (days: any[]) => doctorService.setBulkRoster(rosterDoctor.id, days),
    onSuccess: () => {
      toast.success('Roster saved!')
      qc.invalidateQueries({ queryKey: ['roster', rosterDoctor?.id] })
      setRosterDoctor(null)
    },
    onError: () => toast.error('Failed to save roster')
  })

  const openRoster = (doc: any) => {
    setRosterDays(DEFAULT_ROSTER)
    setRosterDoctor(doc)
  }

  const handleSave = () => {
    const enabledDays = rosterDays.filter(d => d.enabled).map(({ enabled, ...rest }) => rest)
    if (enabledDays.length === 0) return toast.error('At least one day select பண்ணுங்க!')
    saveMutation.mutate(enabledDays)
  }

  const toggleDay = (idx: number) => {
    setRosterDays(prev => prev.map((d, i) => i === idx ? { ...d, enabled: !d.enabled } : d))
  }

  const updateDay = (idx: number, field: string, value: any) => {
    setRosterDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">{data?.length ?? 0} doctors on staff</p>
        </div>
        <Link to="/admin/users/new" className="btn-primary"><Plus size={15} /> Add Doctor</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Search doctors by name, specialization..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 40 }} />
        </div>
        <div style={{ width: 200 }}>
          <CustomSelect
            value={dept}
            onChange={v => setDept(String(v))}
            placeholder="All Departments"
            options={[
              { value: '', label: 'All Departments' },
              { value: 'cardiology', label: 'Cardiology' },
              { value: 'dermatology', label: 'Dermatology' },
              { value: 'orthopedic', label: 'Orthopedic' },
              { value: 'pediatrics', label: 'Pediatrics' },
              { value: 'neurology', label: 'Neurology' },
              { value: 'general_medicine', label: 'General Medicine' },
              { value: 'gynecology', label: 'Gynecology' },
              { value: 'radiology', label: 'Radiology' },
            ]}
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ opacity: 0.4, height: 200 }} />
          ))
        ) : (data || []).map((doc: any) => (
          <div key={doc.id} className="card" style={{
            cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
            borderColor: '#EDE9FE'
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE9FE'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <PhotoUpload
                currentUrl={doc.photo_url}
                name={doc.full_name}
                size={56}
                onUpload={(file) => uploadService.doctorPhoto(doc.doctor_profile_id || doc.id, file).then(r => r.data)}
                onSuccess={() => qc.invalidateQueries({ queryKey: ['doctors'] })}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{doc.full_name}</p>
                <p style={{ fontSize: 12, color: '#8B5CF6', marginTop: 1 }}>{doc.specialization || doc.department}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>4.8</span>
                  <span style={{ fontSize: 11, color: '#A78BFA' }}>(128 reviews)</span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #F3F0FF', paddingTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <span className="badge badge-purple" style={{ fontSize: 11 }}>{doc.experience_years || '5+'}+ yrs</span>
                <span className={`badge ${doc.is_available ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                  {doc.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/appointments/new?doctor_id=${doc.id}`}
                  className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: 12 }}>
                  Book Slot
                </Link>
                {/* Roster button */}
                <button
                  onClick={() => openRoster(doc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
                    fontSize: 12, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
                    border: '1.5px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED'
                  }}>
                  <Calendar size={13} /> Roster
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Roster Modal ── */}
      {rosterDoctor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}
          onClick={e => { if (e.target === e.currentTarget) setRosterDoctor(null) }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(124,58,237,0.2)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #F3F0FF'
            }}>
              <div>
                <h2 style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 16, margin: 0 }}>
                  Duty Roster
                </h2>
                <p style={{ fontSize: 13, color: '#8B5CF6', margin: '2px 0 0' }}>
                  Dr. {rosterDoctor.full_name} — {rosterDoctor.specialization}
                </p>
              </div>
              <button onClick={() => setRosterDoctor(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                <X size={16} color="#6B7280" />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 12, color: '#8B5CF6', marginBottom: 16, fontWeight: 600 }}>
                Days select பண்ணி, time set பண்ணுங்க. Save பண்ணினா existing roster replace ஆகும்.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rosterDays.map((day, idx) => (
                  <div key={day.day_of_week} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    border: `1.5px solid ${day.enabled ? '#C4B5FD' : '#E5E7EB'}`,
                    background: day.enabled ? '#F5F3FF' : '#FAFAFA',
                    transition: 'all 0.15s'
                  }}>
                    {/* Toggle */}
                    <button onClick={() => toggleDay(idx)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none',
                        background: day.enabled ? '#7C3AED' : '#E5E7EB',
                        color: '#fff', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                      {day.enabled ? <Check size={13} /> : <X size={13} color="#9CA3AF" />}
                    </button>

                    {/* Day name */}
                    <span style={{
                      width: 90, fontWeight: 700, fontSize: 13,
                      color: day.enabled ? '#1E1B4B' : '#9CA3AF', flexShrink: 0
                    }}>
                      {day.day_of_week}
                    </span>

                    {/* Time inputs */}
                    {day.enabled ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Clock size={13} color="#8B5CF6" />
                          <input type="time" value={day.start_time}
                            onChange={e => updateDay(idx, 'start_time', e.target.value)}
                            style={{
                              border: '1px solid #DDD6FE', borderRadius: 8, padding: '4px 8px',
                              fontSize: 12, color: '#4C1D95', background: '#fff', width: 95
                            }} />
                          <span style={{ fontSize: 12, color: '#A78BFA' }}>to</span>
                          <input type="time" value={day.end_time}
                            onChange={e => updateDay(idx, 'end_time', e.target.value)}
                            style={{
                              border: '1px solid #DDD6FE', borderRadius: 8, padding: '4px 8px',
                              fontSize: 12, color: '#4C1D95', background: '#fff', width: 95
                            }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: '#8B5CF6' }}>Max:</span>
                          <input type="number" value={day.max_patients} min={1} max={100}
                            onChange={e => updateDay(idx, 'max_patients', parseInt(e.target.value))}
                            style={{
                              width: 50, border: '1px solid #DDD6FE', borderRadius: 8,
                              padding: '4px 6px', fontSize: 12, color: '#4C1D95', textAlign: 'center'
                            }} />
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Off day</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              padding: '16px 24px', borderTop: '1px solid #F3F0FF'
            }}>
              <button onClick={() => setRosterDoctor(null)}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                  background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saveMutation.isPending}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  opacity: saveMutation.isPending ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                <Check size={14} />
                {saveMutation.isPending ? 'Saving...' : 'Save Roster'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
