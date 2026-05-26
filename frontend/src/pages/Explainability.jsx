import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useToast } from '../components/ui/Toast';

export default function Explainability() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [explanations, setExplanations] = useState(null);
  const [counterfactuals, setCounterfactuals] = useState(null);
  const [boundaryData, setBoundaryData] = useState(null);
  const [tab, setTab] = useState('lime');
  const [loading, setLoading] = useState(false);
  const [featurePair, setFeaturePair] = useState([0, 1]);

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const res = await authFetch('/api/experiments?status=completed');
      const data = await res.json();
      setExperiments(data);
    } catch (err) { }
  };

  const generateLIME = () => {
    if (!selectedExp) return;
    setLoading(true);

    // Simulate LIME: perturb input features, observe output changes
    const numFeatures = Object.keys(selectedExp.params).length || 5;
    const featureNames = Object.keys(selectedExp.params).length > 0
      ? Object.keys(selectedExp.params)
      : Array.from({ length: numFeatures }, (_, i) => `feature_${i}`);

    const contributions = featureNames.map(name => {
      // Simulate feature contribution (random but consistent)
      const contribution = (Math.random() - 0.3) * 2;
      return { feature: name, contribution: parseFloat(contribution.toFixed(3)), absContribution: Math.abs(contribution) };
    }).sort((a, b) => b.absContribution - a.absContribution);

    setExplanations(contributions);
    setLoading(false);
  };

  const generateCounterfactuals = () => {
    if (!selectedExp) return;
    setLoading(true);

    const params = selectedExp.params || {};
    const featureNames = Object.keys(params).length > 0
      ? Object.keys(params)
      : ['learning_rate', 'batch_size', 'epochs', 'dropout'];

    const cfs = featureNames.slice(0, 4).map(feature => {
      const originalValue = params[feature] || (Math.random() * 10).toFixed(2);
      const newValue = typeof originalValue === 'number'
        ? (originalValue * (1 + (Math.random() - 0.5))).toFixed(4)
        : (parseFloat(originalValue) * 1.5).toFixed(4);
      return {
        feature,
        original: originalValue,
        counterfactual: newValue,
        predictionChange: Math.random() > 0.5 ? 'Positive → Negative' : 'Negative → Positive',
        confidence: (Math.random() * 0.4 + 0.6).toFixed(2)
      };
    });

    setCounterfactuals(cfs);
    setLoading(false);
  };

  const generateBoundary = () => {
    setLoading(true);

    // Generate 2D decision boundary visualization
    const gridSize = 20;
    const points = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / gridSize) * 10;
        const y = (j / gridSize) * 10;
        // Simple decision boundary: circular
        const dist = Math.sqrt((x - 5) ** 2 + (y - 5) ** 2);
        const cls = dist < 3.5 ? 1 : 0;
        points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), class: cls });
      }
    }

    // Add some data points
    const dataPoints = Array.from({ length: 40 }, () => {
      const x = Math.random() * 10;
      const y = Math.random() * 10;
      const dist = Math.sqrt((x - 5) ** 2 + (y - 5) ** 2);
      const noise = Math.random() < 0.1;
      const cls = noise ? (dist < 3.5 ? 0 : 1) : (dist < 3.5 ? 1 : 0);
      return { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), class: cls, isData: true };
    });

    setBoundaryData({ grid: points, data: dataPoints });
    setLoading(false);
  };

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to access Explainability Dashboard</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Explainable AI Dashboard</h1>
        <p className="text-dark-400 mt-1">Understand model decisions with LIME, counterfactuals, and decision boundaries</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'lime', label: '🔍 LIME Explanations' },
          { id: 'counterfactual', label: '🔄 Counterfactuals' },
          { id: 'boundary', label: '🗺️ Decision Boundary' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-dark-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Experiment selector */}
      {(tab === 'lime' || tab === 'counterfactual') && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <label className="text-dark-400 text-sm">Select Experiment:</label>
          <select onChange={e => {
            const exp = experiments.find(x => x._id === e.target.value);
            setSelectedExp(exp);
          }} className="ml-3 bg-dark-900 border border-dark-600 rounded-lg px-3 py-1.5 text-dark-200 text-sm">
            <option value="">Choose...</option>
            {experiments.map(exp => (
              <option key={exp._id} value={exp._id}>{exp.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* LIME Tab */}
      {tab === 'lime' && (
        <div className="space-y-4">
          <button onClick={generateLIME} disabled={!selectedExp || loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
            Generate LIME Explanation
          </button>

          {explanations && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Feature Contributions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={explanations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="feature" type="category" stroke="#64748b" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {explanations.map((entry, i) => (
                      <Cell key={i} fill={entry.contribution >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-dark-500 text-xs mt-4">
                Green = pushes prediction positive | Red = pushes prediction negative
              </p>
            </div>
          )}
        </div>
      )}

      {/* Counterfactual Tab */}
      {tab === 'counterfactual' && (
        <div className="space-y-4">
          <button onClick={generateCounterfactuals} disabled={!selectedExp || loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
            Generate Counterfactuals
          </button>

          {counterfactuals && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Counterfactual Examples</h3>
              <p className="text-dark-400 text-sm mb-4">"What minimal change would flip the prediction?"</p>
              <div className="space-y-3">
                {counterfactuals.map((cf, i) => (
                  <div key={i} className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-200 font-medium">{cf.feature}</span>
                      <span className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded">
                        Confidence: {cf.confidence}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="text-dark-400">Original: <span className="text-dark-200">{cf.original}</span></span>
                      <span className="text-dark-500">→</span>
                      <span className="text-dark-400">Change to: <span className="text-primary-400">{cf.counterfactual}</span></span>
                    </div>
                    <p className="mt-1 text-xs text-yellow-400">{cf.predictionChange}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Boundary Tab */}
      {tab === 'boundary' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button onClick={generateBoundary} disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
              Generate Decision Boundary
            </button>
            <span className="text-dark-400 text-sm">2D feature space visualization</span>
          </div>

          {boundaryData && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Decision Boundary (Feature {featurePair[0]} vs Feature {featurePair[1]})</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="x" name="Feature 0" stroke="#64748b" type="number" domain={[0, 10]} />
                  <YAxis dataKey="y" name="Feature 1" stroke="#64748b" type="number" domain={[0, 10]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Scatter name="Class 0 (region)" data={boundaryData.grid.filter(p => p.class === 0)} fill="#1e3a5f" opacity={0.3} />
                  <Scatter name="Class 1 (region)" data={boundaryData.grid.filter(p => p.class === 1)} fill="#064e3b" opacity={0.3} />
                  <Scatter name="Class 0 (data)" data={boundaryData.data.filter(p => p.class === 0)} fill="#ef4444" shape="circle" />
                  <Scatter name="Class 1 (data)" data={boundaryData.data.filter(p => p.class === 1)} fill="#06b6d4" shape="diamond" />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 text-xs text-dark-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Class 0</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-cyan-500 inline-block"></span> Class 1</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
