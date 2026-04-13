import { Sun, Moon, Search, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchNotes } from '../../api';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchNotes(val);
        setResults(res.data.data);
        setShowDropdown(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  };

  const handleSelect = (id) => {
    navigate(`/?note=${id}`);
    setQuery(''); setResults([]); setShowDropdown(false);
  };

  const clearSearch = () => { setQuery(''); setResults([]); setShowDropdown(false); };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div 
        className="navbar-brand" 
        onClick={() => navigate('/')} 
        style={{ cursor: 'pointer' }}
      >
        <div className="navbar-logo">
          <img src="/Logo.png" alt="Axon Logo" className="navbar-logo-img" />
        </div>
        <span className="navbar-title">Axon</span>
        <span className="navbar-tagline">where ideas flow</span>
      </div>

      {/* Search */}
      <div className="navbar-search-wrapper">
        <div className="navbar-search">
          <Search size={15} className="search-icon" />
          <input
            id="global-search"
            type="text"
            placeholder="Search notes…"
            value={query}
            onChange={handleSearch}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onFocus={() => results.length && setShowDropdown(true)}
            autoComplete="off"
          />
          {query && (
            <button className="btn-icon" onClick={clearSearch} style={{ padding: '2px' }}>
              <X size={13} />
            </button>
          )}
        </div>
        {showDropdown && (
          <div className="search-dropdown fade-in">
            {searching && <div className="search-loading"><div className="spinner" /></div>}
            {!searching && results.length === 0 && (
              <div className="search-empty">No results for "{query}"</div>
            )}
            {!searching && results.map((note) => (
              <button key={note._id} className="search-result-item" onMouseDown={() => handleSelect(note._id)}>
                <span className="search-result-title">{note.title}</span>
                <div className="search-result-tags">
                  {note.tags?.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        <button
          id="theme-toggle-btn"
          className="btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
