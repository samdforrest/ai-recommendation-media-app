'use client';

import './App.css';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Recommendation {
  title: string;
  year: string | number;
  description: string;
}

const App = () => {
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [movies, setMovies] = useState<Recommendation[]>([]);
  const [shows, setShows] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user context from cookie token
  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.user) {
          setUser({ name: data.user.name, email: data.user.email });
        }
      } catch (err) {
        console.error('Failed to fetch user context:', err);
      }
    };
    getUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const getRecommendations = async () => {
    setLoading(true);
    setMovies([]);
    setShows([]);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Invalid JSON from server:', err);
        alert('The server returned invalid JSON.');
        return;
      }

      if (data.raw && (!data.movies?.length && !data.shows?.length)) {
        alert(data.raw);
      } else {
        setMovies(data.movies || []);
        setShows(data.shows || []);
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      alert(`Error: ${err.message || 'Something went wrong'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);

    // Remove query params from URL without reloading
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());

    window.location.reload(); // Optional if you want to refresh app state
  };


  return (
    <div className="app-container">
      {/* Top bar with login/logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>{user ? `Logged in as ${user.name}` : 'Welcome, Guest'}</div>
        {user ? (
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e53935',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        )}
      </div>

      {user && (
        <div className="user-info" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2>Welcome, {user.name}!</h2>
          <p style={{ color: '#555' }}>{user.email}</p>
        </div>
      )}

      <div className="app-header">
        <h1>AI Media Recommender</h1>
        <h3 className="subheading">Ask for your new selection of Movies and TV!</h3>
      </div>

      <div className="input-section">
        <textarea
          ref={textareaRef}
          className="prompt-input"
          rows={1}
          placeholder="What kind of shows or movies are you in the mood for?"
          value={prompt}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              getRecommendations();
            }
          }}
        />
        <button
          className="recommend-button"
          onClick={getRecommendations}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Recommendations'}
        </button>
      </div>

      <div className="results-section">
        {movies.length > 0 && (
          <div className="category" style={{ animationDelay: '0.1s' }}>
            <h2>Movies</h2>
            <ul>
              {movies.map((rec, index) => (
                <li key={index}>
                  <strong>{rec.title}</strong> ({rec.year})<br />
                  <em>{rec.description}</em>
                </li>
              ))}
            </ul>
          </div>
        )}

        {shows.length > 0 && (
          <div className="category" style={{ animationDelay: '0.2s' }}>
            <h2>TV Series</h2>
            <ul>
              {shows.map((rec, index) => (
                <li key={index}>
                  <strong>{rec.title}</strong> ({rec.year})<br />
                  <em>{rec.description}</em>
                </li>
              ))}
            </ul>
          </div>
        )}

        {movies.length === 0 && shows.length === 0 && !loading && (
          <div className="no-results">No recommendations yet.</div>
        )}
      </div>
    </div>
  );
};

export default App;
