import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import HuggingFaceExport from '../components/HuggingFaceExport';
import { useToast } from '../components/ui/Toast';

export default function Inference() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [normData, setNormData] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    // Find available trained sessions from sessionStorage
    const available = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('weights-')) {
        const id = key.replace('weights-', '');
        available.push(id);
      }
    }
    setSessions(available);
    if (available.length > 0) {
      setSelectedSession(available[available.length - 1]);
    }
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const norm = sessionStorage.getItem(`norm-${selectedSession}`);
    if (norm) {
      const parsed = JSON.parse(norm);
      setNormData(parsed);
      const initial = {};
      parsed.featureCols.forEach(col => { initial[col] = ''; });
      setInputValues(initial);
      loadModel(selectedSession, parsed);
    }
  }, [selectedSession]);

  const loadModel = async (sessionId, norm) => {
    const weightsStr = sessionStorage.getItem(`weights-${sessionId}`);
    if (!weightsStr) return;

    const weights = JSON.parse(weightsStr);
    const config = norm.config;

    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker(
      new URL('../workers/training.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'initialized') {
        worker.postMessage({ type: 'setWeights', payload: { weights } });
      } else if (type === 'weights_set') {
        setModelReady(true);
      } else if (type === 'prediction') {
        handlePredictionResult(payload.result, config);
      }
    };

    worker.postMessage({
      type: 'init',
      payload: {
        modelConfig: {
          type: config.type,
          layers: config.layers,
          learningRate: config.learningRate,
          outputActivation: config.outputActivation,
          loss: config.loss,
          metrics: config.metrics,
          filters: config.filters,
          kernelSizes: config.kernelSizes,
          rnnUnits: config.rnnUnits,
          rnnType: config.rnnType,
          sequenceLength: config.sequenceLength
        },
        inputShape: norm.featureCols.length,
        outputShape: config.outputShape
      }
    });

    workerRef.current = worker;
  };

  const handlePredictionResult = (result, config) => {
    if (config.taskType === 'classification' && config.classLabels) {
      const maxIdx = result.indexOf(Math.max(...result));
      setPrediction({
        type: 'classification',
        label: config.classLabels[maxIdx],
        confidence: (result[maxIdx] * 100).toFixed(1),
        probabilities: config.classLabels.map((label, i) => ({
          label,
          probability: (result[i] * 100).toFixed(1)
        }))
      });
    } else {
      setPrediction({
        type: 'regression',
        value: result[0]?.toFixed(4)
      });
    }
  };

  const runPrediction = () => {
    if (!workerRef.current || !normData || !modelReady) return;

    // Normalize input based on method
    const input = normData.featureCols.map((col, i) => {
      const val = parseFloat(inputValues[col]) || 0;
      if (normData.method === 'z-score') {
        return normData.stds[i] !== 0 ? (val - normData.means[i]) / normData.stds[i] : 0;
      } else if (normData.method === 'min-max') {
        const range = normData.maxs[i] - normData.mins[i];
        return range !== 0 ? (val - normData.mins[i]) / range : 0;
      }
      return val;
    });

    workerRef.current.postMessage({ type: 'predict', payload: { input } });
  };

  const downloadModel = async () => {
    if (!selectedSession) return;
    setExporting(true);

    const weights = JSON.parse(sessionStorage.getItem(`weights-${selectedSession}`));
    const norm = JSON.parse(sessionStorage.getItem(`norm-${selectedSession}`));

    if (exportFormat === 'json') {
      // Full JSON export
      const modelData = {
        format: 'distml-json-v1',
        weights,
        normalization: norm,
        config: norm.config,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `model-${selectedSession.slice(0, 8)}.json`);
    } else if (exportFormat === 'binary') {
      // Binary format - weights as Float32Array + metadata JSON
      try {
        if (user) {
          const res = await authFetch('/api/export', {
            method: 'POST',
            body: JSON.stringify({ weights, normalization: norm, config: norm.config, format: 'binary' })
          });
          if (res.ok) {
            const data = await res.json();
            // Download binary weights
            const binaryData = Uint8Array.from(atob(data.binary), c => c.charCodeAt(0));
            const blob = new Blob([binaryData], { type: 'application/octet-stream' });
            downloadBlob(blob, `model-${selectedSession.slice(0, 8)}.bin`);
            // Download metadata
            const metaBlob = new Blob([JSON.stringify(data.metadata, null, 2)], { type: 'application/json' });
            downloadBlob(metaBlob, `model-${selectedSession.slice(0, 8)}-metadata.json`);
          }
        } else {
          // Client-side binary export
          const allWeights = [];
          for (const layer of weights) {
            for (const w of layer) {
              allWeights.push(...w.data);
            }
          }
          const buffer = new Float32Array(allWeights);
          const blob = new Blob([buffer.buffer], { type: 'application/octet-stream' });
          downloadBlob(blob, `model-${selectedSession.slice(0, 8)}.bin`);
          // Metadata
          const metadata = {
            normalization: norm,
            config: norm.config,
            layerShapes: weights.map(l => l.map(w => w.shape))
          };
          const metaBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
          downloadBlob(metaBlob, `model-${selectedSession.slice(0, 8)}-metadata.json`);
        }
      } catch (err) {
        }
    } else if (exportFormat === 'onnx-like') {
      // ONNX-like JSON format (structured for interop)
      const onnxLike = {
        format: 'distml-onnx-like-v1',
        irVersion: 1,
        graph: {
          nodes: weights.map((layer, i) => ({
            name: `layer_${i}`,
            opType: i < weights.length - 1 ? 'Dense+ReLU' : 'Dense',
            inputs: layer.filter((_, wi) => wi === 0).map(w => ({ shape: w.shape, data: w.data })),
            biases: layer.filter((_, wi) => wi === 1).map(w => ({ shape: w.shape, data: w.data }))
          })),
          inputs: [{ name: 'input', shape: [null, norm.featureCols.length] }],
          outputs: [{ name: 'output', shape: [null, norm.config.outputShape] }]
        },
        metadata: {
          normalization: norm,
          config: norm.config,
          exportedAt: new Date().toISOString()
        }
      };
      const blob = new Blob([JSON.stringify(onnxLike, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `model-${selectedSession.slice(0, 8)}.onnx.json`);
    }

    setExporting(false);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Inference</h2>
          <p className="text-dark-400 mt-1">Make predictions with your trained model</p>
        </div>
        {modelReady && (
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="input-field text-sm py-1.5"
            >
              <option value="json">JSON</option>
              <option value="binary">Binary (.bin)</option>
              <option value="onnx-like">ONNX-like</option>
            </select>
            <button
              onClick={downloadModel}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2"
            >
              <span>💾</span>
              <span>{exporting ? 'Exporting...' : 'Export Model'}</span>
            </button>
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-dark-200 font-medium">No trained models available</p>
          <p className="text-dark-400 text-sm mt-1">Train a model first from the Dashboard</p>
        </div>
      ) : (
        <>
          {/* Session Selector */}
          {sessions.length > 1 && (
            <div className="card">
              <label className="block text-sm text-dark-300 mb-2">Select Model Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="input-field w-full"
              >
                {sessions.map(s => (
                  <option key={s} value={s}>Session {s.slice(0, 8)}...</option>
                ))}
              </select>
            </div>
          )}

          {/* Input Form */}
          {normData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">📝 Input Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {normData.featureCols.map((col, idx) => (
                  <div key={col}>
                    <label className="block text-sm text-dark-300 mb-1">{col}</label>
                    <input
                      type="number"
                      step="any"
                      value={inputValues[col] || ''}
                      onChange={(e) => setInputValues(prev => ({ ...prev, [col]: e.target.value }))}
                      className="input-field w-full"
                      placeholder={`Enter ${col}`}
                    />
                    <p className="text-xs text-dark-500 mt-0.5">
                      {normData.method === 'min-max' && normData.mins && (
                        <>Range: {normData.mins[idx]?.toFixed(2)} - {normData.maxs[idx]?.toFixed(2)}</>
                      )}
                      {normData.method === 'z-score' && normData.means && (
                        <>Mean: {normData.means[idx]?.toFixed(2)}, Std: {normData.stds[idx]?.toFixed(2)}</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={runPrediction}
                  disabled={!modelReady}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>🔮</span>
                  <span>{modelReady ? 'Predict' : 'Loading model...'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Prediction Result */}
          {prediction && (
            <div className="card border-primary-500/30">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">🎯 Prediction Result</h3>
              {prediction.type === 'classification' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏷️</span>
                    <div>
                      <p className="text-2xl font-bold text-primary-400">{prediction.label}</p>
                      <p className="text-dark-400 text-sm">Confidence: {prediction.confidence}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-dark-300 font-medium">Class Probabilities:</p>
                    {prediction.probabilities.map(p => (
                      <div key={p.label} className="flex items-center gap-3">
                        <span className="text-sm text-dark-300 w-24">{p.label}</span>
                        <div className="flex-1 bg-dark-800 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary-500 transition-all"
                            style={{ width: `${p.probability}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-dark-400 w-12 text-right">{p.probability}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  <div>
                    <p className="text-2xl font-bold text-primary-400">{prediction.value}</p>
                    <p className="text-dark-400 text-sm">Predicted value</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Info */}
          {modelReady && (
            <div className="card">
              <h3 className="text-lg font-semibold text-dark-100 mb-3">📦 Export Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-dark-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-dark-100">JSON</p>
                  <p className="text-xs text-dark-400 mt-1">Full model with weights, normalization params, and config. Easy to reload.</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-dark-100">Binary (.bin)</p>
                  <p className="text-xs text-dark-400 mt-1">Compact Float32 weights + separate metadata JSON. Smaller file size.</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-dark-100">ONNX-like</p>
                  <p className="text-xs text-dark-400 mt-1">Structured graph format for interoperability with other ML frameworks.</p>
                </div>
              </div>
            </div>
          )}

          {/* HuggingFace Export */}
          {modelReady && (
            <HuggingFaceExport modelName={selectedSession ? `model-${selectedSession.slice(0, 8)}` : 'my-model'} />
          )}
        </>
      )}
    </div>
  );
}
