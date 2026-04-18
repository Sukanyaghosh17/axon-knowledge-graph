import { PenTool, Calendar, BookMarked, Brain, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Features.css';

const featureData = [
  {
    id: 1,
    title: "Write Notes",
    desc: "Write any notes you want, precisely how you think. Capture ideas in a distraction-free environment.",
    icon: <PenTool size={22} />,
    color: "#F97316",
  },
  {
    id: 2,
    title: "Plan your day",
    desc: "Make sure your day is well planned. Stay on top of schedules with intuitive daily planners.",
    icon: <Calendar size={22} />,
    color: "#F97316",
  },
  {
    id: 3,
    title: "Save Courses",
    desc: "Easily collect and manage resources, links, and documents for all your active semesters.",
    icon: <BookMarked size={22} />,
    color: "#F97316",
  },
  {
    id: 4,
    title: "Learn facts",
    desc: "Keep your mind sharp with structured notes. Reinforce your knowledge naturally.",
    icon: <Brain size={22} />,
    color: "#F97316",
  },
  {
    id: 5,
    title: "Notes from Class",
    desc: "Never forget what your mentor says. Attach files, images, and links seamlessly inline.",
    icon: <BookOpen size={22} />,
    color: "#F97316",
  }
];

const Features = () => {
  return (
    <section id="discover" className="features-section">
      <div className="features-container">
        {featureData.map((feat, index) => {
          const isEven = index % 2 === 1;
          const isLast = index === featureData.length - 1;

          return (
            <div key={feat.id} className={`feature-row ${isEven ? 'row-reverse' : ''}`}>
              {!isLast && (
                <div className={`connector ${isEven ? 'connector-left' : 'connector-right'}`}></div>
              )}

              <div className="feature-text-wrapper">
                <div className="feature-badge">
                  {feat.icon}
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
                <Link to={feat.id === 2 ? "/planner" : feat.id === 3 ? "/courses" : "/app"} className="feature-btn">Try Now</Link>
              </div>

              <div className="feature-card-wrapper">
                <div className="feature-card-glass">
                  <div className="glass-header">
                    <div className="window-dots">
                      <span className="dot" style={{ backgroundColor: '#ff5f56' }}></span>
                      <span className="dot" style={{ backgroundColor: '#ffbd2e' }}></span>
                      <span className="dot" style={{ backgroundColor: '#27c93f' }}></span>
                    </div>
                  </div>
                  <div className="glass-body">
                    <div className="skeleton-title" style={{ width: '50%' }}></div>
                    <div className="skeleton-line" style={{ width: '100%', marginTop: '20px' }}></div>
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                    <div className="skeleton-box" style={{ marginTop: '20px' }}></div>
                  </div>
                </div>
                {/* Decorative floating element for layered depth */}
                <div className="feature-card-float"></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Features;
