import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function History() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await authFetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      toast.error('Failed to load training history');
    }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelectedSessions(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const startCompare = async () => {
    if (selectedSessions.length < 2) return;
    try {
      const res = await authFetch('/api/history/compare', {
        method: 'POST',
        body: JSON.stringify({ sessionIds: selectedSessions })
      });
      if (res.ok) {
        const data = await res.json();
        setCompareData(data);
        setCompareMode(true);
        toast.info(`Comparing ${selectedSessions.length} sessions`);
      }
    } catch (err) {
      toast.error('Failed to compare sessions');
    }
  };

  const deleteSession = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Training Session',
      message: 'Are you sure you want to delete this training session? The model and metrics will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s._id !== id));
        setSelectedSessions(prev => prev.filter(s => s !== id));
        toast.success('Session deleted');
      }
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  const reloadSession = (session) => {
    if (session.normalization) {
      sessionStorage.setItem(`norm-${session._id}`, JSON.stringify(session.normalization));
    }
    navigate(`/inference?session=${session._id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'training': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-dark-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'training': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Training History</h2>
          <p className="text-dark-400 mt-1">View past training sessions and compare results</p>
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Training History</h2>
          <p className="text-dark-400 mt-1">View past training sessions and compare results</p>
        </div>
        <div className="flex gap-3">
          {selectedSessions.length >= 2 && (
            <button onClick={startCompare} className="btn-primary flex items-center gap-2">
              <span>📊</span>
              <span>Compare ({selectedSessions.length})</span>
            </button>
          )}
          {compareMode && (
            <button
              onClick={() => { setCompareMode(false); setCompareData(null); setSelectedSessions([]); }}
              className="btn-secondary"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {/* Compare View */}
      {compareMode && compareData && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">📉 Loss Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={12} type="number" domain={[1, 'dataMax']} allowDuplicatedCategory={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
                  <Legend />
                  {compareData.map((session, idx) => (
                    <Line
                      key={session._id}
                      data={session.metrics.map(m => ({ epoch: m.epoch, loss: m.loss }))}
                      type="monotone"
                      dataKey="loss"
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2}
                      dot={false}
                      name={session.name || `Session ${session._id.slice(0, 6)}`}
                      animationDuration={800}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {compareData.some(s => s.config?.taskType === 'classification') && (
            <div className="card">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">📈 Accuracy Comparison</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={12} type="number" domain={[1, 'dataMax']} allowDuplicatedCategory={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
                    <Legend />
                    {compareData.map((session, idx) => (
                      <Line
                        key={session._id}
                        data={session.metrics.filter(m => m.accuracy != null).map(m => ({ epoch: m.epoch, accuracy: m.accuracy }))}
                        type="monotone"
                        dataKey="accuracy"
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        name={session.name || `Session ${session._id.slice(0, 6)}`}
                        animationDuration={800}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">📋 Configuration Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Configuration comparison">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-2 px-3 text-dark-400" scope="col">Property</th>
                    {compareData.map((s, idx) => (
                      <th key={s._id} className="text-left py-2 px-3" scope="col" style={{ color: colors[idx % colors.length] }}>
                        {s.name || `Session ${s._id.slice(0, 6)}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Architecture</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-dark-200">{s.config?.type}</td>)}</tr>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Learning Rate</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-dark-200">{s.config?.learningRate}</td>)}</tr>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Epochs</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-dark-200">{s.config?.epochs}</td>)}</tr>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Batch Size</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-dark-200">{s.config?.batchSize}</td>)}</tr>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Final Loss</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-primary-400">{s.finalMetrics?.loss?.toFixed(6) || 'N/A'}</td>)}</tr>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Final Accuracy</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-green-400">{s.finalMetrics?.accuracy?.toFixed(4) || 'N/A'}</td>)}</tr>
                  <tr className="border-b border-dark-800"><td className="py-2 px-3 text-dark-300">Workers</td>{compareData.map(s => <td key={s._id} className="py-2 px-3 text-dark-200">{s.config?.numWorkers}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Session List */}
      {!compareMode && (
        <>
          {sessions.length === 0 ? (
            <EmptyState
              icon="📜"
              title="No training history yet"
              description="Complete a training session to see it here. Your models, metrics, and configurations will be saved."
              actionLabel="Start Training"
              actionPath="/"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-dark-400">Select 2+ sessions to compare them side by side</p>
              {sessions.map(session => (
                <div
                  key={session._id}
                  className={`card card-hover flex items-center gap-4 ${
                    selectedSessions.includes(session._id) ? 'border-primary-500/50 bg-primary-500/5' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session._id)}
                    onChange={() => toggleSelect(session._id)}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
                    aria-label={`Select ${session.name || session._id.slice(0, 8)} for comparison`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{getStatusIcon(session.status)}</span>
                      <h4 className="font-medium text-dark-100 truncate">
                        {session.name || `Session ${session._id.slice(0, 8)}`}
                      </h4>
                      <span className={`text-xs ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
                      <span>{session.config?.type || 'unknown'}</span>
                      <span>{session.datasetName || 'Unknown dataset'}</span>
                      <span>{new Date(session.startedAt).toLocaleString()}</span>
                      {session.finalMetrics?.loss && (
                        <span className="text-primary-400">Loss: {session.finalMetrics.loss.toFixed(6)}</span>
                      )}
                      {session.finalMetrics?.accuracy && (
                        <span className="text-green-400">Acc: {(session.finalMetrics.accuracy * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'completed' && (
                      <button
                        onClick={() => reloadSession(session)}
                        className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
                        aria-label="Run inference with this model"
                      >
                        🔮 Inference
                      </button>
                    )}
                    <button
                      onClick={() => deleteSession(session._id)}
                      className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-red-500/20 text-dark-400 hover:text-red-400 rounded-lg transition-colors"
                      aria-label={`Delete session ${session.name || session._id.slice(0, 8)}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
