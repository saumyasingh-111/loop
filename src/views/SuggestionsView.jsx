import React, { useState } from 'react';
import { createSuggestion, upvoteSuggestion } from '../lib/api';
import { useToast } from '../components/Toast';

export default function SuggestionsView({ suggestions, myUpvotedIds, currentUserId, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState({ type: 'suggestion', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [votedLocally, setVotedLocally] = useState([]);

  const handleSubmit = async () => {
    if (!form.text.trim()) return;
    setSubmitting(true);
    try {
      await createSuggestion({ text: form.text.trim(), type: form.type, author_id: currentUserId });
      setForm({ type: form.type, text: '' });
      onChanged();
      toast.success('Thanks — sent to the Loop team.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    if (myUpvotedIds.includes(id) || votedLocally.includes(id)) return;
    setVotedLocally(prev => [...prev, id]);
    try {
      await upvoteSuggestion(id, currentUserId);
      onChanged();
    } catch (err) {
      // likely a duplicate-vote unique constraint hit — safe to ignore
    }
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header" style={{ marginBottom: '28px' }}>
        <h1>Suggestions & Help Desk</h1>
        <p>Suggest new features, report issues, or ask the support team a question.</p>
      </div>

      <div className="suggestion-form-box">
        <h3>Submit a Suggestion or Question</h3>
        <div className="sugg-type-tabs">
          <button className={`sugg-tab ${form.type === 'suggestion' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'suggestion' }))}>💡 Suggestion</button>
          <button className={`sugg-tab ${form.type === 'helpdesk' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'helpdesk' }))}>🎧 Help Desk</button>
        </div>
        <textarea
          className="review-textarea"
          style={{ marginTop: '12px' }}
          rows={3}
          placeholder={form.type === 'suggestion' ? 'e.g. Add a dark mode option...' : 'e.g. How do I cancel a request?'}
          value={form.text}
          onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
        />
        <button className="confirm-btn" style={{ marginTop: '12px', width: 'auto', padding: '10px 24px' }} onClick={handleSubmit} disabled={!form.text.trim() || submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      <h2 className="section-title" style={{ marginTop: '36px' }}>💡 Suggestions</h2>
      {suggestions.filter(s => s.type === 'suggestion').map(s => (
        <div key={s.id} className="suggestion-item">
          <div className="suggestion-body">
            <p className="suggestion-text">{s.text}</p>
            <p className="suggestion-meta">{new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <button className="upvote-btn" onClick={() => handleUpvote(s.id)}>▲ {s.votes}</button>
        </div>
      ))}

      <h2 className="section-title" style={{ marginTop: '36px' }}>🎧 Help Desk</h2>
      {suggestions.filter(s => s.type === 'helpdesk').map(s => (
        <div key={s.id} className="helpdesk-item">
          <p className="helpdesk-question">Q: {s.text}</p>
          <p className="helpdesk-meta">{new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          {s.answer ? (
            <p className="helpdesk-answer">✅ {s.answer}</p>
          ) : (
            <p className="helpdesk-pending">⏳ Awaiting response from support team.</p>
          )}
        </div>
      ))}
    </div>
  );
}
