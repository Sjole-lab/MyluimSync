import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import BottomNav from './components/BottomNav/BottomNav'
import CourseSelectionModal from './components/CourseSelectionModal/CourseSelectionModal'
import AuthPage from './pages/AuthPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import SupporterDashboardPage from './pages/SupporterDashboardPage'
import UploadCenterPage from './pages/UploadCenterPage'
import CourseEmptyStatePage from './pages/CourseEmptyStatePage'
import LegalPage from './pages/LegalPage'

interface UserProfile {
  role: 'miluimnik' | 'supporter' | null
  faculty: string | null
  specialization: string | null
  year_of_study: number | null
}

function App() {
  const [session, setSession] = useState<any>(undefined) // undefined = טרם נבדק
  const [profile, setProfile] = useState<UserProfile>({
    role: null, faculty: null, specialization: null, year_of_study: null
  })
  const [profileLoaded, setProfileLoaded] = useState(false)   // סיים לטעון
  const [profileMissing, setProfileMissing] = useState(false) // פרופיל לא קיים
  const [showCourseModal, setShowCourseModal] = useState(false)
  const fetchingRef = useRef<string | null>(null) // מונע קריאה כפולה

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)

      if (!newSession) {
        setProfile({ role: null, faculty: null, specialization: null, year_of_study: null })
        setProfileLoaded(false)
        setProfileMissing(false)
        setShowCourseModal(false)
        fetchingRef.current = null
        return
      }

      const userId = newSession.user.id
      if (fetchingRef.current === userId) return
      fetchingRef.current = userId

      // טעינת פרופיל + בדיקת קורסים שנבחרו
      supabase
        .from('profiles')
        .select('role, faculty, specialization, year_of_study')
        .eq('id', userId)
        .maybeSingle()                           // לא זורק שגיאה אם אין שורה
        .then(async ({ data, error }) => {
          if (error) { console.error('Error fetching profile:', error); return }
          if (!data) {
            // פרופיל לא קיים — כנראה נוצר לפני שה-trigger/policy הוגדרו
            console.warn('Profile not found for user:', userId)
            setProfile({ role: null, faculty: null, specialization: null, year_of_study: null })
            setProfileMissing(true)
            setProfileLoaded(true)
            fetchingRef.current = null
            return
          }

          const userProfile: UserProfile = {
            role: data?.role ?? null,
            faculty: data?.faculty ?? null,
            specialization: data?.specialization ?? null,
            year_of_study: data?.year_of_study ?? null,
          }
          setProfile(userProfile)
          setProfileLoaded(true)
          setProfileMissing(false)

          // בדוק אם חייל מילואים שלא בחר קורסים עדיין
          if (userProfile.role === 'miluimnik') {
            const { data: existingCourses } = await supabase
              .from('user_courses')
              .select('id')
              .eq('user_id', userId)
              .limit(1)

            if (!existingCourses || existingCourses.length === 0) {
              setShowCourseModal(true)
            }
          }
        })
    })

    return () => subscription.unsubscribe()
  }, [])

  // טרם הגיעה תשובה מסופרביס
  if (session === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', direction: 'rtl', fontFamily: 'sans-serif' }}>
        <h3>MyluimSync טוען...</h3>
      </div>
    )
  }

  // פרופיל לא נמצא ב-DB — הצג מסך ידידותי במקום להיתקע
  if (profileMissing && session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', direction: 'rtl', fontFamily: 'sans-serif', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{ color: '#1e3a8a' }}>פרופיל לא נמצא</h2>
        <p style={{ color: '#64748b', maxWidth: '360px', lineHeight: '1.6' }}>
          החשבון שלך קיים אך הפרופיל לא נשמר כראוי. זה יקרה כי הרשמת התבצעה לפני שהמסד הוגדרעו.
          <br /><br />
          <strong>בקש צור קשר עם מנהל המערכת או צא והירשם מחדש.</strong>
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ padding: '10px 24px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
        >
          יציאה מהמערכת
        </button>
      </div>
    )
  }

  // יש session אבל פרופיל עדיין נטען — ממתינים לפני ניווט
  const roleLoading = session && !profileLoaded

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {session && <Navbar userRole={profile.role} />}

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
                profile.role === 'supporter' ? <Navigate to="/supporter-dashboard" replace /> :
                <Navigate to="/student-dashboard" replace />
              }
            />

            <Route
              path="/student-dashboard"
              element={session && profile.role === 'miluimnik' ? <StudentDashboardPage onOpenCourseModal={() => setShowCourseModal(true)} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/course/empty"
              element={session && profile.role === 'miluimnik' ? <CourseEmptyStatePage /> : <Navigate to="/" replace />}
            />

            <Route
              path="/supporter-dashboard"
              element={session && profile.role === 'supporter' ? <SupporterDashboardPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/upload-center"
              element={session && profile.role === 'supporter' ? <UploadCenterPage /> : <Navigate to="/" replace />}
            />

            <Route path="/legal/:type" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      {/* פופאפ בחירת קורסים — מוצג מעל הכל */}
      {showCourseModal && session && (
        <CourseSelectionModal
          userId={session.user.id}
          faculty={profile.faculty}
          specialization={profile.specialization}
          yearOfStudy={profile.year_of_study}
          onClose={() => setShowCourseModal(false)}
          onSaved={() => {
            setShowCourseModal(false)
            // רענון הדף כדי לטעון חומרים מסוננים
            window.dispatchEvent(new CustomEvent('courses-updated'))
          }}
        />
      )}

      {session && <BottomNav userRole={profile.role} />}
      {session && <Footer />}
    </div>
  )
}

export default App
