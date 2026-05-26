import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import HowToUse from '../components/ui/HowToUse';
import { Play, Square, Waves, AlertTriangle, Circle } from 'lucide-react';

export default function StreamingML() {
  const [config, setConfig] = useState({ rate: 20, windowSize: 50, learningRate: 0.01, batchSize: 5 });
  const [running, setRunning] = useState(false);
  const [data, setData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const [driftDetected, setDriftDetected] = useState(false);
  const [driftCount, setDriftCount] = useState(0);
  const [modelUpdates, setModelUpdates] = useState(0);
  const [currentLR, setCurrentLR] = useState(0.01);
  const intervalRef = useRef(null);
  const modelRef = useRef({ weights: [Math.random(), Math.random()], bias: Math.random() * 0.1 });
  const dataGenRef = useRef({ mean: 0, std: 1, slope: 1, intercept: 0 });
  const stepRef = useRef(0);
  const currentLRRef = useRef(0.01);
  const predictionsRef = useRef([]);
  const accuracyHistoryRef = useRef([]);
  const driftDetectedRef = useRef(false);

  const generatePoint = () => {
    const gen = dataGenRef.current;
    const x = (Math.random() - 0.5) * 4 + gen.mean;
    const noise = (Math.random() - 0.5) * gen.std * 0.5;
    const y = gen.slope * x + gen.intercept + noise;
    return { x, y, timestamp: Date.now() };
  };

  const predict = (x) => {
    const m = modelRef.current;
    return m.weights[0] * x + m.bias;
  };

  const updateModel = (batch, lr) => {
    const m = modelRef.current;
    let gradW = 0, gradB = 0;
    for (const point of batch) {
      const pred = m.weights[0] * point.x + m.bias;
      const error = pred - point.y;
      gradW += error * point.x;
      gradB += error;
    }
    gradW /= batch.length;
    gradB /= batch.length;
    m.weights[0] -= lr * gradW;
    m.bias -= lr * gradB;
    modelRef.current = m;
  };

  const injectDrift = () => {
    dataGenRef.current = {
      mean: dataGenRef.current.mean + (Math.random() - 0.5) * 4,
      std: dataGenRef.current.std * (0.5 + Math.random()),
      slope: -dataGenRef.current.slope + (Math.random() - 0.5),
      intercept: dataGenRef.current.intercept + (Math.random() - 0.5) * 5
    };
    setDriftDetected(true);
    driftDetectedRef.current = true;
    setDriftCount(prev => prev + 1);
    const boostedLR = config.learningRate * 5;
    setCurrentLR(boostedLR);
    currentLRRef.current = boostedLR;
    setTimeout(() => {
      setCurrentLR(config.learningRate);
      currentLRRef.current = config.learningRate;
      setDriftDetected(false);
      driftDetectedRef.current = false;
    }, 5000);
  };

  const startStreaming = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(true);
    setData([]);
    setPredictions([]);
    setAccuracyHistory([]);
    setDriftCount(0);
    setModelUpdates(0);
    stepRef.current = 0;
    predictionsRef.current = [];
    accuracyHistoryRef.current = [];
    driftDetectedRef.current = false;
    modelRef.current = { weights: [Math.random()], bias: Math.random() * 0.1 };
    dataGenRef.current = { mean: 0, std: 1, slope: 1 + Math.random(), intercept: Math.random() * 2 };
    setCurrentLR(config.learningRate);
    currentLRRef.current = config.learningRate;

    let batch = [];
    intervalRef.current = setInterval(() => {
      stepRef.current++;
      const point = generatePoint();
      const pred = predict(point.x);
      const error = Math.abs(pred - point.y);
      
      batch.push(point);

      const newPredEntry = { step: stepRef.current, actual: point.y, predicted: pred, error };
      predictionsRef.current = [...predictionsRef.current, newPredEntry].slice(-config.windowSize);
      
      setData(prev => {
        const updated = [...prev, { ...point, step: stepRef.current }];
        return updated.slice(-config.windowSize);
      });
      
      setPredictions(predictionsRef.current);

      // Update model every batchSize points
      if (batch.length >= config.batchSize) {
        updateModel(batch, currentLRRef.current);
        batch = [];
        setModelUpdates(prev => prev + 1);
      }

      // Track accuracy (inverse of error, normalized)
      if (stepRef.current % 5 === 0) {
        const recentPreds = predictionsRef.current.slice(-20);
        const avgError = recentPreds.length > 0 
          ? recentPreds.reduce((s, p) => s + p.error, 0) / recentPreds.length 
          : 1;
        const accuracy = Math.max(0, Math.min(1, 1 - avgError / 5));
        const newAccEntry = { step: stepRef.current, accuracy: Number(accuracy.toFixed(4)) };
        accuracyHistoryRef.current = [...accuracyHistoryRef.current, newAccEntry].slice(-100);
        setAccuracyHistory(accuracyHistoryRef.current);
      }

      // Auto-detect drift (sudden accuracy drop)
      if (stepRef.current % 20 === 0 && accuracyHistoryRef.current.length > 10) {
        const recent = accuracyHistoryRef.current.slice(-5);
        const older = accuracyHistoryRef.current.slice(-15, -5);
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((s, a) => s + a.accuracy, 0) / recent.length;
          const olderAvg = older.reduce((s, a) => s + a.accuracy, 0) / older.length;
          if (olderAvg - recentAvg > 0.2 && !driftDetectedRef.current) {
            setDriftDetected(true);
            driftDetectedRef.current = true;
            const boostedLR = config.learningRate * 3;
            setCurrentLR(boostedLR);
            currentLRRef.current = boostedLR;
            setTimeout(() => {
              setDriftDetected(false);
              driftDetectedRef.current = false;
              setCurrentLR(config.learningRate);
              currentLRRef.current = config.learningRate;
            }, 3000);
          }
        }
      }
    }, 1000 / config.rate);
  };

  const stopStreaming = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="streaming-ml" steps={[
      'Configure data stream rate and window size.',
      'Click \'Start Stream\' to begin online learning.',
      'Inject concept drift to test adaptation.',
      'Monitor accuracy and model updates in real-time.'
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Real-time Streaming ML</h1>
        <p className="text-purple-300/50 mt-1">Online learning with concept drift detection and auto-adaptation</p>
      </div>

      {/* Config */}
      <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-purple-300/50">Data Rate (pts/sec)</label>
            <input type="number" min={1} max={100} value={config.rate}
              onChange={e => setConfig(p => ({ ...p, rate: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Window Size</label>
            <input type="number" min={10} max={200} value={config.windowSize}
              onChange={e => setConfig(p => ({ ...p, windowSize: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Learning Rate</label>
            <input type="number" min={0.001} max={0.1} step={0.001} value={config.learningRate}
              onChange={e => setConfig(p => ({ ...p, learningRate: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Batch Size</label>
            <input type="number" min={1} max={20} value={config.batchSize}
              onChange={e => setConfig(p => ({ ...p, batchSize: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          {!running ? (
            <button onClick={startStreaming} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Play className="w-4 h-4 inline mr-1" /> Start Streaming
            </button>
          ) : (
            <button onClick={stopStreaming} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Square className="w-4 h-4 inline mr-1" /> Stop
            </button>
          )}
          <button onClick={injectDrift} disabled={!running}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
            <Waves className="w-4 h-4 inline mr-1" /> Inject Drift
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-xs text-purple-300/50">Data Points</p>
          <p className="text-xl font-bold text-white">{stepRef.current}</p>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-xs text-purple-300/50">Model Updates</p>
          <p className="text-xl font-bold text-purple-400">{modelUpdates}</p>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-xs text-purple-300/50">Learning Rate</p>
          <p className={`text-xl font-bold ${driftDetected ? 'text-orange-400' : 'text-white'}`}>{currentLR.toFixed(4)}</p>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-xs text-purple-300/50">Drift Events</p>
          <p className="text-xl font-bold text-orange-400">{driftCount}</p>
        </div>
        <div className={`bg-dark-800/40 rounded-xl p-4 border ${driftDetected ? 'border-orange-500 bg-orange-500/10' : 'border-purple-500/20'} text-center`}>
          <p className="text-xs text-purple-300/50">Status</p>
          <p className={`text-xl font-bold ${driftDetected ? 'text-orange-400' : running ? 'text-green-400' : 'text-purple-300/50'}`}>
            {driftDetected ? <><AlertTriangle className="w-4 h-4 inline mr-1" /> DRIFT</> : running ? <><Circle className="w-3 h-3 inline mr-1 fill-green-400 text-green-400" /> LIVE</> : <><Circle className="w-3 h-3 inline mr-1 text-gray-400" /> IDLE</>}
          </p>
        </div>
      </div>

      {/* Predictions Chart */}
      {predictions.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Actual vs Predicted</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={predictions.slice(-60)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="step" stroke="#6b5b95" />
              <YAxis stroke="#6b5b95" />
              <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} name="Actual" dot={false} />
              <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} name="Predicted" dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accuracy Over Time */}
      {accuracyHistory.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Prediction Accuracy Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={accuracyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="step" stroke="#6b5b95" />
              <YAxis stroke="#6b5b95" domain={[0, 1]} />
              <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="accuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Accuracy" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Distribution */}
      {data.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Data Distribution (Sliding Window)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-purple-300/50">Mean X</p>
              <p className="text-lg font-mono text-white">{(data.reduce((s, d) => s + d.x, 0) / data.length).toFixed(3)}</p>
            </div>
            <div>
              <p className="text-xs text-purple-300/50">Mean Y</p>
              <p className="text-lg font-mono text-white">{(data.reduce((s, d) => s + d.y, 0) / data.length).toFixed(3)}</p>
            </div>
            <div>
              <p className="text-xs text-purple-300/50">Window Size</p>
              <p className="text-lg font-mono text-white">{data.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
