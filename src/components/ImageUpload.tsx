import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

interface Props {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
}

export default function ImageUpload({ value, onChange, folder = 'misc', label = 'Gambar' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5MB'); return }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', folder)

      const res = await fetch('/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form,
      })
      const data = await res.json()
      if (data.status === 0) throw new Error(data.error)

      setPreview(data.url)
      onChange(data.url)
      toast.success('Gambar berhasil diupload!')
    } catch(e: any) {
      toast.error(e.message || 'Gagal upload')
    } finally { setUploading(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>

      {/* Preview */}
      {preview && (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <img src={preview} alt="preview"
            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
            onError={() => setPreview('')} />
          <button onClick={() => { setPreview(''); onChange('') }}
            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      )}

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed var(--border)', borderRadius: 8, padding: 16,
          textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
          background: 'rgba(255,255,255,0.02)',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div className="spinner" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Mengupload...</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Klik atau drag & drop gambar</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>JPG, PNG, WebP, GIF • Max 5MB</div>
          </>
        )}
      </div>

      {/* Input URL manual */}
      <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>atau URL:</span>
        <input
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 12, outline: 'none' }}
          placeholder="https://..."
          value={preview}
          onChange={e => { setPreview(e.target.value); onChange(e.target.value) }}
        />
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
