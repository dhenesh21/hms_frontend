import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  subtitle?: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value?: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export default function CustomSelect({
  options, value, onChange, placeholder = '— Select —',
  className = '', disabled = false
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => String(o.value) === String(value))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: disabled ? '#F9FAFB' : '#fff',
          border: `1.5px solid ${open ? '#7C3AED' : '#E5E7EB'}`,
          borderRadius: 10, fontSize: 13, color: selected ? '#1E1B4B' : '#9CA3AF',
          cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={15} style={{
          color: '#8B5CF6', flexShrink: 0, marginLeft: 8,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(109,40,217,0.12)', zIndex: 9999,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
              No options available
            </div>
          ) : options.map(opt => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                  background: isSelected ? '#F5F3FF' : 'transparent',
                  color: isSelected ? '#6D28D9' : '#1E1B4B',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#FAFAFF' }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <div>
                  <div>{opt.label}</div>
                  {opt.subtitle && <div style={{ fontSize: 11, color: '#8B5CF6', marginTop: 1 }}>{opt.subtitle}</div>}
                </div>
                {isSelected && <Check size={14} style={{ color: '#7C3AED', flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
