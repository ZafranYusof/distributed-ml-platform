import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function Schedules() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cronExpression: '0 */6 * * *',
    modelType: 'neural-network',
    layers: '64, 32',
    learningRate: 0.01,
    epochs: 50,
    batchSize: 32
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await authFetch('/api/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (err) {
      }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authFetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          cronExpression: form.cronExpression,
          modelConfig: {
            type: form.modelType,
            layers: form.layers.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)),
            learningRate: parseFloat(form.learningRate),
            epochs: parseInt(form.epochs),
            batchSize: parseInt(form.batchSize)
          }
        })
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', cronExpression: '0 */6 * * *', modelType: 'neural-network', layers: '64, 32', learningRate: 0.01, epochs: 50, batchSize: 32 });
        fetchSchedules();
      }
    } catch (err) {
      }
    setCreating(false);
  };

  const toggleSchedule = async (id) => {
    try {
      const res = await authFetch(`/api/schedules/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      }
  };

  const deleteSchedule = async (id) => {
    try {
      const res = await authFetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSchedules(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      }
  };

  const cronPresets = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every day at midnight', value: '0 0 * * *' },
    { label: 'Every Monday 9am', value: '0 9 * * 1' },
    { label: 'Every 30 minutes', value: '*/30 * * * *' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-dark-400 bg-dark-800 border-dark-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Scheduled Training</h2>
          <p className="text-dark-400 mt-1">Set up recurring training jobs with cron expressions</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <span>⏰</span> New Schedule
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card border-primary-500/20">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">⏰ Create Schedule</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Daily Retrain"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Cron Expression</label>
                <input
                  type="text"
                  value={form.cronExpression}
                  onChange={(e) => setForm(prev => ({ ...prev, cronExpression: e.target.value }))}
                  className="input-field w-full font-mono"
                  placeholder="0 */6 * * *"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {cronPresets.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, cronExpression: preset.value }))}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      form.cronExpression === preset.value
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                        : 'bg-dark-800 text-dark-400 border border-dark-600 hover:border-dark-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Model Type</label>
                <select
                  value={form.modelType}
                  onChange={(e) => setForm(prev => ({ ...prev, modelType: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="neural-network">Neural Network</option>
                  <option value="linear">Linear</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Learning Rate</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.learningRate}
                  onChange={(e) => setForm(prev => ({ ...prev, learningRate: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Epochs</label>
                <input
                  type="number"
                  value={form.epochs}
                  onChange={(e) => setForm(prev => ({ ...prev, epochs: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Batch Size</label>
                <input
                  type="number"
                  value={form.batchSize}
                  onChange={(e) => setForm(prev => ({ ...prev, batchSize: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Schedule'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-pulse">⏳</div>
          <p className="text-dark-400 mt-2">Loading schedules...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-dark-300 font-medium">No scheduled training jobs</p>
          <p className="text-dark-500 text-sm mt-1">Create a schedule to automate retraining</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <div key={schedule._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${schedule.enabled ? 'bg-green-400' : 'bg-dark-500'}`}></div>
                  <div>
                    <h4 className="font-medium text-dark-100">{schedule.name}</h4>
                    <p className="text-sm text-dark-400 font-mono">{schedule.cronExpression}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(schedule.lastStatus)}`}>
                    {schedule.lastStatus}
                  </span>
                  <button
                    onClick={() => toggleSchedule(schedule._id)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      schedule.enabled
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                        : 'bg-dark-800 text-dark-400 border border-dark-600 hover:border-dark-400'
                    }`}
                  >
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => deleteSchedule(schedule._id)}
                    className="text-dark-500 hover:text-red-400 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-dark-400">
                <div>
                  <span className="text-dark-500">Last Run:</span>{' '}
                  {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
                </div>
                <div>
                  <span className="text-dark-500">Runs:</span>{' '}
                  {schedule.runHistory?.length || 0} total
                </div>
                <div>
                  <span className="text-dark-500">Created:</span>{' '}
                  {new Date(schedule.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Run History */}
              {schedule.runHistory?.length > 0 && (
                <div className="mt-3 border-t border-dark-700 pt-3">
                  <p className="text-xs text-dark-500 mb-2">Recent Runs:</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {schedule.runHistory.slice(-5).reverse().map((run, i) => (
                      <div key={i} className="flex-shrink-0 bg-dark-800 rounded px-3 py-1 border border-dark-600">
                        <p className="text-xs text-dark-300">{new Date(run.startedAt).toLocaleTimeString()}</p>
                        <p className={`text-xs ${run.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                          {run.metrics?.accuracy ? `Acc: ${(run.metrics.accuracy * 100).toFixed(1)}%` : run.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
