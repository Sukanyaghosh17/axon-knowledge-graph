import { Link } from 'react-router-dom';

import Contact from '../components/Contact/Contact';
import './LandingPage.css';

const ContactPage = () => {
  return (
    <div className="landing-container">
      {/* Navbar reused */}
      <nav className="landing-nav">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="landing-brand">
            <img src="/Logo.png" alt="Axon" className="landing-brand-logo" />
            Axon
          </div>
        </Link>
        <div className="landing-links">
          <Link to="/">Home</Link>
          <Link to="/features">Feature</Link>
          <a href="/#discover">Discover</a>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="landing-auth">
          <Link to="/app" className="landing-btn btn-signup">Sign Up</Link>
          <Link to="/app" className="landing-btn btn-login">Log in</Link>
        </div>
      </nav>

      <Contact />
    </div>
  );
};

export default ContactPage;
