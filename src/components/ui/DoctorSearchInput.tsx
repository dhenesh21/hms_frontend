import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authService } from '../../services/api'
import { Search } from 'lucide-react'

interface Props {
  onSelect: (doctorId: number, doctor: any) => void
  inputCls?: string
  placeholder?: string
}

export function DoctorSearchInput({ onSelect, inputCls = 'input', placeholder = 'Search doctor by name...' }: Props) {
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  // Use authService to get all users with doctor role
  const { data: allDoctors } = useQuery({
    queryKey: ['all-doctors-auth'],
    queryFn: async () => {
      const users = await authService.listUsers()
      return (users || []).filter((u: any) => u.role === 'doctor')
    },
    staleTime: 2 * 60 * 1000
  })

  // Filter by search
  const doctors = (allDoctors || []).filter((d: any) =>
    !search ||
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.department?.toLowerCase().includes(search.toLowerCase())
  )

  if (selected) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', border: '1.5px solid #C4B5FD',
        borderRadius: 10, background: '#F5F3FF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0
          }}>
            {selected.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13, margin: 0 }}>
              {selected.full_name}
            </p>
            <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>
              {selected.department || 'Doctor'} · ID: {selected.id}
            </p>
          </div>
        </div>
        <button type="button"
          onClick={() => { setSelected(null); setSearch(''); onSelect(0, null) }}
          style={{
            fontSize: 11, color: '#DC2626', background: '#FEE2E2',
            border: 'none', borderRadius: 6, padding: '3px 10px',
            cursor: 'pointer', fontWeight: 600
          }}>
          Change
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} color="#A78BFA" style={{
          position: 'absolute', left: 11, top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none'
        }} />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setShowList(true) }}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 200)}
          className={inputCls}
          style={{ paddingLeft: 34 }}
        />
      </div>
      {showList && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 3,
          overflow: 'hidden', maxHeight: 260, overflowY: 'auto'
        }}>
          {doctors.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: '#A78BFA', fontSize: 13 }}>
              {!allDoctors ? 'Loading...' : allDoctors.length === 0
                ? '⚠️ No doctors registered. Go to Admin → Register Staff → Doctor'
                : 'No doctors match your search'}
            </div>
          ) : doctors.map((d: any) => (
            <div key={d.id}
              onMouseDown={() => {
                setSelected(d)
                onSelect(d.id, d)
                setShowList(false)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', cursor: 'pointer',
                borderBottom: '1px solid #F3F0FF'
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#F5F3FF')}
              onMouseOut={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0
              }}>
                {d.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13, margin: 0 }}>
                  {d.full_name}
                </p>
                <p style={{ fontSize: 11, color: '#A78BFA', margin: 0 }}>
                  {d.department || 'Doctor'} · ID: {d.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
