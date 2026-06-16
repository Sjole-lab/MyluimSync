import { Link } from 'react-router-dom'
import Button from '../components/Button/Button'
import './CourseEmptyStatePage.css'

function CourseEmptyStatePage() {
  return (
    <div className="empty-page" role="region" aria-label="עמוד מידע ריק">
      <div className="empty-container card">
        <div className="empty-icon" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        
        <h1 className="empty-title">אין עדיין חומרי לימוד זמינים</h1>
        <p className="empty-description">
          התומכים והמרצים שלך עודכנו על הגדרת תקופת המילואים שלך והם שוקדים כעת על ריכוז והעלאת החומרים האקדמיים החסרים לקורס זה.
        </p>

        <div className="empty-suggestions">
          <h3>פעולות מומלצות לביצוע בינתיים:</h3>
          <ul className="suggestions-list">
            <li>פנה ישירות לרכז המילואים האקדמי של המחלקה לקבלת הארכות.</li>
            <li>בדוק קורסים חסרים אחרים בלוח הבקרה שלך שבהם החומר כבר מוכן.</li>
          </ul>
        </div>

        <div className="empty-actions">
          <Link to="/student-dashboard">
            <Button variant="primary">חזרה ללוח הבקרה</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CourseEmptyStatePage