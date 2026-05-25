import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ipdService } from '../../services/api'
import { Bed, Users, Activity, TrendingUp, Plus, ChevronRight, Clock } from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-400',
  occupied: 'bg-red-400',
  reserved: 'bg-amber-400',
  maintenance: 'bg-gray-300',
}

export default function IPDDashboard() {
  const [showAdmitForm, setShowAdmitForm] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['ipd-dashboard'],
    queryFn: () => ipdService.getDashboard().then(r => r.data)
  })

  const { data: activeAdmissions } = useQuery({
    queryKey: ['active-admissions'],
    queryFn: () => ipdService.getActiveAdmissions().then(r => r.data)
  })

  const { data: wards } = useQuery({
    queryKey: ['wards'],
    queryFn: () => ipdService.listWards().then(r => r.data)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IPD</h1>
          <p className="text-sm text-gray-500">Inpatient Department</p>
        </div>
        <Link to="/ipd/admit"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Admit Patient
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Beds" value={stats?.total_beds} color="text-gray-900" />
        <StatCard label="Occupied" value={stats?.occupied_beds} color="text-red-600" />
        <StatCard label="Available" value={stats?.available_beds} color="text-green-600" />
        <StatCard label="Occupancy Rate" value={`${stats?.occupancy_rate ?? 0}%`}
          color="text-blue-600" sub="Bed utilization" />
      </div>

      {/* Ward Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ward Status</h2>
          <div className="space-y-3">
            {wards?.map((ward: any) => (
              <div key={ward.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ward.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{ward.ward_type.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(ward.total_beds, 10) }).map((_, i) => (
                      <div key={i}
                        className={`w-4 h-4 rounded-sm ${i < (ward.total_beds - ward.available_beds) ? 'bg-red-400' : 'bg-green-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {ward.available_beds}/{ward.total_beds}
                  </span>
                </div>
              </div>
            ))}
            {!wards?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No wards configured</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Bed Legend</h2>
          <div className="space-y-2">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-sm ${color}`} />
                <span className="text-sm text-gray-600 capitalize">{status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
            <Link to="/ipd/wards" className="block text-sm text-blue-600 hover:underline">
              Manage Wards & Beds →
            </Link>
            <Link to="/ipd/admissions" className="block text-sm text-blue-600 hover:underline">
              All Admissions →
            </Link>
          </div>
        </div>
      </div>

      {/* Active Admissions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Current Admissions ({activeAdmissions?.length ?? 0})
          </h2>
          <Link to="/ipd/admissions" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['Patient', 'Admission No.', 'Ward / Bed', 'Diagnosis', 'Days', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeAdmissions?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No active admissions</td></tr>
            ) : (
              activeAdmissions?.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{a.patient_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.patient_uhid}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{a.admission_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{a.ward_name || '—'}</p>
                    <p className="text-xs text-gray-400">Bed: {a.bed_number || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{a.diagnosis || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">{a.days_admitted}d</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/ipd/admissions/${a.id}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
