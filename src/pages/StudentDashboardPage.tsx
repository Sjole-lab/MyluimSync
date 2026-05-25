import { useEffect, useState } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './StudentDashboardPage.css'

function StudentDashboardPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [feedbackText, setFeedbackText] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [rating, setRating] = useState(5)
  const [studentName, setStudentName] = useState('סטודנט במילואים')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStudentViewData() {
      setIsLoading(true)
      const { data: coursesData } = await supabase.from('courses').select('*')
      const { data: materialsData } = await supabase.from('materials').select('*')
      setCourses(coursesData || [])
      setMaterials(materialsData || [])
      
      // שליפת שם הסטודנט המחובר לפרופיל
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (prof?.full_name) setStudentName(prof.full_name)
      }
      setIsLoading(false)
    }
    loadStudentViewData()
  }, [])

  // פונקציית הורדה אמיתית המעדכנת את מונה ההורדות ב-Supabase בטכנולוגיית RPC קריאה ישירה
  const handleDownloadFile = async (materialId: string, fileUrl: string) => {
    try {
      await supabase.rpc('increment_download', { material_id: materialId })
      // פתיחת הקובץ להורדה בכרטיסייה חדשה
      window.open(fileUrl, '_blank')
      // עדכון קל של הסטייט המקומי כדי שהסטודנט יראה את השינוי במונה מיידית
      setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, downloads_count: (m.downloads_count || 0) + 1 } : m))
    } catch (err) {
      console.error('Error handling download count:', err)
    }
  }

  // שליחת פידבק אמיתי לטבלה ב-Supabase עבור התומך האקדמי
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterialId || !feedbackText) return

    try {
      const { error } = await supabase.from('material_feedbacks').insert([
        { material_id: selectedMaterialId, user_name: studentName, comment: feedbackText, rating: rating }
      ])
      if (error) throw error
      alert('הפידבק שלך נשלח בהצלחה לתומך האקדמי והוזן במערכת!')
      setFeedbackText('')
      setSelectedMaterialId('')
    } catch (err) {
      console.error('Error saving feedback:', err)
    }
  }

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <h1 className="welcome-title">שלום, {studentName}</h1>
        <p className="welcome-text">מרכז השלמת התוכן האישי שלך. כל הקבצים והסיכומים המרוכזים עבורך זמינים להורדה מיידית.</p>
      </section>

      <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <section className="courses-section card">
          <h2 className="section-title" style={{ marginBottom: '15px' }}>חומרי לימוד וקבצים זמינים עבורך מהתומכים:</h2>
          {isLoading ? <p>טוען חומרי עזר מהשרת...</p> : materials.length === 0 ? <p>טרם הועלו חומרים עבורך לסמסטר הנוכחי.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {materials.map(mat => (
                <div key={mat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-background)' }}>
                  <div>
                    <strong>{mat.title}</strong>
                    <div style={{ fontSize: '12px', color: 'gray', marginTop: '4px' }}>הורדות קובץ זה: {mat.downloads_count || 0} פעמים</div>
                  </div>
                  <Button variant="secondary" onClick={() => handleDownloadFile(mat.id, mat.file_url)}>הורד חומר לימוד 📥</Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* טופס הוספת פידבק וחוות דעת מהשטח */}
        <section className="card">
          <h2 className="section-title" style={{ marginBottom: '15px' }}>השארת פידבק ותודה לתומך האקדמי</h2>
          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group">
              <label htmlFor="select-mat">עבור איזה חומר לימוד ברצונך להגיב?</label>
              <select id="select-mat" required value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)}>
                <option value="">-- בחר חומר לימוד --</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="rating-select">דירוג איכות החומר (1-5 כוכבים)</label>
              <select id="rating-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                <option value="5">⭐⭐⭐⭐⭐ (מצוין)</option>
                <option value="4">⭐⭐⭐⭐ (טוב מאוד)</option>
                <option value="3">⭐⭐⭐ (מספק)</option>
                <option value="2">⭐⭐ (טעון שיפור)</option>
                <option value="1">⭐ (לא רלוונטי)</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="feedback-area">מילים חמות או הערות בונות לתומך</label>
              <textarea id="feedback-area" required value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="כתוב כאן..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '80px', fontFamily: 'sans-serif' }}></textarea>
            </div>
            <Button type="submit" variant="primary">שלח פידבק מעודד לתומך 🚀</Button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default StudentDashboardPage