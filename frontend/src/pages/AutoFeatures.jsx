import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AutoFeatures() {
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [config, setConfig] = useState({
    polynomial: true, polynomialDegree: 2,
    interactions: true,
    binning: true, binningMethod: 'equal-width', numBins: 5,
    oneHot: true,
    topK: 10
  });
  const [generatedFeatures, setGeneratedFeatures] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSampleDataset = () => {
    // Generate a sample dataset
    const numSamples = 100;
    const data = Array.from({ length: numSamples }, (_, i) => ({
      age: Math.floor(Math.random() * 60 + 18),
      income: Math.floor(Math.random() * 80000 + 20000),
      education: ['high_school', 'bachelors', 'masters', 'phd'][Math.floor(Math.random() * 4)],
      experience: Math.floor(Math.random() * 30),
      target: 0
    }));
    // Generate target based on features
    data.forEach(row => {
      row.target = (row.income > 50000 && row.experience > 10) ? 1 : 0;
    });
    setDataset({ columns: ['age', 'income', 'education', 'experience'], target: 'target', data, numericCols: ['age', 'income', 'experience'], categoricalCols: ['education'] });
  };

  const generateFeatures = () => {
    if (!dataset) return;
    setLoading(true);

    const features = [];
    const { numericCols, categoricalCols, data } = dataset;

    // Polynomial features
    if (config.polynomial) {
      for (const col of numericCols) {
        for (let d = 2; d <= config.polynomialDegree; d++) {
          const values = data.map(row => Math.pow(row[col], d));
          const correlation = calculateCorrelation(values, data.map(r => r.target));
          features.push({
            name: `${col}^${d}`,
            type: 'polynomial',
            correlation: parseFloat(correlation.toFixed(4)),
            absCorrelation: Math.abs(correlation),
            preview: values.slice(0, 5).map(v => v.toFixed(2))
          });
        }
      }
    }

    // Interaction features
    if (config.interactions) {
      for (let i = 0; i < numericCols.length; i++) {
        for (let j = i + 1; j < numericCols.length; j++) {
          const col1 = numericCols[i], col2 = numericCols[j];
          const values = data.map(row => row[col1] * row[col2]);
          const correlation = calculateCorrelation(values, data.map(r => r.target));
          features.push({
            name: `${col1} × ${col2}`,
            type: 'interaction',
            correlation: parseFloat(correlation.toFixed(4)),
            absCorrelation: Math.abs(correlation),
            preview: values.slice(0, 5).map(v => v.toFixed(2))
          });
        }
      }
    }

    // Binning features
    if (config.binning) {
      for (const col of numericCols) {
        const values = data.map(row => row[col]);
        const min = Math.min(...values);
        const max = Math.max(...values);

        let binned;
        if (config.binningMethod === 'equal-width') {
          const binWidth = (max - min) / config.numBins;
          binned = values.map(v => Math.min(config.numBins - 1, Math.floor((v - min) / binWidth)));
        } else {
          // Equal-frequency
          const sorted = [...values].sort((a, b) => a - b);
          const binSize = Math.ceil(values.length / config.numBins);
          binned = values.map(v => {
            const idx = sorted.indexOf(v);
            return Math.min(config.numBins - 1, Math.floor(idx / binSize));
          });
        }

        const correlation = calculateCorrelation(binned, data.map(r => r.target));
        features.push({
          name: `${col}_binned_${config.numBins}`,
          type: 'binning',
          correlation: parseFloat(correlation.toFixed(4)),
          absCorrelation: Math.abs(correlation),
          preview: binned.slice(0, 5).map(v => `bin_${v}`)
        });
      }
    }

    // One-hot encoding
    if (config.oneHot) {
      for (const col of categoricalCols) {
        const uniqueValues = [...new Set(data.map(row => row[col]))];
        for (const val of uniqueValues) {
          const encoded = data.map(row => row[col] === val ? 1 : 0);
          const correlation = calculateCorrelation(encoded, data.map(r => r.target));
          features.push({
            name: `${col}_${val}`,
            type: 'one-hot',
            correlation: parseFloat(correlation.toFixed(4)),
            absCorrelation: Math.abs(correlation),
            preview: encoded.slice(0, 5).map(v => v.toString())
          });
        }
      }
    }

    // Sort by absolute correlation and take top K
    features.sort((a, b) => b.absCorrelation - a.absCorrelation);
    setGeneratedFeatures(features);
    setSelectedFeatures(features.slice(0, config.topK).map(f => f.name));
    setLoading(false);
  };

  const calculateCorrelation = (x, y) => {
    const n = x.length;
    if (n === 0) return 0;
    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  };

  const toggleFeature = (name) => {
    setSelectedFeatures(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'polynomial': return '#8b5cf6';
      case 'interaction': return '#06b6d4';
      case 'binning': return '#6366F1';
      case 'one-hot': return '#10b981';
      default: return '#6b5b95';
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case 'polynomial': return 'bg-purple-500/10 text-purple-400';
      case 'interaction': return 'bg-cyan-500/10 text-cyan-400';
      case 'binning': return 'bg-yellow-500/10 text-yellow-400';
      case 'one-hot': return 'bg-green-500/10 text-green-400';
      default: return 'bg-purple-500/15 text-purple-300/50';
    }
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to use AutoFeature Engineering</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">AutoFeature Engineering</h1>
        <p className="text-purple-300/50 mt-1">Automatically generate and rank features from your dataset</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Feature Generation Config</h3>

          {!dataset ? (
            <button onClick={loadSampleDataset} className="w-full px-4 py-2 bg-purple-500/10 text-purple-300 border border-primary-500/20 rounded-lg hover:bg-primary-500/20">
              Load Sample Dataset
            </button>
          ) : (
            <div className="bg-dark-900 rounded-lg p-3 text-sm">
              <p className="text-dark-200">Dataset loaded</p>
              <p className="text-purple-300/50 text-xs mt-1">{dataset.data.length} samples, {dataset.columns.length} features</p>
              <p className="text-purple-300/50 text-xs">Numeric: {dataset.numericCols.join(', ')}</p>
              <p className="text-purple-300/50 text-xs">Categorical: {dataset.categoricalCols.join(', ')}</p>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={config.polynomial} onChange={e => setConfig({ ...config, polynomial: e.target.checked })} className="accent-cyan-500" />
              <span className="text-dark-200 text-sm">Polynomial Features</span>
            </label>
            {config.polynomial && (
              <div className="ml-6">
                <label className="text-purple-300/50 text-xs">Degree</label>
                <select value={config.polynomialDegree} onChange={e => setConfig({ ...config, polynomialDegree: parseInt(e.target.value) })}
                  className="ml-2 bg-dark-900 border border-purple-500/30 rounded px-2 py-1 text-dark-200 text-sm">
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-3">
              <input type="checkbox" checked={config.interactions} onChange={e => setConfig({ ...config, interactions: e.target.checked })} className="accent-cyan-500" />
              <span className="text-dark-200 text-sm">Feature Interactions</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" checked={config.binning} onChange={e => setConfig({ ...config, binning: e.target.checked })} className="accent-cyan-500" />
              <span className="text-dark-200 text-sm">Binning</span>
            </label>
            {config.binning && (
              <div className="ml-6 space-y-2">
                <select value={config.binningMethod} onChange={e => setConfig({ ...config, binningMethod: e.target.value })}
                  className="bg-dark-900 border border-purple-500/30 rounded px-2 py-1 text-dark-200 text-sm w-full">
                  <option value="equal-width">Equal Width</option>
                  <option value="equal-frequency">Equal Frequency</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-purple-300/50 text-xs">Bins:</label>
                  <input type="number" value={config.numBins} onChange={e => setConfig({ ...config, numBins: parseInt(e.target.value) || 5 })} min={2} max={20}
                    className="w-16 bg-dark-900 border border-purple-500/30 rounded px-2 py-1 text-dark-200 text-sm" />
                </div>
              </div>
            )}

            <label className="flex items-center gap-3">
              <input type="checkbox" checked={config.oneHot} onChange={e => setConfig({ ...config, oneHot: e.target.checked })} className="accent-cyan-500" />
              <span className="text-dark-200 text-sm">One-Hot Encoding</span>
            </label>

            <div className="border-t border-purple-500/20 pt-3">
              <label className="text-purple-300/50 text-sm">Select Top K Features</label>
              <input type="number" value={config.topK} onChange={e => setConfig({ ...config, topK: parseInt(e.target.value) || 10 })} min={1} max={50}
                className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" />
            </div>
          </div>

          <button onClick={generateFeatures} disabled={!dataset || loading}
            className="w-full px-4 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Features'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {generatedFeatures ? (
            <>
              {/* Correlation chart */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Feature Ranking by Correlation with Target</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generatedFeatures.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis type="number" domain={[-1, 1]} stroke="#6b5b95" />
                    <YAxis dataKey="name" type="category" stroke="#6b5b95" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                    <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                      {generatedFeatures.slice(0, 15).map((entry, i) => (
                        <Cell key={i} fill={getTypeColor(entry.type)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3">
                  {['polynomial', 'interaction', 'binning', 'one-hot'].map(type => (
                    <span key={type} className={`text-xs px-2 py-1 rounded ${getTypeBg(type)}`}>{type}</span>
                  ))}
                </div>
              </div>

              {/* Feature list with selection */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Generated Features ({generatedFeatures.length} total, {selectedFeatures.length} selected)</h3>
                  <button onClick={() => setSelectedFeatures(generatedFeatures.slice(0, config.topK).map(f => f.name))}
                    className="text-xs text-purple-400 hover:text-purple-300">Select Top {config.topK}</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {generatedFeatures.map((feature, i) => (
                    <div key={i} onClick={() => toggleFeature(feature.name)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedFeatures.includes(feature.name) ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-800/50 backdrop-blur-md border border-purple-500/20 hover:border-dark-500'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedFeatures.includes(feature.name)} readOnly className="accent-cyan-500" />
                        <div>
                          <span className="text-dark-200 text-sm">{feature.name}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getTypeBg(feature.type)}`}>{feature.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-purple-300/50">Preview: [{feature.preview.join(', ')}]</span>
                        <span className={`font-medium ${feature.correlation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          r={feature.correlation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
                <span className="text-purple-300/50 text-sm">{selectedFeatures.length} features selected for use</span>
                <button className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 text-sm">
                  Apply Selected Features
                </button>
              </div>
            </>
          ) : (
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6 flex items-center justify-center h-64">
              <div className="text-center text-purple-300/50">
                <p className="text-4xl mb-4">🧮</p>
                <p>Load a dataset and generate features to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
