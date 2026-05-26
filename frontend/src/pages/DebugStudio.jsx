import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function DebugStudio() {
  const [modelConfig, setModelConfig] = useState({ layers: [4, 16, 8, 3], activation: 'relu' });
  const [testData, setTestData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activations, setActivations] = useState([]);
  const [confusionMatrix, setConfusionMatrix] = useState(null);
  const [misclassified, setMisclassified] = useState([]);
  const [sliceResults, setSliceResults] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const generateTestData = () => {
    const classes = ['setosa', 'versicolor', 'virginica'];
    const means = [[5.0, 3.4, 1.5, 0.2], [5.9, 2.8, 4.3, 1.3], [6.6, 3.0, 5.6, 2.0]];
    const data = [];
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < 30; i++) {
        const features = means[c].map(m => m + (Math.random() - 0.5) * 0.8);
        data.push({ features, trueLabel: c, trueName: classes[c], id: data.length });
      }
    }
    return data;
  };

  const simulateModel = (features) => {
    // Simulate forward pass with activations
    const layerActivations = [];
    let input = features;
    
    for (let l = 1; l < modelConfig.layers.length; l++) {
      const layerSize = modelConfig.layers[l];
      const output = [];
      const rawActivation = [];
      for (let n = 0; n < layerSize; n++) {
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * (Math.random() * 2 - 1) * 0.5;
        }
        sum += Math.random() * 0.1;
        const activated = modelConfig.activation === 'relu' ? Math.max(0, sum) : 1 / (1 + Math.exp(-sum));
        output.push(activated);
        rawActivation.push(activated);
      }
      layerActivations.push(rawActivation);
      input = output;
    }
    
    // Softmax on last layer
    const expSum = input.reduce((s, v) => s + Math.exp(v), 0);
    const probs = input.map(v => Math.exp(v) / expSum);
    const predicted = probs.indexOf(Math.max(...probs));
    
    return { predicted, probs, layerActivations };
  };

  const loadModel = () => {
    const data = generateTestData();
    setTestData(data);
    
    const preds = data.map(d => {
      const result = simulateModel(d.features);
      return { ...d, ...result };
    });
    setPredictions(preds);
    setCurrentIdx(0);
    
    if (preds.length > 0) {
      setActivations(preds[0].layerActivations);
    }

    // Build confusion matrix
    const matrix = Array(3).fill(null).map(() => Array(3).fill(0));
    const misclass = [];
    preds.forEach(p => {
      matrix[p.trueLabel][p.predicted]++;
      if (p.trueLabel !== p.predicted) {
        misclass.push(p);
      }
    });
    setConfusionMatrix(matrix);
    setMisclassified(misclass);

    // Slice analysis
    const slices = [
      { name: 'sepal_length > 6', filter: p => p.features[0] > 6 },
      { name: 'sepal_length <= 6', filter: p => p.features[0] <= 6 },
      { name: 'petal_length > 3', filter: p => p.features[2] > 3 },
      { name: 'petal_length <= 3', filter: p => p.features[2] <= 3 },
    ];
    const sliceRes = slices.map(s => {
      const subset = preds.filter(s.filter);
      const correct = subset.filter(p => p.trueLabel === p.predicted).length;
      return { name: s.name, accuracy: subset.length > 0 ? (correct / subset.length * 100).toFixed(1) : 0, count: subset.length };
    });
    setSliceResults(sliceRes);
    setLoaded(true);
  };

  const stepTo = (idx) => {
    if (idx < 0 || idx >= predictions.length) return;
    setCurrentIdx(idx);
    setActivations(predictions[idx].layerActivations);
  };

  const classes = ['setosa', 'versicolor', 'virginica'];
  const current = predictions[currentIdx];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Debugging Studio</h1>
        <p className="text-purple-300/50 mt-1">Step through predictions, inspect activations, and analyze failures</p>
      </div>

      {/* Load Model */}
      <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Model Configuration</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-purple-300/50">Architecture</label>
            <p className="text-white font-mono text-sm mt-1">[{modelConfig.layers.join(' → ')}]</p>
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Activation</label>
            <select value={modelConfig.activation} onChange={e => setModelConfig(p => ({ ...p, activation: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white text-sm">
              <option value="relu">ReLU</option>
              <option value="sigmoid">Sigmoid</option>
            </select>
          </div>
        </div>
        <button onClick={loadModel} className="px-6 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600">
          Load Model & Test Data
        </button>
      </div>

      {loaded && (
        <>
          {/* Step Through Predictions */}
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase">Prediction Inspector</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => stepTo(currentIdx - 1)} disabled={currentIdx === 0}
                  className="px-3 py-1 bg-purple-500/15 text-white rounded disabled:opacity-50">←</button>
                <span className="text-sm text-purple-300/50">{currentIdx + 1} / {predictions.length}</span>
                <button onClick={() => stepTo(currentIdx + 1)} disabled={currentIdx >= predictions.length - 1}
                  className="px-3 py-1 bg-purple-500/15 text-white rounded disabled:opacity-50">→</button>
              </div>
            </div>
            {current && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-900 rounded-lg p-4">
                  <p className="text-xs text-purple-300/50 mb-2">Input Features</p>
                  <div className="space-y-1">
                    {['sepal_len', 'sepal_wid', 'petal_len', 'petal_wid'].map((name, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-purple-200/70">{name}</span>
                        <span className="text-white font-mono">{current.features[i].toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-dark-900 rounded-lg p-4">
                  <p className="text-xs text-purple-300/50 mb-2">Prediction</p>
                  <div className="space-y-2">
                    {current.probs.map((prob, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-purple-200/70 w-20">{classes[i]}</span>
                        <div className="flex-1 h-4 bg-purple-500/15 rounded overflow-hidden">
                          <div className={`h-full ${i === current.predicted ? 'bg-gradient-btn' : 'bg-dark-500'}`}
                            style={{ width: `${prob * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-white w-12 text-right">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-dark-900 rounded-lg p-4">
                  <p className="text-xs text-purple-300/50 mb-2">Result</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-200/70 text-sm">True:</span>
                      <span className="text-white text-sm font-medium">{current.trueName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200/70 text-sm">Predicted:</span>
                      <span className={`text-sm font-medium ${current.trueLabel === current.predicted ? 'text-green-400' : 'text-red-400'}`}>
                        {classes[current.predicted]}
                      </span>
                    </div>
                    <div className={`mt-2 px-3 py-1.5 rounded text-center text-sm ${
                      current.trueLabel === current.predicted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {current.trueLabel === current.predicted ? <><CheckCircle2 className="w-4 h-4 inline mr-1" /> Correct</> : <><XCircle className="w-4 h-4 inline mr-1" /> Misclassified</>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Layer Activations */}
          {activations.length > 0 && (
            <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Layer Activations (Heatmap)</h3>
              <div className="space-y-3">
                {activations.map((layer, li) => (
                  <div key={li}>
                    <p className="text-xs text-purple-300/50 mb-1">Layer {li + 1} ({layer.length} neurons)</p>
                    <div className="flex gap-1 flex-wrap">
                      {layer.map((val, ni) => {
                        const intensity = Math.min(1, Math.abs(val));
                        const color = val > 0 
                          ? `rgba(6, 182, 212, ${intensity})` 
                          : `rgba(239, 68, 68, ${intensity})`;
                        return (
                          <div key={ni} className="w-8 h-8 rounded flex items-center justify-center text-xs border border-purple-500/30"
                            style={{ backgroundColor: color }} title={`Neuron ${ni}: ${val.toFixed(3)}`}>
                            <span className="text-white/80" style={{ fontSize: '8px' }}>{val.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confusion Matrix */}
          {confusionMatrix && (
            <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Confusion Matrix</h3>
              <div className="overflow-x-auto">
                <table className="mx-auto">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {classes.map(c => <th key={c} className="p-2 text-xs text-purple-300/50">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {confusionMatrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 text-xs text-purple-300/50">{classes[i]}</td>
                        {row.map((val, j) => (
                          <td key={j} className="p-2">
                            <div className={`w-12 h-12 flex items-center justify-center rounded text-sm font-bold ${
                              i === j ? 'bg-green-500/30 text-green-400' : val > 0 ? 'bg-red-500/30 text-red-400' : 'bg-purple-500/15 text-purple-300/40'
                            }`}>{val}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Misclassified */}
            <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Misclassified ({misclassified.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {misclassified.length === 0 ? (
                  <p className="text-purple-300/50 text-sm">No misclassifications!</p>
                ) : misclassified.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-dark-900 rounded-lg cursor-pointer hover:bg-purple-500/15"
                    onClick={() => stepTo(m.id)}>
                    <span className="text-xs text-purple-300/50">#{m.id}</span>
                    <span className="text-xs text-white">{m.trueName}</span>
                    <span className="text-xs text-red-400">→ {classes[m.predicted]}</span>
                    <span className="text-xs text-purple-300/40">conf: {(m.probs[m.predicted] * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slice Analysis */}
            <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Slice Performance</h3>
              <div className="space-y-3">
                {sliceResults.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-purple-200/70 w-36 truncate">{s.name}</span>
                    <div className="flex-1 h-4 bg-purple-500/15 rounded overflow-hidden">
                      <div className="h-full bg-gradient-btn" style={{ width: `${s.accuracy}%` }}></div>
                    </div>
                    <span className="text-xs text-white w-16 text-right">{s.accuracy}%</span>
                    <span className="text-xs text-purple-300/40">n={s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
