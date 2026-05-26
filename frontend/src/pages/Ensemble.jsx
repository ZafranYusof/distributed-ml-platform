import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';
import { useToast } from '../components/ui/Toast';

export default function Ensemble() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [experiments, setExperiments] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [method, setMethod] = useState('bagging');
  const [topN, setTopN] = useState(3);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/experiments?status=completed');
      const data = await res.json();
      setExperiments(data);
    } catch (err) { }
    setLoading(false);
  };

  const toggleModel = (id) => {
    setSelectedModels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const autoSelect = () => {
    // Pick top N by accuracy metric
    const sorted = [...experiments]
      .filter(e => e.metrics && typeof e.metrics.accuracy === 'number')
      .sort((a, b) => (b.metrics.accuracy || 0) - (a.metrics.accuracy || 0))
      .slice(0, topN);
    setSelectedModels(sorted.map(e => e._id));
  };

  const runEnsemble = () => {
    const selected = experiments.filter(e => selectedModels.includes(e._id));
    if (selected.length < 2) return;

    // Simulate predictions for each model (using metrics as proxy)
    const numSamples = 20;
    const modelPredictions = selected.map(model => {
      const acc = model.metrics?.accuracy || 0.5;
      return Array.from({ length: numSamples }, (_, i) => {
        const truth = Math.sin(i * 0.5) > 0 ? 1 : 0;
        const correct = Math.random() < acc;
        return correct ? truth : 1 - truth;
      });
    });

    // Ground truth
    const groundTruth = Array.from({ length: numSamples }, (_, i) => Math.sin(i * 0.5) > 0 ? 1 : 0);

    let ensemblePredictions;

    if (method === 'bagging') {
      // Majority vote / average
      ensemblePredictions = Array.from({ length: numSamples }, (_, i) => {
        const avg = modelPredictions.reduce((s, preds) => s + preds[i], 0) / modelPredictions.length;
        return avg >= 0.5 ? 1 : 0;
      });
    } else if (method === 'boosting') {
      // Weighted by accuracy
      const weights = selected.map(m => m.metrics?.accuracy || 0.5);
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      ensemblePredictions = Array.from({ length: numSamples }, (_, i) => {
        const weightedAvg = modelPredictions.reduce((s, preds, j) => s + preds[i] * weights[j], 0) / totalWeight;
        return weightedAvg >= 0.5 ? 1 : 0;
      });
    } else {
      // Stacking: use first model as meta-learner input
      const stackFeatures = Array.from({ length: numSamples }, (_, i) => 
        modelPredictions.map(preds => preds[i])
      );
      // Simple meta-learner: weighted average with learned weights (simulated)
      const metaWeights = selected.map(m => (m.metrics?.accuracy || 0.5) ** 2);
      const totalMW = metaWeights.reduce((s, w) => s + w, 0);
      ensemblePredictions = stackFeatures.map(features => {
        const score = features.reduce((s, f, j) => s + f * metaWeights[j], 0) / totalMW;
        return score >= 0.5 ? 1 : 0;
      });
    }

    // Calculate accuracies
    const ensembleAcc = ensemblePredictions.reduce((s, p, i) => s + (p === groundTruth[i] ? 1 : 0), 0) / numSamples;
    const individualAccs = modelPredictions.map(preds => 
      preds.reduce((s, p, i) => s + (p === groundTruth[i] ? 1 : 0), 0) / numSamples
    );

    const comparison = selected.map((model, idx) => ({
      name: model.name.substring(0, 15),
      accuracy: parseFloat((individualAccs[idx] * 100).toFixed(1))
    }));
    comparison.push({ name: `Ensemble (${method})`, accuracy: parseFloat((ensembleAcc * 100).toFixed(1)) });

    // Per-sample comparison
    const perSample = Array.from({ length: numSamples }, (_, i) => {
      const row = { sample: i + 1, truth: groundTruth[i], ensemble: ensemblePredictions[i] };
      selected.forEach((m, j) => { row[`model_${j}`] = modelPredictions[j][i]; });
      return row;
    });

    setResults({ comparison, perSample, ensembleAcc, individualAccs, method });
  };

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to use Ensemble Methods</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Ensemble Methods</h1>
        <p className="text-dark-400 mt-1">Combine multiple models for better predictions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection */}
        <div className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Select Models ({selectedModels.length} selected)</h3>
            <div className="flex items-center gap-3">
              <label className="text-dark-400 text-sm">Top N:</label>
              <input type="number" value={topN} onChange={e => setTopN(parseInt(e.target.value) || 3)} min={2} max={10}
                className="w-16 bg-dark-900 border border-dark-600 rounded px-2 py-1 text-dark-200 text-sm" />
              <button onClick={autoSelect} className="px-3 py-1 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg text-sm hover:bg-primary-500/20">
                Auto-Select
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-dark-400">Loading experiments...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {experiments.map(exp => (
                <div key={exp._id} onClick={() => toggleModel(exp._id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedModels.includes(exp._id) ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-900 border border-dark-700 hover:border-dark-500'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedModels.includes(exp._id)} readOnly className="accent-cyan-500" />
                    <span className="text-dark-200 text-sm">{exp.name}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-dark-400">
                    {exp.metrics?.accuracy && <span>Acc: {(exp.metrics.accuracy * 100).toFixed(1)}%</span>}
                    {exp.metrics?.loss && <span>Loss: {exp.metrics.loss.toFixed(4)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Method Selection */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Ensemble Method</h3>
          <div className="space-y-3">
            {[
              { id: 'bagging', label: 'Bagging', desc: 'Average predictions (majority vote)' },
              { id: 'boosting', label: 'Boosting', desc: 'Weight by individual accuracy' },
              { id: 'stacking', label: 'Stacking', desc: 'Meta-learner on model outputs' }
            ].map(m => (
              <div key={m.id} onClick={() => setMethod(m.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${method === m.id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-900 border border-dark-700'}`}>
                <p className="text-dark-200 text-sm font-medium">{m.label}</p>
                <p className="text-dark-500 text-xs mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={runEnsemble} disabled={selectedModels.length < 2}
            className="w-full mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Run Ensemble
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison Chart */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Ensemble vs Individual Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={results.comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {results.comparison.map((entry, i) => (
                    <Cell key={i} fill={i === results.comparison.length - 1 ? '#06b6d4' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Results Summary</h3>
            <div className="space-y-4">
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-dark-400 text-xs">Ensemble Accuracy ({results.method})</p>
                <p className="text-3xl font-bold text-primary-400">{(results.ensembleAcc * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-dark-400 text-xs">Best Individual</p>
                <p className="text-2xl font-bold text-dark-200">{(Math.max(...results.individualAccs) * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-dark-400 text-xs">Improvement</p>
                <p className={`text-2xl font-bold ${results.ensembleAcc > Math.max(...results.individualAccs) ? 'text-green-400' : 'text-yellow-400'}`}>
                  {results.ensembleAcc > Math.max(...results.individualAccs) ? '+' : ''}{((results.ensembleAcc - Math.max(...results.individualAccs)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
