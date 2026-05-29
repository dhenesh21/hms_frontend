import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { opdService, patientService, appointmentService } from '../../src/services/api'
import { Users, Calendar, Stethoscope, TrendingUp, Clock, CheckCircle } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { data: opdStats } = useQuery({
    queryKey: ['opd-dashboard'],
    queryFn: () => opdService.getDashboard().then(r => r.data)
  })

  const weeklyData = [
    { day: 'Mon', visits: 45 }, { day: 'Tue', visits: 62 },
    { day: 'Wed', visits: 38 }, { day: 'Thu', visits: 71 },
    { day: 'Fri', visits: 55 }, { day: 'Sat', visits: 29 }, { day: 'Sun', visits: 12 }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Hospital overview — today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's OPD" value={opdStats?.today_visits ?? 0}
          icon={Stethoscope} color="bg-blue-500" sub="Outpatient visits" />
        <StatCard label="Waiting" value={opdStats?.pending_consultations ?? 0}
          icon={Clock} color="bg-amber-500" sub="In queue" />
        <StatCard label="Follow-ups Today" value={opdStats?.today_follow_ups ?? 0}
          icon={CheckCircle} color="bg-green-500" sub="Scheduled follow-ups" />
        <StatCard label="Total OPD" value={opdStats?.total_visits ?? 0}
          icon={TrendingUp} color="bg-purple-500" sub="All time" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Weekly OPD Visits</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Register Patient', href: '/patients/new', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { label: 'New Appointment', href: '/appointments/new', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { label: 'OPD Visit', href: '/opd/new', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
        ].map(({ label, href, color }) => (
          <a key={href} href={href}
            className={`rounded-xl p-4 text-sm font-medium text-center transition ${color}`}>
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
