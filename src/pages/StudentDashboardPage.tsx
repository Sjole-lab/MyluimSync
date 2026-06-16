import { useEffect, useState } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './StudentDashboardPage.css'

function StudentDashboardPage() {
  const [materials, setMaterials] = useState<any[]>([])
  const [feedbackText, setFeedbackText] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [rating, setRating] = useState(5)
  const [studentName, setStudentName] = useState('סטודנט במילואים')
  const [isLoading, setIsLoading] = useState(true)
  const [absenceStart, setAbsenceStart] = useState('')
  const [absenceEnd, setAbsenceEnd] = useState('')

  useEffect(() => {
    async function loadStudentViewData() {
      setIsLoading(true)
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*, courses(title)')
        .order('created_at', { ascending: false })

      setMaterials(materialsData || [])

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('full_name, absence_start, absence_end').eq('id', user.id).single()
        if (prof?.full_name) setStudentName(prof.full_name)
        if (prof?.absence_start) setAbsenceStart(prof.absence_start)
        if (prof?.absence_end) setAbsenceEnd(prof.absence_end)
      }
      setIsLoading(false)
    }
    loadStudentViewData()
  }, [])

  const handleSaveAbsence = async () => {
    if (!absenceStart || !absenceEnd) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ absence_start: absenceStart, absence_end: absenceEnd }).eq('id', user.id)
    }
  }

  const filteredMaterials = absenceStart && absenceEnd
    ? materials.filter(m => {
        const matDate = new Date(m.created_at)
        const start = new Date(absenceStart)
        const end = new Date(absenceEnd)
        end.setHours(23, 59, 59)
        return matDate >= start && matDate <= end
      })
    : materials

  const handleDownloadFile = async (materialId: string, fileUrl: string) => {
    try {
      await supabase.rpc('increment_download', { material_id: materialId })
      window.open(fileUrl, '_blank')
      setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, downloads_count: (m.downloads_count || 0) + 1 } : m))
    } catch (err) {
      console.error('Error handling download count:', err)
    }
  }

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterialId || !feedbackText) return

    try {
      const { error } = await supabase.from('material_feedbacks').insert([
        { material_id: selectedMaterialId, user_name: studentName, comment: feedbackText, rating: rating }
      ])
      if (error) throw error
      alert('הפידבק שלך נשלח בהצלחה לתומך האקדמי!')
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
        <p className="welcome-text">מרכז השלמת התוכן האישי שלך. הגדר את תקופת המילואים שלך כדי לסנן את החומרים הרלוונטיים.</p>
      </section>

      {/* בחירת תקופת היעדרות */}
      <section className="card" style={{ marginBottom: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: '12px' }}>
          📅 הגדרת תקופת שירות המילואים
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
          בחר את תאריכי ההיעדרות שלך — המערכת תסנן ותציג רק את החומרים שהועלו בתקופה זו.
        </p>
        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="absence-start">תאריך תחילת שירות</label>
            <input
              id="absence-start"
              type="date"
              value={absenceStart}
              onChange={e => setAbsenceStart(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="absence-end">תאריך סיום שירות</label>
            <input
              id="absence-end"
              type="date"
              value={absenceEnd}
              onChange={e => setAbsenceEnd(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          <Button variant="accent" onClick={handleSaveAbsence} disabled={!absenceStart || !absenceEnd}>
            שמור תקופה
          </Button>
          {absenceStart && absenceEnd && (
            <span style={{ fontSize: '14px', color: 'var(--color-accent)', fontWeight: 600 }}>
              נמצאו {filteredMaterials.length} חומרים בתקופה זו
            </span>
          )}
          {absenceStart && absenceEnd && (
            <button
              type="button"
              onClick={() => { setAbsenceStart(''); setAbsenceEnd('') }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              הצג את כל החומרים
            </button>
          )}
        </div>
      </section>

      <div className="dashboard-grid-layout">
        <section className="courses-section card">
          <h2 className="section-title" style={{ marginBottom: '15px' }}>
            {absenceStart && absenceEnd
              ? `חומרים מהתקופה ${new Date(absenceStart).toLocaleDateString('he-IL')} – ${new Date(absenceEnd).toLocaleDateString('he-IL')}`
              : 'כל חומרי הלימוד הזמינים עבורך'}
          </h2>
          {isLoading ? (
            <p>טוען חומרי עזר מהשרת...</p>
          ) : filteredMaterials.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              {absenceStart && absenceEnd
                ? 'לא הועלו חומרים בתקופה זו. נסה לשנות את הטווח.'
                : 'טרם הועלו חומרים.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMaterials.map(mat => (
                <div key={mat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid var(--color-border)', borderRadius: '10px', backgroundColor: 'var(--color-background)', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>{mat.title}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {mat.courses?.title && <span>קורס: {mat.courses.title}</span>}
                      <span>הועלה: {new Date(mat.created_at).toLocaleDateString('he-IL')}</span>
                      <span>הורדות: {mat.downloads_count || 0}</span>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => handleDownloadFile(mat.id, mat.file_url)}>הורד 📥</Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="section-title" style={{ marginBottom: '15px' }}>השארת פידבק לתומך</h2>
          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group">
              <label htmlFor="select-mat">עבור איזה חומר?</label>
              <select id="select-mat" required value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)}>
                <option value="">-- בחר חומר --</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="rating-select">דירוג (1-5 כוכבים)</label>
              <select id="rating-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                <option value="5">⭐⭐⭐⭐⭐ מצוין</option>
                <option value="4">⭐⭐⭐⭐ טוב מאוד</option>
                <option value="3">⭐⭐⭐ מספק</option>
                <option value="2">⭐⭐ טעון שיפור</option>
                <option value="1">⭐ לא רלוונטי</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="feedback-area">הערה לתומך</label>
              <textarea id="feedback-area" required value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="כתוב כאן..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
            </div>
            <Button type="submit" variant="primary">שלח פידבק 🚀</Button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default StudentDashboardPage
