import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RATINGS = ['Excellent', 'Good', 'Okay', 'Needs Work', 'Bad'];
const RATING_COLORS = { Excellent: '#10b981', Good: '#3b82f6', Okay: '#f59e0b', 'Needs Work': '#f97316', Bad: '#ef4444' };
const RATING_EMOJI = { Excellent: '🌟', Good: '👍', Okay: '😐', 'Needs Work': '⚠️', Bad: '👎' };

export default function MaterialsPage() {
  const { user, API } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState({ rating: '', comment: '', suggestion: '' });
  const [submitted, setSubmitted] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', file_url: '', type: 'document', company: 'BIZAXL' });
  const [msg, setMsg] = useState('');

  const fetchMaterials = () => axios.get(`${API}/materials?company=${user.company}`).then(r => setMaterials(r.data)).catch(() => {});
  useEffect(() => { fetchMaterials(); }, []);

  const createMaterial = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/materials`, form);
    setShowForm(false); fetchMaterials();
  };

  const submitFeedback = async (materialId) => {
    if (!feedback.rating) { setMsg('Please select a rating'); return; }
    await axios.post(`${API}/materials/${materialId}/feedback`, feedback);
    setSubmitted(s => ({ ...s, [materialId]: true }));
    setFeedback({ rating: '', comment: '', suggestion: '' });
    setMsg('Feedback submitted! Thank you ✅');
    setTimeout(() => setMsg(''), 3000);
    setSelected(null);
  };

  return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📁 Materials</h1>
          <p className="page-sub">Company documents and resources</p>
        </div>
        {user.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Material</button>}
      </div>

      {msg && <div className="card" style={{ marginBottom: 16, background: '#f0fdf4', color: '#16a34a', padding: '12px 16px' }}>{msg}</div>}

      {showForm && user.role === 'admin' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>New Material</h3>
          <form onSubmit={createMaterial}>
            <div className="form-group"><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div className="form-group"><label className="label">File URL (Google Drive, Notion, etc.)</label><input className="input" type="url" value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} /></div>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Type</label>
                <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="document">📄 Document</option>
                  <option value="presentation">📊 Presentation</option>
                  <option value="video">🎥 Video</option>
                  <option value="guide">📚 Guide</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Company</label>
                <select className="select" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}>
                  <option value="BIZAXL">BIZAXL</option>
                  <option value="SERIA">SERIA</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">Publish</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selected ? (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>← Back</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{selected.title}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{selected.description}</p>
          {selected.file_url && <a href={selected.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginBottom: 24 }}>🔗 Open File</a>}

          {submitted[selected.id] ? (
            <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 10, color: '#16a34a', fontWeight: 600 }}>✅ Feedback submitted! Thank you.</div>
          ) : (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Rate this material</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {RATINGS.map(r => (
                  <button key={r} onClick={() => setFeedback(f => ({ ...f, rating: r }))}
                    style={{ padding: '10px 16px', borderRadius: 10, border: `2px solid ${feedback.rating === r ? RATING_COLORS[r] : 'var(--border)'}`, background: feedback.rating === r ? RATING_COLORS[r] + '20' : 'white', cursor: 'pointer', fontWeight: 600, color: feedback.rating === r ? RATING_COLORS[r] : 'var(--text)', transition: 'all 0.15s' }}>
                    {RATING_EMOJI[r]} {r}
                  </button>
                ))}
              </div>
              <div className="form-group"><label className="label">Comment</label><textarea className="input" rows={3} placeholder="What did you think?" value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} style={{ resize: 'vertical' }} /></div>
              <div className="form-group"><label className="label">Suggestion</label><textarea className="input" rows={2} placeholder="Any improvements?" value={feedback.suggestion} onChange={e => setFeedback(f => ({ ...f, suggestion: e.target.value }))} style={{ resize: 'vertical' }} /></div>
              <button className="btn btn-primary" onClick={() => submitFeedback(selected.id)}>Submit Feedback</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {materials.length === 0 && <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}><div style={{ fontSize: 48 }}>📁</div><p className="text-muted" style={{ marginTop: 12 }}>No materials yet.</p></div>}
          {materials.map(m => (
            <div key={m.id} className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              onClick={() => setSelected(m)}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{m.type === 'video' ? '🎥' : m.type === 'presentation' ? '📊' : m.type === 'guide' ? '📚' : '📄'}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{m.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{m.description}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, background: '#f3f4f6', padding: '3px 10px', borderRadius: 20, color: 'var(--muted)' }}>{m.type}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>by {m.created_by}</span>
              </div>
              {submitted[m.id] && <div style={{ marginTop: 10, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>✅ Feedback given</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
