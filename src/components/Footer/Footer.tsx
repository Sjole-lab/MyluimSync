import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <strong>MyluimSync © {new Date().getFullYear()}</strong>
          <p>פותח באהבה עבור מערך המילואים</p>
        </div>
        <div className="footer-links">
          <Link to="/legal/terms">תנאי שימוש</Link>
          <Link to="/legal/privacy">מדיניות פרטיות</Link>
          <a href="mailto:support@myluimsync.co.il">צור קשר</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;