import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RATINGS = ['Excellent', 'Good', 'Okay', 'Needs Work', 'Bad'];
const RATING_EMOJI = { Excellent: '🌟', Good: '👍', Okay: '😐', 'Needs Work': '⚠️', Bad: '👎' };

export default function SeriaPortal() {
  const { user, logout, API } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState({ rating: '', comment: '', suggestion: '' });
  const [submitted, setSubmitted] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get(`${API}/materials?company=SERIA`).then(r => setMaterials(r.data)).catch(() => {});
  }, []);

  const submitFeedback = async () => {
    if (!feedback.rating) { setMsg('Please select a rating!'); return; }
    await axios.post(`${API}/materials/${selected.id}/feedback`, feedback);
    setSubmitted(s => ({ ...s, [selected.id]: true }));
    setFeedback({ rating: '', comment: '', suggestion: '' });
    setMsg('Thank you for your feedback! 🎉');
    setTimeout(() => setMsg(''), 4000);
    setSelected(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ background: '#1a1a2e', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#00C851', fontWeight: 800, fontSize: 20 }}>🏢 SERIA Portal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Hi, {user.name}!</span>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </nav>

      <div className="container">
        <div className="page-header" style={{ marginTop: 24 }}>
          <h1 className="page-title">Marketing Materials</h1>
          <p className="page-sub">View company materials and share your feedback</p>
        </div>

        {msg && <div className="card" style={{ marginBottom: 20, background: '#f0fdf4', color: '#16a34a', padding: '14px 20px', fontWeight: 600 }}>{msg}</div>}

        {selected ? (
          <div className="card">
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>← Back to Materials</button>
            <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>{selected.title}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{selected.description}</p>
            {selected.file_url && <a href={selected.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginBottom: 28 }}>🔗 View Material</a>}

            {submitted[selected.id] ? (
              <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 12, textAlign: 'center', color: '#16a34a' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <h3 style={{ fontWeight: 700 }}>Feedback Submitted!</h3>
                <p>Thanks for helping us improve.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Share Your Feedback</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  {RATINGS.map(r => (
                    <button key={r} onClick={() => setFeedback(f => ({ ...f, rating: r }))}
                      style={{ padding: '12px 18px', borderRadius: 10, border: `2px solid ${feedback.rating === r ? '#00C851' : 'var(--border)'}`, background: feedback.rating === r ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 700, color: feedback.rating === r ? '#16a34a' : 'var(--text)', fontSize: 15, transition: 'all 0.15s' }}>
                      {RATING_EMOJI[r]} {r}
                    </button>
                  ))}
                </div>
                <div className="form-group"><label className="label">Comment</label><textarea className="input" rows={3} placeholder="What did you think of this material?" value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label className="label">Suggestion</label><textarea className="input" rows={2} placeholder="Any suggestions for improvement?" value={feedback.suggestion} onChange={e => setFeedback(f => ({ ...f, suggestion: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <button className="btn btn-primary" onClick={submitFeedback} style={{ fontSize: 15, padding: '12px 28px' }}>Submit Feedback →</button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {materials.length === 0 && (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📁</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No materials yet</h3>
                <p className="text-muted">Check back soon!</p>
              </div>
            )}
            {materials.map(m => (
              <div key={m.id} className="card" onClick={() => setSelected(m)} style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📄</div>
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{m.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>{m.description}</p>
                {submitted[m.id]
                  ? <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✅ Feedback given</span>
                  : <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 13 }}>💬 Give feedback →</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
