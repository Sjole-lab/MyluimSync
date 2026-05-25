import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';
import { supabase } from '../supabase';

function SupporterDashboardPage() {
  const [stats, setStats] = useState({ uploads: 0, totalDownloads: 0 });
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    async function loadSupporterData() {
      // בחיים האמיתיים נסנן לפי ה-ID של התומך המחובר. כרגע נמשוך נתונים כלליים להדגמה
      const { data: materials } = await supabase.from('materials').select('id, downloads_count');
      const { data: fbs } = await supabase.from('material_feedbacks').select('*, materials(title)');
      
      if (materials) {
        const totalDown = materials.reduce((sum: number, item: any) => sum + (item.downloads_count || 0), 0);
        setStats({ uploads: materials.length, totalDownloads: totalDown });
      }
      if (fbs) setFeedbacks(fbs);
    }
    
    // התיקון: קוראים לפונקציה בשם הנכון שלה!
    loadSupporterData(); 
  }, []);

  return (
    <div style={{padding: '40px 20px', maxWidth: '1200px', margin: '0 auto'}}>
      <div className="card" style={{background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', color: 'white', marginBottom: '30px'}}>
        <h2>שלום, מתנדב אקדמי!</h2>
        <p>תודה על התרומה שלך לסטודנטים בחזית. הנה ההשפעה שלך עד כה:</p>
      </div>

      <div style={{display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap'}}>
        <div className="card" style={{flex: 1, minWidth: '250px', textAlign: 'center'}}>
          <h3 style={{fontSize: '30px', color: 'var(--color-primary)'}}>{stats.uploads}</h3>
          <p>חומרים שהעלית</p>
        </div>
        <div className="card" style={{flex: 1, minWidth: '250px', textAlign: 'center'}}>
          <h3 style={{fontSize: '30px', color: 'var(--color-accent)'}}>{stats.totalDownloads}</h3>
          <p>פעמים שהורידו את הסיכומים שלך</p>
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
        <h3>פידבקים אחרונים מהשטח</h3>
        <Link to="/upload-center"><Button variant="primary">העלה חומר חדש</Button></Link>
      </div>

      <div className="courses-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
        {feedbacks.length === 0 ? <p>טרם התקבלו פידבקים.</p> : feedbacks.map(fb => (
          <div key={fb.id} className="card">
            <strong style={{color: 'var(--color-primary)', display: 'block', marginBottom: '8px'}}>{fb.materials?.title}</strong>
            <div style={{margin: '10px 0', fontStyle: 'italic', lineHeight: '1.5'}}>"{fb.comment}"</div>
            <div style={{fontSize: '12px', color: 'gray', marginTop: '10px'}}>- נכתב ע"י {fb.user_name} ({fb.rating} כוכבים)</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SupporterDashboardPage;