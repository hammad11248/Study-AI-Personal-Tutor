import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, ArrowRight, CheckCircle, XCircle, RotateCcw, HelpCircle, Loader2 } from 'lucide-react';

export default function QuizGenerator({ apiBaseUrl, onQuizCreated, token }) {
  // Config states
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  
  // App workflow states: 'config' | 'loading' | 'active' | 'results'
  const [quizState, setQuizState] = useState('config');
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]); // Array of option indices
  const [grading, setGrading] = useState(null); // Results from evaluation endpoint
  const [gradingLoading, setGradingLoading] = useState(false);

  const startQuizGeneration = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setQuizState('loading');
    
    fetch(`${apiBaseUrl}/api/quizzes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: topic,
        difficulty: difficulty,
        num_questions: numQuestions
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to generate quiz");
        return res.json();
      })
      .then(data => {
        setQuiz(data);
        setUserAnswers(new Array(data.questions.length).fill(null));
        setCurrentQuestionIndex(0);
        setQuizState('active');
        // Notify parent to refresh stats
        if (onQuizCreated) onQuizCreated();
      })
      .catch(err => {
        alert("Error generating quiz: " + err.message);
        setQuizState('config');
      });
  };

  const selectOption = (optIndex) => {
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = optIndex;
      return updated;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = () => {
    if (userAnswers.includes(null)) {
      if (!confirm("You have unanswered questions. Do you still want to submit?")) {
        return;
      }
    }

    setGradingLoading(true);
    setQuizState('loading');

    fetch(`${apiBaseUrl}/api/quizzes/${quiz.quiz_id}/evaluate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers: userAnswers.map(ans => ans === null ? -1 : ans) })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to evaluate quiz");
        return res.json();
      })
      .then(data => {
        setGrading(data);
        setQuizState('results');
        if (onQuizCreated) onQuizCreated();
      })
      .catch(err => {
        alert("Error grading quiz: " + err.message);
        setQuizState('active');
      })
      .finally(() => {
        setGradingLoading(false);
      });
  };

  const resetQuiz = () => {
    setTopic('');
    setQuiz(null);
    setUserAnswers([]);
    setGrading(null);
    setQuizState('config');
  };

  return (
    <div className="animate-fade-in page-container">
      {/* View Header */}
      <div style={{ width: '100%', maxWidth: '680px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain color="var(--color-primary)" />
          Quiz Generator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Test your comprehension on any subject and receive tailored feedback.
        </p>
      </div>

      {/* STATE: Configurator */}
      {quizState === 'config' && (
        <form onSubmit={startQuizGeneration} className="glass-panel" style={{
          padding: '32px',
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Topic or Topic Description</label>
            <input
              type="text"
              className="input-field"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis vs Respiration, Python OOP concepts, American Civil War..."
              required
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Difficulty Level</label>
              <select
                className="input-field"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ appearance: 'none', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Number of Questions</label>
              <select
                className="input-field"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '12px' }}
          >
            Generate Quiz with AI <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* STATE: Loading */}
      {quizState === 'loading' && (
        <div className="glass-panel" style={{
          padding: '64px 32px',
          width: '100%',
          maxWidth: '680px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <Loader2 size={48} className="pulse-glow" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {gradingLoading ? "Tutor is grading your answers..." : "Tutor is composing your quiz..."}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              Connecting to Gemini to generate curriculum-grade questions.
            </p>
          </div>
        </div>
      )}

      {/* STATE: Quiz Taking Active */}
      {quizState === 'active' && quiz && (
        <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Progress indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span>Topic: <strong style={{ color: '#fff' }}>{quiz.topic}</strong></span>
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--color-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Question Card */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '24px' }}>
              {quiz.questions[currentQuestionIndex].question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quiz.questions[currentQuestionIndex].options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => selectOption(optIdx)}
                    className="btn btn-secondary"
                    style={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: '16px 20px',
                      backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--glass-border)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
              style={{ opacity: currentQuestionIndex === 0 ? 0.4 : 1 }}
            >
              Previous
            </button>
            
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                Submit Answers
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn btn-primary"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATE: Results */}
      {quizState === 'results' && grading && (
        <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Score Header Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '4px solid',
            borderColor: grading.score / grading.total >= 0.7 ? 'var(--color-success)' : 'var(--color-accent)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Quiz Results</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
              <span style={{ fontSize: '3rem', fontWeight: 900, color: grading.score / grading.total >= 0.7 ? 'var(--color-success)' : '#fff' }}>
                {grading.score}
              </span>
              <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ {grading.total}</span>
            </div>
            
            <span style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: grading.score / grading.total >= 0.7 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 148, 0.1)',
              color: grading.score / grading.total >= 0.7 ? 'var(--color-success)' : 'var(--color-accent)'
            }}>
              {grading.score / grading.total >= 0.9 ? 'Outstanding!' : grading.score / grading.total >= 0.7 ? 'Good Job!' : 'Keep Practicing!'}
            </span>
          </div>

          {/* Tutor Evaluation Notes */}
          <div className="glass-panel" style={{ padding: '24px 32px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>Tutor Feedback Report</h4>
            <div className="markdown-content">
              <ReactMarkdown>{grading.feedback}</ReactMarkdown>
            </div>
          </div>

          {/* Question Breakdown */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Question Review</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {quiz.questions.map((q, idx) => {
                const studentAns = userAnswers[idx];
                const correctAns = q.correct_option;
                const isCorrect = studentAns === correctAns;

                return (
                  <div key={idx} className="glass-panel" style={{
                    padding: '24px',
                    borderLeft: '4px solid',
                    borderColor: isCorrect ? 'var(--color-success)' : 'var(--color-accent)'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>Q{idx + 1}.</span>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{q.question}</p>
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isCorrect ? (
                          <CheckCircle color="var(--color-success)" size={18} />
                        ) : (
                          <XCircle color="var(--color-accent)" size={18} />
                        )}
                      </span>
                    </div>

                    {/* Options list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', paddingLeft: '24px' }}>
                      {q.options.map((opt, optIndex) => {
                        let colorStyle = 'var(--text-secondary)';
                        let weightStyle = 'normal';
                        let borderStyle = 'none';

                        if (optIndex === correctAns) {
                          colorStyle = 'var(--color-success)';
                          weightStyle = '600';
                        } else if (optIndex === studentAns && !isCorrect) {
                          colorStyle = 'var(--color-accent)';
                          weightStyle = '600';
                        }

                        return (
                          <div key={optIndex} style={{
                            fontSize: '0.85rem',
                            color: colorStyle,
                            fontWeight: weightStyle,
                            display: 'flex',
                            gap: '8px'
                          }}>
                            <span>{String.fromCharCode(65 + optIndex)}.</span>
                            <span>{opt}</span>
                            {optIndex === correctAns && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Correct Answer)</span>}
                            {optIndex === studentAns && !isCorrect && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Your Answer)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      borderLeft: '2px solid var(--glass-border)'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>Explanation:</div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={resetQuiz} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            <RotateCcw size={16} /> Try Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
