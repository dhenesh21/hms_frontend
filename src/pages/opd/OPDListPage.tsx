import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { opdService } from '../../services/api'
import { Plus, Stethoscope, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-amber-100 text-amber-700',
  in_consultation: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  referred: 'bg-purple-100 text-purple-700',
}

export default function OPDListPage() {
  const { data: stats } = useQuery({
    queryKey: ['opd-dashboard'],
    queryFn: () => opdService.getDashboard().then(r => r.data)
  })

  const { data: visits, isLoading } = useQuery({
    queryKey: ['opd-visits'],
    queryFn: () => opdService.listVisits({ limit: 50 }).then(r => r.data)
  })

  const { data: followUps } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: () => opdService.getFollowUps().then(r => r.data)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">OPD</h1>
          <p className="text-sm text-gray-500">Outpatient Department</p>
        </div>
        <Link to="/opd/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> New Visit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Visits", value: stats?.today_visits ?? 0, color: 'text-blue-600' },
          { label: 'Waiting', value: stats?.pending_consultations ?? 0, color: 'text-amber-600' },
          { label: "Today's Follow-ups", value: stats?.today_follow_ups ?? 0, color: 'text-green-600' },
          { label: 'Total Visits', value: stats?.total_visits ?? 0, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Visits Table */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent OPD Visits</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : visits?.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No visits yet</p>
              </div>
            ) : (
              visits?.map((v: any) => (
                <Link key={v.id} to={`/opd/visits/${v.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {v.primary_diagnosis || 'No diagnosis'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-mono">{v.visit_number}</span>
                      {' • '}
                      {format(new Date(v.visit_date), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'}`}>
                      {v.status?.replace('_', ' ')}
                    </span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Upcoming Follow-ups</h2>
            <Calendar size={14} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {followUps?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No follow-ups</div>
            ) : (
              followUps?.map((f: any) => (
                <Link key={f.visit_id} to={`/opd/visits/${f.visit_id}`}
                  className="block px-4 py-3 hover:bg-blue-50 transition">
                  <p className="text-xs font-medium text-gray-800">{format(new Date(f.follow_up_date), 'dd MMM yyyy')}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{f.visit_number}</p>
                  {f.follow_up_notes && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{f.follow_up_notes}</p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
