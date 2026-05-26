import { useState, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Papa from 'papaparse';
import { useToast } from '../components/ui/Toast';

export default function Compare() {
  const toast = useToast();
  const [dataset, setDataset] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [configs, setConfigs] = useState([
    {
      id: 1,
      name: 'Config A',
      type: 'neural-network',
      layers: [64, 32],
      learningRate: 0.01,
      epochs: 30,
      batchSize: 32,
      numWorkers: 2,
      targetColumn: '',
      taskType: 'regression'
    },
    {
      id: 2,
      name: 'Config B',
      type: 'neural-network',
      layers: [128, 64, 32],
      learningRate: 0.005,
      epochs: 30,
      batchSize: 16,
      numWorkers: 2,
      targetColumn: '',
      taskType: 'regression'
    }
  ]);
  const [results, setResults] = useState([]);
  const [training, setTraining] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(0);
  const [progress, setProgress] = useState({});
  const workersRef = useRef([]);
  const nextId = useRef(3);

  const colors = ['#06b6d4', '#8b5cf6', '#6366F1', '#10b981', '#ef4444', '#ec4899'];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const parseCSV = (content, filename) => {
    const result = Papa.parse(content, { header: true, dynamicTyping: true, skipEmptyLines: true });
    setParsedData(result);
    setDataset({ name: filename, content, rows: result.data.length, columns: result.meta.fields });
    const target = result.meta.fields[result.meta.fields.length - 1];
    setConfigs(prev => prev.map(c => ({ ...c, targetColumn: target })));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => parseCSV(ev.target.result, file.name);
      reader.readAsText(file);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => parseCSV(ev.target.result, file.name);
      reader.readAsText(file);
    }
  };

  const loadSample = async (sampleId) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}`);
      const data = await res.json();
      parseCSV(data.content, data.name);
      const taskType = data.type === 'classification' ? 'classification' : 'regression';
      setConfigs(prev => prev.map(c => ({ ...c, taskType })));
    } catch (err) {
      }
  };

  const addConfig = () => {
    const id = nextId.current++;
    setConfigs(prev => [...prev, {
      id,
      name: `Config ${String.fromCharCode(64 + id)}`,
      type: 'neural-network',
      layers: [64, 32],
      learningRate: 0.01,
      epochs: 30,
      batchSize: 32,
      numWorkers: 2,
      targetColumn: dataset?.columns?.[dataset.columns.length - 1] || '',
      taskType: configs[0]?.taskType || 'regression'
    }]);
  };

  const removeConfig = (id) => {
    if (configs.length <= 2) return;
    setConfigs(prev => prev.filter(c => c.id !== id));
  };

  const updateConfig = (id, field, value) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const startComparison = async () => {
    if (!dataset || configs.length < 2) return;
    setTraining(true);
    setResults([]);
    setProgress({});

    const parsed = Papa.parse(dataset.content, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const rows = parsed.data;

    // Run configs sequentially to avoid overwhelming the browser
    const allResults = [];
    for (let i = 0; i < configs.length; i++) {
      setCurrentConfig(i);
      const config = configs[i];
      const result = await trainSingleConfig(config, rows, dataset.columns, i);
      allResults.push(result);
      setResults([...allResults]);
    }

    setTraining(false);
    setCurrentConfig(-1);
  };

  const trainSingleConfig = (config, rows, columns, configIdx) => {
    return new Promise((resolve) => {
      const featureCols = columns.filter(c => c !== config.targetColumn);
      let features = rows.map(row => featureCols.map(col => row[col]));
      let labels;

      const localConfig = { ...config };

      if (config.taskType === 'classification') {
        const uniqueLabels = [...new Set(rows.map(r => r[config.targetColumn]))];
        labels = rows.map(row => {
          const oneHot = new Array(uniqueLabels.length).fill(0);
          oneHot[uniqueLabels.indexOf(row[config.targetColumn])] = 1;
          return oneHot;
        });
        localConfig.outputShape = uniqueLabels.length;
        localConfig.outputActivation = 'softmax';
        localConfig.loss = 'categoricalCrossentropy';
        localConfig.metrics = ['accuracy'];
      } else {
        labels = rows.map(row => [row[config.targetColumn]]);
        localConfig.outputShape = 1;
        localConfig.outputActivation = 'linear';
        localConfig.loss = 'meanSquaredError';
        localConfig.metrics = ['mse'];
      }

      // Normalize
      const numFeatures = featureCols.length;
      const mins = new Array(numFeatures).fill(Infinity);
      const maxs = new Array(numFeatures).fill(-Infinity);
      features.forEach(row => {
        row.forEach((val, i) => {
          if (val < mins[i]) mins[i] = val;
          if (val > maxs[i]) maxs[i] = val;
        });
      });
      features = features.map(row =>
        row.map((val, i) => (maxs[i] - mins[i]) !== 0 ? (val - mins[i]) / (maxs[i] - mins[i]) : 0)
      );

      const metricsLog = [];
      const worker = new Worker(
        new URL('../workers/training.worker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'initialized') {
          worker.postMessage({
            type: 'train',
            payload: {
              xs: features,
              ys: labels,
              epochs: config.epochs,
              batchSize: config.batchSize,
              workerId: 0
            }
          });
        } else if (type === 'epoch_complete') {
          metricsLog.push({
            epoch: payload.epoch,
            loss: payload.loss,
            accuracy: payload.metrics?.acc || payload.metrics?.accuracy
          });
          setProgress(prev => ({
            ...prev,
            [configIdx]: payload.progress
          }));
        } else if (type === 'training_complete') {
          worker.terminate();
          resolve({
            configId: config.id,
            name: config.name,
            config: localConfig,
            metrics: metricsLog,
            finalLoss: metricsLog[metricsLog.length - 1]?.loss,
            finalAccuracy: metricsLog[metricsLog.length - 1]?.accuracy
          });
        }
      };

      worker.postMessage({
        type: 'init',
        payload: {
          modelConfig: {
            type: config.type,
            layers: config.layers,
            learningRate: config.learningRate,
            outputActivation: localConfig.outputActivation,
            loss: localConfig.loss,
            metrics: localConfig.metrics,
            // CNN/RNN specific
            filters: config.filters,
            kernelSizes: config.kernelSizes,
            rnnUnits: config.rnnUnits,
            rnnType: config.rnnType,
            sequenceLength: config.sequenceLength
          },
          inputShape: numFeatures,
          outputShape: localConfig.outputShape
        }
      });
    });
  };

  // Build chart data from results
  const buildChartData = () => {
    if (results.length === 0) return [];
    const maxEpochs = Math.max(...results.map(r => r.metrics.length));
    const data = [];
    for (let i = 0; i < maxEpochs; i++) {
      const point = { epoch: i + 1 };
      results.forEach((r, idx) => {
        if (r.metrics[i]) {
          point[`loss_${idx}`] = r.metrics[i].loss;
          if (r.metrics[i].accuracy != null) {
            point[`acc_${idx}`] = r.metrics[i].accuracy;
          }
        }
      });
      data.push(point);
    }
    return data;
  };

  const chartData = buildChartData();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-50">Comparison Mode</h2>
        <p className="text-purple-300/50 mt-1">Train multiple configurations side by side and compare results</p>
      </div>

      {/* Dataset Selection */}
      {!dataset ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">📁 Select Dataset</h3>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary-400 bg-primary-500/5' : 'border-purple-500/30 hover:border-dark-400'
            }`}
            onClick={() => document.getElementById('compare-file-input').click()}
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-dark-200 font-medium">Drop CSV or click to browse</p>
            <input id="compare-file-input" type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 h-px bg-purple-500/15"></div>
            <span className="text-purple-300/40 text-sm">or</span>
            <div className="flex-1 h-px bg-purple-500/15"></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => loadSample('iris')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white">🌸 Iris Dataset</div>
              <div className="text-xs text-purple-300/50 mt-1">Classification · 150 samples</div>
            </button>
            <button onClick={() => loadSample('housing')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white">🏠 Housing Prices</div>
              <div className="text-xs text-purple-300/50 mt-1">Regression · 200 samples</div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Dataset Info */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-white">{dataset.name}</p>
                  <p className="text-sm text-purple-300/50">{dataset.rows} rows · {dataset.columns.length} columns</p>
                </div>
              </div>
              <button onClick={() => { setDataset(null); setParsedData(null); setResults([]); }} className="text-purple-300/50 hover:text-red-400 text-sm">
                Change
              </button>
            </div>
          </div>

          {/* Configurations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">⚙️ Configurations</h3>
              <button onClick={addConfig} className="btn-secondary text-sm" disabled={configs.length >= 6}>
                + Add Config
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {configs.map((config, idx) => (
                <div key={config.id} className="bg-dark-800/40 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => updateConfig(config.id, 'name', e.target.value)}
                        className="bg-transparent text-white font-medium text-sm border-none outline-none"
                      />
                    </div>
                    {configs.length > 2 && (
                      <button onClick={() => removeConfig(config.id)} className="text-purple-300/40 hover:text-red-400 text-xs">✕</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="text-xs text-purple-300/50">Architecture</label>
                      <select value={config.type} onChange={(e) => updateConfig(config.id, 'type', e.target.value)} className="input-field w-full text-xs py-1">
                        <option value="linear">Linear</option>
                        <option value="neural-network">Neural Network</option>
                        <option value="cnn">CNN</option>
                        <option value="rnn">RNN</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-purple-300/50">Target</label>
                      <select value={config.targetColumn} onChange={(e) => updateConfig(config.id, 'targetColumn', e.target.value)} className="input-field w-full text-xs py-1">
                        {dataset.columns.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                    </div>
                    {(config.type === 'neural-network' || config.type === 'cnn' || config.type === 'rnn') && (
                      <div>
                        <label className="text-xs text-purple-300/50">Layers</label>
                        <input
                          type="text"
                          value={config.layers.join(', ')}
                          onChange={(e) => updateConfig(config.id, 'layers', e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0))}
                          className="input-field w-full text-xs py-1"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-purple-300/50">Learning Rate</label>
                      <input type="number" step="0.001" value={config.learningRate} onChange={(e) => updateConfig(config.id, 'learningRate', parseFloat(e.target.value))} className="input-field w-full text-xs py-1" />
                    </div>
                    <div>
                      <label className="text-xs text-purple-300/50">Epochs</label>
                      <input type="number" min="1" max="200" value={config.epochs} onChange={(e) => updateConfig(config.id, 'epochs', parseInt(e.target.value))} className="input-field w-full text-xs py-1" />
                    </div>
                    <div>
                      <label className="text-xs text-purple-300/50">Batch Size</label>
                      <input type="number" min="1" max="512" value={config.batchSize} onChange={(e) => updateConfig(config.id, 'batchSize', parseInt(e.target.value))} className="input-field w-full text-xs py-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={startComparison}
                disabled={training}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {training ? (
                  <>
                    <span>🔄</span>
                    <span>Training Config {currentConfig + 1}/{configs.length}...</span>
                  </>
                ) : (
                  <>
                    <span>🏁</span>
                    <span>Start Comparison</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress */}
          {training && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">⏳ Training Progress</h3>
              <div className="space-y-3">
                {configs.map((config, idx) => (
                  <div key={config.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-200/70" style={{ color: colors[idx % colors.length] }}>{config.name}</span>
                      <span className="text-purple-300/50">
                        {idx < currentConfig ? '✅ Done' : idx === currentConfig ? `${(progress[idx] || 0).toFixed(0)}%` : 'Waiting...'}
                      </span>
                    </div>
                    <div className="w-full bg-dark-800/40 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${idx < currentConfig ? 100 : idx === currentConfig ? (progress[idx] || 0) : 0}%`,
                          backgroundColor: colors[idx % colors.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Charts */}
          {results.length > 0 && (
            <>
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">📉 Loss Comparison</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                      <XAxis dataKey="epoch" stroke="#A78BFA" fontSize={12} />
                      <YAxis stroke="#A78BFA" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend />
                      {results.map((r, idx) => (
                        <Line
                          key={r.configId}
                          type="monotone"
                          dataKey={`loss_${idx}`}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2}
                          dot={false}
                          name={r.name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Results Summary */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">🏆 Results Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-500/20">
                        <th className="text-left py-2 px-3 text-purple-300/50">Config</th>
                        <th className="text-left py-2 px-3 text-purple-300/50">Architecture</th>
                        <th className="text-left py-2 px-3 text-purple-300/50">Final Loss</th>
                        {results[0]?.finalAccuracy != null && (
                          <th className="text-left py-2 px-3 text-purple-300/50">Final Accuracy</th>
                        )}
                        <th className="text-left py-2 px-3 text-purple-300/50">LR</th>
                        <th className="text-left py-2 px-3 text-purple-300/50">Layers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => {
                        const isBest = r.finalLoss === Math.min(...results.map(x => x.finalLoss));
                        return (
                          <tr key={r.configId} className={`border-b border-dark-800 ${isBest ? 'bg-primary-500/5' : ''}`}>
                            <td className="py-2 px-3 font-medium" style={{ color: colors[idx % colors.length] }}>
                              {r.name} {isBest && '🏆'}
                            </td>
                            <td className="py-2 px-3 text-dark-200">{r.config.type}</td>
                            <td className="py-2 px-3 text-purple-400">{r.finalLoss?.toFixed(6)}</td>
                            {results[0]?.finalAccuracy != null && (
                              <td className="py-2 px-3 text-green-400">{r.finalAccuracy ? (r.finalAccuracy * 100).toFixed(1) + '%' : 'N/A'}</td>
                            )}
                            <td className="py-2 px-3 text-dark-200">{r.config.learningRate}</td>
                            <td className="py-2 px-3 text-dark-200">{r.config.layers?.join(', ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
