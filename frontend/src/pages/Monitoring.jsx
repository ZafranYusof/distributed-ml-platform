import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import HowToUse from '../components/ui/HowToUse';

export default function Monitoring() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSimulate, setShowSimulate] = useState(false);
  const [simForm, setSimForm] = useState({ modelId: '', modelName: '', numSamples: 50 });
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchModels();
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (selectedModel) fetchLogs();
  }, [selectedModel]);

  const fetchModels = async () => {
    try {
      const res = await authFetch('/api/monitoring/models');
      const data = await res.json();
      setModels(data);
      if (data.length > 0) setSelectedModel(data[0].modelId);
    } catch (err) { }
    setLoading(false);
  };

  const fetchLogs = async () => {
    try {
      const res = await authFetch(`/api/monitoring?modelId=${selectedModel}&limit=50`);
      const data = await res.json();
      setLogs(data.reverse());
    } catch (err) { }
  };

  const fetchAlerts = async () => {
    try {
      const res = await authFetch('/api/monitoring/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (err) { }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    const n = parseInt(simForm.numSamples) || 50;
    const predictions = Array.from({ length: n }, () => Math.random());
    const actuals = Array.from({ length: n }, (_, i) => {
      const drift = (i / n) * 0.3;
      return Math.random() * (1 + drift);
    });
    try {
      await authFetch('/api/monitoring', {
        method: 'POST',
        body: JSON.stringify({
          modelId: simForm.modelId || 'model-1',
          modelName: simForm.modelName || 'My Model',
          predictions, actuals
        })
      });
      setShowSimulate(false);
      fetchModels();
      fetchAlerts();
      if (selectedModel === simForm.modelId) fetchLogs();
    } catch (err) { }
  };

  const handleRetrain = async () => {
    try {
      await authFetch('/api/monitoring/retrain', {
        method: 'POST',
        body: JSON.stringify({ modelId: selectedModel })
      });
      toast.success('Retrain triggered for ' + selectedModel);
    } catch (err) {
      toast.error('Failed to trigger retrain');
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'data_drift': return 'text-orange-400 bg-orange-500/10';
      case 'concept_drift': return 'text-red-400 bg-red-500/10';
      case 'accuracy_drop': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-purple-300/50 bg-purple-500/15';
    }
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to access monitoring</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="monitoring" steps={[
      'Select a deployed model to monitor.',
      'Log predictions and actual outcomes.',
      'View drift detection alerts.',
      'Click \'Retrain\' if performance degrades.'
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Model Monitoring & Drift Detection</h1>
          <p className="text-purple-300/50 mt-1">Track model performance, detect data/concept drift, manage alerts</p>
        </div>
        <button onClick={() => setShowSimulate(true)} className="px-4 py-2 bg-purple-500/10 text-purple-300 border border-primary-500/20 rounded-lg hover:bg-primary-500/20">
          + Simulate Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['overview', 'alerts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-purple-500/20 text-purple-300' : 'text-purple-300/50 hover:text-dark-200'}`}>
            {t === 'overview' ? <><BarChart3 className="w-4 h-4 inline mr-1" /> Overview</> : <><AlertTriangle className="w-4 h-4 inline mr-1" /> Alerts ({alerts.length})</>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Model selector */}
          <div className="flex items-center gap-4">
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
              className="bg-dark-800/40 border border-purple-500/30 text-dark-200 rounded-lg px-4 py-2">
              {models.map(m => (
                <option key={m.modelId} value={m.modelId}>{m.modelName || m.modelId}</option>
              ))}
            </select>
            <button onClick={handleRetrain} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm">
              <RefreshCw className="w-4 h-4 inline mr-1" /> Trigger Retrain
            </button>
          </div>

          {logs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accuracy over time */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Accuracy Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={logs.map((l, i) => ({ idx: i + 1, accuracy: (l.accuracy * 100).toFixed(1), timestamp: new Date(l.timestamp).toLocaleDateString() }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis dataKey="idx" stroke="#6b5b95" />
                    <YAxis stroke="#6b5b95" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Drift Score over time */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Data Drift Score</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={logs.map((l, i) => ({ idx: i + 1, drift: l.driftScore?.toFixed(3) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis dataKey="idx" stroke="#6b5b95" />
                    <YAxis stroke="#6b5b95" />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                    <Line type="monotone" dataKey="drift" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Concept Drift */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Concept Drift Score</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={logs.map((l, i) => ({ idx: i + 1, conceptDrift: l.conceptDriftScore?.toFixed(3) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis dataKey="idx" stroke="#6b5b95" />
                    <YAxis stroke="#6b5b95" />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                    <Bar dataKey="conceptDrift" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Summary Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-900 rounded-lg p-4">
                    <p className="text-purple-300/50 text-xs">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-purple-400">{(logs.reduce((s, l) => s + l.accuracy, 0) / logs.length * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-dark-900 rounded-lg p-4">
                    <p className="text-purple-300/50 text-xs">Avg Drift Score</p>
                    <p className="text-2xl font-bold text-yellow-400">{(logs.reduce((s, l) => s + l.driftScore, 0) / logs.length).toFixed(3)}</p>
                  </div>
                  <div className="bg-dark-900 rounded-lg p-4">
                    <p className="text-purple-300/50 text-xs">Total Alerts</p>
                    <p className="text-2xl font-bold text-red-400">{logs.filter(l => l.alertTriggered).length}</p>
                  </div>
                  <div className="bg-dark-900 rounded-lg p-4">
                    <p className="text-purple-300/50 text-xs">Log Entries</p>
                    <p className="text-2xl font-bold text-dark-200">{logs.length}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-purple-300/50">
              <BarChart3 className="w-10 h-10 text-purple-400 mx-auto mb-4" />
              <p>No monitoring data yet. Simulate some data to get started.</p>
            </div>
          )}
        </>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-16 text-purple-300/50">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <p>No alerts. All models performing within thresholds.</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert._id} className={`p-4 rounded-lg border border-purple-500/20 ${getAlertColor(alert.alertType)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{alert.alertType.replace('_', ' ').toUpperCase()}</span>
                    <span className="ml-3 text-sm opacity-75">Model: {alert.modelName || alert.modelId}</span>
                  </div>
                  <span className="text-xs opacity-60">{new Date(alert.timestamp).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-sm opacity-75">
                  Drift: {alert.driftScore?.toFixed(3)} | Accuracy: {(alert.accuracy * 100).toFixed(1)}%
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Simulate Modal */}
      {showSimulate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">Simulate Monitoring Data</h3>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="text-purple-300/50 text-sm">Model ID</label>
                <input value={simForm.modelId} onChange={e => setSimForm({ ...simForm, modelId: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" placeholder="model-1" />
              </div>
              <div>
                <label className="text-purple-300/50 text-sm">Model Name</label>
                <input value={simForm.modelName} onChange={e => setSimForm({ ...simForm, modelName: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" placeholder="My Model" />
              </div>
              <div>
                <label className="text-purple-300/50 text-sm">Number of Samples</label>
                <input type="number" value={simForm.numSamples} onChange={e => setSimForm({ ...simForm, numSamples: e.target.value })}
                  className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-btn text-white rounded-lg py-2 hover:bg-primary-600">Simulate</button>
                <button type="button" onClick={() => setShowSimulate(false)} className="flex-1 bg-purple-500/15 text-purple-200/70 rounded-lg py-2 hover:bg-purple-500/20">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
