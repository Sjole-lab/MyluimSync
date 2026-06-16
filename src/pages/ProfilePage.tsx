import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Button from '../components/Button/Button'
import './ProfilePage.css'

const ONO_FACULTIES: Record<string, string[]> = {
  'מנהל עסקים': [
    'מערכות מידע',
    'חשבונאות',
    'שיווק ופרסום',
    'מימון ושוק ההון',
    'ניהול משאבי אנוש',
    'ניהול כללי',
  ],
  'משפטים': [
    'עריכת דין',
    'לימודי משפט (לא משפטנים)',
  ],
  'מדעי הרוח והחברה': [
    'פסיכולוגיה',
    'תקשורת שיווקית',
    'חינוך וחברה',
    'מדעי המחשב',
    'מוסיקה רב-תחומית',
  ],
  'מקצועות הבריאות': [
    'סיעוד',
    'ריפוי בעיסוק',
    'הפרעות בתקשורת',
    'ספורטתרפיה',
  ],
}

const YEAR_OPTIONS = [
  { value: 1, label: 'שנה א׳' },
  { value: 2, label: 'שנה ב׳' },
  { value: 3, label: 'שנה ג׳' },
  { value: 4, label: 'שנה ד׳' },
]

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'miluimnik' | 'supporter' | null>(null)
  const [faculty, setFaculty] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState<number | ''>('')
  const [remindersEnabled, setRemindersEnabled] = useState(true)

  // שדות סיסמה
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error)
      }

      if (prof) {
        setFullName(prof.full_name || '')
        setRole(prof.role || null)
        setFaculty(prof.faculty || '')
        setSpecialization(prof.specialization || '')
        setYearOfStudy(prof.year_of_study || '')
        setRemindersEnabled(prof.reminders_enabled !== false) // ברירת מחדל אמת
      }
      setIsLoading(false)
    }

    loadProfile()
  }, [])

  const handleFacultyChange = (val: string) => {
    setFaculty(val)
    setSpecialization('')
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!fullName.trim()) {
      setMsg({ text: 'אנא הזן שם מלא.', type: 'error' })
      return
    }

    setIsSaving(true)
    setMsg(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName.trim(),
          faculty: faculty || null,
          specialization: specialization || null,
          year_of_study: yearOfStudy ? Number(yearOfStudy) : null,
          reminders_enabled: remindersEnabled,
        })

      if (error) throw error

      setMsg({ text: 'הפרופיל עודכן בהצלחה! ✅', type: 'success' })
      setIsEditing(false)
      
      // שליחת אירוע לעדכון ה-Navbar והדאשבורדים
      window.dispatchEvent(new CustomEvent('profile-updated'))
    } catch (err: any) {
      setMsg({ text: `שגיאה בעדכון הפרופיל: ${err.message}`, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (newPassword.length < 6) {
      setPwMsg({ text: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים.', type: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'הסיסמאות אינן תואמות.', type: 'error' })
      return
    }

    setIsPasswordUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPwMsg({ text: 'הסיסמה עודכנה בהצלחה! 🔐', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwMsg({ text: `שגיאה בעדכון הסיסמה: ${err.message}`, type: 'error' })
    } finally {
      setIsPasswordUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="profile-page-loading">
        <h3>טוען פרופיל...</h3>
      </div>
    )
  }

  const roleLabel = role === 'miluimnik' ? '🪖 חייל מילואים' : '📚 סטודנט תומך אקדמי'
  const specOptions = faculty ? ONO_FACULTIES[faculty] || [] : []

  return (
    <div className="profile-page">
      <div className="profile-container">
        
        {/* כרטיס פרופיל */}
        <section className="card profile-card">
          <header className="profile-header-section">
            <div className="avatar-circle">
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="profile-title">{fullName || 'משתמש מערכת'}</h1>
              <span className="profile-role-badge">{roleLabel}</span>
            </div>
          </header>

          {msg && (
            <div className={`status-banner ${msg.type}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="profile-form">
            
            <div className="input-group">
              <label htmlFor="p-email">אימייל (לא ניתן לשינוי)</label>
              <input id="p-email" type="email" value={email} disabled className="disabled-input" />
            </div>

            {isEditing ? (
              <>
                <div className="input-group">
                  <label htmlFor="p-fullname">שם מלא</label>
                  <input
                    id="p-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="p-faculty">פקולטה</label>
                  <select
                    id="p-faculty"
                    value={faculty}
                    onChange={e => handleFacultyChange(e.target.value)}
                  >
                    <option value="">-- בחר פקולטה --</option>
                    {Object.keys(ONO_FACULTIES).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="p-specialization">התמחות</label>
                  <select
                    id="p-specialization"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    disabled={!faculty}
                  >
                    <option value="">
                      {faculty ? '-- בחר התמחות --' : 'בחר פקולטה תחילה'}
                    </option>
                    {specOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="p-year">שנת לימוד</label>
                  <select
                    id="p-year"
                    value={yearOfStudy}
                    onChange={e => setYearOfStudy(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- בחר שנה --</option>
                    {YEAR_OPTIONS.map(y => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="profile-details-display">
                <div className="detail-row">
                  <strong>שם מלא:</strong>
                  <span>{fullName || '—'}</span>
                </div>
                <div className="detail-row">
                  <strong>פקולטה:</strong>
                  <span>{faculty || '—'}</span>
                </div>
                <div className="detail-row">
                  <strong>התמחות:</strong>
                  <span>{specialization || '—'}</span>
                </div>
                <div className="detail-row">
                  <strong>שנת לימוד:</strong>
                  <span>
                    {yearOfStudy
                      ? YEAR_OPTIONS.find(y => y.value === yearOfStudy)?.label
                      : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* מתג תזכורות */}
            {role === 'miluimnik' && (
              <div className="reminder-toggle-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={e => setRemindersEnabled(e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="slider-text">
                    🔔 קבל תזכורות פופאפ על קורסים לאחר יומיים של אי-כניסה
                  </span>
                </label>
              </div>
            )}

            <div className="profile-actions-row">
              {isEditing ? (
                <>
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    שמור שינויים
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    ביטול
                  </Button>
                </>
              ) : (
                <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
                  ערוך פרופיל ✏️
                </Button>
              )}
            </div>
          </form>
        </section>

        {/* כרטיס שינוי סיסמה */}
        <section className="card password-card">
          <h2 className="section-title">🔐 שינוי סיסמת כניסה</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            הזן את סיסמתך החדשה בת ששה תווים ומעלה כדי לעדכן אותה.
          </p>

          {pwMsg && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: pwMsg.type === 'error' ? '#fde8e8' : '#dcfce7',
              color: pwMsg.type === 'error' ? '#be123c' : '#15803d',
              fontSize: '14px',
              border: `1px solid ${pwMsg.type === 'error' ? '#fca5a5' : '#86efac'}`
            }}>
              {pwMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group">
              <label htmlFor="p-new-pw">סיסמה חדשה</label>
              <input
                id="p-new-pw"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
              />
            </div>

            <div className="input-group">
              <label htmlFor="p-confirm-pw">אמת סיסמה חדשה</label>
              <input
                id="p-confirm-pw"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="הזן שוב את הסיסמה"
              />
            </div>

            <Button type="submit" variant="accent" isLoading={isPasswordUpdating}>
              עדכן סיסמה
            </Button>
          </form>
        </section>

      </div>
    </div>
  )
}
