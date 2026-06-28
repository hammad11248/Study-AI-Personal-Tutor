import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, User, Brain, GraduationCap } from 'lucide-react';

export default function ChatContainer({ session, apiBaseUrl, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const sessionId = session?.session_id;
  const tutorName = session ? getTutorName(session.personality) : 'StudyAI';
  const tutorPersona = session ? session.personality : 'general';

  function getTutorName(personality) {
    switch (personality) {
      case 'math': return 'Sigma (Math Specialist)';
      case 'science': return 'Newton (Science Guru)';
      case 'history': return 'Athena (History Guide)';
      case 'coding': return 'Ada (Coding Coach)';
      default: return 'StudyAI (General Tutor)';
    }
  }

  function getSuggestions(personality) {
    switch (personality) {
      case 'math':
        return [
          "Explain the difference between combinations and permutations",
          "Can you walk me through solving a quadratic equation?",
          "Give me a calculus practice problem about derivatives"
        ];
      case 'science':
        return [
          "Explain photosynthesis using a simple analogy",
          "What is the difference between mitosis and meiosis?",
          "How does Einstein's E=mc² formula work in practice?"
        ];
      case 'history':
        return [
          "What were the primary causes of the French Revolution?",
          "Can you summarize the rise and fall of the Roman Empire?",
          "What was the significance of the Silk Road trade route?"
        ];
      case 'coding':
        return [
          "Explain how recursion works with a stack analogy",
          "What is the difference between synchronous and asynchronous code?",
          "Write a python code snippet showing how binary search works"
        ];
      default:
        return [
          "Help me understand a difficult topic step-by-step",
          "Give me some active recall study strategies",
          "Create a study schedule for my upcoming final exams"
        ];
    }
  }

  // Fetch session messages
  useEffect(() => {
    if (!sessionId) return;
    
    setMessages([]);
    setError('');
    
    // Skip backend fetch for offline local sessions
    if (sessionId.toString().startsWith('local')) {
      return;
    }
    
    fetch(`${apiBaseUrl}/api/sessions/${sessionId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load chat history");
        return res.json();
      })
      .then(data => {
        setMessages(data);
      })
      .catch(err => {
        console.error(err);
        setError("Could not load past messages. Using offline session.");
      });
  }, [sessionId, apiBaseUrl, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) setInput('');
    setLoading(true);
    
    // Optimistic UI update
    const tempUserMsg = { sender: 'user', content: text, message_id: 'temp-user-' + Date.now() };
    setMessages(prev => [...prev, tempUserMsg]);

    // Handle local session offline fallback
    if (sessionId.toString().startsWith('local')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            content: `### ⚠️ Offline Demo Mode\n\nI received your message: **"${text}"**\n\nHowever, the StudyAI backend server is currently offline or unreachable. To chat with me and use my AI features, please start the backend:\n\n1. **Run Backend Server**:\n   Open a terminal in the \`backend\` directory and execute:\n   \`\`\`powershell\n   .\\venv\\Scripts\\python.exe -m uvicorn main:app --reload\n   \`\`\`\n2. **Run MongoDB**:\n   Make sure MongoDB is running locally on port \`27017\`.\n3. **Set Gemini Key**:\n   Add your Gemini API Key in the \`backend/.env\` file:\n   \`\`\`env\n   GEMINI_API_KEY=AIzaSy...\n   \`\`\`\n\nOnce the server is running, refresh the page to chat normally!`,
            message_id: 'offline-reply-' + Date.now()
          }
        ]);
        setLoading(false);
      }, 800);
      return;
    }

    fetch(`${apiBaseUrl}/api/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: text })
    })
      .then(res => {
        if (!res.ok) throw new Error("Error connecting to server");
        return res.json();
      })
      .then(aiMsg => {
        // Replace temp messages or append actual saved message
        setMessages(prev => {
          // Remove temp and add actual
          const filtered = prev.filter(m => !m.message_id.toString().startsWith('temp'));
          return [...filtered, tempUserMsg, aiMsg];
        });
      })
      .catch(err => {
        console.error(err);
        setMessages(prev => [
          ...prev, 
          { 
            sender: 'assistant', 
            content: `I'm sorry, I could not connect to the backend. Please check if your server is running. Error: ${err.message}`, 
            message_id: 'err-' + Date.now() 
          }
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="animate-fade-in chat-container">
      {/* Chat Header */}
      <div className="glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '8px',
            borderRadius: '8px',
            color: 'var(--color-primary)'
          }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{tutorName}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gemini-1.5-Flash Active</span>
          </div>
        </div>
        
        {error && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
            {error}
          </span>
        )}
      </div>

      {/* Messages List Area */}
      <div className="chat-messages-area">
        {messages.length === 0 && !loading && (
          <div style={{
            margin: 'auto',
            maxWidth: '560px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            padding: '32px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              margin: '0 auto'
            }}>
              <Sparkles size={32} />
            </div>
            
            <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                Start a session with your Tutor
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Ask a question, paste code, or explore suggestions. I am tuned to help you work through solutions and build solid learning structures.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {getSuggestions(tutorPersona).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    padding: '12px 16px',
                    width: '100%',
                    backgroundColor: 'rgba(20, 22, 37, 0.4)',
                    borderColor: 'var(--glass-border)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.message_id} 
              className={`chat-message-row ${isUser ? 'chat-message-row--user' : 'chat-message-row--ai'}`}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isUser ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                border: '1px solid',
                borderColor: isUser ? 'transparent' : 'var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isUser ? '#fff' : 'var(--color-secondary)',
                flexShrink: 0
              }}>
                {isUser ? <User size={16} /> : <Brain size={16} />}
              </div>

              {/* Message Bubble */}
              <div 
                className={isUser ? "" : "markdown-content"}
                style={{
                  padding: '16px 20px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: isUser ? 'rgba(139, 92, 246, 0.15)' : 'var(--glass-bg)',
                  border: '1px solid',
                  borderColor: isUser ? 'rgba(139, 92, 246, 0.3)' : 'var(--glass-border)',
                  color: 'var(--text-primary)',
                  boxShadow: isUser ? 'none' : '0 4px 20px rgba(0,0,0,0.15)',
                  wordBreak: 'break-word'
                }}
              >
                {isUser ? (
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.95rem' }}>{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', gap: '16px', maxWidth: '80%', alignSelf: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary)',
              flexShrink: 0
            }}>
              <Brain size={16} />
            </div>

            <div className="glass-panel" style={{
              padding: '16px 20px',
              borderRadius: '16px 16px 16px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '260px'
            }}>
              <div className="skeleton" style={{ height: '14px', width: '100%' }} />
              <div className="skeleton" style={{ height: '14px', width: '85%' }} />
              <div className="skeleton" style={{ height: '14px', width: '60%' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Box */}
      <div className="glass-panel" style={{
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message your tutor ${tutorName}... (Press Enter to send, Shift+Enter for new line)`}
          rows={1}
          style={{
            flexGrow: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            resize: 'none',
            padding: '8px 4px',
            maxHeight: '120px',
            lineHeight: 1.5,
            fontSize: '0.95rem'
          }}
        />
        
        <button
          onClick={() => handleSend()}
          className="btn btn-primary"
          disabled={!input.trim() || loading}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            opacity: (!input.trim() || loading) ? 0.4 : 1,
            cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
