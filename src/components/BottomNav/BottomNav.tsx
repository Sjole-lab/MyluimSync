import { Link, useLocation } from 'react-router-dom'
import './BottomNav.css'

interface BottomNavProps {
  userRole: 'miluimnik' | 'supporter' | null
}

function BottomNav({ userRole }: BottomNavProps) {
  const location = useLocation()

  const dashboardPath = userRole === 'supporter' ? '/supporter-dashboard' : '/student-dashboard'

  return (
    <nav className="bottom-nav" role="navigation" aria-label="ניווט מהיר למובייל">
      <Link to={dashboardPath} className={`bottom-nav-item ${location.pathname === dashboardPath ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>דאשבורד</span>
      </Link>

      {userRole === 'miluimnik' && (
        <Link to="/student-dashboard" className={`bottom-nav-item ${location.pathname === '/student-dashboard' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>סיכומים</span>
        </Link>
      )}

      {userRole === 'supporter' && (
        <Link to="/upload-center" className={`bottom-nav-item ${location.pathname === '/upload-center' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <span>העלאה</span>
        </Link>
      )}
    </nav>
  )
}

export default BottomNav