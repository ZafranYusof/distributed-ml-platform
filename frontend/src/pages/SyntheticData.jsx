import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/ui/Toast';

const API = 'http://localhost:5005/api/synthetic-data';

export default function SyntheticData() {
  const { token } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [rows, setRows] = useState(1000);
  const [columns, setColumns] = useState([
    { name: 'age', type: 'numeric', distribution: 'normal', params: { mean: 35, std: 10 }, categories: [] },
    { name: 'income', type: 'numeric', distribution: 'normal', params: { mean: 50000, std: 15000 }, categories: [] },
    { name: 'category', type: 'categorical', distribution: 'uniform', params: {}, categories: ['A', 'B', 'C', 'D'] },
  ]);
  const [anomalyPercent, setAnomalyPercent] = useState(2);
  const [privacyEpsilon, setPrivacyEpsilon] = useState(0);
  const [generatedData, setGeneratedData] = useState(null);
  const [preview, setPreview] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState([]);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const addColumn = () => {
    setColumns([...columns, { name: `col_${columns.length}`, type: 'numeric', distribution: 'normal', params: { mean: 0, std: 1 }, categories: [] }]);
  };

  const removeColumn = (idx) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const updateColumn = (idx, field, value) => {
    const updated = [...columns];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[idx] = { ...updated[idx], [parent]: { ...updated[idx][parent], [child]: value } };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setColumns(updated);
  };

  const generate = async () => {
    setLoading(true);
    try {
      const config = { rows, columns, anomalyPercent, privacyEpsilon: privacyEpsilon || undefined };
      const res = await fetch(`${API}/generate`, { method: 'POST', headers, body: JSON.stringify({ config }) });
      const data = await res.json();
      setGeneratedData(data.csv);
      
      // Parse preview
      const lines = data.csv.split('\n');
      const hdrs = lines[0].split(',');
      const previewRows = lines.slice(1, 11).map(line => {
        const vals = line.split(',');
        const row = {};
        hdrs.forEach((h, i) => { row[h] = vals[i]; });
        return row;
      });
      setPreview(previewRows);

      // Calculate distributions for numeric columns
      const allRows = lines.slice(1).map(line => line.split(','));
      const dists = columns.filter(c => c.type === 'numeric').map((col, ci) => {
        const colIdx = columns.indexOf(col);
        const values = allRows.map(r => parseFloat(r[colIdx])).filter(v => !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const buckets = 10;
        const step = (max - min) / buckets;
        const histogram = Array(buckets).fill(0);
        values.forEach(v => {
          const bucket = Math.min(buckets - 1, Math.floor((v - min) / step));
          histogram[bucket]++;
        });
        return {
          name: col.name,
          data: histogram.map((count, i) => ({ range: `${(min + i * step).toFixed(1)}`, count }))
        };
      });
      setDistributions(dists);
    } catch (err) { }
    setLoading(false);
  };

  const saveConfig = async () => {
    if (!name.trim()) return;
    try {
      const config = { rows, columns, anomalyPercent, privacyEpsilon };
      await fetch(API, { method: 'POST', headers, body: JSON.stringify({ name, config }) });
      setName('');
      fetchConfigs();
    } catch (err) { }
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch(API, { headers });
      const data = await res.json();
      setSavedConfigs(Array.isArray(data) ? data : []);
    } catch (err) { }
  };

  const exportCSV = () => {
    if (!generatedData) return;
    const blob = new Blob([generatedData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthetic_data_${rows}rows.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Synthetic Data Generator</h1>
        <p className="text-dark-400 mt-1">Generate realistic datasets with configurable distributions and privacy</p>
      </div>

      {/* Config */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Dataset Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs text-dark-400">Rows</label>
            <input type="number" min={10} max={100000} value={rows} onChange={e => setRows(+e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="text-xs text-dark-400">Anomaly %</label>
            <input type="number" min={0} max={50} value={anomalyPercent} onChange={e => setAnomalyPercent(+e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="text-xs text-dark-400">Privacy ε (0=off)</label>
            <input type="number" min={0} max={10} step={0.1} value={privacyEpsilon} onChange={e => setPrivacyEpsilon(+e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="text-xs text-dark-400">Columns</label>
            <p className="mt-1 px-3 py-2 text-white text-lg font-bold">{columns.length}</p>
          </div>
        </div>

        {/* Column Editor */}
        <div className="space-y-3 mb-4">
          {columns.map((col, i) => (
            <div key={i} className="flex gap-3 items-center p-3 bg-dark-900 rounded-lg">
              <input value={col.name} onChange={e => updateColumn(i, 'name', e.target.value)}
                className="w-28 px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm" placeholder="Name" />
              <select value={col.type} onChange={e => updateColumn(i, 'type', e.target.value)}
                className="px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm">
                <option value="numeric">Numeric</option>
                <option value="categorical">Categorical</option>
                <option value="datetime">Datetime</option>
              </select>
              {col.type === 'numeric' && (
                <>
                  <select value={col.distribution} onChange={e => updateColumn(i, 'distribution', e.target.value)}
                    className="px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm">
                    <option value="normal">Normal</option>
                    <option value="uniform">Uniform</option>
                    <option value="exponential">Exponential</option>
                  </select>
                  {col.distribution === 'normal' && (
                    <>
                      <input type="number" value={col.params.mean || 0} onChange={e => updateColumn(i, 'params.mean', +e.target.value)}
                        className="w-20 px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm" placeholder="μ" />
                      <input type="number" value={col.params.std || 1} onChange={e => updateColumn(i, 'params.std', +e.target.value)}
                        className="w-20 px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm" placeholder="σ" />
                    </>
                  )}
                  {col.distribution === 'uniform' && (
                    <>
                      <input type="number" value={col.params.min || 0} onChange={e => updateColumn(i, 'params.min', +e.target.value)}
                        className="w-20 px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm" placeholder="Min" />
                      <input type="number" value={col.params.max || 1} onChange={e => updateColumn(i, 'params.max', +e.target.value)}
                        className="w-20 px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm" placeholder="Max" />
                    </>
                  )}
                </>
              )}
              {col.type === 'categorical' && (
                <input value={col.categories.join(',')} onChange={e => updateColumn(i, 'categories', e.target.value.split(','))}
                  className="flex-1 px-2 py-1 bg-dark-800 border border-dark-600 rounded text-white text-sm" placeholder="cat1,cat2,cat3" />
              )}
              <button onClick={() => removeColumn(i)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={addColumn} className="px-3 py-1.5 text-sm bg-dark-700 text-dark-300 rounded-lg hover:bg-dark-600">
            + Add Column
          </button>
          <button onClick={generate} disabled={loading || columns.length === 0}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Data'}
          </button>
          {generatedData && (
            <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Save Config */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-dark-400">Save Configuration</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Config name..."
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm" />
          </div>
          <button onClick={saveConfig} disabled={!name.trim()} className="px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50">
            Save
          </button>
          <button onClick={fetchConfigs} className="px-4 py-2 bg-dark-700 text-dark-300 rounded-lg">
            Load Saved
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Preview (first 10 rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  {Object.keys(preview[0]).map(h => (
                    <th key={h} className="text-left py-2 px-3 text-dark-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-dark-700/50">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="py-2 px-3 text-white font-mono text-xs">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {distributions.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Distribution Charts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {distributions.map((dist, i) => (
              <div key={i}>
                <p className="text-xs text-dark-400 mb-2">{dist.name}</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={dist.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
