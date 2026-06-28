import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal, Code, Copy, Cpu, Check, Loader2, Sparkles } from 'lucide-react';

export default function CodeExplainer({ apiBaseUrl, token }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [result, setResult] = useState(null);

  const handleExplain = (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    fetch(`${apiBaseUrl}/api/explain-code`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code, language })
    })
      .then(res => {
        if (!res.ok) throw new Error("Explanation failed");
        return res.json();
      })
      .then(data => {
        setResult(data);
      })
      .catch(err => {
        alert("Error explaining code: " + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const copyRefactoredCode = () => {
    if (!result?.refactored) return;
    
    // Strip markdown code fences if they exist
    let cleanCode = result.refactored;
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      // Remove first line (e.g. ```python) and last line (```)
      if (lines.length > 2) {
        cleanCode = lines.slice(1, -1).join('\n');
      }
    }

    navigator.clipboard.writeText(cleanCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="animate-fade-in page-container page-container--no-center">
      {/* View Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal color="var(--color-primary)" />
          Code Explainer & Optimizer
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Paste complex code fragments to parse execution blocks, analyze Big-O runtimes, and review refactored clean-code options.
        </p>
      </div>

      {/* Main Workspace Split Layout */}
      <div className="code-explainer-grid">
        
        {/* Left Side: Code Input */}
        <form onSubmit={handleExplain} className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Input Code Segment</span>
            <select
              className="input-field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: '140px', padding: '6px 12px' }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="htmlcss">HTML / CSS</option>
            </select>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Paste your ${language} code here...`}
            required
            style={{
              flexGrow: 1,
              width: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              padding: '16px',
              outline: 'none',
              resize: 'none',
              minHeight: '260px'
            }}
          />

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !code.trim()}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="pulse-glow" style={{ animation: 'spin 1s infinite linear' }} />
                <span>Ada is analyzing...</span>
              </>
            ) : (
              <>
                <Code size={16} />
                <span>Explain Snippet</span>
              </>
            )}
          </button>
        </form>

        {/* Right Side: AI Analysis */}
        <div className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          {!result && !loading && (
            <div style={{
              margin: 'auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '320px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Awaiting Code Analysis</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  Enter code on the left and submit. Ada will generate steps, evaluate complexity, and write optimal refactorings.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="skeleton" style={{ height: '36px', width: '120px', borderRadius: '20px' }} />
                <div className="skeleton" style={{ height: '36px', width: '80px', borderRadius: '20px' }} />
              </div>
              <div className="skeleton" style={{ height: '24px', width: '40%' }} />
              <div className="skeleton" style={{ height: '14px', width: '100%' }} />
              <div className="skeleton" style={{ height: '14px', width: '90%' }} />
              <div className="skeleton" style={{ height: '14px', width: '95%' }} />
              <div className="skeleton" style={{ height: '100px', width: '100%', borderRadius: '8px' }} />
            </div>
          )}

          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Complexity Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '12px 16px',
                borderRadius: '8px'
              }}>
                <Cpu size={18} color="var(--color-secondary)" />
                <div style={{ fontSize: '0.85rem' }}>
                  Complexity: <strong style={{ color: '#fff' }}>{result.complexity}</strong>
                </div>
              </div>

              {/* Step-by-Step Explanation */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>Tutor Breakdown</h4>
                <div className="markdown-content" style={{ fontSize: '0.9rem' }}>
                  <ReactMarkdown>{result.explanation}</ReactMarkdown>
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--glass-border)' }} />

              {/* Refactored Code */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Refactored Option</h4>
                  <button 
                    onClick={copyRefactoredCode}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                  >
                    {copied ? (
                      <>
                        <Check size={12} color="var(--color-success)" />
                        <span style={{ color: 'var(--color-success)' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="markdown-content" style={{ fontSize: '0.85rem' }}>
                  <ReactMarkdown>{result.refactored}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
