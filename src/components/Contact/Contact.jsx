import React from 'react';
import { Hash, Send, Code, MessageSquare, Video, Users } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-wrapper">
      <section className="contact-container fade-in">
        <div className="contact-left">
          <span className="contact-label">/ contact /</span>
          <h2 className="contact-heading">We’re here to help you — anytime.</h2>
          
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
            
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Name" className="contact-input" />
              <input type="email" placeholder="E-Mail" className="contact-input" />
              <textarea placeholder="Message" className="contact-textarea"></textarea>
              <button type="submit" className="contact-submit">Submit</button>
            </form>
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
