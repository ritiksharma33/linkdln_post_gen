import React, { useState } from 'react';
import './App.css';

// --- SVG Icons ---
const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6Z"/><path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/></svg> );
const SparkleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.5 8.5L4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3z" /><path d="M5 3v4h4" /><path d="M19 17v4h-4" /></svg> );
// --- ADDED THIS ICON ---
const NewPostIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg> );


function App() {
  // --- State Management ---
  const [topic, setTopic] = useState('');
  const [post, setPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // --- New State for Follow-up Questions ---
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});

  // --- Handle Input Change for Follow-up Answers ---
  const handleAnswerChange = (question, answer) => {
    setUserAnswers(prev => ({ ...prev, [question]: answer }));
  };

  // --- API Call Logic ---
  const handleSubmit = async (isInitialSubmit = true) => {
    setIsLoading(true);
    setError(null);
    setPost('');
    setCopySuccess('');

    let bodyPayload;
    if (isInitialSubmit) {
      bodyPayload = { topic };
    } else {
      bodyPayload = { topic, details: userAnswers };
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong.');
      }

      const data = await response.json();

      if (data.post) {
        setPost(data.post);
        setFollowUpQuestions([]); // Clear questions on final success
        setUserAnswers({});
      } else if (data.followUpQuestions) {
        setFollowUpQuestions(data.followUpQuestions);
        // Initialize answers object
        const initialAnswers = data.followUpQuestions.reduce((acc, q) => ({ ...acc, [q]: '' }), {});
        setUserAnswers(initialAnswers);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (post) {
      navigator.clipboard.writeText(post).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2500);
      });
    }
  };

  // --- ADDED THIS FUNCTION ---
  const handleReset = () => {
    setTopic('');
    setPost('');
    setError(null);
    setFollowUpQuestions([]);
    setUserAnswers({});
    setCopySuccess('');
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <h1>LinkedIn Post Spark ✨</h1>
          <p>Generate engaging LinkedIn posts with the power of AI</p>
        </header>

        {/* --- Step 1: Initial Topic Input --- */}
        {followUpQuestions.length === 0 && !post && (
          <div className="input-section">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., I won the Delhi Industrial Ideathon..."
              className="topic-input"
              rows="3"
            />
            <button
              onClick={() => handleSubmit(true)}
              disabled={isLoading || !topic.trim()}
              className="generate-button"
            >
              {isLoading ? 'Analyzing...' : <><SparkleIcon /> Generate Post</>}
            </button>
          </div>
        )}

        {/* --- Step 2: Follow-up Questions --- */}
        {followUpQuestions.length > 0 && (
          <div className="follow-up-section">
            <h3>Tell me a bit more...</h3>
            {followUpQuestions.map((q, index) => (
              <div key={index} className="question-group">
                <label>{q}</label>
                <input
                  type="text"
                  value={userAnswers[q] || ''}
                  onChange={(e) => handleAnswerChange(q, e.target.value)}
                  className="answer-input"
                />
              </div>
            ))}
            <button
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
              className="generate-button"
            >
              {isLoading ? 'Generating...' : '✨ Create My Post'}
            </button>
          </div>
        )}

        {/* --- Loading, Error, and Final Post Display --- */}
        {error && <div className="error-message">{error}</div>}
        {isLoading && (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Crafting your post...</p>
          </div>
        )}
        {post && (
          <div className="post-output-container">
            {/* --- MODIFIED THIS SECTION --- */}
            <div className="post-output-header">
              <h2>Your Generated Post</h2>
              <div className="button-group">
                <button onClick={copyToClipboard} className="copy-button">
                  <CopyIcon /> {copySuccess || 'Copy'}
                </button>
                <button onClick={handleReset} className="new-post-button">
                  <NewPostIcon /> Generate New
                </button>
              </div>
            </div>
            {/* --- END OF MODIFIED SECTION --- */}
            <div className="post-output">
              <p style={{ whiteSpace: 'pre-wrap' }}>{post}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;