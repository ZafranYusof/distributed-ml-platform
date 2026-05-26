import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function ModelCards() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [form, setForm] = useState({
    modelId: '', modelName: '', description: '', intendedUse: '', limitations: '',
    performanceMetrics: '{}', trainingDataSummary: '', hyperparameters: '{}', biasAnalysis: '{}'
  });

  const API = 'http://localhost:5005/api';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) fetchCards();
  }, [token]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/model-cards`, { headers });
      const data = await res.json();
      setCards(data);
    } catch (err) { }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    let performanceMetrics = {}, hyperparameters = {}, biasAnalysis = {};
    try { performanceMetrics = JSON.parse(form.performanceMetrics); } catch (e) {}
    try { hyperparameters = JSON.parse(form.hyperparameters); } catch (e) {}
    try { biasAnalysis = JSON.parse(form.biasAnalysis); } catch (e) {}

    try {
      await fetch(`${API}/model-cards`, {
        method: 'POST', headers,
        body: JSON.stringify({
          modelId: form.modelId, modelName: form.modelName,
          content: {
            description: form.description, intendedUse: form.intendedUse,
            limitations: form.limitations, performanceMetrics,
            trainingDataSummary: form.trainingDataSummary, hyperparameters, biasAnalysis
          }
        })
      });
      setShowCreate(false);
      setForm({ modelId: '', modelName: '', description: '', intendedUse: '', limitations: '', performanceMetrics: '{}', trainingDataSummary: '', hyperparameters: '{}', biasAnalysis: '{}' });
      fetchCards();
    } catch (err) { }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/model-cards/${id}`, { method: 'DELETE', headers });
    if (selectedCard?._id === id) setSelectedCard(null);
    fetchCards();
  };

  const exportMarkdown = (card) => {
    const blob = new Blob([card.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-card-${card.modelName || card.modelId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to access Model Cards</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Model Cards</h1>
          <p className="text-dark-400 mt-1">Auto-generated documentation for model transparency and accountability</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg hover:bg-primary-500/20">
          + Create Model Card
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-dark-400 text-center py-8"><div class="animate-pulse space-y-3"><div class="h-4 bg-dark-700 rounded w-3/4"></div><div class="h-4 bg-dark-700 rounded w-1/2"></div></div></div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12 text-dark-400 bg-dark-800 border border-dark-700 rounded-xl">
              <p className="text-4xl mb-4">📋</p>
              <p>No model cards yet</p>
            </div>
          ) : (
            cards.map(card => (
              <div key={card._id} onClick={() => setSelectedCard(card)}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${selectedCard?._id === card._id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-800 border border-dark-700 hover:border-dark-500'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-dark-200 font-medium">{card.modelName || card.modelId}</h3>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); exportMarkdown(card); }} className="text-primary-400 hover:text-primary-300 text-xs">📥</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(card._id); }} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                </div>
                <p className="text-dark-500 text-xs mt-1">{new Date(card.createdAt).toLocaleDateString()}</p>
                {card.content?.description && (
                  <p className="text-dark-400 text-sm mt-2 line-clamp-2">{card.content.description}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Card preview */}
        <div className="lg:col-span-2">
          {selectedCard ? (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{selectedCard.modelName}</h2>
                <button onClick={() => exportMarkdown(selectedCard)} className="px-3 py-1 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded text-sm hover:bg-primary-500/20">
                  Export Markdown
                </button>
              </div>

              <div className="space-y-6">
                {selectedCard.content?.description && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-dark-300">{selectedCard.content.description}</p>
                  </div>
                )}
                {selectedCard.content?.intendedUse && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Intended Use</h3>
                    <p className="text-dark-300">{selectedCard.content.intendedUse}</p>
                  </div>
                )}
                {selectedCard.content?.limitations && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Limitations</h3>
                    <p className="text-dark-300">{selectedCard.content.limitations}</p>
                  </div>
                )}
                {selectedCard.content?.performanceMetrics && Object.keys(selectedCard.content.performanceMetrics).length > 0 && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(selectedCard.content.performanceMetrics).map(([k, v]) => (
                        <div key={k} className="bg-dark-900 rounded-lg p-3">
                          <p className="text-dark-500 text-xs">{k}</p>
                          <p className="text-dark-200 font-medium">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCard.content?.trainingDataSummary && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Training Data</h3>
                    <p className="text-dark-300">{selectedCard.content.trainingDataSummary}</p>
                  </div>
                )}
                {selectedCard.content?.hyperparameters && Object.keys(selectedCard.content.hyperparameters).length > 0 && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Hyperparameters</h3>
                    <div className="bg-dark-900 rounded-lg p-4">
                      {Object.entries(selectedCard.content.hyperparameters).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-dark-700 last:border-0">
                          <span className="text-dark-400 text-sm">{k}</span>
                          <span className="text-dark-200 text-sm">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCard.content?.biasAnalysis && Object.keys(selectedCard.content.biasAnalysis).length > 0 && (
                  <div>
                    <h3 className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-2">Bias Analysis</h3>
                    <div className="bg-dark-900 rounded-lg p-4">
                      {Object.entries(selectedCard.content.biasAnalysis).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-dark-700 last:border-0">
                          <span className="text-dark-400 text-sm">{k}</span>
                          <span className="text-dark-200 text-sm">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 flex items-center justify-center h-64">
              <p className="text-dark-400">Select a model card to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Create Model Card</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-dark-400 text-sm">Model ID</label>
                <input value={form.modelId} onChange={e => setForm({ ...form, modelId: e.target.value })} required
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Model Name</label>
                <input value={form.modelName} onChange={e => setForm({ ...form, modelName: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Intended Use</label>
                <textarea value={form.intendedUse} onChange={e => setForm({ ...form, intendedUse: e.target.value })} rows={2}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Limitations</label>
                <textarea value={form.limitations} onChange={e => setForm({ ...form, limitations: e.target.value })} rows={2}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Performance Metrics (JSON)</label>
                <input value={form.performanceMetrics} onChange={e => setForm({ ...form, performanceMetrics: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200 font-mono text-sm" placeholder='{"accuracy": 0.95}' />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Training Data Summary</label>
                <textarea value={form.trainingDataSummary} onChange={e => setForm({ ...form, trainingDataSummary: e.target.value })} rows={2}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Hyperparameters (JSON)</label>
                <input value={form.hyperparameters} onChange={e => setForm({ ...form, hyperparameters: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200 font-mono text-sm" placeholder='{"lr": 0.001}' />
              </div>
              <div>
                <label className="text-dark-400 text-sm">Bias Analysis (JSON)</label>
                <input value={form.biasAnalysis} onChange={e => setForm({ ...form, biasAnalysis: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200 font-mono text-sm" placeholder='{"gender_gap": 0.02}' />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-500 text-white rounded-lg py-2 hover:bg-primary-600">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-dark-700 text-dark-300 rounded-lg py-2 hover:bg-dark-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
