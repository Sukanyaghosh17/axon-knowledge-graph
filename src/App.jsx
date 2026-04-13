import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar/Navbar';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import NotesPage from './pages/NotesPage';
import AppDashboard from './pages/AppDashboard';
import DailyPlannerPage from './pages/DailyPlannerPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import './styles/global.css';

const MainLayout = () => (
  <div className="app-layout">
    <Navbar />
    <div className="app-body">
      <Outlet />
    </div>
  </div>
);

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Dashboard — full-screen, own layout */}
          <Route path="/app" element={<AppDashboard />} />
          {/* Editor — full-screen three-panel layout */}
          <Route path="/app/edit" element={<NotesPage />} />
          <Route path="/planner" element={<DailyPlannerPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
