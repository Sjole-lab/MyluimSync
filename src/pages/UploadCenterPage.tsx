import { useEffect, useState, useRef, useCallback } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './UploadCenterPage.css'

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.mp3,.mp4'
const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function getFileIcon(nameOrUrl: string): string {
  const ext = nameOrUrl.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['ppt', 'pptx'].includes(ext)) return '📊'
  if (['xls', 'xlsx'].includes(ext)) return '📈'
  if (['mp3', 'mp4', 'm4a'].includes(ext)) return '🎧'
  if (['png', 'jpg', 'jpeg'].includes(ext)) return '🖼️'
  return '📎'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadCenterPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    const [{ data: coursesData }, { data: materialsData }, { data: { user } }] = await Promise.all([
      supabase.from('courses').select('*').order('title'),
      supabase.from('materials').select('*, courses(title)').order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])
    setCourses(coursesData || [])
    setMaterials(materialsData || [])
    setCurrentUserId(user?.id || null)
  }

  useEffect(() => { loadData() }, [])

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      setStatusMsg({ text: `הקובץ גדול מדי (${formatBytes(file.size)}). המגבלה: ${MAX_SIZE_MB}MB.`, type: 'error' })
      return
    }
    setSelectedFile(file)
    setStatusMsg(null)
    if (!materialTitle) setMaterialTitle(file.name.replace(/\.[^/.]+$/, ''))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [materialTitle])

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)
    if (!selectedCourseId) { setStatusMsg({ text: 'אנא בחר קורס.', type: 'error' }); return }
    if (!materialTitle.trim()) { setStatusMsg({ text: 'אנא הכנס כותרת.', type: 'error' }); return }
    if (!selectedFile) { setStatusMsg({ text: 'אנא בחר קובץ להעלאה.', type: 'error' }); return }

    setIsSubmitting(true)
    setUploadProgress(15)

    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${Date.now()}-${safeName}`

      const { data: storageData, error: storageError } = await supabase.storage
        .from('materials')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false })

      if (storageError) throw new Error(`שגיאת אחסון: ${storageError.message}`)
      setUploadProgress(65)

      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(storageData.path)

      const { error: dbError } = await supabase.from('materials').insert([{
        title: materialTitle.trim(),
        course_id: selectedCourseId,
        file_url: publicUrl,
        uploaded_by: currentUserId,
        lesson_date: lessonDate,
      }])

      if (dbError) throw new Error(`שגיאת מסד נתונים: ${dbError.message}`)

      setUploadProgress(100)
      setStatusMsg({ text: `✅ "${selectedFile.name}" הועלה בהצלחה!`, type: 'success' })
      setMaterialTitle('')
      setSelectedCourseId('')
      setSelectedFile(null)
      setLessonDate(new Date().toISOString().split('T')[0])
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadData()

    } catch (err: any) {
      setStatusMsg({ text: err.message || 'שגיאה בהעלאה. ודא שה-bucket "materials" קיים וציבורי.', type: 'error' })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setUploadProgress(0), 500)
    }
  }

  const handleDelete = async (mat: any) => {
    if (!window.confirm(`למחוק את "${mat.title}"? פעולה זו אינה ניתנת לביטול.`)) return
    setDeletingId(mat.id)
    try {
      // מחיקה מ-Storage
      const urlMatch = mat.file_url?.match(/\/materials\/(.+)$/)
      if (urlMatch) {
        await supabase.storage.from('materials').remove([decodeURIComponent(urlMatch[1])])
      }
      // מחיקה מ-DB
      const { error } = await supabase.from('materials').delete().eq('id', mat.id)
      if (error) throw error
      setMaterials(prev => prev.filter(m => m.id !== mat.id))
      setStatusMsg({ text: '🗑️ החומר נמחק בהצלחה.', type: 'success' })
    } catch (err: any) {
      setStatusMsg({ text: `שגיאה במחיקה: ${err.message}`, type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const getYearLabel = (year: number | null) => {
    if (!year) return ''
    return ['שנה א׳', 'שנה ב׳', 'שנה ג׳', 'שנה ד׳'][year - 1] || `שנה ${year}`
  }

  const coursesByGroup: Record<string, typeof courses> = {}
  courses.forEach(c => {
    const groupName = c.faculty
      ? (c.specialization ? `${c.faculty} - ${c.specialization}` : c.faculty)
      : (c.department || 'כללי')
    if (!coursesByGroup[groupName]) coursesByGroup[groupName] = []
    coursesByGroup[groupName].push(c)
  })

  const myMaterials = materials.filter(m => m.uploaded_by === currentUserId)
  const otherMaterials = materials.filter(m => m.uploaded_by !== currentUserId)

  return (
    <div className="upload-page">
      <header className="page-header">
        <h1 className="page-title">מרכז העלאת חומרי לימוד</h1>
        <p className="page-subtitle">PDF · Word · PowerPoint · Excel · NotebookLM Audio — הכל עבור הלוחמים שחוזרים</p>
      </header>

      {statusMsg && (
        <div className={`status-banner ${statusMsg.type}`}>
          {statusMsg.text}
          <button onClick={() => setStatusMsg(null)} className="status-close">✕</button>
        </div>
      )}

      <form className="upload-section card" onSubmit={handleUploadSubmit}>
        <div className="upload-form-inputs">
          <div className="input-group">
            <label htmlFor="course-select">קורס אקדמי</label>
            <select id="course-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
              <option value="">-- בחר קורס --</option>
              {Object.entries(coursesByGroup).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.year_of_study ? `(${getYearLabel(c.year_of_study)})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="material-title">כותרת החומר</label>
            <input
              id="material-title"
              type="text"
              placeholder="לדוגמה: סיכום הרצאה 4 — דיני חוזים"
              value={materialTitle}
              onChange={e => setMaterialTitle(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="lesson-date">תאריך השיעור / הסיכום</label>
            <input
              id="lesson-date"
              type="date"
              required
              value={lessonDate}
              onChange={e => setLessonDate(e.target.value)}
            />
          </div>
        </div>

        <div
          className={`upload-zone${isDragging ? ' drag-active' : ''}${selectedFile ? ' file-selected' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {selectedFile ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>{getFileIcon(selectedFile.name)}</div>
              <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px', wordBreak: 'break-all' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{formatBytes(selectedFile.size)}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>לחץ להחלפה</p>
            </div>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <h3 className="upload-title">גרור קובץ לכאן או לחץ לבחירה</h3>
              <p className="upload-text">PDF · Word · PowerPoint · Excel · תמונה · NotebookLM Audio</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>עד {MAX_SIZE_MB}MB</p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept={ACCEPTED_EXTENSIONS}
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
          />
        </div>

        {isSubmitting && uploadProgress > 0 && (
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            <p className="progress-label">מעלה... {uploadProgress}%</p>
          </div>
        )}

        <Button variant="primary" type="submit" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? 'מעלה לענן...' : 'העלה חומר לימודי'}
        </Button>
      </form>

      {/* החומרים שלי */}
      <section className="history-section">
        <h2 className="section-title">החומרים שהעלית ({myMaterials.length})</h2>
        {myMaterials.length === 0 ? (
          <div className="empty-state-small">טרם העלית חומרים. העלאה ראשונה תופיע כאן.</div>
        ) : (
          <div className="materials-list">
            {myMaterials.map(mat => (
              <div key={mat.id} className="material-row own">
                <div className="material-icon">{getFileIcon(mat.file_url || '')}</div>
                <div className="material-info">
                  <strong>{mat.title}</strong>
                  <span className="material-meta">
                    {mat.courses?.title && <span>{mat.courses.title}</span>}
                    <span>📅 תאריך שיעור: {new Date(mat.lesson_date || mat.created_at).toLocaleDateString('he-IL')}</span>
                    <span>{mat.downloads_count || 0} הורדות</span>
                  </span>
                </div>
                <div className="material-actions">
                  <a href={mat.file_url} target="_blank" rel="noreferrer" className="action-link view">פתח</a>
                  <button
                    onClick={() => handleDelete(mat)}
                    disabled={deletingId === mat.id}
                    className="action-link delete"
                  >
                    {deletingId === mat.id ? '...' : 'מחק'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* כל החומרים של אחרים */}
      {otherMaterials.length > 0 && (
        <section className="history-section">
          <h2 className="section-title">חומרים של תומכים אחרים ({otherMaterials.length})</h2>
          <div className="materials-list">
            {otherMaterials.map(mat => (
              <div key={mat.id} className="material-row">
                <div className="material-icon">{getFileIcon(mat.file_url || '')}</div>
                <div className="material-info">
                  <strong>{mat.title}</strong>
                  <span className="material-meta">
                    {mat.courses?.title && <span>{mat.courses.title}</span>}
                    <span>📅 תאריך שיעור: {new Date(mat.lesson_date || mat.created_at).toLocaleDateString('he-IL')}</span>
                    <span>{mat.downloads_count || 0} הורדות</span>
                  </span>
                </div>
                <div className="material-actions">
                  <a href={mat.file_url} target="_blank" rel="noreferrer" className="action-link view">פתח</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default UploadCenterPage
