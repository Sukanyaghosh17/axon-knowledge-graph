import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar/Navbar';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import NotesPage from './pages/NotesPage';
import GraphPage from './pages/GraphPage';
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
          <Route element={<MainLayout />}>
            <Route path="/app" element={<NotesPage />} />
            <Route path="/graph" element={<GraphPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
