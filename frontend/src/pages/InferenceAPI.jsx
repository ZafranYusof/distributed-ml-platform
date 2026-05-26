import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function InferenceAPI() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeploy, setShowDeploy] = useState(false);
  const [form, setForm] = useState({ modelName: '', rateLimit: 100 });
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [testInput, setTestInput] = useState('[[1, 2, 3, 4]]');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/inference-endpoints');
      const data = await res.json();
      setEndpoints(data);
    } catch (err) { }
    setLoading(false);
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    try {
      const body = {
        modelName: form.modelName,
        rateLimit: form.rateLimit,
        config: { type: 'classification', outputSize: 3 },
        weights: null,
        normalization: null
      };
      await authFetch('/api/inference-endpoints', { method: 'POST', body: JSON.stringify(body) });
      setShowDeploy(false);
      setForm({ modelName: '', rateLimit: 100 });
      fetchEndpoints();
    } catch (err) { }
  };

  const handleToggleActive = async (ep) => {
    await authFetch(`/api/inference-endpoints/${ep._id}`, {
      method: 'PUT', body: JSON.stringify({ active: !ep.active, rateLimit: ep.rateLimit })
    });
    fetchEndpoints();
  };

  const handleRegenerateKey = async (ep) => {
    const res = await authFetch(`/api/inference-endpoints/${ep._id}/regenerate-key`, { method: 'POST' });
    const data = await res.json();
    setEndpoints(prev => prev.map(e => e._id === ep._id ? data : e));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this endpoint?')) return;
    await authFetch(`/api/inference-endpoints/${id}`, { method: 'DELETE' });
    fetchEndpoints();
    if (selectedEndpoint?._id === id) setSelectedEndpoint(null);
  };

  const handleTest = async () => {
    if (!selectedEndpoint) return;
    try {
      let input;
      try { input = JSON.parse(testInput); } catch { input = testInput; }
      const res = await fetch(`/api/inference/${selectedEndpoint.modelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': selectedEndpoint.apiKey },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) { setTestResult({ error: err.message }); }
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to manage inference endpoints</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Real-time Inference API</h1>
          <p className="text-purple-300/50 mt-1">Deploy models as REST endpoints with API keys and rate limiting</p>
        </div>
        <button onClick={() => setShowDeploy(!showDeploy)} className="px-4 py-2 bg-gradient-btn text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
          + Deploy Model
        </button>
      </div>

      {/* Deploy Form */}
      {showDeploy && (
        <form onSubmit={handleDeploy} className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Deploy New Endpoint</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Model Name</label>
              <input type="text" value={form.modelName} onChange={(e) => setForm(prev => ({ ...prev, modelName: e.target.value }))} required className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. iris-classifier-v2" />
            </div>
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Rate Limit (requests/day)</label>
              <input type="number" value={form.rateLimit} onChange={(e) => setForm(prev => ({ ...prev, rateLimit: Number(e.target.value) }))} min={1} className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-gradient-btn text-white rounded-lg text-sm">Deploy</button>
            <button type="button" onClick={() => setShowDeploy(false)} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Endpoints List */}
      {loading ? (
        <div className="text-purple-300/50 text-center py-10">Loading endpoints...</div>
      ) : endpoints.length === 0 ? (
        <div className="text-center py-20 text-purple-300/50">
          <p className="text-4xl mb-4">🌐</p>
          <p>No endpoints deployed yet. Deploy a model to create your first API.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {endpoints.map(ep => (
            <div key={ep._id} className={`bg-dark-800/40 border rounded-lg p-5 ${selectedEndpoint?._id === ep._id ? 'border-primary-500' : 'border-purple-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${ep.active ? 'bg-green-400' : 'bg-dark-500'}`}></div>
                  <h3 className="text-white font-medium">{ep.modelName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ep.active ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/15 text-purple-300/50'}`}>
                    {ep.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedEndpoint(ep)} className="text-xs px-2 py-1 bg-purple-500/15 text-purple-200/70 hover:text-white rounded">Test</button>
                  <button onClick={() => handleToggleActive(ep)} className="text-xs px-2 py-1 bg-purple-500/15 text-purple-200/70 hover:text-white rounded">
                    {ep.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(ep._id)} className="text-xs px-2 py-1 bg-purple-500/15 text-red-400 hover:bg-red-500/10 rounded">Delete</button>
                </div>
              </div>

              {/* Endpoint Details */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-dark-900 rounded p-2">
                  <p className="text-xs text-purple-300/40">Requests</p>
                  <p className="text-sm text-white font-medium">{ep.requests || 0}</p>
                </div>
                <div className="bg-dark-900 rounded p-2">
                  <p className="text-xs text-purple-300/40">Errors</p>
                  <p className="text-sm text-red-400 font-medium">{ep.errors || 0}</p>
                </div>
                <div className="bg-dark-900 rounded p-2">
                  <p className="text-xs text-purple-300/40">Avg Latency</p>
                  <p className="text-sm text-white font-medium">{ep.requests > 0 ? (ep.totalLatency / ep.requests).toFixed(1) : 0}ms</p>
                </div>
                <div className="bg-dark-900 rounded p-2">
                  <p className="text-xs text-purple-300/40">Rate Limit</p>
                  <p className="text-sm text-white font-medium">{ep.rateLimit}/day</p>
                </div>
              </div>

              {/* API Key & Endpoint */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 bg-dark-900 rounded p-2">
                  <span className="text-xs text-purple-300/40">Endpoint:</span>
                  <code className="text-xs text-purple-400 flex-1">POST http://localhost:5005/api/inference/{ep.modelId}</code>
                </div>
                <div className="flex items-center gap-2 bg-dark-900 rounded p-2">
                  <span className="text-xs text-purple-300/40">API Key:</span>
                  <code className="text-xs text-purple-200/70 flex-1 font-mono">{ep.apiKey}</code>
                  <button onClick={() => handleRegenerateKey(ep)} className="text-xs text-purple-400 hover:text-purple-300">Regenerate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Panel */}
      {selectedEndpoint && (
        <div className="bg-dark-800/40 border border-primary-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Test Endpoint: {selectedEndpoint.modelName}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Input (JSON array)</label>
              <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={3} className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <button onClick={handleTest} className="px-4 py-2 bg-gradient-btn text-white rounded-lg text-sm font-medium">Send Request</button>
            {testResult && (
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-xs text-purple-300/50 mb-1">Response:</p>
                <pre className="text-xs text-purple-200/70 font-mono overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Usage Guide */}
      <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Usage Guide</h3>
        <div className="bg-dark-900 rounded-lg p-4">
          <pre className="text-xs text-purple-200/70 font-mono overflow-auto">{`# cURL example
curl -X POST http://localhost:5005/api/inference/<modelId> \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your-api-key>" \\
  -d '{"input": [[1, 2, 3, 4]]}'

# Response
{
  "predictions": [[0.7, 0.2, 0.1]],
  "latency": 5,
  "modelId": "<modelId>"
}`}</pre>
        </div>
      </div>
    </div>
  );
}
