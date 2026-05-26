import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/ui/Toast';

export default function MLOpsCICD() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [deployments, setDeployments] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [tab, setTab] = useState('deploy');
  const [newDeploy, setNewDeploy] = useState({ modelName: '', version: 1, accuracy: 0.9, loss: 0.1, accThreshold: 0.85, lossThreshold: 0.5 });
  const [monitorData, setMonitorData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDeployments(); fetchAudit(); }, []);

  const fetchDeployments = async () => {
    try {
      const res = await authFetch('/api/mlops/deployments');
      const data = await res.json();
      setDeployments(Array.isArray(data) ? data : []);
    } catch (err) { }
  };

  const fetchAudit = async () => {
    try {
      const res = await authFetch('/api/mlops/audit');
      const data = await res.json();
      setAuditLog(Array.isArray(data) ? data : []);
    } catch (err) { }
  };

  const createDeployment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const gateResults = {
        accuracy: newDeploy.accuracy,
        loss: newDeploy.loss,
        thresholds: { accuracy: newDeploy.accThreshold, loss: newDeploy.lossThreshold },
        passed: newDeploy.accuracy >= newDeploy.accThreshold && newDeploy.loss <= newDeploy.lossThreshold
      };
      await authFetch('/api/mlops/deployments', {
        method: 'POST',
        body: JSON.stringify({ modelId: `model-${Date.now()}`, modelName: newDeploy.modelName, version: newDeploy.version, gateResults })
      });
      setNewDeploy({ modelName: '', version: 1, accuracy: 0.9, loss: 0.1, accThreshold: 0.85, lossThreshold: 0.5 });
      fetchDeployments();
      fetchAudit();
    } catch (err) { }
    setLoading(false);
  };

  const rollback = async (id) => {
    if (!confirm('Rollback this deployment?')) return;
    await authFetch(`/api/mlops/deployments/${id}/rollback`, { method: 'POST' });
    fetchDeployments();
    fetchAudit();
  };

  const promote = async (id) => {
    await authFetch(`/api/mlops/deployments/${id}/promote`, { method: 'POST' });
    fetchDeployments();
    fetchAudit();
  };

  const simulateMonitoring = () => {
    const data = [];
    let accuracy = 0.92;
    for (let i = 0; i < 30; i++) {
      accuracy += (Math.random() - 0.52) * 0.02;
      accuracy = Math.max(0.5, Math.min(1, accuracy));
      data.push({ time: `T+${i}h`, accuracy: Number(accuracy.toFixed(4)), threshold: 0.85 });
    }
    setMonitorData(data);
  };

  const getStatusBadge = (status) => {
    const styles = {
      deployed: 'bg-green-500/20 text-green-400',
      'rolled-back': 'bg-red-500/20 text-red-400',
      gated: 'bg-yellow-500/20 text-yellow-400',
      pending: 'bg-dark-600 text-purple-200/70',
      failed: 'bg-red-500/20 text-red-400'
    };
    return styles[status] || styles.pending;
  };

  const pipelineStages = [
    { name: 'Version', icon: '📦', status: 'success' },
    { name: 'Test', icon: '🧪', status: 'success' },
    { name: 'Gate', icon: '🚧', status: 'success' },
    { name: 'Deploy', icon: '🚀', status: 'active' },
    { name: 'Monitor', icon: '📡', status: 'pending' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">MLOps CI/CD Pipeline</h1>
          <p className="text-purple-300/50 mt-1">Version, gate, deploy, and monitor ML models</p>
        </div>
        <div className="flex gap-2">
          {['deploy', 'monitor', 'audit'].map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'monitor') simulateMonitoring(); }}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize ${tab === t ? 'bg-gradient-btn text-white' : 'bg-purple-500/15 text-purple-200/70'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Pipeline */}
      <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between">
          {pipelineStages.map((stage, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex flex-col items-center ${
                stage.status === 'success' ? 'text-green-400' :
                stage.status === 'active' ? 'text-purple-400' : 'text-purple-300/40'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                  stage.status === 'success' ? 'border-green-500 bg-green-500/10' :
                  stage.status === 'active' ? 'border-primary-500 bg-primary-500/10 animate-pulse' :
                  'border-purple-500/30 bg-dark-900'
                }`}>
                  {stage.icon}
                </div>
                <span className="text-xs mt-2">{stage.name}</span>
              </div>
              {i < pipelineStages.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  stage.status === 'success' ? 'bg-green-500' : 'bg-dark-600'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {tab === 'deploy' && (
        <>
          {/* New Deployment */}
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">New Deployment</h3>
            <form onSubmit={createDeployment} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-purple-300/50">Model Name</label>
                  <input value={newDeploy.modelName} onChange={e => setNewDeploy(p => ({ ...p, modelName: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" required placeholder="my-model" />
                </div>
                <div>
                  <label className="text-xs text-purple-300/50">Version</label>
                  <input type="number" min={1} value={newDeploy.version} onChange={e => setNewDeploy(p => ({ ...p, version: +e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-xs text-purple-300/50">Model Accuracy</label>
                  <input type="number" min={0} max={1} step={0.01} value={newDeploy.accuracy}
                    onChange={e => setNewDeploy(p => ({ ...p, accuracy: +e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-xs text-purple-300/50">Model Loss</label>
                  <input type="number" min={0} max={10} step={0.01} value={newDeploy.loss}
                    onChange={e => setNewDeploy(p => ({ ...p, loss: +e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-xs text-purple-300/50">Accuracy Threshold</label>
                  <input type="number" min={0} max={1} step={0.01} value={newDeploy.accThreshold}
                    onChange={e => setNewDeploy(p => ({ ...p, accThreshold: +e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-xs text-purple-300/50">Loss Threshold</label>
                  <input type="number" min={0} max={10} step={0.01} value={newDeploy.lossThreshold}
                    onChange={e => setNewDeploy(p => ({ ...p, lossThreshold: +e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" disabled={loading || !newDeploy.modelName}
                  className="px-6 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                  Deploy Model
                </button>
                <span className="text-xs text-purple-300/50">
                  Gate: acc ≥ {newDeploy.accThreshold} & loss ≤ {newDeploy.lossThreshold} →{' '}
                  {newDeploy.accuracy >= newDeploy.accThreshold && newDeploy.loss <= newDeploy.lossThreshold
                    ? <span className="text-green-400">PASS ✓</span>
                    : <span className="text-red-400">FAIL ✗</span>}
                </span>
              </div>
            </form>
          </div>

          {/* Deployments List */}
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Deployments</h3>
            {deployments.length === 0 ? (
              <p className="text-purple-300/50 text-center py-8">No deployments yet</p>
            ) : (
              <div className="space-y-3">
                {deployments.map(d => (
                  <div key={d._id} className="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white font-medium">{d.modelName}</p>
                        <p className="text-xs text-purple-300/50">v{d.version} · {new Date(d.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.gateResults && (
                        <span className="text-xs text-purple-300/50">
                          acc: {d.gateResults.accuracy?.toFixed(2)} | loss: {d.gateResults.loss?.toFixed(2)}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(d.status)}`}>{d.status}</span>
                      {d.status === 'deployed' && (
                        <button onClick={() => rollback(d._id)} className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">
                          Rollback
                        </button>
                      )}
                      {d.status === 'gated' && (
                        <button onClick={() => promote(d._id)} className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded hover:bg-green-600/30">
                          Promote
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'monitor' && (
        <div className="space-y-4">
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Production Model Monitoring</h3>
            {monitorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monitorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                  <XAxis dataKey="time" stroke="#6b5b95" />
                  <YAxis stroke="#6b5b95" domain={[0.5, 1]} />
                  <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} name="Accuracy" dot={false} />
                  <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" name="Threshold" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-purple-300/50 text-center py-8">Click "Monitor" tab to simulate monitoring data</p>
            )}
          </div>
          <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
            <p className="text-xs text-purple-300/50">
              Auto-rollback triggers when accuracy drops below threshold for 3 consecutive checks.
              The system will revert to the previous stable version and log the event.
            </p>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Audit Trail</h3>
          {auditLog.length === 0 ? (
            <p className="text-purple-300/50 text-center py-8">No audit events yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLog.map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-dark-900 rounded-lg">
                  <span className="text-lg">
                    {log.action === 'deploy' ? '🚀' : log.action === 'rollback' ? '⏪' : log.action === 'promote' ? '⬆️' : '🚧'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-white capitalize">{log.action}</p>
                    <p className="text-xs text-purple-300/50">
                      {log.details?.modelName} v{log.details?.version}
                    </p>
                  </div>
                  <span className="text-xs text-purple-300/40">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
