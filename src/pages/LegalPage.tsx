import { useParams, Link } from 'react-router-dom'

function LegalPage() {
  const { type } = useParams()

  const getLegalContent = () => {
    if (type === 'privacy') {
      return {
        title: 'מדיניות פרטיות ואבטחת מידע - MyluimSync',
        body: 'מערכת MyluimSync מחויבת להגנה מקסימלית על פרטיות הסטודנטים המשרתים במילואים והתומכים האקדמיים כאחד. כל המידע המועלה, לרבות שמות מלאים, כתובות דואר אלקטרוני וקבצים לימודיים, נשמרים ומאובטחים במסדי הנתונים בענן של Supabase תחת הצפנה מתקדמת במצב מנוחה ובמעבר. המידע משמש אך ורק לצרכים פדגוגיים אקדמיים של המוסד ואינו מועבר, נמכר או נחשף לשום גורם מסחרי או צד שלישי אחר.'
      }
    }
    return {
      title: 'תנאי שימוש ותקנון המערכת - MyluimSync',
      body: 'השימוש בפלטפורמת MyluimSync מיועד לסטודנטים פעילים בשירות מילואים ולמתנדבי מערך התמיכה בלבד. כל התכנים, הסיכומים, המטלות והפתרונות המועלים למערכת הם באחריותם הבלעדית של המשתמשים המעלים. חל איסור מוחלט על העלאת חומרים המפרים זכויות יוצרים מסחריות, ספרי לימוד מוגנים או תכנים מסווגים. המערכת שומרת לעצמה את הזכות להסיר חומרים שאינם עומדים בסטנדרט האקדמי של המוסד.'
    }
  }

  const content = getLegalContent()

  return (
    <div style={{ padding: '40px var(--spacing-md)', maxWidth: '800px', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
      <div className="card" style={{ padding: '30px' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '24px', marginBottom: '20px', borderBottom: '2px solid var(--color-border)', paddingBottom: '10px' }}>
          {content.title}
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text)', lineHeight: '1.8', marginBottom: '30px' }}>
          {content.body}
        </p>

        <div style={{ backgroundColor: 'var(--color-background)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>📬 מרכז שירות לקוחות וצור קשר רשמי</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            נתקלת בבעיה טכנית? יש לך שאלה לגבי זכויות יוצרים או חומרים חסרים? צוות התמיכה האקדמי זמין עבורך:
            <br />
            <strong>📧 דואר אלקטרוני לתמיכה:</strong> support@myluimsync.ac.il
            <br />
            <strong>⏰ שעות פעילות חדר מצב אקדמי:</strong> ימים א׳-ה׳ בין השעות 08:00 ל-20:00 (זמינות מוגברת לחיילי מילואים פעילים).
          </p>
        </div>

        <Link to="/" style={{ color: 'var(--color-secondary)', fontWeight: 'bold', textDecoration: 'none' }}>→ חזרה למסך הבית</Link>
      </div>
    </div>
  )
}

export default LegalPage