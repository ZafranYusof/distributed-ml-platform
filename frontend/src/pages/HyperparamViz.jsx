import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useToast } from '../components/ui/Toast';

export default function HyperparamViz() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [data, setData] = useState({ experiments: [], importance: {} });
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState('');
  const [selectedParams, setSelectedParams] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('');

  useEffect(() => {
    fetchData();
  }, [tagFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/hyperparam-viz?';
      if (tagFilter) url += `tags=${tagFilter}`;
      const res = await authFetch(url);
      const result = await res.json();
      setData(result);

      // Auto-select params and metric
      if (result.experiments.length > 0) {
        const allParams = new Set();
        const allMetrics = new Set();
        result.experiments.forEach(exp => {
          Object.entries(exp.params).forEach(([k, v]) => { if (typeof v === 'number') allParams.add(k); });
          Object.entries(exp.metrics).forEach(([k, v]) => { if (typeof v === 'number') allMetrics.add(k); });
        });
        setSelectedParams(Array.from(allParams).slice(0, 4));
        if (allMetrics.size > 0) setSelectedMetric(Array.from(allMetrics)[0]);
      }
    } catch (err) { }
    setLoading(false);
  };

  // Get all unique params and metrics
  const allParams = new Set();
  const allMetrics = new Set();
  data.experiments.forEach(exp => {
    Object.entries(exp.params).forEach(([k, v]) => { if (typeof v === 'number') allParams.add(k); });
    Object.entries(exp.metrics).forEach(([k, v]) => { if (typeof v === 'number') allMetrics.add(k); });
  });

  // Prepare parallel coordinates data
  const parallelData = data.experiments.map(exp => {
    const row = { name: exp.name };
    selectedParams.forEach(p => { row[p] = exp.params[p] ?? null; });
    if (selectedMetric) row[selectedMetric] = exp.metrics[selectedMetric] ?? null;
    return row;
  }).filter(row => selectedParams.some(p => row[p] !== null));

  // Importance chart data
  const importanceData = Object.entries(data.importance)
    .map(([param, score]) => ({ param, importance: parseFloat(score.toFixed(3)) }))
    .sort((a, b) => b.importance - a.importance);

  const COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to view hyperparameter visualization</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Hyperparameter Visualization</h1>
        <p className="text-dark-400 mt-1">Explore hyperparameter-metric relationships across experiments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-dark-400 text-xs">Filter by Tag</label>
          <input value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="e.g. baseline,v2"
            className="ml-2 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-dark-200 text-sm" />
        </div>
        <div>
          <label className="text-dark-400 text-xs">Metric</label>
          <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}
            className="ml-2 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-dark-200 text-sm">
            {Array.from(allMetrics).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Param selection */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
        <p className="text-dark-400 text-sm mb-2">Select Parameters to Visualize:</p>
        <div className="flex flex-wrap gap-2">
          {Array.from(allParams).map(p => (
            <button key={p} onClick={() => {
              setSelectedParams(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
            }} className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedParams.includes(p) ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-dark-700 text-dark-400 border border-dark-600'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-dark-400"><div class="animate-pulse space-y-3"><div class="h-4 bg-dark-700 rounded w-3/4"></div><div class="h-4 bg-dark-700 rounded w-1/2"></div></div></div>
      ) : data.experiments.length === 0 ? (
        <div className="text-center py-16 text-dark-400">
          <p className="text-4xl mb-4">📉</p>
          <p>No completed experiments found. Run some experiments with hyperparameters to visualize.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parallel Coordinates (simplified as scatter plots per param vs metric) */}
          {selectedParams.map((param, idx) => (
            <div key={param} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">{param} vs {selectedMetric || 'metric'}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey={param} name={param} stroke="#64748b" type="number" />
                  <YAxis dataKey={selectedMetric} name={selectedMetric} stroke="#64748b" type="number" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={parallelData.filter(d => d[param] !== null && d[selectedMetric] !== null)} fill={COLORS[idx % COLORS.length]} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ))}

          {/* Importance Chart */}
          {importanceData.length > 0 && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 lg:col-span-2">
              <h3 className="text-white font-semibold mb-4">Hyperparameter Importance (Correlation with {selectedMetric || 'metric'})</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={importanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" domain={[0, 1]} stroke="#64748b" />
                  <YAxis dataKey="param" type="category" stroke="#64748b" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {importanceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Experiments Table */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">Experiments Data ({data.experiments.length} total)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left text-dark-400 py-2 px-3">Name</th>
                    {selectedParams.map(p => <th key={p} className="text-left text-dark-400 py-2 px-3">{p}</th>)}
                    {selectedMetric && <th className="text-left text-primary-400 py-2 px-3">{selectedMetric}</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.experiments.slice(0, 20).map(exp => (
                    <tr key={exp.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                      <td className="py-2 px-3 text-dark-200">{exp.name}</td>
                      {selectedParams.map(p => <td key={p} className="py-2 px-3 text-dark-300">{exp.params[p] ?? '-'}</td>)}
                      {selectedMetric && <td className="py-2 px-3 text-primary-400 font-medium">{exp.metrics[selectedMetric] ?? '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
