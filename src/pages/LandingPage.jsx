import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  { id: 'write-notes',  icon: '✍️', title: 'Write Notes',       desc: 'Rich text editor for all your thoughts',      iconBg: '#f5eed0' },
  { id: 'plan-day',     icon: '📅', title: 'Plan Your Day',     desc: 'Built-in daily planner to stay on track',    iconBg: '#e0ebcc' },
  { id: 'save-courses', icon: '📚', title: 'Save Courses',      desc: 'Bookmark and organise your learning',        iconBg: '#f5d9b0' },
];

const STEPS = [
  { num: '01', icon: '🖊️', title: 'Write it down', desc: 'Capture notes and ideas using our beautiful rich-text editor.' },
  { num: '02', icon: '🗂️', title: 'Organise everything', desc: 'Tag notes, build folders, and plan your week with the built-in daily planner.' },
  { num: '03', icon: '🚀', title: 'Learn & achieve', desc: 'Review saved courses, revisit your ideas, and retain knowledge that actually sticks.' },
];

const LandingPage = () => {
  return (
    <div className="landing-container">

      {/* ── Navbar ── */}
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
          <Link to="/login"  className="landing-btn btn-login">Log in</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="landing-main">
        <div className="landing-text-content">
          <div className="hero-badge">✦ Built for students</div>
          <h1 className="landing-tagline">
            <span className="text-orange">Organise</span> your ideas,<br />
            elevate your thinking.
          </h1>
          <p className="landing-description">
            Axon is your all-in-one study companion — capture notes, plan your day, save courses, and learn smarter. Everything in one place, always connected.
          </p>
          <Link to="/signup" className="landing-btn btn-cta">Start for Free →</Link>
        </div>

        <div className="landing-image-container">
          <img src="/Home Page.png" alt="Axon Illustration" className="landing-image" />
        </div>
      </main>

      {/* ── How Axon helps you succeed ── */}
      <section className="lf-section">
        <span className="lf-blob lf-blob--tl" aria-hidden="true" />
        <span className="lf-blob lf-blob--br" aria-hidden="true" />
        <h2 className="lf-heading">How Axon helps you succeed</h2>
        <div className="lf-cards">
          {FEATURES.map((f) => (
            <div className="lf-card" key={f.id}>
              <span className="lf-icon" style={{ background: f.iconBg }}>{f.icon}</span>
              <div className="lf-card-text">
                <strong className="lf-card-title">{f.title}</strong>
                <span className="lf-card-desc">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works — 3 steps ── */}
      <section className="hiw-section">
        <p className="hiw-eyebrow">Simple by design</p>
        <h2 className="hiw-heading">Get started in 3 easy steps</h2>
        <div className="hiw-steps">
          {STEPS.map((s, i) => (
            <div className="hiw-step" key={i}>
              <div className="hiw-step-top">
                <span className="hiw-num">{s.num}</span>
                <span className="hiw-step-icon">{s.icon}</span>
              </div>
              <h3 className="hiw-title">{s.title}</h3>
              <p className="hiw-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA banner ── */}
      <section className="cta-banner">
        <span className="cta-blob cta-blob--l" aria-hidden="true" />
        <span className="cta-blob cta-blob--r" aria-hidden="true" />
        <h2 className="cta-heading">Your best study life starts here.</h2>
        <p className="cta-sub">Join thousands of students who use Axon to study smarter, plan better, and stress less.</p>
        <Link to="/signup" className="cta-btn">Create your free account →</Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span className="footer-brand">
          <img src="/Logo.png" alt="Axon" className="footer-logo" /> Axon
        </span>
        <div className="footer-links">
          <Link to="/features">Features</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} Axon. Made with 🌿</span>
      </footer>

    </div>
  );
};

export default LandingPage;
