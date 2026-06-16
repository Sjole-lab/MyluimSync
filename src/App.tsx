import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import BottomNav from './components/BottomNav/BottomNav'
import AuthPage from './pages/AuthPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import SupporterDashboardPage from './pages/SupporterDashboardPage'
import UploadCenterPage from './pages/UploadCenterPage'
import CourseEmptyStatePage from './pages/CourseEmptyStatePage'
import LegalPage from './pages/LegalPage'

function App() {
  const [session, setSession] = useState<any>(undefined) // undefined = טרם נבדק
  const [role, setRole] = useState<'miluimnik' | 'supporter' | null>(null)
  const fetchingRef = useRef<string | null>(null) // מונע קריאה כפולה ל-fetchUserRole

  useEffect(() => {
    // onAuthStateChange מפעיל INITIAL_SESSION מיד עם הטעינה — לא צריך getSession בנפרד
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)

      if (!newSession) {
        setRole(null)
        fetchingRef.current = null
        return
      }

      const userId = newSession.user.id
      if (fetchingRef.current === userId) return // כבר מושך role לאותו יוזר
      fetchingRef.current = userId

      supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error('Error fetching role:', error)
          setRole(data?.role ?? null)
        })
    })

    return () => subscription.unsubscribe()
  }, [])

  // טרם הגיעה תשובה מ-Supabase
  if (session === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', direction: 'rtl', fontFamily: 'sans-serif' }}>
        <h3>MyluimSync טוען...</h3>
      </div>
    )
  }

  // יש session אבל role עדיין נטען — ממתינים לפני ניווט
  const roleLoading = session && role === null

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {session && <Navbar userRole={role} />}

      <main className="main-content" style={{ flex: 1, paddingTop: session ? '70px' : '0' }}>
        {roleLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', direction: 'rtl', fontFamily: 'sans-serif' }}>
            <h3>טוען פרופיל...</h3>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                !session ? <AuthPage /> :
                role === 'supporter' ? <Navigate to="/supporter-dashboard" replace /> :
                <Navigate to="/student-dashboard" replace />
              }
            />

            <Route
              path="/student-dashboard"
              element={session && role === 'miluimnik' ? <StudentDashboardPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/course/empty"
              element={session && role === 'miluimnik' ? <CourseEmptyStatePage /> : <Navigate to="/" replace />}
            />

            <Route
              path="/supporter-dashboard"
              element={session && role === 'supporter' ? <SupporterDashboardPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/upload-center"
              element={session && role === 'supporter' ? <UploadCenterPage /> : <Navigate to="/" replace />}
            />

            <Route path="/legal/:type" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      {session && <BottomNav userRole={role} />}
      {session && <Footer />}
    </div>
  )
}

export default App
