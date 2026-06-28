import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, RotateCcw, Loader2, Sparkles, BookOpen } from 'lucide-react';

export default function Flashcards({ apiBaseUrl, onFlashcardsCreated, token }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(6);
  
  // States: 'config' | 'loading' | 'deck'
  const [viewState, setViewState] = useState('config');
  const [currentDeck, setCurrentDeck] = useState(null);
  const [flippedCards, setFlippedCards] = useState({}); // card index -> bool
  const [pastDecks, setPastDecks] = useState([]);

  // Fetch past decks
  const loadPastDecks = () => {
    fetch(`${apiBaseUrl}/api/flashcards`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPastDecks(data))
      .catch(err => console.error("Error loading past decks:", err));
  };

  useEffect(() => {
    loadPastDecks();
  }, [apiBaseUrl, token]);

  const generateDeck = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setViewState('loading');
    setFlippedCards({});

    fetch(`${apiBaseUrl}/api/flashcards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ topic, count })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to generate flashcards");
        return res.json();
      })
      .then(data => {
        setCurrentDeck(data);
        setViewState('deck');
        loadPastDecks(); // reload list
        if (onFlashcardsCreated) onFlashcardsCreated();
      })
      .catch(err => {
        alert("Error generating flashcards: " + err.message);
        setViewState('config');
      });
  };

  const toggleFlip = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const loadPastDeck = (deck) => {
    setCurrentDeck(deck);
    setFlippedCards({});
    setViewState('deck');
  };

  return (
    <div className="animate-fade-in page-container">
      {/* View Header */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers color="var(--color-primary)" />
          Study Flashcards
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Generate vocabulary lists, formulas, and terminology cards to test your memory.
        </p>
      </div>

      {/* STATE: Configuration */}
      {viewState === 'config' && (
        <div className="flashcards-config-grid">
          {/* Form */}
          <form onSubmit={generateDeck} className="glass-panel" style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            height: 'fit-content'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Create New Deck</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deck Topic</label>
              <input
                type="text"
                className="input-field"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Organic Chemistry Nomenclature, Spanish Vocab: Travel, Core Python Methods..."
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Number of Cards</label>
              <select
                className="input-field"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                <option value={4}>4 Cards</option>
                <option value={6}>6 Cards</option>
                <option value={8}>8 Cards</option>
                <option value={10}>10 Cards</option>
                <option value={12}>12 Cards</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
              Generate Cards <ArrowRight size={16} />
            </button>
          </form>

          {/* History Deck List */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '340px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Recent Decks</h3>
            <div style={{
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexGrow: 1
            }}>
              {pastDecks.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No saved decks yet.
                </div>
              ) : (
                pastDecks.map((deck) => (
                  <button
                    key={deck.set_id}
                    onClick={() => loadPastDeck(deck)}
                    className="btn btn-secondary"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      width: '100%',
                      borderColor: 'rgba(255,255,255,0.03)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'}
                  >
                    <BookOpen size={14} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deck.topic}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                      {deck.cards?.length} cards
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE: Loading */}
      {viewState === 'loading' && (
        <div className="glass-panel" style={{
          padding: '64px 32px',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <Loader2 size={48} className="pulse-glow" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tutor is generating cards...</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              Writing front/back cards with detailed explanations.
            </p>
          </div>
        </div>
      )}

      {/* STATE: Cards Deck Active */}
      {viewState === 'deck' && currentDeck && (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Deck Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Viewing Deck</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentDeck.topic}</h3>
            </div>
            
            <button onClick={() => setViewState('config')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <RotateCcw size={14} /> Back to Creator
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '8px'
          }}>
            Tip: Click a card to flip it and reveal the details.
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {currentDeck.cards.map((card, idx) => {
              const isFlipped = flippedCards[idx];
              return (
                <div 
                  key={idx}
                  className={`flashcard-container ${isFlipped ? 'is-flipped' : ''}`}
                  onClick={() => toggleFlip(idx)}
                >
                  <div className="flashcard-inner">
                    {/* Front */}
                    <div className="flashcard-front">
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', position: 'absolute', top: '16px', left: '16px' }}>Card {idx+1}</span>
                      <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>
                        {card.front}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'absolute', bottom: '16px' }}>Click to flip</span>
                    </div>

                    {/* Back */}
                    <div className="flashcard-back">
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 600, textTransform: 'uppercase', position: 'absolute', top: '16px', left: '16px' }}>Answer</span>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.5, overflowY: 'auto', maxHeight: '140px', paddingRight: '4px' }}>
                        {card.back}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
