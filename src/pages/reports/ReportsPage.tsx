import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../../services/api'
import { Download } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'

// reportsService real methods:
// getMIS(p?), getOPD(p?), getIPD(p?), getRevenue(p?), getPatients(p?),
// getLab(p?), getPharmacy(p?), getInsurance(p?), getBedOccupancy(),
// getDoctorWise(p?), getSavedReports(), createSchedule(d), listSchedules()

const COLORS = ['#7C3AED', '#4F46E5', '#2563EB', '#0D9488', '#16A34A', '#D97706']

const admissionTrend = [
  { month: 'Jan', opd: 1240, ipd: 68 }, { month: 'Feb', opd: 1380, ipd: 74 },
  { month: 'Mar', opd: 1190, ipd: 62 }, { month: 'Apr', opd: 1560, ipd: 89 },
  { month: 'May', opd: 1420, ipd: 78 },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'mis' | 'revenue' | 'opd' | 'ipd' | 'bed'>('mis')

  const { data: mis }      = useQuery({ queryKey: ['reports-mis'],      queryFn: () => reportsService.getMIS().then((r: any) => r.data) })
  const { data: revenue }  = useQuery({ queryKey: ['reports-revenue'],  queryFn: () => reportsService.getRevenue().then((r: any) => r.data), enabled: activeTab === 'revenue' })
  const { data: opdData }  = useQuery({ queryKey: ['reports-opd'],      queryFn: () => reportsService.getOPD().then((r: any) => r.data), enabled: activeTab === 'opd' })
  const { data: ipdData }  = useQuery({ queryKey: ['reports-ipd'],      queryFn: () => reportsService.getIPD().then((r: any) => r.data), enabled: activeTab === 'ipd' })
  const { data: bedData }  = useQuery({ queryKey: ['reports-bed'],      queryFn: () => reportsService.getBedOccupancy().then((r: any) => r.data), enabled: activeTab === 'bed' })
  const { data: doctorData } = useQuery({ queryKey: ['reports-doctor'], queryFn: () => reportsService.getDoctorWise().then((r: any) => r.data) })

  const weeklyRevenue = revenue?.weekly || [
    { week: 'W1', amount: 285000 }, { week: 'W2', amount: 342000 },
    { week: 'W3', amount: 298000 }, { week: 'W4', amount: 412000 },
  ]

  const deptData = opdData?.by_department || [
    { name: 'Cardiology', visits: 142 }, { name: 'Dermatology', visits: 98 },
    { name: 'Orthopedic', visits: 87  }, { name: 'Pediatrics',  visits: 115 },
    { name: 'Neurology',  visits: 64  }, { name: 'General',     visits: 201 },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Hospital performance metrics & insights</p>
        </div>
        <button className="btn-secondary"><Download size={15} /> Export</button>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {(['mis', 'revenue', 'opd', 'ipd', 'bed'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'mis' ? 'MIS Overview' : t === 'revenue' ? 'Revenue' : t === 'opd' ? 'OPD' : t === 'ipd' ? 'IPD' : 'Bed Occupancy'}
          </button>
        ))}
      </div>

      {/* MIS Overview */}
      {activeTab === 'mis' && (
        <div>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Patients',  value: mis?.total_patients  ?? '—', trend: '+12.5%', up: true,  cls: 'stat-icon-purple' },
              { label: 'Total Revenue',   value: mis?.total_revenue   ? `₹${mis.total_revenue.toLocaleString()}` : '—', trend: '+15.3%', up: true,  cls: 'stat-icon-green' },
              { label: 'Avg Daily OPD',   value: mis?.avg_daily_opd   ?? '—', trend: '+8.4%',  up: true,  cls: 'stat-icon-blue' },
              { label: 'Bed Occupancy',   value: mis?.bed_occupancy   ? `${mis.bed_occupancy}%` : '—', trend: '+4.5%',  up: false, cls: 'stat-icon-orange' },
            ].map(({ label, value, trend, up, cls }) => (
              <div key={label} className="stat-card">
                <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B', margin: '8px 0 4px' }}>{value}</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: up ? '#16A34A' : '#DC2626' }}>{up ? '↑' : '↓'} {trend}</span>
                <span style={{ fontSize: 11, color: '#A78BFA', marginLeft: 4 }}>vs last month</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <p className="section-title" style={{ marginBottom: 16 }}>OPD vs IPD Trend</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={admissionTrend}>
                  <defs>
                    <linearGradient id="gOPD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gIPD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A78BFA' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDE9FE', borderRadius: 10, fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="opd" stroke="#7C3AED" fill="url(#gOPD)" strokeWidth={2} name="OPD" />
                  <Area type="monotone" dataKey="ipd" stroke="#2563EB" fill="url(#gIPD)" strokeWidth={2} name="IPD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <p className="section-title" style={{ marginBottom: 16 }}>Visits by Department</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#A78BFA' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EDE9FE', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="visits" radius={[0, 6, 6, 0]}>
                    {deptData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doctor-wise */}
          {doctorData?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <p className="section-title" style={{ marginBottom: 16 }}>Doctor-wise Performance</p>
              <div className="table-wrapper" style={{ margin: 0 }}>
                <table>
                  <thead><tr><th>Doctor</th><th>Department</th><th>Patients</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {(doctorData || []).slice(0, 8).map((d: any) => (
                      <tr key={d.doctor_id}>
                        <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{d.doctor_name}</td>
                        <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{d.department}</span></td>
                        <td style={{ fontWeight: 700, color: '#4C1D95', fontSize: 13 }}>{d.total_patients}</td>
                        <td style={{ fontWeight: 700, color: '#16A34A', fontSize: 13 }}>₹{d.total_revenue?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16 }}>Weekly Revenue</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#A78BFA' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#A78BFA' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #EDE9FE', borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {revenue?.summary && (
            <div className="grid-4">
              {[
                { label: 'OPD Revenue',   value: revenue.summary.opd_revenue },
                { label: 'IPD Revenue',   value: revenue.summary.ipd_revenue },
                { label: 'Lab Revenue',   value: revenue.summary.lab_revenue },
                { label: 'Pharmacy Rev', value: revenue.summary.pharmacy_revenue },
              ].map(({ label, value }) => (
                <div key={label} className="stat-card">
                  <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B' }}>₹{(value || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OPD Tab */}
      {activeTab === 'opd' && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 16 }}>OPD Summary</p>
          {opdData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: 'Total Visits',     value: opdData.total_visits },
                { label: 'New Patients',     value: opdData.new_patients },
                { label: 'Follow-ups',       value: opdData.follow_ups },
                { label: 'Avg Wait Time',    value: opdData.avg_wait_time ? `${opdData.avg_wait_time} min` : '—' },
                { label: 'Consultations',    value: opdData.consultations },
                { label: 'Procedures',       value: opdData.procedures },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#F5F3FF', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11.5, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', marginTop: 4 }}>{value ?? '—'}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#C4B5FD', fontSize: 13 }}>Loading OPD data...</p>}
        </div>
      )}

      {/* IPD Tab */}
      {activeTab === 'ipd' && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 16 }}>IPD Summary</p>
          {ipdData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: 'Total Admissions',  value: ipdData.total_admissions },
                { label: 'Avg LOS (days)',     value: ipdData.avg_los },
                { label: 'Discharges',         value: ipdData.total_discharges },
                { label: 'Current Inpatients', value: ipdData.current_inpatients },
                { label: 'ICU Admissions',     value: ipdData.icu_admissions },
                { label: 'Bed Occupancy',      value: ipdData.bed_occupancy_rate ? `${ipdData.bed_occupancy_rate}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#F5F3FF', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11.5, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', marginTop: 4 }}>{value ?? '—'}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#C4B5FD', fontSize: 13 }}>Loading IPD data...</p>}
        </div>
      )}

      {/* Bed Occupancy Tab */}
      {activeTab === 'bed' && (
        <div>
          {bedData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(bedData.wards || bedData || []).map((w: any, i: number) => {
                const occ = Math.round(((w.occupied_beds || 0) / (w.total_beds || 1)) * 100)
                return (
                  <div key={i} className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{w.ward_name || w.name}</p>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✓ {w.available_beds} free</span>
                        <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>● {w.occupied_beds} occupied</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: occ > 85 ? '#DC2626' : '#7C3AED' }}>{occ}%</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${occ}%`, background: occ > 85 ? '#DC2626' : undefined }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p style={{ color: '#C4B5FD', fontSize: 13 }}>Loading bed occupancy data...</p>}
        </div>
      )}
    </div>
  )
}
