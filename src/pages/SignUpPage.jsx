import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import './SignUpPage.css';

const SignUpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="signup-root">
      <div className="signup-container">
        <div className="signup-form-side" style={{ padding: '0', maxWidth: '400px', margin: '0 auto' }}>

          <div className="signup-header">
            <h1>Sign Up</h1>
            <p>Join and start taking notes</p>
          </div>

          <form className="signup-form" onSubmit={(e) => { e.preventDefault(); navigate('/app'); }}>
            <div className="form-group">
              <div className="input-wrapper">
                <User size={20} className="input-icon" strokeWidth={1.5} />
                <input type="text" placeholder="Name" />
              </div>
            </div>

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
               <button type="submit" className="submit-btn" title="Sign Up">
                 Sign Up
               </button>
            </div>

            <div className="signup-footer">
              Already have an account? <Link to="/login">Log In</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SignUpPage;
