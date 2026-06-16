import { Link } from 'react-router-dom'
import { supabase } from '../../supabase'
import './Navbar.css'

interface NavbarProps {
  userRole: 'miluimnik' | 'supporter' | null
}

function Navbar({ userRole }: NavbarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="global-navbar" role="navigation" aria-label="ניווט מערכת ראשי">
      <div className="navbar-container">
        <div className="navbar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>MyluimSync</span>
        </div>
        
        <div className="navbar-links">
          {/* ניתוב מותנה פרופיל - המילואימניק רואה דאשבורד אישי, התומך רואה דאשבורד אימפקט */}
          {userRole === 'miluimnik' && (
            <>
              <Link to="/student-dashboard" className="nav-link">מרכז השלמות</Link>
              <Link to="/course/empty" className="nav-link">מסך עזר חסר</Link>
            </>
          )}

          {userRole === 'supporter' && (
            <>
              <Link to="/supporter-dashboard" className="nav-link">לוח בקרה ואימפקט</Link>
              <Link to="/upload-center" className="nav-link">מרכז העלאת חומרים</Link>
            </>
          )}

          <Link to="/profile" className="nav-link" style={{ fontWeight: 600 }}>פרופיל אישי 👤</Link>

          <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif' }}>
            התנתק מהמערכת 🚪
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar