import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { patientService } from '../../services/api'
import { Search, Plus, User, Phone, Droplets, ChevronRight } from 'lucide-react'

const bloodGroupColors: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-100 text-red-700',
  'B+': 'bg-orange-100 text-orange-700', 'B-': 'bg-orange-100 text-orange-700',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-100 text-purple-700',
  'O+': 'bg-green-100 text-green-700', 'O-': 'bg-green-100 text-green-700',
}

export default function PatientListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => patientService.list({ search: search || undefined, page, size: 20 }).then(r => r.data),
    placeholderData: (prev) => prev
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} registered patients</p>
        </div>
        <Link to="/patients/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} />
          New Patient
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text" placeholder="Search by name, UHID, phone..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Patient</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">UHID</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Gender</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Blood</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Phone</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : data?.patients?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No patients found</td></tr>
            ) : (
              data?.patients?.map((p: any) => (
                <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{p.first_name[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {p.first_name} {p.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.uhid}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize">{p.gender}</td>
                  <td className="px-4 py-3">
                    {p.blood_group ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bloodGroupColors[p.blood_group] || 'bg-gray-100 text-gray-600'}`}>
                        {p.blood_group}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={16} className="text-gray-300" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}
                className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
