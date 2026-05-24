import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { doctorService } from '../../services/api'
import { Search, UserRound, Star, Clock, IndianRupee } from 'lucide-react'

export default function DoctorListPage() {
  const [search, setSearch] = useState('')
  const [filterSpec, setFilterSpec] = useState('')

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.list().then(r => r.data)
  })

  const specializations = [...new Set(doctors?.map((d: any) => d.specialization) || [])]

  const filtered = doctors?.filter((d: any) => {
    const matchSearch = !search ||
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase())
    const matchSpec = !filterSpec || d.specialization === filterSpec
    return matchSearch && matchSpec
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Doctors</h1>
        <p className="text-sm text-gray-500">{doctors?.length ?? 0} registered doctors</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search by name or specialization..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Specializations</option>
          {specializations.map((s: any) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold">{doc.full_name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{doc.full_name}</p>
                  <p className="text-xs text-blue-600">{doc.specialization}</p>
                  {doc.department && <p className="text-xs text-gray-400">{doc.department}</p>}
                </div>
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${doc.is_available ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{doc.experience_years} yrs experience</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <IndianRupee size={12} />
                  <span>₹{doc.consultation_fee} consultation fee</span>
                </div>
                {doc.available_days?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{doc.available_days.slice(0, 3).join(', ')}{doc.available_days.length > 3 ? '...' : ''}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                  ${doc.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {doc.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
          {filtered?.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <UserRound size={40} className="mx-auto mb-3 opacity-30" />
              <p>No doctors found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
