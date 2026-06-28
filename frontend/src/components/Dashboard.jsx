import React from 'react';
import { 
  BookOpen, 
  BrainCircuit, 
  Layers, 
  Terminal, 
  ArrowRight,
  Flame,
  Award,
  Clock
} from 'lucide-react';

export default function Dashboard({ 
  analytics, 
  onQuickStartChat 
}) {
  // Compute dashboard metrics directly from MongoDB Aggregation analytics
  const {
    session_count: sessionCount,
    quiz_count: quizCount,
    completed_quizzes: completedQuizzes,
    flashcard_count: flashcardCount,
    avg_score: avgScore
  } = analytics || {
    session_count: 0,
    quiz_count: 0,
    completed_quizzes: 0,
    flashcard_count: 0,
    avg_score: 0
  };


  const tutorCards = [
    {
      id: 'math',
      name: 'Sigma',
      title: 'Math Specialist',
      desc: 'Formulas, equations, calculus, algebra step-by-step.',
      color: '#06b6d4', // Cyan
      icon: <span style={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 'bold' }}>∑</span>
    },
    {
      id: 'science',
      name: 'Newton',
      title: 'Science Guru',
      desc: 'Physics dynamics, chemical structures, molecular biology.',
      color: '#10b981', // Emerald
      icon: <BookOpen size={24} />
    },
    {
      id: 'history',
      name: 'Athena',
      title: 'History Guide',
      desc: 'Historical cause-and-effect, civilizations, and storytelling.',
      color: '#f59e0b', // Amber
      icon: <Clock size={24} />
    },
    {
      id: 'coding',
      name: 'Ada',
      title: 'Coding Coach',
      desc: 'Coding languages, algorithm complexity, code review.',
      color: '#8b5cf6', // Violet
      icon: <Terminal size={24} />
    }
  ];

  return (
    <div className="animate-fade-in dashboard-container">
      {/* Welcome Banner */}
      <div className="glass-panel dashboard-banner">
        {/* Glow behind logo */}
        <div className="dashboard-banner-glow" />
        
        <h2 className="dashboard-title">
          Welcome back, Scholar!
        </h2>
        <p className="dashboard-subtitle">
          "An investment in knowledge pays the best interest." Select a tutor specialist below or construct a custom quiz to begin study.
        </p>
        
        <div className="dashboard-stats-row">
          <div className="dashboard-stat-item">
            <Flame color="var(--color-accent)" size={16} />
            <span className="dashboard-stat-text">Daily Streak: <strong style={{ color: '#fff' }}>3 days</strong></span>
          </div>
          <div className="dashboard-stat-item">
            <Award color="var(--color-warning)" size={16} />
            <span className="dashboard-stat-text">Average Score: <strong style={{ color: '#fff' }}>{avgScore}%</strong></span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div>
        <h3 className="section-heading">Your Progress</h3>
        <div className="metrics-grid">
          <div className="glass-card metric-card">
            <span className="metric-label">Study Sessions</span>
            <div className="metric-value-row">
              <span className="metric-number">{sessionCount}</span>
              <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Active chats</span>
            </div>
          </div>
          
          <div className="glass-card metric-card">
            <span className="metric-label">Quizzes Graded</span>
            <div className="metric-value-row">
              <span className="metric-number">{completedQuizzes}</span>
              <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>/{quizCount} generated</span>
            </div>
          </div>
          
          <div className="glass-card metric-card">
            <span className="metric-label">Flashcard Sets</span>
            <div className="metric-value-row">
              <span className="metric-number">{flashcardCount}</span>
              <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Set collections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tutor Selection */}
      <div>
        <h3 className="section-heading">Tutor Specialists</h3>
        <div className="tutors-grid">
          {tutorCards.map((tutor) => (
            <div 
              key={tutor.id} 
              className="glass-card tutor-card"
            >
              <div
                className="tutor-icon-wrap"
                style={{
                  backgroundColor: `${tutor.color}15`,
                  border: `1px solid ${tutor.color}30`,
                  color: tutor.color
                }}
              >
                {tutor.icon}
              </div>
              
              <div>
                <h4 className="tutor-name">
                  {tutor.name}
                  <span className="tutor-title-text">— {tutor.title}</span>
                </h4>
                <p className="tutor-desc">
                  {tutor.desc}
                </p>
              </div>

              <button 
                onClick={() => onQuickStartChat(tutor.name, tutor.id)}
                className="btn btn-secondary tutor-btn"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tutor.color;
                  e.currentTarget.style.color = tutor.color;
                  e.currentTarget.style.backgroundColor = `${tutor.color}05`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Start Tutoring <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
