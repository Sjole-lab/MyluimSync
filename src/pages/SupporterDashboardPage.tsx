import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';
import { supabase } from '../supabase';

function SupporterDashboardPage() {
  const [stats, setStats] = useState({ uploads: 0, totalDownloads: 0 });
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    async function loadSupporterData() {
      const { data: mats } = await supabase
        .from('materials')
        .select('id, title, downloads_count, created_at, courses(title)')
        .order('created_at', { ascending: false });

      const { data: fbs } = await supabase
        .from('material_feedbacks')
        .select('*, materials(title, created_at)')
        .order('created_at', { ascending: false });

      if (mats) {
        const totalDown = mats.reduce((sum: number, item: any) => sum + (item.downloads_count || 0), 0);
        setStats({ uploads: mats.length, totalDownloads: totalDown });
        setMaterials(mats);
      }
      if (fbs) setFeedbacks(fbs);
    }

    loadSupporterData();
  }, []);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* כרטיס ברוך הבא */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', color: 'white', marginBottom: '30px' }}>
        <h2>שלום, מתנדב אקדמי!</h2>
        <p>תודה על התרומה שלך לסטודנטים בחזית. הנה ההשפעה שלך עד כה:</p>
      </div>

      {/* כרטיסי סטטיסטיקה */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '30px', color: 'var(--color-primary)' }}>{stats.uploads}</h3>
          <p>חומרים שהועלו</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '30px', color: 'var(--color-accent)' }}>{stats.totalDownloads}</h3>
          <p>סה"כ הורדות</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '30px', color: 'var(--color-secondary)' }}>{feedbacks.length}</h3>
          <p>פידבקים התקבלו</p>
        </div>
      </div>

      {/* טבלת חומרים שהועלו */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3>חומרים שהועלו</h3>
        <Link to="/upload-center"><Button variant="primary">+ העלה חומר חדש</Button></Link>
      </div>

      {materials.length === 0 ? (
        <div className="card" style={{ marginBottom: '30px', color: '#64748b', textAlign: 'center' }}>
          <p>טרם הועלו חומרים. לחץ על "העלה חומר חדש" כדי להתחיל.</p>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '30px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>
                <th style={{ padding: '10px 12px' }}>שם הסיכום</th>
                <th style={{ padding: '10px 12px' }}>קורס</th>
                <th style={{ padding: '10px 12px' }}>📅 תאריך העלאה</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>הורדות</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(mat => (
                <tr key={mat.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{mat.title}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{mat.courses?.title || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                    {new Date(mat.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-accent)', fontWeight: 600 }}>
                    {mat.downloads_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* פידבקים */}
      <h3 style={{ marginBottom: '16px' }}>פידבקים אחרונים מהשטח</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {feedbacks.length === 0 ? (
          <p style={{ color: '#64748b' }}>טרם התקבלו פידבקים.</p>
        ) : feedbacks.map(fb => (
          <div key={fb.id} className="card">
            <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
              {fb.materials?.title}
            </strong>
            {fb.materials?.created_at && (
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                📅 סיכום מתאריך: {new Date(fb.materials.created_at).toLocaleDateString('he-IL')}
              </span>
            )}
            <div style={{ margin: '8px 0', fontStyle: 'italic', lineHeight: '1.6', fontSize: '14px' }}>"{fb.comment}"</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>— {fb.user_name}</span>
              <span>{'⭐'.repeat(fb.rating || 0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SupporterDashboardPage;
