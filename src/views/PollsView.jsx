import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { castVote } from '../lib/api';
import { useToast } from '../components/Toast';

export default function PollsView({ polls, currentUserId, assets, setSelectedAsset, navigate, onVoted }) {
  const toast = useToast();
  const [now, setNow] = useState(Date.now());
  const [votingOptionId, setVotingOptionId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeLeft = (expiresAt) => {
    const remaining = new Date(expiresAt).getTime() - now;
    if (remaining <= 0) return null;
    const hrs = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return `${hrs}h ${mins}m left`;
  };

  const handleVote = async (pollId, optionId) => {
    setVotingOptionId(optionId);
    try {
      await castVote(pollId, optionId);
      onVoted();
      toast.success('Vote cast! +10 Aura ✦');
    } catch (err) {
      toast.error(err.message || 'Could not cast your vote.');
    } finally {
      setVotingOptionId(null);
    }
  };

  const handleDeepLink = (linkedItemId) => {
    const asset = assets.find(a => a.id === linkedItemId);
    if (!asset) {
      toast.warning('The linked item is no longer available.');
      return;
    }
    setSelectedAsset(asset);
    navigate('item-detail');
  };

  return (
    <div className="view-content animate-fade-in">
      <div className="view-header">
        <h1>FitCheck Polls</h1>
        <p>Vote for the best style. Each poll expires exactly 24 hours after it's created.</p>
      </div>

      {polls.length === 0 && (
        <div className="empty-state"><span>✨</span><p>No polls yet. Tap the + button to start the first FitCheck!</p></div>
      )}

      <div className="polls-section">
        {polls.map(poll => {
          const timeLeft = getTimeLeft(poll.expires_at);
          const expired = !timeLeft;
          const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);
          const myVote = poll.allVotes.find(v => v.user_id === currentUserId);
          const winningOption = expired && totalVotes > 0
            ? poll.options.reduce((best, o) => (o.voteCount > (best?.voteCount || -1) ? o : best), null)
            : null;

          return (
            <div key={poll.id} className="poll-item">
              <div className="poll-header-row">
                <h2 className="poll-title">{poll.title}</h2>
                <span className={`poll-timer ${expired ? 'expired' : ''}`}>
                  {expired ? '🔒 Poll Closed' : `⏱ ${timeLeft}`}
                </span>
              </div>
              {poll.options.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>No outfit options added yet.</p>
              )}
              <div className="poll-grid-three">
                {poll.options.map(option => {
                  const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                  const voted = myVote?.option_id === option.id;
                  const isWinner = winningOption && winningOption.id === option.id;
                  const canDeepLink = isWinner && option.linked_item_id;

                  const handleClick = () => {
                    if (canDeepLink) { handleDeepLink(option.linked_item_id); return; }
                    if (!expired && !myVote) handleVote(poll.id, option.id);
                  };

                  return (
                    <div key={option.id}
                      className={`poll-option-card ${voted ? 'voted' : ''} ${expired ? 'poll-expired-card' : ''} ${isWinner ? 'poll-winner-card' : ''}`}
                      onClick={handleClick}
                      style={canDeepLink ? { cursor: 'pointer' } : undefined}>
                      <div className="poll-image-container">
                        {option.image_url ? <img src={option.image_url} alt={option.name} className="poll-image" /> : <div className="poll-image poll-image-placeholder" />}
                        <div className="poll-overlay"></div>
                        <div className="vibe-text"><h3>VIBE CHECK</h3><p>{option.vibe}</p></div>
                        {isWinner && <span className="poll-winner-badge">🏆 Winning Fit</span>}
                      </div>
                      <div className="poll-content">
                        <div className="card-labels">
                          <span className="style-tag">STYLE VOTE</span>
                          <span className="aura-tag">+10 AURA</span>
                        </div>
                        <h3>{option.name}</h3>
                        {(myVote || expired) && (
                          <div className="vote-bar-wrap">
                            <div className="vote-bar-fill" style={{ width: `${pct}%` }}></div>
                            <span className="vote-bar-label">{pct}% ({option.voteCount})</span>
                          </div>
                        )}
                        <button className={`confirm-btn ${voted ? 'voted-btn' : ''}`} disabled={!canDeepLink && (expired || !!myVote || votingOptionId === option.id)}>
                          {canDeepLink
                            ? 'Rent This Fit →'
                            : expired
                              ? (voted ? '✓ Your Vote' : `${pct}%`)
                              : (voted ? '✓ Voted!' : votingOptionId === option.id ? 'Voting...' : `Vote for ${option.name}`)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
