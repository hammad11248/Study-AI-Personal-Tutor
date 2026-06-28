import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatContainer from './components/ChatContainer';
import QuizGenerator from './components/QuizGenerator';
import Flashcards from './components/Flashcards';
import CodeExplainer from './components/CodeExplainer';
import AuthPage from './components/AuthPage';
import LearningIntelligence from './components/LearningIntelligence';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Analytics state calculated by MongoDB Aggregation Pipeline in the backend
  const [analytics, setAnalytics] = useState({
    session_count: 0,
    quiz_count: 0,
    completed_quizzes: 0,
    flashcard_count: 0,
    avg_score: 0
  });

  // Authentication State
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('studyai_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('studyai_token') || null;
  });

  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('studyai_guest') === 'true';
  });

  // Close sidebar when switching views on mobile
  const handleSetActiveView = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  // Helper to resolve request headers
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (isGuest) {
      headers['Authorization'] = `Bearer local-guest`;
    }
    return headers;
  };

  // Sync data from database
  const fetchSessions = () => {
    fetch(`${API_BASE_URL}/api/sessions`, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then((data) => setSessions(data))
      .catch((err) => {
        console.error('Error fetching sessions:', err);
        if (err.message === 'Unauthenticated' && !isGuest) {
          handleLogout();
        }
      });
  };

  const fetchQuizzes = () => {
    fetch(`${API_BASE_URL}/api/quizzes`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch((err) => console.error('Error fetching quizzes:', err));
  };

  const fetchFlashcardSets = () => {
    fetch(`${API_BASE_URL}/api/flashcards`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => setFlashcards(data))
      .catch((err) => console.error('Error fetching flashcard sets:', err));
  };

  const fetchAnalytics = () => {
    fetch(`${API_BASE_URL}/api/analytics`, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then((data) => setAnalytics(data))
      .catch((err) => {
        console.warn('Error fetching backend analytics, using local client-side fallback:', err);
        // Client-side fallback metrics computation
        setAnalytics({
          session_count: sessions.length,
          quiz_count: quizzes.length,
          completed_quizzes: quizzes.filter(q => q.score !== null).length,
          flashcard_count: flashcards.length,
          avg_score: quizzes.filter(q => q.score !== null).length > 0 
            ? Math.round((quizzes.filter(q => q.score !== null).reduce((acc, q) => acc + (q.score / (q.questions?.length || 5)), 0) / quizzes.filter(q => q.score !== null).length) * 100)
            : 0
        });
      });
  };

  // Trigger sync on login or guest change
  useEffect(() => {
    if (user || isGuest) {
      fetchSessions();
      fetchQuizzes();
      fetchFlashcardSets();
      fetchAnalytics();
    }
  }, [user, token, isGuest]);

  // Recalculate/refetch analytics whenever database states change
  useEffect(() => {
    if (user || isGuest) {
      fetchAnalytics();
    }
  }, [sessions, quizzes, flashcards]);

  // Auth Handlers
  const handleAuthSuccess = (data) => {
    const { token, username, email, user_id } = data;
    const userData = { username, email, user_id };
    
    localStorage.setItem('studyai_token', token);
    localStorage.setItem('studyai_user', JSON.stringify(userData));
    localStorage.removeItem('studyai_guest');
    
    setToken(token);
    setUser(userData);
    setIsGuest(false);
    setActiveView('dashboard');
  };

  const handleGuestLogin = () => {
    localStorage.setItem('studyai_guest', 'true');
    localStorage.removeItem('studyai_token');
    localStorage.removeItem('studyai_user');
    
    setIsGuest(true);
    setToken(null);
    setUser(null);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('studyai_token');
    localStorage.removeItem('studyai_user');
    localStorage.removeItem('studyai_guest');
    
    setToken(null);
    setUser(null);
    setIsGuest(false);
    setSessions([]);
    setQuizzes([]);
    setFlashcards([]);
    setCurrentSessionId(null);
    setActiveView('dashboard');
  };

  // Creation of chat session
  const handleCreateSession = (title = 'New Study Session', personality = 'general') => {
    fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, personality }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((newSession) => {
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSession.session_id);
        setActiveView('chat');
        setSidebarOpen(false);
      })
      .catch((err) => {
        console.warn('Error creating session, using local offline fallback:', err);
        const localSession = {
          session_id: 'local-' + Date.now(),
          title: title,
          personality: personality,
          created_at: new Date().toISOString()
        };
        setSessions((prev) => [localSession, ...prev]);
        setCurrentSessionId(localSession.session_id);
        setActiveView('chat');
        setSidebarOpen(false);
      });
  };

  const handleQuickStartChat = (tutorName, personality) => {
    const sessionTitle = `${tutorName} Session`;
    handleCreateSession(sessionTitle, personality);
  };

  const handleDeleteSession = (sessionId) => {
    if (sessionId.toString().startsWith('local')) {
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setActiveView('dashboard');
      }
      return;
    }

    fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
          if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setActiveView('dashboard');
          }
        }
      })
      .catch((err) => {
        console.error('Error deleting session:', err);
        // Fallback local deletion
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setActiveView('dashboard');
        }
      });
  };

  const activeSession = sessions.find((s) => s.session_id === currentSessionId);

  // GATEKEEPING: If not logged in and not guest, show Auth Portal
  if (!token && !isGuest) {
    return (
      <AuthPage 
        apiBaseUrl={API_BASE_URL}
        onAuthSuccess={handleAuthSuccess}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  // Render sub panels
  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            analytics={analytics}
            onQuickStartChat={handleQuickStartChat}
          />
        );
      case 'chat':
        return (
          <ChatContainer
            session={activeSession}
            apiBaseUrl={API_BASE_URL}
            token={token || 'local-guest'}
          />
        );
      case 'quizzes':
        return (
          <QuizGenerator
            apiBaseUrl={API_BASE_URL}
            onQuizCreated={fetchQuizzes}
            token={token || 'local-guest'}
          />
        );
      case 'flashcards':
        return (
          <Flashcards
            apiBaseUrl={API_BASE_URL}
            onFlashcardsCreated={fetchFlashcardSets}
            token={token || 'local-guest'}
          />
        );
      case 'code-explainer':
        return (
          <CodeExplainer 
            apiBaseUrl={API_BASE_URL}
            token={token || 'local-guest'}
          />
        );

      // ── NEW CASE ADDED ──────────────────────────────────────
      case 'intelligence':
        return (
          <LearningIntelligence
            apiBaseUrl={API_BASE_URL}
            token={token || 'local-guest'}
            sessions={sessions}
          />
        );
      // ── END NEW CASE ────────────────────────────────────────

      default:
        return (
          <Dashboard
            analytics={analytics}
            onQuickStartChat={handleQuickStartChat}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with User profiles */}
      <Sidebar
        activeView={activeView}
        setActiveView={handleSetActiveView}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        onCreateSession={() => handleCreateSession('New Study Session', 'general')}
        onDeleteSession={handleDeleteSession}
        user={user}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="app-main">
        {/* Mobile Top Bar */}
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <div className="mobile-brand">
            <span className="mobile-brand-name">StudyAI</span>
            <span className="mobile-brand-dot" />
          </div>
          <div style={{ width: '40px' }} />
        </div>

        {renderMainContent()}
      </main>
    </div>
  );
}