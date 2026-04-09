import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar/Navbar';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import './styles/global.css';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <div className="app-body">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/graph" element={<GraphPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
