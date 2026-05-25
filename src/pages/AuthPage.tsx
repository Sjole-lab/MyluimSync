import { useState } from 'react'
import Button from '../components/Button/Button'
import { supabase } from '../supabase'
import './AuthPage.css'

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
        if (!selectedRole || !fullName) {
          throw new Error('אנא מלא את שמך המלא ובחר תפקיד מתאים במערכת')
        }
        // 1. יצירת יוזר ב-Supabase Authentication
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) throw authError

        // 2. יצירת רשומת פרופיל מקושרת בטבלת profiles
        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: authData.user.id, full_name: fullName, role: selectedRole }
          ])
          if (profileError) throw profileError
          setMsg({ text: 'החשבון נוצר בהצלחה! מערכת האבטחה מעבירה אותך...', type: 'success' })
        }
      } else {
        // התחברות משתמש קיים
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error('פרטי הגישה שגויים או שהמשתמש אינו קיים במערכת')
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'אירעה שגיאה בתקשורת עם השרת', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <header className="auth-header">
          <h1 className="auth-title">MyluimSync</h1>
          <p className="auth-subtitle">מערכת סנכרון והשלמת חומרי לימוד מבוססת ענן</p>
        </header>

        <form className="auth-card" onSubmit={handleAuthSubmit}>
          <h2 className="auth-card-title">{isRegistering ? 'רישום פרופיל חדש' : 'התחברות מאובטחת'}</h2>
          
          {msg.text && (
            <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '15px', backgroundColor: msg.type === 'error' ? '#fde8e8' : '#e1f5fe', color: msg.type === 'error' ? '#e11d48' : '#0284c7', fontSize: '14px', textAlign: 'center' }}>
              {msg.text}
            </div>
          )}

          {isRegistering && (
            <>
              <div className="input-group">
                <label htmlFor="fullname">שם מלא (עבור המרצים והתומכים)</label>
                <input id="fullname" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="לדוגמה: רס״ן עומרי גלעד" />
              </div>
              <div className="role-selection">
                <button type="button" className={`role-option ${selectedRole === 'miluimnik' ? 'selected' : ''}`} onClick={() => setSelectedRole('miluimnik')}>
                  <span className="role-title">חייל מילואים</span>
                  <span className="role-description">סטודנט הזקוק לחומר אקדמי</span>
                </button>
                <button type="button" className={`role-option ${selectedRole === 'supporter' ? 'selected' : ''}`} onClick={() => setSelectedRole('supporter')}>
                  <span className="role-title">סטודנט תומך</span>
                  <span className="role-description">מתנדב להעלאת סיכומים</span>
                </button>
              </div>
            </>
          )}

          <div className="input-group">
            <label htmlFor="email">כתובת דואר אלקטרוני</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@domain.com" />
          </div>

          <div className="input-group">
            <label htmlFor="password">סיסמה מאובטחת</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            {isRegistering ? 'בצע רישום וסנכרון' : 'התחבר למערכת'}
          </Button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setMsg({text:'', type:''}); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
              {isRegistering ? 'כבר רשום במערכת? היכנס כאן' : 'משתמש בדיקה / מרצה בוחן? לחץ כאן להרשמה מהירה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthPage