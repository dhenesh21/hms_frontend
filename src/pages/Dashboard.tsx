import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'
import { opdService } from '../services/api'
import { Users, Calendar, Stethoscope, TrendingUp, Clock, CheckCircle, Plus, BedDouble, FlaskConical, Receipt, Activity } from 'lucide-react'

const weeklyData = [
  { day: 'Mon', visits: 45, revenue: 38000 }, { day: 'Tue', visits: 62, revenue: 52000 },
  { day: 'Wed', visits: 38, revenue: 31000 }, { day: 'Thu', visits: 71, revenue: 59000 },
  { day: 'Fri', visits: 55, revenue: 46000 }, { day: 'Sat', visits: 29, revenue: 24000 }, { day: 'Sun', visits: 12, revenue: 9000 }
]

const recentActivity = [
  { text: 'New patient Rohan Mehta registered', time: '10 min ago', color: '#7C3AED' },
  { text: 'Lab report for Raj Kumar is ready', time: '25 min ago', color: '#0D9488' },
  { text: 'Payment of ₹5,000 received', time: '35 min ago', color: '#16A34A' },
  { text: 'IPD admission for Anjali Singh', time: '1 hr ago', color: '#2563EB' },
  { text: 'OT scheduled: Dr. Sharma - 3 PM', time: '2 hr ago', color: '#D97706' },
]

function StatCard({ label, value, icon: Icon, iconClass, trend, trendUp }: any) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 12.5, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B', marginTop: 4, lineHeight: 1 }}>{value ?? '—'}</p>
        </div>
        <div className={`stat-icon ${iconClass}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: trendUp ? '#16A34A' : '#DC2626' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>vs last month</span>
        </div>
      )}
    </div>
  )
}

const quickActions = [
  { label: 'New Appointment', href: '/appointments/new', icon: Calendar, color: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Register Patient', href: '/patients/new', icon: Users, color: '#2563EB', bg: '#DBEAFE' },
  { label: 'OPD Visit', href: '/opd/new', icon: Stethoscope, color: '#0D9488', bg: '#CCFBF1' },
  { label: 'Lab Order', href: '/lab/new', icon: FlaskConical, color: '#D97706', bg: '#FEF3C7' },
  { label: 'New Bill', href: '/billing', icon: Receipt, color: '#DC2626', bg: '#FEE2E2' },
  { label: 'IPD Admit', href: '/ipd/admit', icon: BedDouble, color: '#4F46E5', bg: '#E0E7FF' },
]

export default function Dashboard() {
  const { data: opdStats } = useQuery({
    queryKey: ['opd-dashboard'],
    queryFn: () => opdService.getDashboard().then(r => r.data)
  })

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's what's happening in your hospital today.</p>
        </div>
        <Link to="/appointments/new" className="btn-primary">
          <Plus size={15} /> New Appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Patients" value="2,548" icon={Users} iconClass="stat-icon-purple" trend="12.5%" trendUp />
        <StatCard label="OPD Visits Today" value={opdStats?.today_visits ?? 342} icon={Stethoscope} iconClass="stat-icon-blue" trend="8.4%" trendUp />
        <StatCard label="IPD Admissions" value={opdStats?.total_visits ?? 68} icon={BedDouble} iconClass="stat-icon-green" trend="4.5%" trendUp={false} />
        <StatCard label="Total Revenue" value="₹18,75,000" icon={TrendingUp} iconClass="stat-icon-orange" trend="15.3%" trendUp />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <p className="section-title">Revenue Overview</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', marginTop: 2 }}>₹18,75,000
                <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', marginLeft: 8 }}>↑ 15.3%</span>
              </p>
            </div>
            <select className="select" style={{ fontSize: 12 }}>
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#A78BFA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #EDE9FE', borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Schedule */}
        <div className="card">
          <div className="section-header">
            <p className="section-title">Today's Schedule</p>
            <Link to="/appointments" style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { time: '09:00 AM', name: 'Dr. Arjun Sharma', dept: 'Cardiologist', type: 'OPD' },
              { time: '10:30 AM', name: 'Dr. Neha Verma', dept: 'Dermatologist', type: 'OPD' },
              { time: '12:00 PM', name: 'Dr. Rakesh Patel', dept: 'Orthopedic', type: 'OPD' },
              { time: '02:00 PM', name: 'Dr. Pooja Singh', dept: 'Pediatrician', type: 'IPD' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar avatar-sm avatar-purple" style={{ fontSize: 10 }}>
                  {s.name.split(' ').slice(1).join('')[0]}S
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1E1B4B' }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: '#A78BFA' }}>{s.dept}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#4C1D95' }}>{s.time}</p>
                  <span className={`badge ${s.type === 'OPD' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 10 }}>{s.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Quick Access */}
        <div className="card">
          <p className="section-title" style={{ marginBottom: 16 }}>Quick Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {quickActions.map(({ label, href, icon: Icon, color, bg }) => (
              <Link key={href} to={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: bg, borderRadius: 14, padding: '16px 12px',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  border: `1px solid ${bg}`
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 6px 20px ${color}25`
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}>
                  <Icon size={22} color={color} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: color, lineHeight: 1.3 }}>{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="section-header">
            <p className="section-title">Recent Activity</p>
            <Link to="/reports" style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i < recentActivity.length - 1 ? '1px solid #F3F0FF' : 'none'
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: a.color, flexShrink: 0, marginTop: 5
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.4 }}>{a.text}</p>
                  <p style={{ fontSize: 11, color: '#A78BFA', marginTop: 2 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
