import { Link } from 'react-router-dom';

import Features from '../components/Features/Features';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Navbar */}
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

      {/* Main Content */}
      <main className="landing-main">
        <div className="landing-text-content">
          <h1 className="landing-tagline">
            <span className="text-orange">Organise</span> your ideas,<br />
            elevate your thinking.
          </h1>
          <p className="landing-description">
            Built for students, Axon helps you capture, organize, and revisit ideas with ease. No more lost notes — everything stays connected and evolving.
          </p>
          <Link to="/app" className="landing-btn btn-cta">Try for Free</Link>
        </div>
        
        <div className="landing-image-container">
          <img src="/Home Page.png" alt="Axon Illustration" className="landing-image" />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
