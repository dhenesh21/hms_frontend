import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ipdService } from '../../services/api'
import { BedDouble, Users, Activity, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const BED_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: 'Available',   color: '#16A34A', bg: '#DCFCE7' },
  occupied:    { label: 'Occupied',    color: '#DC2626', bg: '#FEE2E2' },
  reserved:    { label: 'Reserved',    color: '#D97706', bg: '#FEF3C7' },
  maintenance: { label: 'Maintenance', color: '#6B7280', bg: '#F3F4F6' },
}

export default function IPDDashboard() {
  const { data: stats } = useQuery({ queryKey: ['ipd-dashboard'], queryFn: () => ipdService.getDashboard().then(r => r.data) })
  const { data: activeAdmissions } = useQuery({ queryKey: ['active-admissions'], queryFn: () => ipdService.getActiveAdmissions().then(r => r.data) })
  const { data: wards } = useQuery({ queryKey: ['wards'], queryFn: () => ipdService.listWards().then(r => r.data) })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IPD — Inpatient Department</h1>
          <p className="page-subtitle">Bed management, admissions & patient care</p>
        </div>
        <Link to="/ipd/admit" className="btn-primary"><Plus size={15} /> New Admission</Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Beds', value: stats?.total_beds ?? 0, icon: BedDouble, cls: 'stat-icon-purple' },
          { label: 'Occupied', value: stats?.occupied_beds ?? 0, icon: Users, cls: 'stat-icon-red' },
          { label: 'Available', value: stats?.available_beds ?? 0, icon: Activity, cls: 'stat-icon-green' },
          { label: 'Occupancy Rate', value: `${stats?.occupancy_rate ?? 0}%`, icon: TrendingUp, cls: 'stat-icon-orange' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <div className={`stat-icon ${cls}`}><Icon size={18} /></div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Ward overview */}
        <div className="card">
          <p className="section-title" style={{ marginBottom: 16 }}>Ward Overview</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(wards || [
              { name: 'General Ward', total_beds: 40, available_beds: 12, occupied_beds: 26, maintenance_beds: 2 },
              { name: 'Private Ward', total_beds: 20, available_beds: 8, occupied_beds: 10, maintenance_beds: 2 },
              { name: 'ICU', total_beds: 10, available_beds: 2, occupied_beds: 7, maintenance_beds: 1 },
              { name: 'NICU', total_beds: 10, available_beds: 4, occupied_beds: 6, maintenance_beds: 0 },
              { name: 'Pediatric Ward', total_beds: 15, available_beds: 6, occupied_beds: 8, maintenance_beds: 1 },
            ]).map((w: any, i: number) => {
              const occ = Math.round((w.occupied_beds / w.total_beds) * 100)
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '12px 14px', borderRadius: 12,
                  background: '#FAFAFF', border: '1px solid #F3F0FF'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13.5 }}>{w.name}</p>
                      <p style={{ fontSize: 12, color: '#A78BFA' }}>{w.total_beds} beds</p>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${occ}%` }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      {[
                        { label: 'Available', val: w.available_beds, color: '#16A34A' },
                        { label: 'Occupied', val: w.occupied_beds, color: '#DC2626' },
                        { label: 'Maintenance', val: w.maintenance_beds, color: '#9CA3AF' },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="status-dot" style={{ background: s.color }} />
                          <span style={{ fontSize: 11, color: '#6B7280' }}>{s.val} {s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 48 }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: occ > 80 ? '#DC2626' : '#7C3AED' }}>{occ}%</p>
                    <p style={{ fontSize: 10, color: '#A78BFA' }}>occupancy</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Admissions */}
        <div className="card">
          <div className="section-header">
            <p className="section-title">Active Admissions</p>
            <span className="badge badge-purple">{activeAdmissions?.length ?? 0}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(activeAdmissions || []).slice(0, 8).map((a: any) => (
              <Link key={a.id} to={`/ipd/${a.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: '#FAFAFF', border: '1px solid #F3F0FF',
                  cursor: 'pointer', transition: 'border-color 0.15s'
                }}>
                  <div className="avatar avatar-sm avatar-teal">
                    {a.patient_name?.[0] || 'P'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{a.patient_name}</p>
                    <p style={{ fontSize: 11, color: '#A78BFA' }}>
                      Bed {a.bed_number} · Dr. {a.doctor_name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: '#6B7280' }}>
                      {a.admission_date ? format(new Date(a.admission_date), 'dd MMM') : '—'}
                    </p>
                    <ChevronRight size={14} color="#C4B5FD" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
