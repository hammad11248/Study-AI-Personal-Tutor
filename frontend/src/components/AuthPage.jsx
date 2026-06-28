import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthPage({ apiBaseUrl, onAuthSuccess, onGuestLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin 
      ? { username_or_email: username, password } 
      : { username, email, password };

    fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }
        return data;
      })
      .then((data) => {
        onAuthSuccess(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Connection to auth server failed.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      padding: '20px',
      overflow: 'auto'
    }}>
      {/* Decorative blurred background circles */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '30%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '30%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, var(--color-secondary-glow) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Auth Portal Box */}
      <div className="glass-panel animate-fade-in auth-portal-box">
        {/* Header/Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
          }}>
            <GraduationCap size={32} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              background: 'linear-gradient(to right, #ffffff, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isLogin ? 'Enter your details to log in to StudyAI' : 'Sign up to configure your custom AI tutor'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--color-accent)',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Username / Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? "student123 or student@email.com" : "student123"}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {/* Email Input (Sign Up Only) */}
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@studyai.com"
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s infinite linear' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <hr style={{ flexGrow: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Or</span>
          <hr style={{ flexGrow: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
        </div>

        {/* Guest / Offline Mode */}
        <button
          onClick={onGuestLogin}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
        >
          Explore in Guest Mode
        </button>
      </div>
    </div>
  );
}
