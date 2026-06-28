import React from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  BrainCircuit, 
  Layers, 
  Terminal, 
  Plus, 
  Trash2,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeView, 
  setActiveView, 
  sessions, 
  currentSessionId, 
  setCurrentSessionId, 
  onCreateSession,
  onDeleteSession,
  user,
  onLogout,
  sidebarOpen,
  setSidebarOpen
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'chat', label: 'AI Chatbot', Icon: MessageSquare },
    { id: 'quizzes', label: 'Quiz Generator', Icon: BrainCircuit },
    { id: 'flashcards', label: 'Flashcards', Icon: Layers },
    { id: 'code-explainer', label: 'Code Explainer', Icon: Terminal },
  ];

  const handleChatNav = () => {
    if (currentSessionId) {
      setActiveView('chat');
    } else if (sessions.length > 0) {
      setCurrentSessionId(sessions[0].session_id);
      setActiveView('chat');
    } else {
      onCreateSession();
    }
  };

  return (
    <aside className={`sidebar glass-panel ${sidebarOpen ? 'sidebar--open' : ''}`}>
      {/* Mobile close button */}
      <button
        className="sidebar-close-btn"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close menu"
      >
        <X size={20} />
      </button>

      {/* Branding Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <GraduationCap size={22} color="#fff" />
        </div>
        <div className="sidebar-brand">
          <h1 className="sidebar-brand-name">StudyAI</h1>
          <span className="sidebar-brand-tagline">AI Personal Tutor</span>
        </div>
        <div className="pulse-glow sidebar-status-dot" />
      </div>

      {/* Main Navigation */}
      <div className="sidebar-nav-section">
        <p className="sidebar-section-label">Tutor Hub</p>
        
        <nav className="sidebar-nav">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeView === id;
            const onClick = id === 'chat' ? handleChatNav : () => setActiveView(id);
            return (
              <button
                key={id}
                onClick={onClick}
                className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn--active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}

          {/* AI Intelligence Engine button */}
          <button 
            onClick={() => setActiveView('intelligence')}
            className={`sidebar-nav-btn sidebar-nav-btn--intelligence ${activeView === 'intelligence' ? 'sidebar-nav-btn--active' : ''}`}
          >
            <Sparkles size={18} />
            <span style={{ fontWeight: 600 }}>AI Intelligence</span>
            <span className="sidebar-new-badge">NEW</span>
          </button>
        </nav>
      </div>

      <hr className="sidebar-divider" />

      {/* Chat Sessions Navigation */}
      <div className="sidebar-sessions">
        <div className="sidebar-sessions-header">
          <span className="sidebar-section-label">Chat History</span>
          <button 
            onClick={onCreateSession}
            className="sidebar-add-btn"
            title="New Chat Session"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Scrollable list of sessions */}
        <div className="sidebar-sessions-list">
          {sessions.length === 0 ? (
            <div className="sidebar-sessions-empty">
              No active chats. Start a new one!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = currentSessionId === session.session_id && activeView === 'chat';
              return (
                <div 
                  key={session.session_id}
                  className={`sidebar-session-item ${isActive ? 'sidebar-session-item--active' : ''}`}
                  onClick={() => {
                    setCurrentSessionId(session.session_id);
                    setActiveView('chat');
                  }}
                >
                  <div className="sidebar-session-info">
                    <MessageSquare 
                      size={14} 
                      color={isActive ? 'var(--color-primary)' : 'var(--text-muted)'} 
                      style={{ flexShrink: 0 }}
                    />
                    <span className={`sidebar-session-title ${isActive ? 'sidebar-session-title--active' : ''}`}>
                      {session.title}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.session_id);
                    }}
                    className="sidebar-delete-btn"
                    title="Delete Chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <hr className="sidebar-divider" style={{ margin: 0 }} />

      {/* User Profile / Logout Card */}
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">
            {user?.username ? user.username[0] : 'G'}
          </div>
          <div className="sidebar-user-text">
            <span className="sidebar-username">{user?.username || 'Guest Scholar'}</span>
            <span className="sidebar-useremail">{user?.email || 'Offline Demo Mode'}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="sidebar-logout-btn"
          title={user ? "Log Out" : "Exit Guest Mode"}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}