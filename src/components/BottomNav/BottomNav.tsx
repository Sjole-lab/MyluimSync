import { Link, useLocation } from 'react-router-dom'
import './BottomNav.css'

function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="ניווט מהיר למובייל">
      <Link to="/student-dashboard" className={`bottom-nav-item ${location.pathname === '/student-dashboard' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>דאשבורד</span>
      </Link>
      <Link to="/upload-center" className={`bottom-nav-item ${location.pathname === '/upload-center' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span>העלאה</span>
      </Link>
    </nav>
  )
}

export default BottomNav