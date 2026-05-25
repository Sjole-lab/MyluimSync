import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
  const [session, setSession] = useState<any>(null)
  const [role, setRole] = useState<'miluimnik' | 'supporter' | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // 1. בדיקת סשן נוכחי בעת טעינת האתר
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserRole(session.user.id)
      else setLoading(false)
    })

    // 2. האזנה לשינויים במצב ההתחברות (התחברות/התנתקות)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUserRole(session.user.id)
      else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setRole(data?.role || null)
    } catch (err) {
      console.error('Error fetching role:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', direction: 'rtl', fontFamily: 'sans-serif' }}>
        <h3>MyluimSync בודק חיבור מאובטח לענן...</h3>
      </div>
    )
  }

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {session && <Navbar userRole={role} />}
      
      <main className="main-content" style={{ flex: 1, paddingTop: session ? '70px' : '0' }}>
        <Routes>
          {/* דף כניסה - אם מחובר, מנתב אוטומטית לפי תפקיד */}
          <Route 
            path="/" 
            element={session ? (role === 'supporter' ? <Navigate to="/supporter-dashboard" /> : <Navigate to="/student-dashboard" />) : <AuthPage />} 
          />
          
          {/* נתיבים ייעודיים לחייל מילואים בלבד */}
          <Route 
            path="/student-dashboard" 
            element={session && role === 'miluimnik' ? <StudentDashboardPage /> : <Navigate to="/" />} 
          />
          <Route 
            path="/course/empty" 
            element={session && role === 'miluimnik' ? <CourseEmptyStatePage /> : <Navigate to="/" />} 
          />
          
          {/* נתיבים ייעודיים לתומך אקדמי בלבד */}
          <Route 
            path="/supporter-dashboard" 
            element={session && role === 'supporter' ? <SupporterDashboardPage /> : <Navigate to="/" />} 
          />
          <Route 
            path="/upload-center" 
            element={session && role === 'supporter' ? <UploadCenterPage /> : <Navigate to="/" />} 
          />
          
          {/* נתיבים חוקיים ונגישים לכולם */}
          <Route path="/legal/:type" element={<LegalPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {session && <BottomNav userRole={role} />}
      {session && <Footer />}
    </div>
  )
}

export default App