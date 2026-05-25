import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { otService } from '../../services/api'
import { Stethoscope, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  pre_op: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-green-100 text-green-700 animate-pulse',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  postponed: 'bg-orange-100 text-orange-700',
}

const OT_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 border-green-200',
  booked: 'bg-blue-100 border-blue-200',
  in_use: 'bg-red-100 border-red-200',
  cleaning: 'bg-amber-100 border-amber-200',
  maintenance: 'bg-gray-100 border-gray-200',
}

export default function OTPage() {
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['ot-stats'],
    queryFn: () => otService.getDashboard().then(r => r.data)
  })

  const { data: theatres } = useQuery({
    queryKey: ['ot-theatres'],
    queryFn: () => otService.listTheatres().then(r => r.data)
  })

  const { data: todaySurgeries } = useQuery({
    queryKey: ['today-surgeries'],
    queryFn: () => otService.todaySurgeries().then(r => r.data)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      otService.updateSurgery(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['today-surgeries'] }); toast.success('Status updated') }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operation Theatre</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <Link to="/ot/schedule/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Schedule Surgery
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Surgeries", value: stats?.today_surgeries, color: 'text-blue-600' },
          { label: 'In Progress', value: stats?.in_progress, color: 'text-green-600' },
          { label: 'Scheduled', value: stats?.scheduled_today, color: 'text-amber-600' },
          { label: 'Available OTs', value: stats?.available_ots, color: 'text-teal-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* OT Status Grid */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Theatre Status</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {theatres?.map((ot: any) => (
            <div key={ot.id} className={`border rounded-xl p-4 text-center ${OT_STATUS_COLORS[ot.status] || 'bg-gray-50 border-gray-200'}`}>
              <p className="text-lg font-bold text-gray-800">{ot.ot_number}</p>
              <p className="text-xs text-gray-600 mt-0.5">{ot.name}</p>
              <p className="text-xs font-medium mt-1.5 capitalize">{ot.status.replace('_', ' ')}</p>
            </div>
          ))}
          {!theatres?.length && (
            <p className="col-span-5 text-center text-gray-400 text-sm py-4">No OTs configured</p>
          )}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Today's Schedule ({todaySurgeries?.length ?? 0})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {todaySurgeries?.map((s: any) => (
            <div key={s.id} className="px-5 py-4 flex items-center gap-4">
              {/* Time */}
              <div className="w-16 text-center flex-shrink-0">
                <p className="text-sm font-bold text-gray-800">{s.scheduled_start_time}</p>
                {s.scheduled_end_time && <p className="text-xs text-gray-400">{s.scheduled_end_time}</p>}
              </div>

              {/* Divider */}
              <div className="w-px h-12 bg-gray-200 flex-shrink-0" />

              {/* Info */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{s.procedure_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Patient ID: {s.patient_id}
                  {s.patient_name && ` • ${s.patient_name}`}
                  {s.ot_name && ` • ${s.ot_name}`}
                </p>
                {s.anesthesia_type && (
                  <p className="text-xs text-gray-400 mt-0.5">Anesthesia: {s.anesthesia_type}</p>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                  {s.status?.replace('_', ' ')}
                </span>
                {s.status === 'scheduled' && (
                  <button onClick={() => updateStatus.mutate({ id: s.id, status: 'in_progress' })}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                    Start
                  </button>
                )}
                {s.status === 'in_progress' && (
                  <button onClick={() => updateStatus.mutate({ id: s.id, status: 'completed' })}
                    className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">
                    Complete
                  </button>
                )}
                <Link to={`/ot/surgeries/${s.id}`} className="text-xs text-blue-600 hover:underline">
                  Details
                </Link>
              </div>
            </div>
          ))}
          {todaySurgeries?.length === 0 && (
            <div className="text-center py-12">
              <Stethoscope size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">No surgeries scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
