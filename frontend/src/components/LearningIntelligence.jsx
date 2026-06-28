/**
 * ================================================================
 *  LearningIntelligence.jsx
 *  
 *  SETUP:
 *  1. Save this file to: frontend/src/components/LearningIntelligence.jsx
 *  
 *  2. In App.jsx, add the import at the top:
 *       import LearningIntelligence from './components/LearningIntelligence';
 *  
 *  3. In App.jsx renderMainContent(), add a new case:
 *       case 'intelligence':
 *         return (
 *           <LearningIntelligence
 *             apiBaseUrl={API_BASE_URL}
 *             token={token || 'local-guest'}
 *             sessions={sessions}
 *           />
 *         );
 *  
 *  4. In Sidebar.jsx, add a nav item for 'intelligence' view.
 *     Label: "AI Intelligence"  Icon: 🧠
 * ================================================================
 */

import React, { useState, useEffect, useRef } from 'react';

const API = (apiBaseUrl, token) => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  post: (path, body) =>
    fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  get: (path) =>
    fetch(`${apiBaseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
});

// ─── Micro components ─────────────────────────────────────────

const Badge = ({ text, color = '#6366f1' }) => (
  <span style={{
    background: color + '22',
    color,
    border: `1px solid ${color}44`,
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
  }}>{text}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg-secondary, #1e1e2e)',
    border: '1px solid var(--border, #2d2d3d)',
    borderRadius: 16,
    padding: 24,
    ...style,
  }}>{children}</div>
);

const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48 }}>
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      border: '3px solid #6366f122',
      borderTopColor: '#6366f1',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#888', fontSize: 14 }}>AI is thinking...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProgressBar = ({ value, max = 100, color = '#6366f1' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: '#ffffff11', borderRadius: 99, height: 8, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        borderRadius: 99, transition: 'width 0.8s ease',
      }} />
    </div>
  );
};

// ─── Tab: Study Roadmap ───────────────────────────────────────

function RoadmapTab({ api }) {
  const [form, setForm] = useState({ topic: '', level: 'Beginner', goal: '', weeks: 4 });
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);

  const submit = async () => {
    if (!form.topic || !form.goal) return;
    setLoading(true);
    setRoadmap(null);
    const data = await api.post('/api/ai/roadmap', form);
    setRoadmap(data);
    setActiveWeek(0);
    setLoading(false);
  };

  const diffColor = { gradual: '#22c55e', steep: '#f59e0b', 'plateau-then-spike': '#6366f1' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary, #fff)', fontSize: 17 }}>
          🗺️ Generate Personalized Study Roadmap
        </h3>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>
          AI designs a week-by-week plan tailored to your level and goal.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Topic / Subject</label>
            <input
              style={inputStyle}
              placeholder="e.g. Machine Learning, Calculus, World War II..."
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Current Level</label>
            <select style={inputStyle} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration (weeks)</label>
            <select style={inputStyle} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })}>
              {[2, 4, 6, 8, 12].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Your Goal</label>
            <input
              style={inputStyle}
              placeholder="e.g. Pass university final exam, Build a project, Get a job..."
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
          </div>
        </div>

        <button onClick={submit} disabled={loading || !form.topic || !form.goal} style={btnStyle}>
          {loading ? 'Generating...' : '✨ Generate AI Roadmap'}
        </button>
      </Card>

      {loading && <Spinner />}

      {roadmap && !roadmap.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <Card style={{ background: 'linear-gradient(135deg, #6366f122, #8b5cf622)', borderColor: '#6366f133' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 20 }}>{roadmap.title}</h2>
                <p style={{ margin: 0, color: '#bbb', fontSize: 14, lineHeight: 1.6 }}>{roadmap.summary}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge text={`${roadmap.total_weeks} Weeks`} color="#6366f1" />
                <Badge
                  text={roadmap.difficulty_curve?.replace(/-/g, ' ')}
                  color={diffColor[roadmap.difficulty_curve] || '#888'}
                />
              </div>
            </div>

            {roadmap.ai_reasoning && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#ffffff08', borderRadius: 10, borderLeft: '3px solid #6366f1' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#a0a0b0' }}>
                  <strong style={{ color: '#6366f1' }}>🧠 AI Reasoning: </strong>{roadmap.ai_reasoning}
                </p>
              </div>
            )}
          </Card>

          {/* Week tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {roadmap.weeks?.map((w, i) => (
              <button
                key={i}
                onClick={() => setActiveWeek(i)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: activeWeek === i ? '#6366f1' : '#ffffff11',
                  color: activeWeek === i ? '#fff' : '#888',
                  fontWeight: activeWeek === i ? 700 : 400,
                  fontSize: 13, transition: 'all 0.2s',
                }}
              >
                Week {w.week}
              </button>
            ))}
          </div>

          {/* Active week detail */}
          {roadmap.weeks?.[activeWeek] && (() => {
            const w = roadmap.weeks[activeWeek];
            return (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: 17 }}>Week {w.week}: {w.theme}</h3>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>{w.focus}</p>
                  </div>
                  <Badge text={`~${w.estimated_hours}h`} color="#f59e0b" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <h4 style={sectionHead}>📋 Daily Tasks</h4>
                    {w.daily_tasks?.map((t, i) => (
                      <div key={i} style={listItem}>
                        <span style={{ color: '#6366f1', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span> {t}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={sectionHead}>💡 Key Concepts</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {w.key_concepts?.map((c, i) => <Badge key={i} text={c} color="#8b5cf6" />)}
                    </div>
                    <h4 style={{ ...sectionHead, marginTop: 16 }}>🏆 Milestone</h4>
                    <p style={{ margin: 0, color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>{w.milestone}</p>
                  </div>
                </div>

                {w.tip && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#f59e0b11', borderRadius: 10, borderLeft: '3px solid #f59e0b' }}>
                    <p style={{ margin: 0, color: '#f59e0b', fontSize: 13 }}>💡 <strong>Study Tip:</strong> {w.tip}</p>
                  </div>
                )}
              </Card>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Performance Analyzer ────────────────────────────────

function PerformanceTab({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/api/ai/performance');
    setData(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const trendColor = { improving: '#22c55e', declining: '#ef4444', consistent: '#6366f1', inconsistent: '#f59e0b', no_data: '#888', insufficient_data: '#888' };
  const trendIcon = { improving: '📈', declining: '📉', consistent: '➡️', inconsistent: '〰️', no_data: '📊', insufficient_data: '📊' };
  const sevColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: 17 }}>🔬 AI Performance Analysis</h3>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Deep analysis of your quiz history to find patterns and gaps.</p>
        </div>
        <button onClick={load} disabled={loading} style={{ ...btnStyle, padding: '8px 16px', fontSize: 13, margin: 0 }}>
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>

      {loading && <Spinner />}

      {data && !data.error && (
        <>
          {/* Overview cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>
                {trendIcon[data.overall_trend] || '📊'}
              </div>
              <div style={{ color: trendColor[data.overall_trend] || '#888', fontWeight: 700, fontSize: 14 }}>
                {(data.overall_trend || 'No Data').replace(/_/g, ' ').toUpperCase()}
              </div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Overall Trend</div>
            </Card>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#6366f1' }}>{data.performance_score || 0}</div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Performance Score</div>
              <ProgressBar value={data.performance_score || 0} color="#6366f1" />
            </Card>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>🎯</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{data.weaknesses?.length || 0}</div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Areas to Improve</div>
            </Card>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>💪</div>
              <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{data.strengths?.length || 0}</div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Strengths Found</div>
            </Card>
          </div>

          {/* AI Insight */}
          {data.ai_insight && (
            <Card style={{ background: 'linear-gradient(135deg, #6366f111, #8b5cf611)', borderColor: '#6366f133' }}>
              <p style={{ margin: 0, color: '#c4b5fd', fontSize: 14, lineHeight: 1.7 }}>
                <strong style={{ color: '#8b5cf6' }}>🧠 AI Insight: </strong>{data.ai_insight}
              </p>
            </Card>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Weaknesses */}
            <Card>
              <h4 style={sectionHead}>⚠️ Weaknesses</h4>
              {data.weaknesses?.length ? data.weaknesses.map((w, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 12, background: '#ffffff06', borderRadius: 10, borderLeft: `3px solid ${sevColor[w.severity] || '#888'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ color: '#fff', fontSize: 13 }}>{w.area}</strong>
                    <Badge text={w.severity} color={sevColor[w.severity]} />
                  </div>
                  <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{w.fix}</p>
                </div>
              )) : <p style={{ color: '#666', fontSize: 13 }}>No major weaknesses detected.</p>}
            </Card>

            {/* Strengths */}
            <Card>
              <h4 style={sectionHead}>✅ Strengths</h4>
              {data.strengths?.length ? data.strengths.map((s, i) => (
                <div key={i} style={{ marginBottom: 10, padding: 12, background: '#22c55e08', borderRadius: 10, borderLeft: '3px solid #22c55e' }}>
                  <strong style={{ color: '#22c55e', fontSize: 13 }}>{s.area}</strong>
                  <p style={{ margin: '4px 0 0', color: '#999', fontSize: 12 }}>{s.evidence}</p>
                </div>
              )) : <p style={{ color: '#666', fontSize: 13 }}>Take more quizzes to identify strengths.</p>}
            </Card>
          </div>

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <Card>
              <h4 style={sectionHead}>🎯 Prioritized Recommendations</h4>
              {data.recommendations.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    minWidth: 28, height: 28, borderRadius: '50%', background: '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 12,
                  }}>{r.priority}</div>
                  <div>
                    <p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.action}</p>
                    <p style={{ margin: '2px 0 0', color: '#888', fontSize: 12 }}>{r.reason}</p>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Next quiz suggestion */}
          {data.next_quiz_suggestion && (
            <Card style={{ borderColor: '#6366f133' }}>
              <h4 style={{ ...sectionHead, marginBottom: 10 }}>🎲 AI Suggested Next Quiz</h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 36 }}>📝</div>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700 }}>{data.next_quiz_suggestion.topic}</p>
                  <p style={{ margin: '2px 0 0', color: '#888', fontSize: 13 }}>
                    <Badge text={data.next_quiz_suggestion.difficulty} color="#f59e0b" /> &nbsp;
                    {data.next_quiz_suggestion.reason}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {data?.summary && !data.weaknesses && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ color: '#888', margin: 0 }}>{data.summary}</p>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Mind Map ────────────────────────────────────────────

function MindMapTab({ api }) {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState(2);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    setMapData(null);
    setSelected(null);
    const data = await api.post('/api/ai/mindmap', { topic, depth });
    setMapData(data);
    setLoading(false);
  };

  // Draw the mind map on canvas
  useEffect(() => {
    if (!mapData?.nodes || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = 420;
    ctx.clearRect(0, 0, W, H);

    const nodes = mapData.nodes;
    const edges = mapData.edges || [];

    // Radial layout
    const root = nodes.find(n => n.type === 'root');
    const branches = nodes.filter(n => n.type === 'branch');
    const leaves = nodes.filter(n => n.type === 'leaf');

    const positions = {};
    if (root) positions[root.id] = { x: W / 2, y: H / 2 };

    branches.forEach((b, i) => {
      const angle = (2 * Math.PI * i) / branches.length - Math.PI / 2;
      positions[b.id] = {
        x: W / 2 + Math.cos(angle) * 130,
        y: H / 2 + Math.sin(angle) * 110,
      };
    });

    leaves.forEach((l) => {
      const edge = edges.find(e => e.to === l.id);
      const parentPos = edge ? positions[edge.from] : { x: W / 2, y: H / 2 };
      if (!parentPos) return;
      const angle = Math.random() * 2 * Math.PI;
      positions[l.id] = {
        x: parentPos.x + Math.cos(angle) * 70 + (Math.random() - 0.5) * 20,
        y: parentPos.y + Math.sin(angle) * 60 + (Math.random() - 0.5) * 20,
      };
    });

    // Draw edges
    ctx.strokeStyle = '#6366f133';
    ctx.lineWidth = 1.5;
    edges.forEach(({ from, to }) => {
      const a = positions[from], b = positions[to];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 20, b.x, b.y);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (!pos) return;
      const r = node.type === 'root' ? 36 : node.type === 'branch' ? 24 : 16;
      const color = node.color || '#6366f1';

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = node.type === 'root' ? 16 : 8;

      ctx.fillStyle = color + (node.type === 'root' ? 'ff' : node.type === 'branch' ? 'dd' : '99');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = `${node.type === 'root' ? 11 : 9}px sans-serif`;
      const words = node.label.split(' ');
      if (words.length === 1) {
        ctx.fillText(node.label, pos.x, pos.y + r + 14);
      } else {
        ctx.fillText(words.slice(0, 2).join(' '), pos.x, pos.y + r + 12);
        if (words.length > 2) ctx.fillText(words.slice(2).join(' '), pos.x, pos.y + r + 22);
      }
    });

  }, [mapData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary, #fff)', fontSize: 17 }}>
          🕸️ AI Concept Mind Map
        </h3>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>
          Visualize any concept as an interactive knowledge graph.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            placeholder="Topic (e.g. Neural Networks, French Revolution...)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
          />
          <select style={{ ...inputStyle, width: 160 }} value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
            <option value={1}>Surface (Quick)</option>
            <option value={2}>Detailed</option>
            <option value={3}>Expert (Deep)</option>
          </select>
          <button onClick={generate} disabled={loading || !topic} style={{ ...btnStyle, margin: 0, whiteSpace: 'nowrap' }}>
            {loading ? 'Building...' : '🕸️ Generate Map'}
          </button>
        </div>
      </Card>

      {loading && <Spinner />}

      {mapData && !mapData.error && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff' }}>{mapData.central_topic}</h3>
              <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>{mapData.description}</p>
            </div>
            <Badge text={`${mapData.total_concepts || mapData.nodes?.length} concepts`} color="#8b5cf6" />
          </div>

          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 420, borderRadius: 12, background: '#0d0d1a', display: 'block', cursor: 'pointer' }}
          />

          <div style={{ marginTop: 16 }}>
            <h4 style={sectionHead}>📚 All Concepts</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mapData.nodes?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, border: `1px solid ${n.color || '#6366f1'}44`,
                    background: selected?.id === n.id ? (n.color || '#6366f1') : (n.color || '#6366f1') + '22',
                    color: selected?.id === n.id ? '#fff' : (n.color || '#6366f1'),
                    cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
                  }}
                >
                  {n.label}
                </button>
              ))}
            </div>

            {selected && (
              <div style={{ marginTop: 12, padding: 14, background: '#ffffff08', borderRadius: 10, borderLeft: `3px solid ${selected.color || '#6366f1'}` }}>
                <strong style={{ color: selected.color || '#6366f1' }}>{selected.label}</strong>
                <p style={{ margin: '4px 0 0', color: '#bbb', fontSize: 13 }}>{selected.description}</p>
                <Badge text={selected.type} color={selected.color} />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Session Summarizer ──────────────────────────────────

function SummarizerTab({ api, sessions }) {
  const [sessionId, setSessionId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    if (!sessionId) return;
    setLoading(true);
    setSummary(null);
    const data = await api.post(`/api/ai/summarize-session/${sessionId}`, {});
    setSummary(data);
    setLoading(false);
  };

  const engagementColor = { surface: '#888', moderate: '#f59e0b', deep: '#6366f1', exceptional: '#22c55e' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary, #fff)', fontSize: 17 }}>
          📋 AI Session Summarizer
        </h3>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>
          Get an intelligent debrief of any chat session with key concepts and review questions.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            style={{ ...inputStyle, flex: 1 }}
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">— Select a session —</option>
            {sessions?.map(s => (
              <option key={s.session_id} value={s.session_id}>
                {s.title || 'Untitled Session'} ({s.personality || 'general'})
              </option>
            ))}
          </select>
          <button onClick={summarize} disabled={loading || !sessionId} style={{ ...btnStyle, margin: 0 }}>
            {loading ? 'Analyzing...' : '📋 Summarize Session'}
          </button>
        </div>
      </Card>

      {loading && <Spinner />}

      {summary && !summary.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: 'linear-gradient(135deg, #8b5cf611, #6366f111)', borderColor: '#6366f133' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 17 }}>{summary.session_title}</h3>
                <p style={{ margin: '6px 0 0', color: '#bbb', fontSize: 13, lineHeight: 1.7 }}>{summary.summary}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <Badge text={`Depth: ${summary.depth_score}/100`} color="#6366f1" />
                <Badge text={summary.engagement_quality} color={engagementColor[summary.engagement_quality] || '#888'} />
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <h4 style={sectionHead}>🧩 Key Concepts Covered</h4>
              {summary.key_concepts?.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ffffff08' }}>
                  <span style={{ color: '#ddd', fontSize: 13 }}>{c.concept}</span>
                  <Badge
                    text={c.mastery_level}
                    color={c.mastery_level === 'mastered' ? '#22c55e' : c.mastery_level === 'practiced' ? '#6366f1' : '#888'}
                  />
                </div>
              ))}
            </Card>

            <Card>
              <h4 style={sectionHead}>🕳️ Knowledge Gaps</h4>
              {summary.knowledge_gaps?.length
                ? summary.knowledge_gaps.map((g, i) => (
                  <div key={i} style={{ ...listItem, borderLeft: '3px solid #ef444466', paddingLeft: 10 }}>{g}</div>
                ))
                : <p style={{ color: '#666', fontSize: 13 }}>No major gaps identified!</p>}

              {summary.ai_observation && (
                <>
                  <h4 style={{ ...sectionHead, marginTop: 16 }}>🔍 AI Observation</h4>
                  <p style={{ color: '#a0a0b0', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{summary.ai_observation}</p>
                </>
              )}
            </Card>
          </div>

          {summary.review_questions?.length > 0 && (
            <Card>
              <h4 style={sectionHead}>❓ Review Questions (Test Yourself)</h4>
              {summary.review_questions.map((q, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 14, background: '#ffffff06', borderRadius: 10 }}>
                  <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 600 }}>Q{i + 1}. {q.question}</p>
                  <p style={{ margin: '6px 0 0', color: '#666', fontSize: 12 }}>💡 Hint: {q.hint}</p>
                </div>
              ))}
            </Card>
          )}

          {summary.next_steps?.length > 0 && (
            <Card>
              <h4 style={sectionHead}>🚀 Recommended Next Steps</h4>
              {summary.next_steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>{s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢'}</span>
                  <p style={{ margin: 0, color: '#ddd', fontSize: 13 }}>{s.step}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────

const labelStyle = { display: 'block', color: '#888', fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 };
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ffffff22',
  background: '#ffffff0a', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};
const btnStyle = {
  marginTop: 16, padding: '11px 24px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
  fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s',
  opacity: 1,
};
const sectionHead = { margin: '0 0 12px', color: '#a0a0b0', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' };
const listItem = { padding: '6px 0', color: '#ccc', fontSize: 13, borderBottom: '1px solid #ffffff06', display: 'flex', gap: 8 };

// ─── Main Component ───────────────────────────────────────────

const TABS = [
  { id: 'roadmap', label: '🗺️ Study Roadmap', desc: 'Personalized learning plan' },
  { id: 'performance', label: '🔬 Performance AI', desc: 'Weakness & pattern analysis' },
  { id: 'mindmap', label: '🕸️ Mind Map', desc: 'Visual concept graph' },
  { id: 'summarizer', label: '📋 Session Summary', desc: 'Smart debrief & review' },
];

export default function LearningIntelligence({ apiBaseUrl, token, sessions }) {
  const [activeTab, setActiveTab] = useState('roadmap');
  const api = API(apiBaseUrl, token);

  return (
    <div className="animate-fade-in page-container page-container--no-center" style={{ background: 'transparent' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🧠</div>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: 22, fontWeight: 800 }}>
              Learning Intelligence Engine
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
              Powered by Gemini AI · Adaptive · Personalized · Insightful
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : '#ffffff0a',
              color: activeTab === tab.id ? '#fff' : '#888',
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
              borderBottom: activeTab === tab.id ? '2px solid transparent' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'roadmap' && <RoadmapTab api={api} />}
      {activeTab === 'performance' && <PerformanceTab api={api} />}
      {activeTab === 'mindmap' && <MindMapTab api={api} />}
      {activeTab === 'summarizer' && <SummarizerTab api={api} sessions={sessions} />}
    </div>
  );
}