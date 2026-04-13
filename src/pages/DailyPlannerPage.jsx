import React, { useState, useEffect } from 'react';
import { 
  Sun, Coffee, Heart, CheckCircle, Circle, ChevronDown, ChevronUp,
  Star, Book, PenTool, LayoutDashboard, Calendar as CalendarIcon,
  Smile, Wind, Check, User, Link as LinkIcon, Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './DailyPlannerPage.css';

const DailyPlannerPage = () => {
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleEvent, setNewScheduleEvent] = useState('');

  const [scheduleItems, setScheduleItems] = useState([
    { id: 1, time: '07:30 AM', event: 'Wake Up' },
    { id: 2, time: '08:00 AM', event: 'Revise Notes' },
    { id: 3, time: '09:30 AM', event: 'Attend Class' },
    { id: 4, time: '12:30 PM', event: 'Lunch Break' },
    { id: 5, time: '01:30 PM', event: 'Lab' },
    { id: 6, time: '04:00 PM', event: 'Self Study' },
    { id: 7, time: '06:00 PM', event: 'Break' },
    { id: 8, time: '07:00 PM', event: 'Study' },
    { id: 9, time: '09:30 PM', event: 'Reading' },
  ]);

  const addScheduleItem = () => {
    if (newScheduleTime.trim() && newScheduleEvent.trim()) {
      setScheduleItems(prev => [...prev, { id: Date.now(), time: newScheduleTime.trim(), event: newScheduleEvent.trim() }]);
      setNewScheduleTime('');
      setNewScheduleEvent('');
      setIsEditingSchedule(false);
    }
  };

  const removeScheduleItem = (id) => {
    setScheduleItems(prev => prev.filter(item => item.id !== id));
  };
  const [todos, setTodos] = useState([
    { id: 1, text: 'Send report to client', completed: true },
    { id: 2, text: 'Buy groceries', completed: false },
    { id: 3, text: 'Plan weekend trip', completed: false },
    { id: 4, text: 'Read for 30 minutes', completed: true },
  ]);

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  const addTodo = () => {
    if (newTodoText.trim()) {
      setTodos(prev => [...prev, { id: Date.now(), text: newTodoText.trim(), completed: false }]);
      setNewTodoText('');
      setIsAddingTodo(false);
    }
  };

  const [todaysFocus, setTodaysFocus] = useState('Finish the project proposal');
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [focusInput, setFocusInput] = useState(todaysFocus);

  const saveFocus = () => {
    setTodaysFocus(focusInput);
    setIsEditingFocus(false);
  };

  const [dailyQuote, setDailyQuote] = useState('Small steps every day lead to big results. Focus on the present.');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteInput, setQuoteInput] = useState(dailyQuote);

  const saveQuote = () => {
    setDailyQuote(quoteInput);
    setIsEditingQuote(false);
  };

  const cancelQuote = () => {
    setQuoteInput(dailyQuote);
    setIsEditingQuote(false);
  };

  const [favPages, setFavPages] = useState([
    'Morning Routine',
    'Reading List',
    'Project Ideas',
    'Weekly Reflection'
  ]);
  const [isEditingFavs, setIsEditingFavs] = useState(false);
  const [newFavPage, setNewFavPage] = useState('');

  const addFavPage = () => {
    if (newFavPage.trim()) {
      setFavPages(prev => [...prev, newFavPage.trim()]);
      setNewFavPage('');
    }
  };

  const removeFavPage = (index) => {
    setFavPages(prev => prev.filter((_, i) => i !== index));
  };

  const [habits, setHabits] = useState([
    { name: 'Drink Water', days: [true,  true,  true,  true,  true,  false, false] },
    { name: 'Exercise',    days: [false, false, true,  true,  false, false, false] },
    { name: 'Meditate',    days: [true,  true,  false, false, true,  false, false] },
  ]);

  const toggleHabit = (habitIdx, dayIdx) => {
    setHabits(prev => prev.map((h, hi) =>
      hi !== habitIdx ? h :
      { ...h, days: h.days.map((d, di) => di === dayIdx ? !d : d) }
    ));
  };

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitText, setNewHabitText] = useState('');

  const addHabit = () => {
    if (newHabitText.trim()) {
      setHabits(prev => [...prev, { name: newHabitText.trim(), days: [false, false, false, false, false, false, false] }]);
      setNewHabitText('');
      setIsAddingHabit(false);
    }
  };

  const handleHabitKeyDown = (e) => {
    if (e.key === 'Enter') addHabit();
    if (e.key === 'Escape') {
      setIsAddingHabit(false);
      setNewHabitText('');
    }
  };

  // ── Notes & Reflection ─────────────────────────────────
  const [dailyNote, setDailyNote] = useState('');
  const [dailyReflection, setDailyReflection] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveNote = () => {
    setNoteSaving(true);
    setTimeout(() => {
      setNoteSaving(false);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }, 500); 
  };

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // ── Live clock ─────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // ── Modal State for Specific Habits ────────────────────
  const [activeHabitModal, setActiveHabitModal] = useState(null);

  const [habitProgress, setHabitProgress] = useState({
    Hydrate:     { current: 0,  goal: 3000 },  // ml
    Mindfulness: { current: 0,  goal: 30   },  // minutes
    Workout:     { current: 0,  goal: 60   },  // minutes
    Reading:     { current: 0,  goal: 15   },  // pages
  });

  const [modalInputs, setModalInputs] = useState({
    hydrateAmount: '',
    mindfulnessDuration: '',
    workoutType: '',
    workoutDuration: '',
    readingBook: '',
    readingPages: '',
  });

  const updateProgress = (habit, value) => {
    setHabitProgress(prev => ({
      ...prev,
      [habit]: { ...prev[habit], current: Math.min(Number(value), prev[habit].goal) },
    }));
  };

  const getPercent = (habit) => {
    const { current, goal } = habitProgress[habit];
    return goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
  };

  const renderHabitModalContent = () => {
    switch (activeHabitModal) {
      case 'Hydrate':
        return (
          <div className="habit-form">
            <label>Water goal<span className="habit-form-hint">3,000 ml</span></label>
            <label>
              Amount drank (ml)
              <input
                type="number" placeholder="e.g. 500"
                value={modalInputs.hydrateAmount}
                onChange={e => {
                  setModalInputs(p => ({ ...p, hydrateAmount: e.target.value }));
                  updateProgress('Hydrate', e.target.value);
                }}
              />
            </label>
            <div className="habit-modal-progress">
              <div className="habit-modal-bar" style={{ width: `${getPercent('Hydrate')}%`, background: '#f5a45a' }} />
            </div>
            <span className="habit-modal-pct">{getPercent('Hydrate')}% of daily goal</span>
          </div>
        );
      case 'Mindfulness':
        return (
          <div className="habit-form">
            <label>
              Minutes meditated today
              <input
                type="number" placeholder="e.g. 15"
                value={modalInputs.mindfulnessDuration}
                onChange={e => {
                  setModalInputs(p => ({ ...p, mindfulnessDuration: e.target.value }));
                  updateProgress('Mindfulness', e.target.value);
                }}
              />
            </label>
            <div className="habit-modal-progress">
              <div className="habit-modal-bar" style={{ width: `${getPercent('Mindfulness')}%`, background: '#7ab87a' }} />
            </div>
            <span className="habit-modal-pct">{getPercent('Mindfulness')}% of 30 min goal</span>
            <button className="notes-save-btn" style={{ marginTop: '8px', padding: '10px' }}>Start Session</button>
          </div>
        );
      case 'Workout':
        return (
          <div className="habit-form">
            <label>Type<input type="text" placeholder="e.g. Strength Training" value={modalInputs.workoutType} onChange={e => setModalInputs(p => ({ ...p, workoutType: e.target.value }))} /></label>
            <label>
              Duration (minutes)
              <input
                type="number" placeholder="e.g. 45"
                value={modalInputs.workoutDuration}
                onChange={e => {
                  setModalInputs(p => ({ ...p, workoutDuration: e.target.value }));
                  updateProgress('Workout', e.target.value);
                }}
              />
            </label>
            <div className="habit-modal-progress">
              <div className="habit-modal-bar" style={{ width: `${getPercent('Workout')}%`, background: '#6aa8d4' }} />
            </div>
            <span className="habit-modal-pct">{getPercent('Workout')}% of 1 hr goal</span>
          </div>
        );
      case 'Reading':
        return (
          <div className="habit-form">
            <label>Book name<input type="text" placeholder="e.g. Atomic Habits" value={modalInputs.readingBook} onChange={e => setModalInputs(p => ({ ...p, readingBook: e.target.value }))} /></label>
            <label>
              Pages read today
              <input
                type="number" placeholder="e.g. 8"
                value={modalInputs.readingPages}
                onChange={e => {
                  setModalInputs(p => ({ ...p, readingPages: e.target.value }));
                  updateProgress('Reading', e.target.value);
                }}
              />
            </label>
            <div className="habit-modal-progress">
              <div className="habit-modal-bar" style={{ width: `${getPercent('Reading')}%`, background: '#d4a84b' }} />
            </div>
            <span className="habit-modal-pct">{getPercent('Reading')}% of 15 pages goal</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="planner-page">
      <main className="planner-container">
        {/* Banner */}
        <div className="planner-banner">
          <img src="/planner-banner.png" alt="Aesthetic planner desk" className="banner-img" />
        </div>

        {/* Header Section */}
        <div className="planner-header">
          <div className="planner-title-row">
            <h1 className="planner-title">Daily Planner</h1>
            <Coffee className="planner-title-icon" size={28} />
          </div>
          

        </div>

        {/* 3-Column Grid Layout */}
        <div className="planner-grid">
          
          {/* LEFT COLUMN */}
          <div className="planner-col left-col">
            <div className="aesthetic-card">
              <img src="/planner-card.png" alt="Morning aesthetic" className="aesthetic-img" />
            </div>

            <div className="planner-section block-shadow">
              <div className="section-header-flex" style={{ marginBottom: '12px' }}>
                <h3 className="section-title" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  <Star size={16} /> Favourite Pages
                </h3>
                <button
                  className="quote-edit-btn"
                  onClick={() => setIsEditingFavs(!isEditingFavs)}
                  title="Edit Favourite Pages"
                >
                  <Pencil size={13} />
                </button>
              </div>

              {isEditingFavs && (
                <div className="schedule-add-form" style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="New page link..."
                    value={newFavPage}
                    onChange={(e) => setNewFavPage(e.target.value)}
                    className="schedule-input"
                    onKeyDown={(e) => e.key === 'Enter' && addFavPage()}
                  />
                  <button className="schedule-add-btn" onClick={addFavPage}>Add</button>
                </div>
              )}

              <ul className="fav-list">
                {favPages.map((page, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <LinkIcon size={14} /> {page}
                    </span>
                    {isEditingFavs && (
                      <button 
                        className="schedule-delete-btn"
                        onClick={() => removeFavPage(idx)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="planner-section block-shadow">
              <div className="section-header-flex" style={{ marginBottom: '12px' }}>
                <h3 className="section-title" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  <Wind size={16} /> Daily Quote
                </h3>
                <button
                  className="quote-edit-btn"
                  onClick={() => { setQuoteInput(dailyQuote); setIsEditingQuote(!isEditingQuote); }}
                  title="Edit quote"
                >
                  <Pencil size={13} />
                </button>
              </div>
              {isEditingQuote ? (
                <div className="quote-edit-form">
                  <textarea
                    className="quote-edit-input"
                    value={quoteInput}
                    onChange={(e) => setQuoteInput(e.target.value)}
                    autoFocus
                    rows={3}
                  />
                  <div className="quote-edit-actions">
                    <button className="tracker-save-btn" onClick={saveQuote}>Save</button>
                    <button className="tracker-cancel-btn" onClick={cancelQuote}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="quote-text">"{dailyQuote}"</p>
              )}
            </div>

            <div className="planner-section block-shadow tracker-section">
              <h3 className="section-title">Habit Tracker</h3>
              <div className="tracker-table">

                {/* Header row */}
                <div className="tracker-row tracker-header">
                  <div className="tracker-name" />
                  <div className="tracker-days">
                    {daysOfWeek.map((day, i) => (
                      <span key={i} className="tracker-day-label">{day}</span>
                    ))}
                  </div>
                </div>

                {/* Habit rows */}
                {habits.map((habit, hi) => (
                  <div className="tracker-row" key={hi}>
                    <div className="tracker-name">• {habit.name}</div>
                    <div className="tracker-days">
                      {habit.days.map((checked, di) => (
                        <button
                          key={di}
                          className={`tracker-dot ${checked ? 'checked' : ''}`}
                          onClick={() => toggleHabit(hi, di)}
                          aria-label={`${habit.name} ${daysOfWeek[di]} ${checked ? 'done' : 'not done'}`}
                        >
                          {checked && <Check size={11} strokeWidth={3.5} />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Habit Row */}
                {isAddingHabit ? (
                  <div className="tracker-add-row">
                    <input 
                      type="text" 
                      className="tracker-add-input"
                      placeholder="Habit name..."
                      value={newHabitText}
                      onChange={(e) => setNewHabitText(e.target.value)}
                      onKeyDown={handleHabitKeyDown}
                      autoFocus
                    />
                    <div className="tracker-add-actions">
                      <button className="tracker-save-btn" onClick={addHabit}>Save</button>
                      <button className="tracker-cancel-btn" onClick={() => setIsAddingHabit(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="tracker-add-btn" onClick={() => setIsAddingHabit(true)}>
                    + Add Habit
                  </button>
                )}

              </div>
            </div>
          </div>

          {/* CENTER COLUMN */}
          <div className="planner-col center-col">
            <div className="welcome-banner block-shadow">
              <h2>{greeting}!</h2>
              <p>Here's your plan for today:</p>
              <div className="date-weather">
                <span className="date"><CalendarIcon size={14} /> {formattedDate}</span>
                <span className="weather"><Sun size={14} /> {formattedTime}</span>
              </div>
            </div>

            <div className="planner-section block-shadow">
              <h3 className="section-title"><Heart size={16} /> Daily Habits</h3>
              <div className="habits-grid">
                <div className="habit-card" onClick={() => setActiveHabitModal('Hydrate')} style={{ cursor: 'pointer' }}>
                  <span className="habit-icon bg-orange">💧</span>
                  <span>Hydrate</span>
                  <span className="habit-goal">3 liters daily</span>
                  <div className="habit-progress-bar">
                    <div className="habit-progress-fill" style={{ width: `${getPercent('Hydrate')}%`, background: '#f5a45a' }} />
                  </div>
                  <span className="habit-pct">{getPercent('Hydrate')}%</span>
                </div>
                <div className="habit-card" onClick={() => setActiveHabitModal('Mindfulness')} style={{ cursor: 'pointer' }}>
                  <span className="habit-icon bg-green">🧘‍♀️</span>
                  <span>Mindfulness</span>
                  <span className="habit-goal">30 min daily</span>
                  <div className="habit-progress-bar">
                    <div className="habit-progress-fill" style={{ width: `${getPercent('Mindfulness')}%`, background: '#7ab87a' }} />
                  </div>
                  <span className="habit-pct">{getPercent('Mindfulness')}%</span>
                </div>
                <div className="habit-card" onClick={() => setActiveHabitModal('Workout')} style={{ cursor: 'pointer' }}>
                  <span className="habit-icon bg-blue">🏃‍♂️</span>
                  <span>Workout</span>
                  <span className="habit-goal">1 hour daily</span>
                  <div className="habit-progress-bar">
                    <div className="habit-progress-fill" style={{ width: `${getPercent('Workout')}%`, background: '#6aa8d4' }} />
                  </div>
                  <span className="habit-pct">{getPercent('Workout')}%</span>
                </div>
                <div className="habit-card" onClick={() => setActiveHabitModal('Reading')} style={{ cursor: 'pointer' }}>
                  <span className="habit-icon bg-yellow">📚</span>
                  <span>Reading</span>
                  <span className="habit-goal">15 pages daily</span>
                  <div className="habit-progress-bar">
                    <div className="habit-progress-fill" style={{ width: `${getPercent('Reading')}%`, background: '#d4a84b' }} />
                  </div>
                  <span className="habit-pct">{getPercent('Reading')}%</span>
                </div>
              </div>
            </div>

            <div className="planner-section block-shadow">
              <h3 className="section-title bg-accent">To-Do List</h3>
              <ul className="todo-list">
                {todos.map(todo => (
                  <li key={todo.id} className="todo-item" onClick={() => toggleTodo(todo.id)}>
                    {todo.completed ? (
                      <CheckCircle size={18} className="todo-check completed" />
                    ) : (
                      <Circle size={18} className="todo-check" />
                    )}
                    <span className={todo.completed ? 'todo-text completed' : 'todo-text'}>
                      {todo.text}
                    </span>
                  </li>
                ))}
              </ul>
              
              {isAddingTodo ? (
                <div className="todo-add-form" style={{ marginTop: '12px' }}>
                  <input 
                    type="text" 
                    className="todo-input" 
                    placeholder="New task..." 
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="schedule-add-btn" onClick={addTodo} style={{ flex: 1 }}>Add</button>
                    <button className="tracker-cancel-btn" onClick={() => setIsAddingTodo(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="add-todo-btn" onClick={() => setIsAddingTodo(true)}>+ Add Task</button>
              )}
            </div>

            <div className="planner-section block-shadow focus-section">
              <h3 className="section-title text-center text-rose">🎯 Today's Focus</h3>
              {isEditingFocus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    className="focus-input-field"
                    value={focusInput}
                    onChange={(e) => setFocusInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveFocus()}
                    autoFocus
                  />
                  <button className="notes-save-btn" onClick={saveFocus}>Save Focus</button>
                </div>
              ) : (
                <button className="focus-btn" onClick={() => setIsEditingFocus(true)}>{todaysFocus}</button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="planner-col right-col">

            <div className="planner-section block-shadow schedule-section">
              <div className="schedule-header-wrapper">
                <div 
                  className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setScheduleExpanded(!scheduleExpanded)}
                >
                  <h3 className="section-title" style={{ margin: 0, padding: 0 }}>Today's Schedule</h3>
                  {scheduleExpanded ? <ChevronUp size={16} color="#4b4b4b" /> : <ChevronDown size={16} color="#4b4b4b" />}
                </div>
                {scheduleExpanded && (
                  <button 
                    className="schedule-edit-toggle"
                    onClick={() => setIsEditingSchedule(!isEditingSchedule)}
                  >
                    {isEditingSchedule ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>
              
              {scheduleExpanded && (
                <div className="schedule-list">
                  {scheduleItems.map((item, idx) => (
                    <div className="schedule-item" key={item.id}>
                      <span className="time">{item.time}</span>
                      <span className="event">
                        {item.event}
                        {isEditingSchedule && (
                          <button 
                            className="schedule-delete-btn"
                            onClick={() => removeScheduleItem(item.id)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    </div>
                  ))}

                  {isEditingSchedule && (
                    <div className="schedule-add-form">
                      <input 
                        type="text" 
                        placeholder="Time (e.g. 10:00 AM)" 
                        value={newScheduleTime}
                        onChange={(e) => setNewScheduleTime(e.target.value)}
                        className="schedule-input"
                      />
                      <input 
                        type="text" 
                        placeholder="Event (e.g. Meeting)" 
                        value={newScheduleEvent}
                        onChange={(e) => setNewScheduleEvent(e.target.value)}
                        className="schedule-input"
                        onKeyDown={(e) => e.key === 'Enter' && addScheduleItem()}
                      />
                      <button className="schedule-add-btn" onClick={addScheduleItem}>Add</button>
                    </div>
                  )}

                  {!isEditingSchedule && (
                    <button 
                      className="tracker-add-btn" 
                      style={{ marginTop: '12px' }}
                      onClick={() => setIsEditingSchedule(true)}
                    >
                      + Add Event
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="planner-section block-shadow notes-section">
              <div className="section-header-flex" style={{ marginBottom: '16px' }}>
                <h3 className="section-title" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>Notes & Reflection</h3>
                <button 
                  className={`notes-save-btn ${noteSaved ? 'success' : ''}`}
                  onClick={handleSaveNote}
                  disabled={noteSaving}
                >
                  {noteSaving ? 'Saving...' : noteSaved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
              
              <div className="notes-group">
                <label className="notes-label">General Notes</label>
                <textarea 
                  className="notes-textarea" 
                  placeholder="Write down your thoughts..."
                  value={dailyNote}
                  onChange={(e) => setDailyNote(e.target.value)}
                ></textarea>
              </div>

              <div className="notes-group" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(40, 54, 24, 0.08)' }}>
                <label className="notes-label">Daily Reflection</label>
                <p className="reflection-prompt" style={{ marginBottom: '8px', fontSize: '0.8rem' }}>What went well today?</p>
                <textarea 
                  className="notes-textarea reflection-textarea" 
                  placeholder="Today was great because..."
                  value={dailyReflection}
                  onChange={(e) => setDailyReflection(e.target.value)}
                  style={{ height: '80px' }}
                ></textarea>
              </div>
            </div>



          </div>
        </div>
      </main>

      {/* Habit Details Modal */}
      {activeHabitModal && (
        <div className="habit-modal-overlay" onClick={() => setActiveHabitModal(null)}>
          <div className="habit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="habit-modal-header">
              <h3>{activeHabitModal} Details</h3>
              <button className="habit-modal-close" onClick={() => setActiveHabitModal(null)}>✕</button>
            </div>
            <div className="habit-modal-body">
              {renderHabitModalContent()}
            </div>
            <div className="habit-modal-footer">
              <button className="notes-save-btn" onClick={() => setActiveHabitModal(null)}>Save Details</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyPlannerPage;
