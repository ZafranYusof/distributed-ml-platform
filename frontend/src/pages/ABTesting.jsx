import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '../components/ui/Toast';
import { FlaskConical, Loader, Play, Pause, Trash2 } from 'lucide-react';

export default function ABTesting() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testDetail, setTestDetail] = useState(null);
  const [form, setForm] = useState({
    name: '',
    modelAName: 'Model A',
    modelBName: 'Model B',
    trafficSplit: 50
  });
  const [creating, setCreating] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await authFetch('/api/abtesting');
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch (err) {
      }
    setLoading(false);
  };

  const fetchTestDetail = async (id) => {
    try {
      const res = await authFetch(`/api/abtesting/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTestDetail(data);
      }
    } catch (err) {
      }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authFetch('/api/abtesting', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          modelA: { name: form.modelAName, config: { type: 'neural-network', layers: [64, 32] } },
          modelB: { name: form.modelBName, config: { type: 'neural-network', layers: [128, 64] } },
          trafficSplit: parseInt(form.trafficSplit)
        })
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', modelAName: 'Model A', modelBName: 'Model B', trafficSplit: 50 });
        fetchTests();
      }
    } catch (err) {
      }
    setCreating(false);
  };

  const simulatePredictions = async (testId) => {
    setSimulating(true);
    try {
      // Simulate 20 predictions
      for (let i = 0; i < 20; i++) {
        const input = { x: Math.random() * 10 };
        const prediction = Math.random() * 100;
        const actual = prediction + (Math.random() - 0.5) * 20;

        await authFetch(`/api/abtesting/${testId}/predict`, {
          method: 'POST',
          body: JSON.stringify({ input, prediction, actual })
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      fetchTests();
      if (selectedTest === testId) fetchTestDetail(testId);
    } catch (err) {
      }
    setSimulating(false);
  };

  const updateStatus = async (testId, status) => {
    try {
      await authFetch(`/api/abtesting/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchTests();
    } catch (err) {
      }
  };

  const deleteTest = async (testId) => {
    try {
      await authFetch(`/api/abtesting/${testId}`, { method: 'DELETE' });
      setTests(prev => prev.filter(t => t._id !== testId));
      if (selectedTest === testId) {
        setSelectedTest(null);
        setTestDetail(null);
      }
    } catch (err) {
      }
  };

  const getChartData = () => {
    if (!testDetail?.results) return [];
    const data = [];
    let modelAErrors = [];
    let modelBErrors = [];

    testDetail.results.forEach((r, i) => {
      if (r.model === 'A') modelAErrors.push(r.error || 0);
      else modelBErrors.push(r.error || 0);

      if ((i + 1) % 5 === 0 || i === testDetail.results.length - 1) {
        const avgA = modelAErrors.length > 0 ? modelAErrors.reduce((a, b) => a + b, 0) / modelAErrors.length : null;
        const avgB = modelBErrors.length > 0 ? modelBErrors.reduce((a, b) => a + b, 0) / modelBErrors.length : null;
        data.push({
          batch: data.length + 1,
          modelA: avgA !== null ? parseFloat(avgA.toFixed(4)) : null,
          modelB: avgB !== null ? parseFloat(avgB.toFixed(4)) : null
        });
        modelAErrors = [];
        modelBErrors = [];
      }
    });
    return data;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">A/B Testing</h2>
          <p className="text-purple-300/50 mt-1">Compare model performance with traffic splitting</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <FlaskConical className="w-4 h-4" /> New A/B Test
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4"><FlaskConical className="w-5 h-5 inline mr-1" /> Create A/B Test</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-purple-200/70 mb-1">Test Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-field w-full"
                placeholder="MLP vs Deep MLP"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-purple-200/70 mb-1">Model A Name</label>
                <input
                  type="text"
                  value={form.modelAName}
                  onChange={(e) => setForm(prev => ({ ...prev, modelAName: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Model A"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-200/70 mb-1">Model B Name</label>
                <input
                  type="text"
                  value={form.modelBName}
                  onChange={(e) => setForm(prev => ({ ...prev, modelBName: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Model B"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1">
                Traffic Split (Model A: {form.trafficSplit}% / Model B: {100 - form.trafficSplit}%)
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={form.trafficSplit}
                onChange={(e) => setForm(prev => ({ ...prev, trafficSplit: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-purple-300/40 mt-1">
                <span>Model A heavy</span>
                <span>Equal</span>
                <span>Model B heavy</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Test'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-pulse"><Loader className="w-8 h-8 text-purple-400 animate-spin mx-auto" /></div>
          <p className="text-purple-300/50 mt-2">Loading tests...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="card text-center py-12">
          <FlaskConical className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-purple-200/70 font-medium">No A/B tests yet</p>
          <p className="text-purple-300/40 text-sm mt-1">Create a test to compare model performance</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => (
            <div key={test._id} className={`card transition-colors ${selectedTest === test._id ? 'border-primary-500/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${test.status === 'active' ? 'bg-green-400 animate-pulse' : test.status === 'paused' ? 'bg-yellow-400' : 'bg-dark-500'}`}></div>
                  <div>
                    <h4 className="font-medium text-white">{test.name}</h4>
                    <p className="text-xs text-purple-300/50">
                      {test.modelA?.name} ({test.trafficSplit}%) vs {test.modelB?.name} ({100 - test.trafficSplit}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => simulatePredictions(test._id)}
                    disabled={simulating || test.status !== 'active'}
                    className="text-xs bg-purple-500/10 text-purple-300 border border-primary-500/20 px-3 py-1 rounded-lg hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                  >
                    {simulating ? <Loader className="w-3 h-3 inline animate-spin" /> : <Play className="w-3 h-3 inline" />} Simulate
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTest(test._id === selectedTest ? null : test._id);
                      if (test._id !== selectedTest) fetchTestDetail(test._id);
                    }}
                    className="text-xs bg-dark-800/40 text-purple-200/70 border border-purple-500/30 px-3 py-1 rounded-lg hover:border-dark-400 transition-colors"
                  >
                    {selectedTest === test._id ? 'Hide' : 'Details'}
                  </button>
                  {test.status === 'active' ? (
                    <button onClick={() => updateStatus(test._id, 'paused')} className="text-xs text-yellow-400 hover:text-yellow-300">⏸</button>
                  ) : test.status === 'paused' ? (
                    <button onClick={() => updateStatus(test._id, 'active')} className="text-xs text-green-400 hover:text-green-300"><Play className="w-3 h-3" /></button>
                  ) : null}
                  <button onClick={() => deleteTest(test._id)} className="text-xs text-purple-300/40 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-3 grid grid-cols-4 gap-3">
                <div className="bg-dark-800/40 rounded-lg p-2 border border-purple-500/30 text-center">
                  <p className="text-xs text-purple-300/40">Total</p>
                  <p className="text-sm font-bold text-dark-200">{test.summary?.totalRequests || 0}</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-2 border border-purple-500/30 text-center">
                  <p className="text-xs text-purple-300/40">Model A</p>
                  <p className="text-sm font-bold text-blue-400">{test.summary?.modelARequests || 0}</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-2 border border-purple-500/30 text-center">
                  <p className="text-xs text-purple-300/40">Model B</p>
                  <p className="text-sm font-bold text-purple-400">{test.summary?.modelBRequests || 0}</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-2 border border-purple-500/30 text-center">
                  <p className="text-xs text-purple-300/40">Winner</p>
                  <p className="text-sm font-bold text-green-400">
                    {test.summary?.totalRequests > 0
                      ? (test.summary.modelAAvgError <= test.summary.modelBAvgError ? 'A' : 'B')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Detail View */}
              {selectedTest === test._id && testDetail && (
                <div className="mt-4 border-t border-purple-500/20 pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-400">{testDetail.modelA?.name}</p>
                      <p className="text-xs text-purple-300/50 mt-1">Avg Error: {testDetail.summary?.modelAAvgError?.toFixed(4) || 'N/A'}</p>
                      <p className="text-xs text-purple-300/50">Requests: {testDetail.summary?.modelARequests || 0}</p>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-purple-400">{testDetail.modelB?.name}</p>
                      <p className="text-xs text-purple-300/50 mt-1">Avg Error: {testDetail.summary?.modelBAvgError?.toFixed(4) || 'N/A'}</p>
                      <p className="text-xs text-purple-300/50">Requests: {testDetail.summary?.modelBRequests || 0}</p>
                    </div>
                  </div>

                  {/* Chart */}
                  {testDetail.results?.length > 0 && (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                          <XAxis dataKey="batch" tick={{ fill: '#A78BFA', fontSize: 11 }} label={{ value: 'Batch', fill: '#A78BFA', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#A78BFA', fontSize: 11 }} label={{ value: 'Avg Error', angle: -90, fill: '#A78BFA', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
                          <Legend />
                          <Line type="monotone" dataKey="modelA" stroke="#3b82f6" strokeWidth={2} dot={false} name={testDetail.modelA?.name} />
                          <Line type="monotone" dataKey="modelB" stroke="#a855f7" strokeWidth={2} dot={false} name={testDetail.modelB?.name} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
