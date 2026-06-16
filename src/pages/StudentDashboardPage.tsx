import { useEffect, useState, useCallback } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './StudentDashboardPage.css'

interface Props {
  onOpenCourseModal: () => void
}

function StudentDashboardPage({ onOpenCourseModal }: Props) {
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [feedbackText, setFeedbackText] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [rating, setRating] = useState(5)
  const [studentName, setStudentName] = useState('סטודנט במילואים')
  const [userProfile, setUserProfile] = useState<{ faculty?: string; specialization?: string; year_of_study?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [absenceStart, setAbsenceStart] = useState('')
  const [absenceEnd, setAbsenceEnd] = useState('')
  const [absenceSaved, setAbsenceSaved] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>('all')
  const [selectedCourseNames, setSelectedCourseNames] = useState<{id: string, title: string}[]>([])

  // מעקב השלמת חומרים ותזכורות
  const [completedMaterialIds, setCompletedMaterialIds] = useState<string[]>([])
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [showReminderPopup, setShowReminderPopup] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsLoading(false); return }

    // טען פרופיל
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name, absence_start, absence_end, faculty, specialization, year_of_study, reminders_enabled')
      .eq('id', user.id)
      .maybeSingle()

    if (prof) {
      if (prof.full_name) setStudentName(prof.full_name)
      if (prof.absence_start) setAbsenceStart(prof.absence_start)
      if (prof.absence_end) setAbsenceEnd(prof.absence_end)
      setRemindersEnabled(prof.reminders_enabled !== false)
      setUserProfile({
        faculty: prof.faculty,
        specialization: prof.specialization,
        year_of_study: prof.year_of_study,
      })
    }

    // טען קורסים שנבחרו
    const { data: userCourses } = await supabase
      .from('user_courses')
      .select('course_id, courses(id, title)')
      .eq('user_id', user.id)

    const courseIds = userCourses?.map((uc: any) => uc.course_id) ?? []
    setSelectedCourseIds(courseIds)
    setSelectedCourseNames(
      userCourses?.map((uc: any) => ({ id: uc.course_id, title: uc.courses?.title ?? '' })) ?? []
    )

    // טען חומרים — רק מהקורסים שנבחרו (אם בחר קורסים)
    let materialsQuery = supabase
      .from('materials')
      .select('*, courses(title)')
      .order('lesson_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (courseIds.length > 0) {
      materialsQuery = materialsQuery.in('course_id', courseIds)
    }

    const { data: materialsData } = await materialsQuery
    const loadedMaterials = materialsData || []
    setMaterials(loadedMaterials)

    // טען חומרים שהושלמו
    let completedIds: string[] = []
    try {
      const { data: completions, error: compError } = await supabase
        .from('material_completions')
        .select('material_id')
        .eq('user_id', user.id)
      
      if (!compError && completions) {
        completedIds = completions.map((c: any) => c.material_id)
        setCompletedMaterialIds(completedIds)
      }
    } catch (e) {
      console.warn('completions query failed:', e)
    }

    // בדיקת תזכורת פופאפ
    const isRemindersOn = prof ? prof.reminders_enabled !== false : true
    if (isRemindersOn && prof && prof.absence_start && prof.absence_end) {
      const start = new Date(prof.absence_start)
      const end = new Date(prof.absence_end)
      end.setHours(23, 59, 59)

      // חומרים שהחסיר
      const missedMats = loadedMaterials.filter((m: any) => {
        const matDate = new Date(m.lesson_date || m.created_at)
        return matDate >= start && matDate <= end
      })
      const remainingCount = missedMats.length - missedMats.filter((m: any) => completedIds.includes(m.id)).length

      if (remainingCount > 0) {
        const lastVisit = localStorage.getItem('last_dashboard_visit')
        const now = Date.now()
        if (lastVisit) {
          const hours = (now - Number(lastVisit)) / (1000 * 60 * 60)
          if (hours >= 48) {
            setShowReminderPopup(true)
          }
        }
        localStorage.setItem('last_dashboard_visit', now.toString())
      }
    } else {
      localStorage.setItem('last_dashboard_visit', Date.now().toString())
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // האזן לאירוע עדכון קורסים מה-Modal
    const handler = () => loadData()
    window.addEventListener('courses-updated', handler)
    return () => window.removeEventListener('courses-updated', handler)
  }, [loadData])

  const handleSaveAbsence = async () => {
    if (!absenceStart || !absenceEnd) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles')
        .update({ absence_start: absenceStart, absence_end: absenceEnd })
        .eq('id', user.id)
      if (!error) { setAbsenceSaved(true); setTimeout(() => setAbsenceSaved(false), 3000) }
    }
  }

  // סינון לפי תקופת היעדרות + קורס ספציפי
  const filteredMaterials = materials.filter(m => {
    const matchAbsence = !(absenceStart && absenceEnd) || (() => {
      const matDate = new Date(m.lesson_date || m.created_at)
      const start = new Date(absenceStart)
      const end = new Date(absenceEnd)
      end.setHours(23, 59, 59)
      return matDate >= start && matDate <= end
    })()

    const matchCourse = activeCourseFilter === 'all' || m.course_id === activeCourseFilter

    return matchAbsence && matchCourse
  })

  // כל החומרים שפורסמו בתקופת המילואים (לצורך מדדי השלמה וסטטיסטיקה)
  const allAbsenceMaterials = materials.filter(m => {
    if (!absenceStart || !absenceEnd) return true
    const matDate = new Date(m.lesson_date || m.created_at)
    const start = new Date(absenceStart)
    const end = new Date(absenceEnd)
    end.setHours(23, 59, 59)
    return matDate >= start && matDate <= end
  })

  const handleDownloadFile = (materialId: string, fileUrl: string) => {
    // Increment download count in the background
    supabase.rpc('increment_download', { material_id: materialId })
      .then(() => {
        setMaterials(prev => prev.map(m =>
          m.id === materialId ? { ...m, downloads_count: (m.downloads_count || 0) + 1 } : m
        ))
      })
      .catch(err => {
        console.error('Error handling download count:', err)
      })

    // Open immediately to prevent browser popup blockers from blocking the tab
    try {
      const newWindow = window.open(fileUrl, '_blank')
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback if popup blocker still caught it
        window.location.href = fileUrl
      }
    } catch (e) {
      window.location.href = fileUrl
    }
  }

  const toggleMaterialCompletion = async (materialId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isCompleted = completedMaterialIds.includes(materialId)
    
    // Optimistic UI update
    setCompletedMaterialIds(prev =>
      isCompleted ? prev.filter(id => id !== materialId) : [...prev, materialId]
    )

    try {
      if (isCompleted) {
        await supabase
          .from('material_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('material_id', materialId)
      } else {
        await supabase
          .from('material_completions')
          .insert({
            user_id: user.id,
            material_id: materialId
          })
      }
    } catch (err) {
      console.error('Error toggling material completion:', err)
      // Rollback on error
      setCompletedMaterialIds(prev =>
        isCompleted ? [...prev, materialId] : prev.filter(id => id !== materialId)
      )
    }
  }

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterialId || !feedbackText) return

    try {
      const { error } = await supabase.from('material_feedbacks').insert([
        { material_id: selectedMaterialId, user_name: studentName, comment: feedbackText, rating }
      ])
      if (error) throw error
      setFeedbackSuccess(true)
      setFeedbackText('')
      setSelectedMaterialId('')
      setTimeout(() => setFeedbackSuccess(false), 4000)
    } catch (err) {
      console.error('Error saving feedback:', err)
    }
  }

  const getCourseProgress = (courseId: string) => {
    const courseMats = allAbsenceMaterials.filter(m => m.course_id === courseId)
    const completed = courseMats.filter(m => completedMaterialIds.includes(m.id)).length
    return { completed, total: courseMats.length }
  }

  const yearLabel = userProfile?.year_of_study
    ? ['', 'שנה א׳', 'שנה ב׳', 'שנה ג׳', 'שנה ד׳'][userProfile.year_of_study] ?? ''
    : ''

  return (
    <div className="dashboard-page">

      {/* Banner ברוך הבא */}
      <section className="welcome-banner">
        <h1 className="welcome-title">שלום, {studentName}</h1>
        <p className="welcome-text">מרכז השלמת התוכן האישי שלך — מציג חומרים לפי הקורסים שבחרת.</p>
        {userProfile?.faculty && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', padding: '4px 14px', fontSize: '13px', fontWeight: 600 }}>
              🏫 {userProfile.faculty}
            </span>
            {userProfile.specialization && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', padding: '4px 14px', fontSize: '13px', fontWeight: 600 }}>
                🎯 {userProfile.specialization}
              </span>
            )}
            {yearLabel && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', padding: '4px 14px', fontSize: '13px', fontWeight: 600 }}>
                📅 {yearLabel}
              </span>
            )}
          </div>
        )}
      </section>

      {/* מדדי התקדמות והשלמה */}
      {selectedCourseIds.length > 0 && (
        <section className="card progress-section" style={{ marginBottom: '20px', padding: '20px' }}>
          <h2 className="section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 מדדי השלמת פערים אקדמיים
          </h2>
          <div className="progress-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center', backgroundColor: 'var(--color-background-alt)' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{allAbsenceMaterials.length}</div>
              <div className="stat-label" style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>חומרים שהחסרת במילואים</div>
            </div>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center', backgroundColor: 'var(--color-background-alt)' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>
                {allAbsenceMaterials.filter(m => completedMaterialIds.includes(m.id)).length}
              </div>
              <div className="stat-label" style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>חומרים שהשלמת</div>
            </div>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center', backgroundColor: 'var(--color-background-alt)' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>
                {allAbsenceMaterials.length - allAbsenceMaterials.filter(m => completedMaterialIds.includes(m.id)).length}
              </div>
              <div className="stat-label" style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>חומרים שנותר להשלים</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              <span>קצב השלמת החומרים:</span>
              <span>
                {allAbsenceMaterials.length > 0 
                  ? Math.round((allAbsenceMaterials.filter(m => completedMaterialIds.includes(m.id)).length / allAbsenceMaterials.length) * 100) 
                  : 0}% הושלמו
              </span>
            </div>
            <div className="progress-bar-fill-wrapper" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                  transition: 'width 0.4s ease-out',
                  width: `${allAbsenceMaterials.length > 0 
                    ? Math.round((allAbsenceMaterials.filter(m => completedMaterialIds.includes(m.id)).length / allAbsenceMaterials.length) * 100) 
                    : 0}%` 
                }} 
              />
            </div>
          </div>
        </section>
      )}

      {/* כפתור ערוך קורסים */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={onOpenCourseModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: '1.5px solid var(--color-secondary)',
            color: 'var(--color-secondary)', borderRadius: '10px',
            padding: '7px 16px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#eff6ff')}
          onMouseOut={e => (e.currentTarget.style.background = 'none')}
        >
          ✏️ ערוך קורסים שלי ({selectedCourseIds.length})
        </button>
      </div>

      {/* סינון תקופת היעדרות */}
      <section className="card" style={{ marginBottom: '20px' }}>
        <h2 className="section-title" style={{ marginBottom: '12px' }}>📅 הגדרת תקופת שירות המילואים</h2>
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
          {absenceSaved && (
            <span style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600 }}>✅ נשמר!</span>
          )}
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

      {/* פילטר קורסים */}
      {selectedCourseNames.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>סנן לפי קורס:</span>
          <button
            onClick={() => setActiveCourseFilter('all')}
            style={{
              padding: '5px 14px', borderRadius: '999px', border: '1.5px solid',
              borderColor: activeCourseFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)',
              background: activeCourseFilter === 'all' ? 'var(--color-primary)' : '#fff',
              color: activeCourseFilter === 'all' ? '#fff' : '#64748b',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >הכל</button>
          {selectedCourseNames.map(c => {
            const { completed, total } = getCourseProgress(c.id)
            return (
              <button
                key={c.id}
                onClick={() => setActiveCourseFilter(c.id)}
                style={{
                  padding: '5px 14px', borderRadius: '999px', border: '1.5px solid',
                  borderColor: activeCourseFilter === c.id ? 'var(--color-primary)' : 'var(--color-border)',
                  background: activeCourseFilter === c.id ? 'var(--color-primary)' : '#fff',
                  color: activeCourseFilter === c.id ? '#fff' : '#64748b',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                title={`${c.title} (${completed}/${total} הושלמו)`}
              >
                {c.title} ({completed}/{total})
              </button>
            )
          })}
        </div>
      )}

      <div className="dashboard-grid-layout">
        {/* רשימת חומרים */}
        <section className="courses-section card">
          <h2 className="section-title" style={{ marginBottom: '15px' }}>
            {absenceStart && absenceEnd
              ? `חומרים מהתקופה ${new Date(absenceStart).toLocaleDateString('he-IL')} – ${new Date(absenceEnd).toLocaleDateString('he-IL')}`
              : selectedCourseIds.length > 0
              ? `חומרי הלימוד בקורסים שלך (${filteredMaterials.length})`
              : 'כל חומרי הלימוד הזמינים'}
          </h2>

          {isLoading ? (
            <p>טוען חומרי עזר מהשרת...</p>
          ) : selectedCourseIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              <p style={{ fontSize: '15px', marginBottom: '12px' }}>עדיין לא בחרת קורסים</p>
              <Button variant="primary" onClick={onOpenCourseModal}>בחר קורסים עכשיו</Button>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              {absenceStart && absenceEnd
                ? 'לא הועלו חומרים בתקופה זו. נסה לשנות את הטווח.'
                : 'טרם הועלו חומרים לקורסים שבחרת.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMaterials.map(mat => {
                const isCompleted = completedMaterialIds.includes(mat.id)
                return (
                  <div
                    key={mat.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px', border: '1px solid var(--color-border)',
                      borderRadius: '10px', backgroundColor: isCompleted ? '#f0fdf4' : 'var(--color-background)', gap: '12px',
                      borderColor: isCompleted ? '#bbf7d0' : 'var(--color-border)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* תיבת סימון להשלמה */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleMaterialCompletion(mat.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                        title={isCompleted ? "סומן כהושלם (לחץ לביטול)" : "סמן כהושלם"}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ 
                        display: 'block', 
                        marginBottom: '4px',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: isCompleted ? '#16a34a' : 'var(--color-text)',
                      }}>
                        {mat.title}
                      </strong>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {mat.courses?.title && <span>📖 {mat.courses.title}</span>}
                        <span>📅 שיעור: {new Date(mat.lesson_date || mat.created_at).toLocaleDateString('he-IL')}</span>
                        <span>הורדות: {mat.downloads_count || 0}</span>
                      </div>
                    </div>
                    <Button variant={isCompleted ? 'secondary' : 'primary'} onClick={() => handleDownloadFile(mat.id, mat.file_url)}>
                      הורד 📥
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* טופס פידבק */}
        <section className="card">
          <h2 className="section-title" style={{ marginBottom: '15px' }}>השארת פידבק לתומך</h2>
          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group">
              <label htmlFor="select-mat">עבור איזה חומר?</label>
              <select
                id="select-mat"
                required
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
              >
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
              <textarea
                id="feedback-area"
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="כתוב כאן..."
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <Button type="submit" variant="primary">שלח פידבק 🚀</Button>
            {feedbackSuccess && (
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '14px', textAlign: 'center', border: '1px solid #86efac' }}>
                ✅ הפידבק נשלח בהצלחה לתומך!
              </div>
            )}
          </form>
        </section>
      </div>

      {/* פופאפ תזכורת אי-כניסה */}
      {showReminderPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          direction: 'rtl'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '440px',
            padding: '30px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '12px' }}>לא שכחת את הלימודים?</h3>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '24px' }}>
              שלום <strong>{studentName}</strong>, שמנו לב שלא ביקרת במערכת כבר יומיים.
              <br />
              ממתינים לך עוד <strong>{allAbsenceMaterials.length - allAbsenceMaterials.filter(m => completedMaterialIds.includes(m.id)).length}</strong> חומרי לימוד להשלמה על מנת לצמצם את הפער האקדמי שנוצר.
            </p>
            <Button variant="primary" fullWidth onClick={() => setShowReminderPopup(false)}>
              אני מתחיל ללמוד עכשיו! 📚
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboardPage
