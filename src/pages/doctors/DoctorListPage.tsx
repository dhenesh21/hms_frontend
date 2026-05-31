import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { doctorService } from '../../services/api'
import { Search, Plus, Star, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DoctorListPage() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, dept],
    queryFn: () => doctorService.list({ search: search || undefined, department: dept || undefined }).then(r => r.data)
  })

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
        <select value={dept} onChange={e => setDept(e.target.value)} className="select">
          <option value="">All Departments</option>
          <option value="cardiology">Cardiology</option>
          <option value="dermatology">Dermatology</option>
          <option value="orthopedic">Orthopedic</option>
          <option value="pediatrics">Pediatrics</option>
          <option value="neurology">Neurology</option>
        </select>
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
              <div className="avatar avatar-lg avatar-purple" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff' }}>
                {doc.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
