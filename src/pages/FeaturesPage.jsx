import { Link } from 'react-router-dom';

import Features from '../components/Features/Features';
import './LandingPage.css';

const FeaturesPage = () => {
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
          <Link to="/contact">Contact</Link>
        </div>
        <div className="landing-auth">
          <Link to="/signup" className="landing-btn btn-signup">Sign Up</Link>
          <Link to="/login" className="landing-btn btn-login">Log in</Link>
        </div>
      </nav>

      <Features />
    </div>
  );
};

export default FeaturesPage;
