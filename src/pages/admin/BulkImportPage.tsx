import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patientService } from '../../services/api'
import { Upload, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

type ImportRow = {
  row: number
  data: any
  status: 'pending' | 'success' | 'error'
  error?: string
}

const PATIENT_TEMPLATE = [
  { first_name: 'John', last_name: 'Doe', date_of_birth: '1990-05-15', gender: 'male', phone: '9876543210', email: 'john@example.com', blood_group: 'O+', address: '123 Main St', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', emergency_contact_name: 'Jane Doe', emergency_contact_phone: '9876543211' }
]

export default function BulkImportPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const [failed, setFailed] = useState(0)
  const [activeType, setActiveType] = useState<'patients'>('patients')

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(PATIENT_TEMPLATE)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Patients')
    // Auto column widths
    const cols = Object.keys(PATIENT_TEMPLATE[0]).map(k => ({ wch: Math.max(k.length, 15) }))
    ws['!cols'] = cols
    XLSX.writeFile(wb, 'patient_import_template.xlsx')
    toast.success('Template downloaded!')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws)
        if (!data.length) return toast.error('No data found in file')
        const importRows: ImportRow[] = data.map((row: any, i: number) => ({
          row: i + 2,
          data: row,
          status: 'pending'
        }))
        setRows(importRows)
        setImported(0); setFailed(0)
        toast.success(`${data.length} rows loaded — click Import to proceed`)
      } catch { toast.error('Failed to read file') }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!rows.length) return toast.error('Load a file first')
    setImporting(true)
    let ok = 0, fail = 0
    const updated = [...rows]

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (row.status === 'success') continue
      try {
        // Validate required fields
        if (!row.data.first_name || !row.data.last_name) throw new Error('first_name and last_name are required')
        if (!row.data.date_of_birth) throw new Error('date_of_birth is required (YYYY-MM-DD)')
        if (!row.data.gender) throw new Error('gender is required (male/female/other)')
        if (!row.data.phone) throw new Error('phone is required')

        await patientService.create({
          first_name: String(row.data.first_name || '').trim(),
          last_name: String(row.data.last_name || '').trim(),
          date_of_birth: String(row.data.date_of_birth || '').trim(),
          gender: String(row.data.gender || '').toLowerCase().trim(),
          phone: String(row.data.phone || '').trim(),
          email: row.data.email ? String(row.data.email).trim() : undefined,
          blood_group: row.data.blood_group ? String(row.data.blood_group).trim() : undefined,
          address: row.data.address ? String(row.data.address).trim() : undefined,
          city: row.data.city ? String(row.data.city).trim() : undefined,
          state: row.data.state ? String(row.data.state).trim() : undefined,
          pincode: row.data.pincode ? String(row.data.pincode).trim() : undefined,
          emergency_contact_name: row.data.emergency_contact_name ? String(row.data.emergency_contact_name).trim() : undefined,
          emergency_contact_phone: row.data.emergency_contact_phone ? String(row.data.emergency_contact_phone).trim() : undefined,
        })
        updated[i] = { ...row, status: 'success' }
        ok++
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || 'Unknown error'
        updated[i] = { ...row, status: 'error', error: msg }
        fail++
      }
      setRows([...updated])
      // Small delay to avoid overwhelming the API
      await new Promise(r => setTimeout(r, 100))
    }

    setImported(ok); setFailed(fail); setImporting(false)
    qc.invalidateQueries({ queryKey: ['patients'] })
    toast.success(`Import complete: ${ok} success, ${fail} failed`)
  }

  const downloadErrors = () => {
    const errorRows = rows.filter(r => r.status === 'error').map(r => ({ ...r.data, error: r.error }))
    if (!errorRows.length) return toast.error('No errors to download')
    const ws = XLSX.utils.json_to_sheet(errorRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Errors')
    XLSX.writeFile(wb, 'import_errors.xlsx')
  }

  const pending = rows.filter(r => r.status === 'pending').length
  const success = rows.filter(r => r.status === 'success').length
  const errors = rows.filter(r => r.status === 'error').length
  const progress = rows.length ? Math.round(((success + errors) / rows.length) * 100) : 0

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Bulk Import</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Import patients from Excel (.xlsx) files</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { num: 1, title: 'Download Template', desc: 'Get the Excel template with correct column headers' },
          { num: 2, title: 'Fill & Upload', desc: 'Fill patient data and upload the file' },
          { num: 3, title: 'Import', desc: 'Review rows and click Import' },
        ].map(({ num, title, desc }) => (
          <div key={num} style={{ display: 'flex', gap: 12, padding: '14px 16px', background: '#FAFAFF', border: '1px solid #EDE9FE', borderRadius: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{num}</div>
            <div><p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>{title}</p><p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{desc}</p></div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={downloadTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1.5px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer' }}>
            <Download size={15} /> Download Template
          </button>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1.5px solid #EDE9FE', background: '#fff', color: '#4C1D95', cursor: 'pointer' }}>
            <Upload size={15} /> Upload Excel File
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
          {rows.length > 0 && !importing && (
            <button onClick={handleImport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', cursor: 'pointer' }}>
              Import {rows.length} Patients
            </button>
          )}
          {errors > 0 && (
            <button onClick={downloadErrors}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
              <Download size={15} /> Download Errors ({errors})
            </button>
          )}
        </div>

        {/* Progress */}
        {importing && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>Importing... {progress}%</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{success + errors} / {rows.length}</span>
            </div>
            <div style={{ height: 8, background: '#EDE9FE', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Summary */}
        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total', value: rows.length, color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Pending', value: pending, color: '#D97706', bg: '#FFFBEB' },
              { label: 'Success', value: success, color: '#059669', bg: '#ECFDF5' },
              { label: 'Failed', value: errors, color: '#DC2626', bg: '#FEF2F2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ padding: '8px 16px', background: bg, borderRadius: 8, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0 }}>{value}</p>
                <p style={{ fontSize: 11, color, fontWeight: 600, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Data Table */}
        {rows.length > 0 && (
          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #EDE9FE', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#FAFAFF', position: 'sticky', top: 0 }}>
                {['Row', 'Name', 'DOB', 'Gender', 'Phone', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid #EDE9FE' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F9F7FF', background: row.status === 'error' ? '#FFF5F5' : row.status === 'success' ? '#F0FDF4' : undefined }}>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280' }}>{row.row}</td>
                    <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{row.data.first_name} {row.data.last_name}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280' }}>{row.data.date_of_birth}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280', textTransform: 'capitalize' }}>{row.data.gender}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280' }}>{row.data.phone}</td>
                    <td style={{ padding: '8px 14px' }}>
                      {row.status === 'success' && <CheckCircle size={16} color="#059669" />}
                      {row.status === 'error' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <XCircle size={14} color="#DC2626" />
                          <span style={{ fontSize: 11, color: '#DC2626' }}>{row.error}</span>
                        </div>
                      )}
                      {row.status === 'pending' && <span style={{ fontSize: 11, color: '#D97706' }}>Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!rows.length && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#C4B5FD' }}>
            <Upload size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>Upload an Excel file to start importing</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Download the template first for correct column format</p>
          </div>
        )}
      </div>

      {/* Column Reference */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 12 }}>Column Reference (Patient Import)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { col: 'first_name', req: true }, { col: 'last_name', req: true },
            { col: 'date_of_birth', req: true, note: 'YYYY-MM-DD' }, { col: 'gender', req: true, note: 'male/female/other' },
            { col: 'phone', req: true }, { col: 'email', req: false },
            { col: 'blood_group', req: false, note: 'A+/B+/O+ etc' }, { col: 'address', req: false },
            { col: 'city', req: false }, { col: 'state', req: false },
            { col: 'pincode', req: false }, { col: 'emergency_contact_name', req: false },
            { col: 'emergency_contact_phone', req: false },
          ].map(({ col, req, note }) => (
            <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FAFAFF', borderRadius: 6 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4C1D95' }}>{col}</span>
              {req && <span style={{ fontSize: 9, background: '#FEF2F2', color: '#DC2626', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>REQ</span>}
              {note && <span style={{ fontSize: 10, color: '#9CA3AF' }}>({note})</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
