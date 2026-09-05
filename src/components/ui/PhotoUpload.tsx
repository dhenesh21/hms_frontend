import { useRef, useState } from 'react'
import { Camera, Trash2, Upload, User } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = 'http://127.0.0.1:8000'

interface PhotoUploadProps {
  currentUrl?: string | null
  name?: string              // initials fallback
  size?: number              // avatar size px (default 80)
  onUpload: (file: File) => Promise<{ photo_url: string }>
  onDelete?: () => Promise<any>
  onSuccess?: (url: string) => void
  shape?: 'circle' | 'square'
  editable?: boolean
}

export default function PhotoUpload({
  currentUrl, name, size = 80,
  onUpload, onDelete, onSuccess,
  shape = 'circle', editable = true
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const photoSrc = preview || (currentUrl ? `${API_BASE}${currentUrl}` : null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large (max 5MB)')
    // Show preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    // Upload
    setLoading(true)
    try {
      const res = await onUpload(file)
      setPreview(null)
      onSuccess?.(res.photo_url)
      toast.success('Photo updated')
    } catch (err: any) {
      setPreview(null)
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete()
      setPreview(null)
      onSuccess?.('')
      toast.success('Photo removed')
    } catch {
      toast.error('Failed to remove photo')
    } finally {
      setLoading(false)
    }
  }

  const radius = shape === 'circle' ? '50%' : 12

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Avatar */}
      <div style={{ position: 'relative', width: size, height: size }}>
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={name || 'Photo'}
            style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', border: '3px solid #EDE9FE' }}
          />
        ) : (
          <div style={{
            width: size, height: size, borderRadius: radius,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid #EDE9FE', fontSize: size * 0.3, fontWeight: 700, color: '#fff'
          }}>
            {name ? initials : <User size={size * 0.4} color="#fff" />}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: radius,
            background: 'rgba(109,40,217,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        )}

        {/* Camera button */}
        {editable && !loading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: size * 0.32, height: size * 0.32,
              borderRadius: '50%', border: '2px solid #fff',
              background: '#7C3AED', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(124,58,237,0.4)'
            }}>
            <Camera size={size * 0.16} color="#fff" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      {editable && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', fontSize: 11, fontWeight: 600,
              borderRadius: 6, border: '1.5px solid #DDD6FE',
              background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer'
            }}>
            <Upload size={11} /> Upload
          </button>
          {(photoSrc || currentUrl) && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                borderRadius: 6, border: '1.5px solid #FEE2E2',
                background: '#FFF5F5', color: '#DC2626', cursor: 'pointer'
              }}>
              <Trash2 size={11} /> Remove
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
