import { Link } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import Features from '../components/Features/Features';
import './LandingPage.css';

const FeaturesPage = () => {
  return (
    <div className="landing-container">
      {/* Navbar reused */}
      <nav className="landing-nav">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="landing-brand">
            Axon <PenTool size={20} className="brand-icon" />
          </div>
        </Link>
        <div className="landing-links">
          <Link to="/">Home</Link>
          <Link to="/features">Feature</Link>
          <Link to="/">Discover</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="landing-auth">
          <Link to="/app" className="landing-btn btn-signup">Sign Up</Link>
          <Link to="/app" className="landing-btn btn-login">Log in</Link>
        </div>
      </nav>

      <Features />
    </div>
  );
};

export default FeaturesPage;
