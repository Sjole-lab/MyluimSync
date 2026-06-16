import { useEffect, useState, useRef } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './UploadCenterPage.css'

function UploadCenterPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // טעינת קורסים והיסטוריית חומרים
  const loadData = async () => {
    const { data: coursesData } = await supabase.from('courses').select('*')
    const { data: materialsData } = await supabase.from('materials').select('*')
    
    setCourses(coursesData || [])
    setMaterials(materialsData || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  // יצירת רשומה חדשה (Create - CRUD) ב-Supabase בלחיצה על כפתור העלאה
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId || !materialTitle) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('materials')
        .insert([
          {
            title: materialTitle,
            course_id: selectedCourseId,
            file_url: 'https://cbbmvqnserogotbukghy.supabase.co/storage/v1/object/public/materials/mock.pdf' // דוגמה למיקום עתידי בסטורג'
          }
        ])

      if (error) throw error

      // איפוס טופס וטעינת נתונים מעודכנים מחדש
      setMaterialTitle('')
      await loadData()
    } catch (err) {
      console.error('שגיאה בשמירת החומר בשרת:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="upload-page">
      <header className="page-header">
        <h1 className="page-title">מרכז העלאת תכנים ואקדמיה</h1>
        <p className="page-subtitle">כאן מתנדבים ותומכים מעלים חומרי לימוד יקרי ערך לסטודנטים שבחזית</p>
      </header>

      <form className="upload-section card" onSubmit={handleUploadSubmit}>
        <div className="upload-form-inputs">
          <div className="input-group">
            <label htmlFor="course-select">בחר קורס אקדמי</label>
            <select
              id="course-select"
              required
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">-- בחר קורס מהרשימה --</option>
              {(() => {
                const byDept: Record<string, typeof courses> = {}
                courses.forEach(c => {
                  const dept = c.department || 'כללי'
                  if (!byDept[dept]) byDept[dept] = []
                  byDept[dept].push(c)
                })
                return Object.entries(byDept).map(([dept, items]) => (
                  <optgroup key={dept} label={dept}>
                    {items.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </optgroup>
                ))
              })()}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="material-title">שם/כותרת הקובץ או הסיכום</label>
            <input
              id="material-title"
              type="text"
              required
              placeholder="לדוגמה: סיכום הרצאה 4 - מבני נתונים רלציוניים"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="upload-zone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="upload-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <h3 className="upload-title">בחר קובץ להצמדה מהמחשב</h3>
          <p className="upload-text">גרור לכאן קבצי PDF, Word או מצגות (עד 15MB)</p>
          <input type="file" ref={fileInputRef} className="file-input" style={{ display: 'none' }} />
        </div>

        <Button variant="primary" type="submit" fullWidth isLoading={isSubmitting}>
          העלה חומר לימודי למערכת
        </Button>
      </form>

      <section className="history-section">
        <h2 className="section-title">היסטוריית החומרים שהועלו לאחרונה</h2>
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>שם הכותרת</th>
                <th>קובץ מצורף</th>
                <th>תאריך הפקה בענן</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat) => {
                const associatedCourse = courses.find(c => c.id === mat.course_id)
                return (
                  <tr key={mat.id}>
                    <td><strong>{mat.title}</strong> <span style={{fontSize: '12px', opacity: 0.7}}>({associatedCourse?.title || 'קורס כללי'})</span></td>
                    <td><a href={mat.file_url} target="_blank" rel="noreferrer" className="download-link-table">צפה בקובץ 📥</a></td>
                    <td>{new Date(mat.created_at).toLocaleDateString('he-IL')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default UploadCenterPage