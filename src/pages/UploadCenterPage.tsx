import { useEffect, useState, useRef, useCallback } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './UploadCenterPage.css'

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.mp3,.mp4'

const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['ppt', 'pptx'].includes(ext)) return '📊'
  if (['xls', 'xlsx'].includes(ext)) return '📈'
  if (['mp3', 'mp4', 'm4a'].includes(ext)) return '🎧'
  if (['png', 'jpg', 'jpeg'].includes(ext)) return '🖼️'
  return '📎'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadCenterPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    const { data: coursesData } = await supabase.from('courses').select('*').order('title')
    const { data: materialsData } = await supabase
      .from('materials')
      .select('*, courses(title)')
      .order('created_at', { ascending: false })
    setCourses(coursesData || [])
    setMaterials(materialsData || [])
  }

  useEffect(() => { loadData() }, [])

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      setStatusMsg({ text: `הקובץ גדול מדי (${formatBytes(file.size)}). המגבלה היא ${MAX_SIZE_MB}MB.`, type: 'error' })
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    if (!selectedCourseId) {
      setStatusMsg({ text: 'אנא בחר קורס מהרשימה.', type: 'error' })
      return
    }
    if (!materialTitle.trim()) {
      setStatusMsg({ text: 'אנא הכנס כותרת לחומר.', type: 'error' })
      return
    }
    if (!selectedFile) {
      setStatusMsg({ text: 'אנא בחר קובץ להעלאה.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(10)

    try {
      // שלב 1: העלאת הקובץ ל-Supabase Storage
      const ext = selectedFile.name.split('.').pop() || 'bin'
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${Date.now()}-${safeName}`

      setUploadProgress(30)

      const { data: storageData, error: storageError } = await supabase.storage
        .from('materials')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false })

      if (storageError) throw new Error(`שגיאת אחסון: ${storageError.message}`)

      setUploadProgress(70)

      // שלב 2: קבלת URL ציבורי
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(storageData.path)

      // שלב 3: שמירה בטבלת materials
      const { error: dbError } = await supabase.from('materials').insert([{
        title: materialTitle.trim(),
        course_id: selectedCourseId,
        file_url: publicUrl,
      }])

      if (dbError) throw new Error(`שגיאת מסד נתונים: ${dbError.message}`)

      setUploadProgress(100)
      setStatusMsg({ text: `✅ הקובץ "${selectedFile.name}" הועלה בהצלחה!`, type: 'success' })

      // איפוס טופס
      setMaterialTitle('')
      setSelectedCourseId('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadData()

    } catch (err: any) {
      console.error('Upload error:', err)
      setStatusMsg({ text: err.message || 'שגיאה בהעלאה. ודא שה-Storage bucket "materials" קיים וציבורי.', type: 'error' })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const coursesByDept: Record<string, typeof courses> = {}
  courses.forEach(c => {
    const dept = c.department || 'כללי'
    if (!coursesByDept[dept]) coursesByDept[dept] = []
    coursesByDept[dept].push(c)
  })

  return (
    <div className="upload-page">
      <header className="page-header">
        <h1 className="page-title">מרכז העלאת חומרי לימוד</h1>
        <p className="page-subtitle">העלה PDF, Word, מצגות, Excel, NotebookLM Audio ועוד — הכל בשביל הלוחמים שחוזרים</p>
      </header>

      {statusMsg && (
        <div style={{
          margin: '0 0 20px 0',
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 500,
          backgroundColor: statusMsg.type === 'success' ? '#dcfce7' : '#fde8e8',
          color: statusMsg.type === 'success' ? '#15803d' : '#be123c',
          border: `1px solid ${statusMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
        }}>
          {statusMsg.text}
        </div>
      )}

      <form className="upload-section card" onSubmit={handleUploadSubmit}>
        <div className="upload-form-inputs">
          <div className="input-group">
            <label htmlFor="course-select">קורס אקדמי</label>
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">-- בחר קורס --</option>
              {Object.entries(coursesByDept).map(([dept, items]) => (
                <optgroup key={dept} label={dept}>
                  {items.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="material-title">כותרת החומר</label>
            <input
              id="material-title"
              type="text"
              placeholder="לדוגמה: סיכום הרצאה 4 — מבני נתונים"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
            />
          </div>
        </div>

        {/* אזור גרירה */}
        <div
          className={`upload-zone ${isDragging ? 'drag-active' : ''} ${selectedFile ? 'file-selected' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {selectedFile ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>{getFileIcon(selectedFile.name)}</div>
              <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{formatBytes(selectedFile.size)}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>לחץ להחלפת קובץ</p>
            </div>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <h3 className="upload-title">גרור קובץ לכאן או לחץ לבחירה</h3>
              <p className="upload-text">
                PDF · Word · מצגת PowerPoint · Excel · טקסט · תמונה · NotebookLM Audio
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>עד {MAX_SIZE_MB}MB</p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept={ACCEPTED_EXTENSIONS}
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
          />
        </div>

        {/* Progress bar */}
        {isSubmitting && uploadProgress > 0 && (
          <div style={{ margin: '8px 0' }}>
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))', borderRadius: '999px', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
              מעלה... {uploadProgress}%
            </p>
          </div>
        )}

        <Button variant="primary" type="submit" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? 'מעלה לענן...' : 'העלה חומר לימודי'}
        </Button>
      </form>

      {/* טבלת היסטוריה */}
      <section className="history-section">
        <h2 className="section-title">חומרים שהועלו ({materials.length})</h2>
        {materials.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
            <p>טרם הועלו חומרים. היה הראשון!</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>שם החומר</th>
                  <th>קורס</th>
                  <th>קובץ</th>
                  <th>תאריך</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <span style={{ marginLeft: '6px' }}>{getFileIcon(mat.file_url || '')}</span>
                      <strong>{mat.title}</strong>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{mat.courses?.title || '—'}</td>
                    <td>
                      <a href={mat.file_url} target="_blank" rel="noreferrer" className="download-link-table">
                        פתח 📥
                      </a>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {new Date(mat.created_at).toLocaleDateString('he-IL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default UploadCenterPage
