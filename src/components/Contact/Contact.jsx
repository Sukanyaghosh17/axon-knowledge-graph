import React, { useState } from 'react';
import { Hash, Send, Code, MessageSquare, Video, Users } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    // Simulate async send (replace with real API call if backend is wired)
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-wrapper">
      <section className="contact-container fade-in">
        <div className="contact-left">
          <span className="contact-label">/ contact /</span>
          <h2 className="contact-heading">We're here to help you — anytime.</h2>
          
          <div className="contact-info">
            <div className="info-block">
              <h3>Call Center</h3>
              <p>+1 (800) 123 4567</p>
              <p>+44 (0) 20 7123 4567</p>
            </div>
            
            <div className="info-block">
              <h3>Email</h3>
              <a href="mailto:hello@axon.app" className="email-link">hello@axon.app</a>
            </div>
          </div>
          
          <div className="contact-social">
            <h3>Social Network</h3>
            <div className="social-icons">
              <button className="social-icon" aria-label="Twitter"><Hash size={18} /></button>
              <button className="social-icon" aria-label="Telegram"><Send size={18} /></button>
              <button className="social-icon" aria-label="Github"><Code size={18} /></button>
              <button className="social-icon" aria-label="Discord"><MessageSquare size={18} /></button>
              <button className="social-icon" aria-label="YouTube"><Video size={18} /></button>
              <button className="social-icon" aria-label="LinkedIn"><Users size={18} /></button>
            </div>
          </div>
        </div>

        <div className="contact-right">
          <div className="contact-form-card">
            <span className="contact-pin" role="img" aria-label="pin">📌</span>
            <h3>Get in Touch</h3>
            <p>Tell us your goals and how we can help you organize your ideas.</p>

            {submitted ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '12px',
                color: '#16a34a'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>&#10003;</div>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Message sent!</p>
                <p style={{ fontSize: '0.82rem', opacity: 0.8 }}>We’ll get back to you soon.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{ marginTop: '16px', background: 'transparent', border: '1px solid #86efac', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', color: '#16a34a', fontSize: '0.8rem' }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {error && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginBottom: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                    {error}
                  </p>
                )}
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="contact-input"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="E-Mail"
                  className="contact-input"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <textarea
                  name="message"
                  placeholder="Message"
                  className="contact-textarea"
                  value={form.message}
                  onChange={handleChange}
                  required
                />
                <button
                  type="submit"
                  className="contact-submit"
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Sending…' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="footer-bottom">
        <p>&copy; Axon 2026. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy policy</a>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
