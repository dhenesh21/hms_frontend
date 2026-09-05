import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { reportTemplateService } from '../../services/api'
import { FileText, Plus, Pencil, Trash2, ScanLine, FlaskConical, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

const DEPT_ICON: Record<string, any> = { radiology: ScanLine, lab: FlaskConical }

export default function ReportTemplatesPage() {
  const qc = useQueryClient()
  const [deptFilter, setDeptFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const { register, handleSubmit, reset, setValue, watch } = useForm()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['report-templates', deptFilter],
    queryFn: () => reportTemplateService.list({
      department: deptFilter || undefined,
      active_only: false,
    }).then(r => r.data),
  })

  const createTemplate = useMutation({
    mutationFn: (d: any) => reportTemplateService.create(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates'] })
      toast.success('Report template created')
      closeForm()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create template')
  })

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => reportTemplateService.update(id, cleanPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates'] })
      toast.success('Report template updated')
      closeForm()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update template')
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => reportTemplateService.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates'] })
      toast.success('Status updated')
    }
  })

  const removeTemplate = useMutation({
    mutationFn: (id: number) => reportTemplateService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates'] })
      toast.success('Template deactivated')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to remove template')
  })

  const closeForm = () => { setShowForm(false); setEditing(null); reset({ department: '', category: '', template_name: '', findings_template: '', impression_template: '' }) }

  const openNew = () => { setEditing(null); reset({ department: '', category: '', template_name: '', findings_template: '', impression_template: '' }); setShowForm(true) }

  const openEdit = (t: any) => {
    setEditing(t)
    reset({
      department: t.department, category: t.category, template_name: t.template_name,
      findings_template: t.findings_template, impression_template: t.impression_template || '',
    })
    setShowForm(true)
  }

  const onSubmit = (d: any) => {
    if (editing) {
      updateTemplate.mutate({ id: editing.id, data: { template_name: d.template_name, findings_template: d.findings_template, impression_template: d.impression_template } })
    } else {
      if (!d.department) return toast.error('Select a department')
      createTemplate.mutate(d)
    }
  }

  const grouped = (templates || []).reduce((acc: Record<string, any[]>, t: any) => {
    acc[t.category] = acc[t.category] || []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Diagnostic Report Templates</h1>
          <p className="text-sm text-gray-500">Reusable findings & impression templates for Radiology and Lab reporting</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 btn-primary transition">
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-2">
        {['', 'radiology', 'lab'].map(d => (
          <button key={d || 'all'} onClick={() => setDeptFilter(d)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${deptFilter === d ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {d ? d.charAt(0).toUpperCase() + d.slice(1) : 'All Departments'}
          </button>
        ))}
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading templates...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <FileText size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No report templates yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</h2>
              <div className="grid grid-cols-2 gap-3">
                {(items as any[]).map((t: any) => {
                  const Icon = DEPT_ICON[t.department] || FileText
                  return (
                    <div key={t.id} className={`bg-white rounded-xl border p-4 shadow-sm ${t.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Icon size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{t.template_name}</p>
                            <p className="text-xs text-gray-400 uppercase">{t.department}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{t.findings_template}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => openEdit(t)}
                          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => toggleActive.mutate({ id: t.id, is_active: !t.is_active })}
                          className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                          {t.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => { if (window.confirm('Deactivate this template?')) removeTemplate.mutate(t.id) }}
                          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 ml-auto">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">{editing ? 'Edit Template' : 'New Report Template'}</h2>
              <button onClick={closeForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Department *</label>
                  <CustomSelect
                    value={watch('department') || ''}
                    onChange={v => setValue('department', String(v))}
                    disabled={!!editing}
                    placeholder="— Select —"
                    options={[{ value: '', label: '— Select —' }, { value: 'radiology', label: 'Radiology' }, { value: 'lab', label: 'Lab' }]}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category *</label>
                  <input {...register('category', { required: true })} disabled={!!editing}
                    className={`${inputCls} disabled:bg-gray-50`} placeholder="e.g. xray, ct, cbc" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Template Name *</label>
                <input {...register('template_name', { required: true })} className={inputCls} placeholder="e.g. Normal Chest X-Ray" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Findings Template *</label>
                <textarea {...register('findings_template', { required: true })} rows={5} className={inputCls}
                  placeholder="Standard findings text — the reporting doctor can edit this after applying the template" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Impression Template</label>
                <textarea {...register('impression_template')} rows={2} className={inputCls}
                  placeholder="Optional standard impression text" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 btn-primary">{editing ? 'Save Changes' : 'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
