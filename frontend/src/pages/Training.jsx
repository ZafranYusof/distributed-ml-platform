import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import HowToUse from '../components/ui/HowToUse';
import { RefreshCw, CheckCircle2, Loader, Save, Wand2, HardHat, TrendingDown, BarChart3 } from 'lucide-react';

export default function Training() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const workersRef = useRef([]);
  const [status, setStatus] = useState('initializing');
  const [metrics, setMetrics] = useState([]);
  const [workerProgress, setWorkerProgress] = useState({});
  const [aggregatedLoss, setAggregatedLoss] = useState([]);
  const [trainingSpeeds, setTrainingSpeeds] = useState({});
  const [totalEpochs, setTotalEpochs] = useState(0);
  const [completedWorkers, setCompletedWorkers] = useState(0);
  const [numWorkers, setNumWorkers] = useState(0);
  const [modelWeights, setModelWeights] = useState(null);
  const [trainingConfig, setTrainingConfig] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saved, setSaved] = useState(false);
  const [validationMetrics, setValidationMetrics] = useState(null);
  const weightsCollected = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`training-${sessionId}`);
    if (!stored) {
      navigate('/');
      return;
    }
    const data = JSON.parse(stored);
    setTrainingConfig(data);
    initTraining(data);

    return () => {
      workersRef.current.forEach(w => w.terminate());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    if (status === 'training' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, startTime]);

  const initTraining = async (data) => {
    const { dataset, columns, config } = data;
    const parsed = Papa.parse(dataset, { header: true, dynamicTyping: true, skipEmptyLines: true });
    let rows = parsed.data;

    // Feature selection
    const preprocessing = config.preprocessing || {};
    let featureCols = columns.filter(c => c !== config.targetColumn);
    if (preprocessing.selectedFeatures && preprocessing.selectedFeatures.length > 0) {
      featureCols = preprocessing.selectedFeatures.filter(c => c !== config.targetColumn);
    }

    let features = rows.map(row => featureCols.map(col => row[col]));
    let labels;

    if (config.taskType === 'classification') {
      const uniqueLabels = [...new Set(rows.map(r => r[config.targetColumn]))];
      labels = rows.map(row => {
        const oneHot = new Array(uniqueLabels.length).fill(0);
        oneHot[uniqueLabels.indexOf(row[config.targetColumn])] = 1;
        return oneHot;
      });
      config.outputShape = uniqueLabels.length;
      config.outputActivation = 'softmax';
      config.loss = 'categoricalCrossentropy';
      config.metrics = ['accuracy'];
      config.classLabels = uniqueLabels;
    } else {
      labels = rows.map(row => [row[config.targetColumn]]);
      config.outputShape = 1;
      config.outputActivation = 'linear';
      config.loss = 'meanSquaredError';
      config.metrics = ['mse'];
    }

    // Normalization
    const numFeatures = featureCols.length;
    const normMethod = preprocessing.normalization || 'min-max';
    let normParams = {};

    if (normMethod === 'min-max') {
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
      normParams = { method: 'min-max', mins, maxs };
    } else if (normMethod === 'z-score') {
      const means = new Array(numFeatures).fill(0);
      const stds = new Array(numFeatures).fill(0);
      features.forEach(row => {
        row.forEach((val, i) => { means[i] += val; });
      });
      means.forEach((_, i) => { means[i] /= features.length; });
      features.forEach(row => {
        row.forEach((val, i) => { stds[i] += (val - means[i]) ** 2; });
      });
      stds.forEach((_, i) => { stds[i] = Math.sqrt(stds[i] / features.length); });
      features = features.map(row =>
        row.map((val, i) => stds[i] !== 0 ? (val - means[i]) / stds[i] : 0)
      );
      normParams = { method: 'z-score', means, stds };
    }

    // Train/Test split
    const splitRatio = preprocessing.trainTestSplit || 0.8;
    const splitIdx = Math.floor(features.length * splitRatio);

    // Shuffle data before split
    const indices = Array.from({ length: features.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const shuffledFeatures = indices.map(i => features[i]);
    const shuffledLabels = indices.map(i => labels[i]);

    const trainFeatures = shuffledFeatures.slice(0, splitIdx);
    const trainLabels = shuffledLabels.slice(0, splitIdx);
    const testFeatures = shuffledFeatures.slice(splitIdx);
    const testLabels = shuffledLabels.slice(splitIdx);

    // Store normalization params for inference
    const normData = { ...normParams, featureCols, config, splitRatio };
    sessionStorage.setItem(`norm-${sessionId}`, JSON.stringify(normData));

    // Store test data for validation
    sessionStorage.setItem(`test-${sessionId}`, JSON.stringify({ features: testFeatures, labels: testLabels }));

    // Split training data across workers
    const nWorkers = config.numWorkers;
    setNumWorkers(nWorkers);
    setTotalEpochs(config.epochs);
    const chunkSize = Math.ceil(trainFeatures.length / nWorkers);

    const workers = [];
    for (let i = 0; i < nWorkers; i++) {
      const worker = new Worker(
        new URL('../workers/training.worker.js', import.meta.url),
        { type: 'module' }
      );

      const workerXs = trainFeatures.slice(i * chunkSize, (i + 1) * chunkSize);
      const workerYs = trainLabels.slice(i * chunkSize, (i + 1) * chunkSize);

      worker.onmessage = (e) => handleWorkerMessage(e, i, nWorkers, config);

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
          inputShape: numFeatures,
          outputShape: config.outputShape
        }
      });

      worker._trainData = { xs: workerXs, ys: workerYs, config };
      workers.push(worker);
    }

    workersRef.current = workers;
    setStatus('initializing');
  };

  const handleWorkerMessage = useCallback((e, workerIdx, nWorkers, config) => {
    const { type, payload } = e.data;

    switch (type) {
      case 'initialized':
        const worker = workersRef.current[workerIdx];
        if (worker && worker._trainData) {
          setStatus('training');
          setStartTime(Date.now());
          worker.postMessage({
            type: 'train',
            payload: {
              xs: worker._trainData.xs,
              ys: worker._trainData.ys,
              epochs: worker._trainData.config.epochs,
              batchSize: worker._trainData.config.batchSize,
              workerId: workerIdx
            }
          });
        }
        break;

      case 'epoch_complete':
        setWorkerProgress(prev => ({
          ...prev,
          [payload.workerId]: payload.progress
        }));
        setTrainingSpeeds(prev => ({
          ...prev,
          [payload.workerId]: payload.samplesPerSec
        }));
        setMetrics(prev => {
          const newMetrics = [...prev, {
            epoch: payload.epoch,
            loss: payload.loss,
            worker: payload.workerId,
            ...payload.metrics
          }];
          return newMetrics;
        });
        setAggregatedLoss(prev => {
          const existing = prev.find(m => m.epoch === payload.epoch);
          if (existing) {
            const updated = { ...existing };
            updated[`worker${payload.workerId}`] = payload.loss;
            const workerLosses = Object.keys(updated)
              .filter(k => k.startsWith('worker'))
              .map(k => updated[k]);
            updated.avgLoss = workerLosses.reduce((a, b) => a + b, 0) / workerLosses.length;
            return prev.map(m => m.epoch === payload.epoch ? updated : m);
          } else {
            const entry = {
              epoch: payload.epoch,
              [`worker${payload.workerId}`]: payload.loss,
              avgLoss: payload.loss
            };
            return [...prev, entry];
          }
        });
        break;

      case 'training_complete':
        setCompletedWorkers(prev => {
          const newCount = prev + 1;
          if (newCount === nWorkers) {
            collectAndAverageWeights(nWorkers);
          }
          return newCount;
        });
        break;

      case 'weights':
        weightsCollected.current.push(payload.weights);
        if (weightsCollected.current.length === nWorkers) {
          performFederatedAveraging(weightsCollected.current, nWorkers);
        }
        break;

      case 'weights_set':
        setStatus('completed');
        break;
    }
  }, []);

  const collectAndAverageWeights = (nWorkers) => {
    weightsCollected.current = [];
    workersRef.current.forEach(w => {
      w.postMessage({ type: 'getWeights' });
    });
  };

  const performFederatedAveraging = (allWeights, nWorkers) => {
    // Average weights across all workers
    // allWeights[workerIdx][layerIdx][weightIdx] = { shape, data }
    const averaged = allWeights[0].map((layer, layerIdx) => {
      if (layer.length === 0) return []; // Skip layers with no weights (e.g., reshape)
      return layer.map((weight, weightIdx) => ({
        shape: weight.shape,
        data: weight.data.map((val, dataIdx) => {
          let sum = val;
          for (let w = 1; w < allWeights.length; w++) {
            sum += allWeights[w][layerIdx][weightIdx].data[dataIdx];
          }
          return sum / nWorkers;
        })
      }));
    });

    setModelWeights(averaged);

    // Set averaged weights back to first worker for inference
    workersRef.current[0].postMessage({
      type: 'setWeights',
      payload: { weights: averaged }
    });

    // Store weights for inference page
    sessionStorage.setItem(`weights-${sessionId}`, JSON.stringify(averaged));
  };

  const saveToHistory = async () => {
    if (!user || saved) return;
    try {
      const normData = JSON.parse(sessionStorage.getItem(`norm-${sessionId}`) || '{}');
      const lastMetrics = aggregatedLoss[aggregatedLoss.length - 1];
      const finalMetrics = {
        loss: lastMetrics?.avgLoss,
        accuracy: metrics.filter(m => m.epoch === totalEpochs)?.[0]?.accuracy || metrics.filter(m => m.epoch === totalEpochs)?.[0]?.acc,
        trainingTime: elapsedTime
      };

      await authFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          name: `${trainingConfig?.config?.type || 'Model'} - ${trainingConfig?.datasetName || 'Dataset'}`,
          datasetName: trainingConfig?.datasetName || 'Unknown',
          config: trainingConfig?.config,
          metrics: aggregatedLoss.map(m => ({ epoch: m.epoch, loss: m.avgLoss })),
          finalMetrics,
          modelWeights: modelWeights,
          normalization: normData,
          status: 'completed'
        })
      });
      setSaved(true);
    } catch (err) {
      }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalSpeed = Object.values(trainingSpeeds).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="training" steps={[
      'Upload a dataset or select a sample dataset.',
      'Configure model architecture (Linear/NN/CNN/RNN).',
      'Set hyperparameters (learning rate, epochs, batch size).',
      'Choose number of workers for distributed training.',
      'Click \'Start Training\' and watch real-time progress.'
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Training Session</h2>
          <p className="text-purple-300/50 mt-1">
            {status === 'training' && <><RefreshCw className="w-4 h-4 inline mr-1 animate-spin" /> Training in progress...</>}
            {status === 'completed' && <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" /> Training completed!</>}
            {status === 'initializing' && <><Loader className="w-4 h-4 inline mr-1 animate-spin" /> Initializing workers...</>}
          </p>
        </div>
        <div className="flex gap-3">
          {status === 'completed' && user && (
            <button
              onClick={saveToHistory}
              disabled={saved}
              className={`btn-secondary flex items-center gap-2 ${saved ? 'opacity-50' : ''}`}
            >
              <span>{saved ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Save className="w-4 h-4" />}</span>
              <span>{saved ? 'Saved' : 'Save to History'}</span>
            </button>
          )}
          {status === 'completed' && (
            <button onClick={() => navigate('/inference')} className="btn-primary">
              <Wand2 className="w-4 h-4 inline mr-1" /> Go to Inference
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-purple-300/50 text-xs uppercase tracking-wide">Status</p>
          <p className="text-lg font-bold text-purple-400 mt-1 capitalize">{status}</p>
        </div>
        <div className="card text-center">
          <p className="text-purple-300/50 text-xs uppercase tracking-wide">Elapsed</p>
          <p className="text-lg font-bold text-white mt-1">{formatTime(elapsedTime)}</p>
        </div>
        <div className="card text-center">
          <p className="text-purple-300/50 text-xs uppercase tracking-wide">Workers</p>
          <p className="text-lg font-bold text-white mt-1">{completedWorkers}/{numWorkers} done</p>
        </div>
        <div className="card text-center">
          <p className="text-purple-300/50 text-xs uppercase tracking-wide">Speed</p>
          <p className="text-lg font-bold text-green-400 mt-1">{totalSpeed} samples/s</p>
        </div>
        <div className="card text-center">
          <p className="text-purple-300/50 text-xs uppercase tracking-wide">Architecture</p>
          <p className="text-lg font-bold text-purple-400 mt-1 capitalize">{trainingConfig?.config?.type || '-'}</p>
        </div>
      </div>

      {/* Worker Progress */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4"><HardHat className="w-5 h-5 inline mr-1" /> Worker Progress</h3>
        <div className="space-y-3">
          {Array.from({ length: numWorkers }, (_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-purple-200/70">Worker {i + 1}</span>
                <span className="text-purple-300/50">
                  {(workerProgress[i] || 0).toFixed(0)}% · {trainingSpeeds[i] || 0} samples/s
                </span>
              </div>
              <div className="w-full bg-dark-800/40 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${workerProgress[i] || 0}%`,
                    backgroundColor: `hsl(${180 + i * 30}, 70%, 50%)`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loss Chart */}
      {aggregatedLoss.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4"><TrendingDown className="w-5 h-5 inline mr-1" /> Loss Curve</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregatedLoss}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                <XAxis dataKey="epoch" stroke="#A78BFA" fontSize={12} />
                <YAxis stroke="#A78BFA" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgLoss"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name="Avg Loss"
                />
                {Array.from({ length: numWorkers }, (_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`worker${i}`}
                    stroke={`hsl(${180 + i * 30}, 70%, 50%)`}
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                    name={`Worker ${i + 1}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Worker Metrics */}
      {metrics.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4"><BarChart3 className="w-5 h-5 inline mr-1" /> Training Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left py-2 px-3 text-purple-300/50">Epoch</th>
                  <th className="text-left py-2 px-3 text-purple-300/50">Worker</th>
                  <th className="text-left py-2 px-3 text-purple-300/50">Loss</th>
                  {trainingConfig?.config?.taskType === 'classification' && (
                    <th className="text-left py-2 px-3 text-purple-300/50">Accuracy</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {metrics.slice(-20).map((m, i) => (
                  <tr key={i} className="border-b border-dark-800">
                    <td className="py-2 px-3 text-dark-200">{m.epoch}</td>
                    <td className="py-2 px-3 text-dark-200">Worker {m.worker + 1}</td>
                    <td className="py-2 px-3 text-purple-400">{m.loss?.toFixed(6)}</td>
                    {trainingConfig?.config?.taskType === 'classification' && (
                      <td className="py-2 px-3 text-green-400">{(m.accuracy || m.acc)?.toFixed(4)}</td>
                    )}
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
