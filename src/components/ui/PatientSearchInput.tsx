import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientService } from '../../services/api'
import { Search } from 'lucide-react'

interface Props {
  onChange: (patientId: string) => void
  inputCls?: string
}

export function PatientSearchInput({ onChange, inputCls = 'input' }: Props) {
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const { data } = useQuery({
    queryKey: ['pt-search-ui', search],
    queryFn: () => patientService.list({ search, size: 8 }).then((r: any) => r.data),
    enabled: search.length >= 2
  })

  const patients = data?.patients || []

  if (selected) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', border: '1.5px solid #C4B5FD',
        borderRadius: 10, background: '#F5F3FF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0
          }}>
            {selected.first_name?.[0]}{selected.last_name?.[0]}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13, margin: 0 }}>
              {selected.first_name} {selected.last_name}
            </p>
            <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>
              {selected.uhid} · ID: {selected.id}
            </p>
          </div>
        </div>
        <button type="button"
          onClick={() => { setSelected(null); setSearch(''); onChange('') }}
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
          placeholder="Search name, UHID, phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setShowList(true) }}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 200)}
          className={inputCls}
          style={{ paddingLeft: 34 }}
        />
      </div>
      {showList && search.length >= 2 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 3, overflow: 'hidden'
        }}>
          {patients.length === 0 ? (
            <div style={{ padding: '12px 14px', textAlign: 'center', color: '#A78BFA', fontSize: 13 }}>
              No patients found for "{search}"
            </div>
          ) : patients.map((p: any) => (
            <div key={p.id}
              onMouseDown={() => {
                setSelected(p)
                onChange(String(p.id))  // passes numeric ID as string
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
                width: 28, height: 28, borderRadius: '50%', background: '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 11, color: '#7C3AED', flexShrink: 0
              }}>
                {p.first_name?.[0]}{p.last_name?.[0]}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13, margin: 0 }}>
                  {p.first_name} {p.last_name}
                </p>
                <p style={{ fontSize: 11, color: '#A78BFA', margin: 0 }}>
                  {p.uhid} · {p.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
