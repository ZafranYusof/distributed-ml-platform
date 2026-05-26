import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DistributedInference() {
  const { user } = useAuth();
  const [modelConfig, setModelConfig] = useState({ layers: [{ units: 16, activation: 'relu' }, { units: 3, activation: 'softmax' }], inputSize: 4 });
  const [batchSize, setBatchSize] = useState(100);
  const [numWorkers, setNumWorkers] = useState(4);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [workerStats, setWorkerStats] = useState([]);
  const [history, setHistory] = useState([]);
  const workersRef = useRef([]);
  const timeoutsRef = useRef([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const runInference = () => {
    setRunning(true);
    setResults(null);
    setWorkerStats([]);
    timeoutsRef.current = [];

    // Generate random batch data
    const inputSize = modelConfig.inputSize;
    const totalSamples = batchSize;
    const samplesPerWorker = Math.ceil(totalSamples / numWorkers);
    const startTime = performance.now();
    let completedWorkers = 0;
    const allPredictions = [];
    const stats = Array.from({ length: numWorkers }, (_, i) => ({
      id: i, status: 'running', samples: 0, latency: 0, utilization: 0
    }));
    setWorkerStats([...stats]);

    // Simulate distributed inference with setTimeout (simulating Web Workers)
    for (let w = 0; w < numWorkers; w++) {
      const workerStart = performance.now();
      const workerSamples = Math.min(samplesPerWorker, totalSamples - w * samplesPerWorker);

      const timeoutId = setTimeout(() => {
        // Simulate inference computation
        const predictions = [];
        for (let i = 0; i < workerSamples; i++) {
          const input = Array.from({ length: inputSize }, () => Math.random());
          // Simple forward pass simulation
          let output = input;
          for (const layer of modelConfig.layers) {
            const newOutput = Array.from({ length: layer.units }, () => {
              let sum = 0;
              for (let j = 0; j < output.length; j++) sum += output[j] * (Math.random() - 0.5);
              return layer.activation === 'relu' ? Math.max(0, sum) : sum;
            });
            if (layer.activation === 'softmax') {
              const expSum = newOutput.reduce((a, b) => a + Math.exp(b), 0);
              for (let j = 0; j < newOutput.length; j++) newOutput[j] = Math.exp(newOutput[j]) / expSum;
            }
            output = newOutput;
          }
          predictions.push(output);
        }

        const workerLatency = performance.now() - workerStart;
        stats[w] = { id: w, status: 'done', samples: workerSamples, latency: workerLatency, utilization: Math.min(100, (workerSamples / samplesPerWorker) * 100) };
        setWorkerStats([...stats]);
        allPredictions.push(...predictions);
        completedWorkers++;

        if (completedWorkers === numWorkers) {
          const totalTime = performance.now() - startTime;
          const result = {
            totalSamples: allPredictions.length,
            totalTime,
            throughput: (allPredictions.length / totalTime) * 1000,
            avgLatencyPerBatch: totalTime / numWorkers,
            predictions: allPredictions.slice(0, 5)
          };
          setResults(result);
          setHistory(prev => [{ ...result, timestamp: new Date().toISOString(), workers: numWorkers, batchSize }, ...prev].slice(0, 10));
          setRunning(false);
        }
      }, Math.random() * 200 + 50 * w); // Stagger worker starts
      timeoutsRef.current.push(timeoutId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Distributed Inference</h1>
        <p className="text-purple-300/50 mt-1">Split batch predictions across multiple Web Workers for parallel inference</p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-4">
          <label className="block text-sm text-purple-300/50 mb-2">Batch Size</label>
          <input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} min={10} max={10000} className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-4">
          <label className="block text-sm text-purple-300/50 mb-2">Number of Workers</label>
          <input type="number" value={numWorkers} onChange={(e) => setNumWorkers(Number(e.target.value))} min={1} max={16} className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-4">
          <label className="block text-sm text-purple-300/50 mb-2">Input Features</label>
          <input type="number" value={modelConfig.inputSize} onChange={(e) => setModelConfig(prev => ({ ...prev, inputSize: Number(e.target.value) }))} min={1} max={100} className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <button
        onClick={runInference}
        disabled={running}
        className="px-6 py-3 bg-gradient-btn text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
      >
        {running ? '⏳ Running Inference...' : '🚀 Run Distributed Inference'}
      </button>

      {/* Worker Stats */}
      {workerStats.length > 0 && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Worker Utilization</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workerStats.map(w => (
              <div key={w.id} className="bg-dark-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-200/70">Worker {w.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {w.status}
                  </span>
                </div>
                <div className="w-full bg-purple-500/15 rounded-full h-2 mb-2">
                  <div className="bg-gradient-btn h-2 rounded-full transition-all" style={{ width: `${w.utilization}%` }}></div>
                </div>
                <div className="text-xs text-purple-300/40">
                  <span>{w.samples} samples</span> · <span>{w.latency.toFixed(1)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{results.throughput.toFixed(0)}</p>
              <p className="text-xs text-purple-300/50 mt-1">predictions/sec</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{results.totalTime.toFixed(1)}ms</p>
              <p className="text-xs text-purple-300/50 mt-1">total time</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{results.avgLatencyPerBatch.toFixed(1)}ms</p>
              <p className="text-xs text-purple-300/50 mt-1">avg latency/worker</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{results.totalSamples}</p>
              <p className="text-xs text-purple-300/50 mt-1">total predictions</p>
            </div>
          </div>
          {results.predictions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-purple-300/50 mb-2">Sample predictions (first 5):</p>
              <div className="bg-dark-900 rounded-lg p-3 text-xs text-purple-200/70 font-mono overflow-auto max-h-32">
                {results.predictions.map((p, i) => (
                  <div key={i}>[{p.map(v => v.toFixed(4)).join(', ')}]</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Run History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-purple-300/50 border-b border-purple-500/20">
                  <th className="text-left py-2 px-3">Time</th>
                  <th className="text-left py-2 px-3">Workers</th>
                  <th className="text-left py-2 px-3">Batch</th>
                  <th className="text-left py-2 px-3">Throughput</th>
                  <th className="text-left py-2 px-3">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-purple-500/20/50 text-purple-200/70">
                    <td className="py-2 px-3">{new Date(h.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-3">{h.workers}</td>
                    <td className="py-2 px-3">{h.batchSize}</td>
                    <td className="py-2 px-3 text-purple-400">{h.throughput.toFixed(0)} pred/s</td>
                    <td className="py-2 px-3">{h.totalTime.toFixed(1)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
