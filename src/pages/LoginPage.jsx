import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import './SignUpPage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="signup-root">
      <div className="signup-container">
        <div className="signup-form-side" style={{ padding: '0', maxWidth: '400px', margin: '0 auto' }}>

          <div className="signup-header">
            <h1>Log In</h1>
            <p>Welcome back to Axon</p>
          </div>

          <form className="signup-form" onSubmit={(e) => { e.preventDefault(); navigate('/app'); }}>
            <div className="form-group">
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" strokeWidth={1.5} />
                <input type="email" placeholder="Email" />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" strokeWidth={1.5} />
                <input type="password" placeholder="Password" />
              </div>
            </div>

            <div className="form-submit-wrapper">
               <button type="submit" className="submit-btn" title="Log In">
                 Log In
               </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#718096' }}>
              Don't have an account? <Link to="/signup" style={{ color: '#4a5568', fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
