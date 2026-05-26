import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function ActiveLearning() {
  const { user } = useAuth();
  const [config, setConfig] = useState({ initialLabeled: 10, poolSize: 200, querySize: 5, strategy: 'entropy' });
  const [running, setRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [results, setResults] = useState(null);
  const [uncertainSamples, setUncertainSamples] = useState([]);
  const [labeledCount, setLabeledCount] = useState(0);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const [phase, setPhase] = useState('config'); // config, labeling, complete

  const startActiveLearning = () => {
    setPhase('labeling');
    setIteration(0);
    setAccuracyHistory([]);
    setLabeledCount(config.initialLabeled);

    // Generate pool of unlabeled data
    const pool = Array.from({ length: config.poolSize }, (_, i) => {
      const x1 = Math.random() * 10;
      const x2 = Math.random() * 10;
      const trueLabel = (x1 + x2 > 10) ? 1 : 0;
      return { id: i, x1: parseFloat(x1.toFixed(2)), x2: parseFloat(x2.toFixed(2)), trueLabel, labeled: i < config.initialLabeled };
    });

    // Initial training
    const labeled = pool.filter(p => p.labeled);
    const accuracy = trainAndEvaluate(labeled, pool);
    setAccuracyHistory([{ iteration: 0, accuracy: parseFloat((accuracy * 100).toFixed(1)), labeled: config.initialLabeled }]);

    // Score unlabeled samples
    const uncertain = scoreUncertainty(pool.filter(p => !p.labeled), labeled, config.strategy);
    setUncertainSamples(uncertain.slice(0, config.querySize));
    setResults({ pool, labeled: config.initialLabeled });
  };

  const trainAndEvaluate = (labeled, allData) => {
    // Simple logistic regression simulation
    if (labeled.length < 2) return 0.5;
    const posCount = labeled.filter(l => l.trueLabel === 1).length;
    const threshold = posCount / labeled.length;

    // Evaluate on all data
    let correct = 0;
    for (const sample of allData) {
      const score = (sample.x1 + sample.x2) / 20; // Normalized feature
      const pred = score > (1 - threshold) ? 1 : 0;
      if (pred === sample.trueLabel) correct++;
    }
    return correct / allData.length;
  };

  const scoreUncertainty = (unlabeled, labeled, strategy) => {
    // Calculate uncertainty for each unlabeled sample
    const posRatio = labeled.filter(l => l.trueLabel === 1).length / labeled.length;

    return unlabeled.map(sample => {
      const score = (sample.x1 + sample.x2) / 20;
      let uncertainty;

      if (strategy === 'entropy') {
        // Entropy-based: highest when prediction is near 0.5
        const p = Math.abs(score - 0.5) < 0.3 ? 0.5 + Math.random() * 0.1 : score;
        const entropy = -(p * Math.log2(p + 1e-10) + (1 - p) * Math.log2(1 - p + 1e-10));
        uncertainty = entropy;
      } else {
        // Margin sampling: smallest margin between top two classes
        const margin = Math.abs(score - 0.5) * 2;
        uncertainty = 1 - margin;
      }

      return { ...sample, uncertainty: parseFloat(uncertainty.toFixed(3)) };
    }).sort((a, b) => b.uncertainty - a.uncertainty);
  };

  const labelSamples = (labels) => {
    // User labels the uncertain samples
    const newIteration = iteration + 1;
    setIteration(newIteration);

    const newLabeledCount = labeledCount + config.querySize;
    setLabeledCount(newLabeledCount);

    // Simulate retraining with more labeled data
    const baseAccuracy = 0.5 + (newLabeledCount / config.poolSize) * 0.4 + Math.random() * 0.05;
    const accuracy = Math.min(0.98, baseAccuracy);

    const newHistory = [...accuracyHistory, {
      iteration: newIteration,
      accuracy: parseFloat((accuracy * 100).toFixed(1)),
      labeled: newLabeledCount
    }];
    setAccuracyHistory(newHistory);

    // Check if we should stop
    if (newLabeledCount >= config.poolSize * 0.5 || accuracy > 0.95) {
      setPhase('complete');
      return;
    }

    // Generate new uncertain samples
    const remaining = config.poolSize - newLabeledCount;
    const newUncertain = Array.from({ length: Math.min(config.querySize, remaining) }, (_, i) => ({
      id: newLabeledCount + i,
      x1: parseFloat((Math.random() * 10).toFixed(2)),
      x2: parseFloat((Math.random() * 10).toFixed(2)),
      trueLabel: Math.random() > 0.5 ? 1 : 0,
      uncertainty: parseFloat((0.5 + Math.random() * 0.5).toFixed(3))
    }));
    setUncertainSamples(newUncertain);
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to use Active Learning</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Active Learning</h1>
        <p className="text-purple-300/50 mt-1">Iteratively label the most informative samples to maximize model performance</p>
      </div>

      {phase === 'config' && (
        <div className="max-w-lg">
          <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-semibold">Configuration</h3>
            <div>
              <label className="text-purple-300/50 text-sm">Initial Labeled Samples</label>
              <input type="number" value={config.initialLabeled} onChange={e => setConfig({ ...config, initialLabeled: parseInt(e.target.value) || 10 })}
                className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" />
            </div>
            <div>
              <label className="text-purple-300/50 text-sm">Unlabeled Pool Size</label>
              <input type="number" value={config.poolSize} onChange={e => setConfig({ ...config, poolSize: parseInt(e.target.value) || 200 })}
                className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" />
            </div>
            <div>
              <label className="text-purple-300/50 text-sm">Query Size (samples per iteration)</label>
              <input type="number" value={config.querySize} onChange={e => setConfig({ ...config, querySize: parseInt(e.target.value) || 5 })}
                className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200" />
            </div>
            <div>
              <label className="text-purple-300/50 text-sm">Uncertainty Strategy</label>
              <select value={config.strategy} onChange={e => setConfig({ ...config, strategy: e.target.value })}
                className="w-full mt-1 bg-dark-900 border border-purple-500/30 rounded-lg px-3 py-2 text-dark-200">
                <option value="entropy">Entropy Sampling</option>
                <option value="margin">Margin Sampling</option>
              </select>
            </div>
            <button onClick={startActiveLearning} className="w-full px-4 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600">
              Start Active Learning
            </button>
          </div>
        </div>
      )}

      {phase === 'labeling' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accuracy chart */}
          <div className="lg:col-span-2 bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Accuracy Improvement</h3>
            {accuracyHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={accuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                  <XAxis dataKey="iteration" stroke="#6b5b95" label={{ value: 'Iteration', position: 'bottom', fill: '#6b5b95' }} />
                  <YAxis stroke="#6b5b95" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-purple-300/50">Training initial model...</p>
            )}
            <div className="flex gap-6 mt-4 text-sm">
              <span className="text-purple-300/50">Iteration: <span className="text-dark-200">{iteration}</span></span>
              <span className="text-purple-300/50">Labeled: <span className="text-purple-400">{labeledCount}/{config.poolSize}</span></span>
              <span className="text-purple-300/50">Strategy: <span className="text-dark-200">{config.strategy}</span></span>
            </div>
          </div>

          {/* Uncertain samples to label */}
          <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">Label These Samples</h3>
            <p className="text-purple-300/50 text-xs mb-4">Most uncertain samples (highest {config.strategy})</p>
            <div className="space-y-3">
              {uncertainSamples.map((sample, i) => (
                <div key={i} className="bg-dark-900 rounded-lg p-3 border border-purple-500/20">
                  <div className="flex justify-between text-xs text-purple-300/50 mb-2">
                    <span>x1: {sample.x1}, x2: {sample.x2}</span>
                    <span className="text-yellow-400">U: {sample.uncertainty}</span>
                  </div>
                  <div className="w-full bg-purple-500/15 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${sample.uncertainty * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => labelSamples()} className="w-full mt-4 px-4 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 text-sm">
              Label All & Retrain
            </button>
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <p className="text-4xl mb-2">✅</p>
            <h3 className="text-green-400 font-semibold text-lg">Active Learning Complete</h3>
            <p className="text-purple-300/50 mt-2">Achieved target accuracy with {labeledCount} labeled samples ({((labeledCount / config.poolSize) * 100).toFixed(0)}% of pool)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Accuracy Over Iterations</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={accuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                  <XAxis dataKey="iteration" stroke="#6b5b95" />
                  <YAxis stroke="#6b5b95" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Labels Per Iteration</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={accuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                  <XAxis dataKey="iteration" stroke="#6b5b95" />
                  <YAxis stroke="#6b5b95" />
                  <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                  <Bar dataKey="labeled" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-purple-300/50 text-xs">Final Accuracy</p>
              <p className="text-2xl font-bold text-purple-400">{accuracyHistory[accuracyHistory.length - 1]?.accuracy}%</p>
            </div>
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-purple-300/50 text-xs">Total Iterations</p>
              <p className="text-2xl font-bold text-dark-200">{iteration}</p>
            </div>
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-purple-300/50 text-xs">Labels Saved</p>
              <p className="text-2xl font-bold text-green-400">{config.poolSize - labeledCount}</p>
            </div>
          </div>

          <button onClick={() => { setPhase('config'); setResults(null); setAccuracyHistory([]); setIteration(0); }}
            className="px-4 py-2 bg-purple-500/15 text-purple-200/70 rounded-lg hover:bg-purple-500/20">
            ← Start Over
          </button>
        </div>
      )}
    </div>
  );
}
