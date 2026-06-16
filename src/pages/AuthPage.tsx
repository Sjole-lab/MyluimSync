import { useState } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './AuthPage.css'

function translateSupabaseError(msg: string): string {
  if (msg.includes('User already registered') || msg.includes('already registered'))
    return 'כתובת האימייל הזו כבר רשומה במערכת. לחץ על "כבר רשום? היכנס כאן" כדי להתחבר.'
  if (msg.includes('Password should be at least'))
    return 'הסיסמה חייבת להכיל לפחות 6 תווים.'
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
    return 'האימייל או הסיסמה שגויים. בדוק ונסה שוב.'
  if (msg.includes('Email not confirmed'))
    return 'יש לאשר את כתובת האימייל לפני ההתחברות. בדוק את תיבת הדואר שלך.'
  if (msg.includes('signup_disabled'))
    return 'ההרשמה סגורה כרגע. פנה למנהל המערכת.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'יותר מדי ניסיונות. המתן מספר דקות ונסה שוב.'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'בעיית תקשורת עם השרת. בדוק את החיבור לאינטרנט.'
  return 'אירעה שגיאה. נסה שוב.'
}

function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<'miluimnik' | 'supporter' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMsg({ text: '', type: '' })

    try {
      if (isRegistering) {
        if (!selectedRole) {
          setMsg({ text: 'אנא בחר תפקיד — חייל מילואים או סטודנט תומך.', type: 'error' })
          return
        }
        if (!fullName.trim()) {
          setMsg({ text: 'אנא הכנס את שמך המלא.', type: 'error' })
          return
        }
        if (password.length < 6) {
          setMsg({ text: 'הסיסמה חייבת להכיל לפחות 6 תווים.', type: 'error' })
          return
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })

        if (authError) {
          setMsg({ text: translateSupabaseError(authError.message), type: 'error' })
          return
        }

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: authData.user.id, full_name: fullName.trim(), role: selectedRole }
          ])
          if (profileError) {
            setMsg({ text: 'החשבון נוצר אך שמירת הפרופיל נכשלה. פנה לתמיכה.', type: 'error' })
            return
          }
          setMsg({ text: 'ברוך הבא! החשבון נוצר בהצלחה — מתחבר...', type: 'success' })
        } else {
          setMsg({ text: 'נשלח אימייל אישור. בדוק את תיבת הדואר שלך ולחץ על הקישור.', type: 'success' })
        }

      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setMsg({ text: translateSupabaseError(error.message), type: 'error' })
        }
      }
    } catch (err: any) {
      setMsg({ text: translateSupabaseError(err?.message || ''), type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setIsRegistering(!isRegistering)
    setMsg({ text: '', type: '' })
    setSelectedRole(null)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <header className="auth-header">
          <h1 className="auth-title">MyluimSync</h1>
          <p className="auth-subtitle">מערכת סנכרון והשלמת חומרי לימוד מבוססת ענן</p>
        </header>

        <form className="auth-card" onSubmit={handleAuthSubmit}>
          <h2 className="auth-card-title">{isRegistering ? 'יצירת חשבון חדש' : 'התחברות למערכת'}</h2>

          {msg.text && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: msg.type === 'error' ? '#fde8e8' : '#dcfce7',
              color: msg.type === 'error' ? '#be123c' : '#15803d',
              fontSize: '14px',
              lineHeight: '1.5',
              border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#86efac'}`
            }}>
              {msg.text}
            </div>
          )}

          {isRegistering && (
            <>
              <div className="input-group">
                <label htmlFor="fullname">שם מלא</label>
                <input
                  id="fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="לדוגמה: יוסי כהן"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                  בחר את תפקידך
                </label>
                <div className="role-selection">
                  <button
                    type="button"
                    className={`role-option ${selectedRole === 'miluimnik' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('miluimnik')}
                  >
                    <span className="role-title">🪖 חייל מילואים</span>
                    <span className="role-description">צריך לצמצם פערים אקדמיים</span>
                  </button>
                  <button
                    type="button"
                    className={`role-option ${selectedRole === 'supporter' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('supporter')}
                  >
                    <span className="role-title">📚 סטודנט תומך</span>
                    <span className="role-description">מתנדב להעלאת סיכומים</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@example.com"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">סיסמה {isRegistering && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(לפחות 6 תווים)</span>}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            {isRegistering ? 'צור חשבון' : 'התחבר'}
          </Button>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: '#64748b' }}>
            {isRegistering ? 'כבר יש לך חשבון?' : 'אין לך חשבון עדיין?'}
            {' '}
            <button
              type="button"
              onClick={switchMode}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', fontWeight: 600 }}
            >
              {isRegistering ? 'היכנס כאן' : 'הירשם בחינם'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
