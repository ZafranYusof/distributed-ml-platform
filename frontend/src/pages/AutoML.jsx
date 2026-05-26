import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useToast } from '../components/ui/Toast';
import { FolderOpen, Upload, Flower2, Home, TrendingUp, BarChart3, Search, Loader, CheckCircle2, Trophy, ClipboardList } from 'lucide-react';

export default function AutoML() {
  const toast = useToast();
  const [dataset, setDataset] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentConfig: null });
  const [results, setResults] = useState([]);
  const [bestResult, setBestResult] = useState(null);
  const workerRef = useRef(null);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = Papa.parse(ev.target.result, { header: true, dynamicTyping: true, skipEmptyLines: true });
      setParsedData(result.data);
      setDataset({ name: file.name, rows: result.data.length, columns: result.meta.fields, content: ev.target.result });
      if (result.meta.fields.length > 0) {
        setTargetColumn(result.meta.fields[result.meta.fields.length - 1]);
      }
    };
    reader.readAsText(file);
  };

  const loadSample = async (sampleId) => {
    const res = await fetch(`/api/samples/${sampleId}`);
    const data = await res.json();
    const result = Papa.parse(data.content, { header: true, dynamicTyping: true, skipEmptyLines: true });
    setParsedData(result.data);
    setDataset({ name: data.name, rows: result.data.length, columns: result.meta.fields, content: data.content });
    if (result.meta.fields.length > 0) {
      setTargetColumn(result.meta.fields[result.meta.fields.length - 1]);
    }
  };

  const startSearch = () => {
    if (!dataset || !targetColumn) return;
    setRunning(true);
    setResults([]);
    setBestResult(null);

    const learningRates = [0.001, 0.01, 0.05, 0.1];
    const batchSizes = [16, 32, 64];
    const layerConfigs = [[32], [64, 32], [128, 64], [64, 32, 16]];
    const totalConfigs = learningRates.length * batchSizes.length * layerConfigs.length;
    setProgress({ current: 0, total: totalConfigs, currentConfig: null });

    // Run search in a Web Worker
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');

      self.onmessage = async function(e) {
        const { data, columns, targetColumn, configs } = e.data;

        // Prepare data
        const features = columns.filter(c => c !== targetColumn);
        const numericData = data.filter(row => {
          return features.every(f => typeof row[f] === 'number' && !isNaN(row[f])) &&
                 (typeof row[targetColumn] === 'number' && !isNaN(row[targetColumn]));
        });

        if (numericData.length === 0) {
          self.postMessage({ type: 'error', message: 'No valid numeric data found' });
          return;
        }

        const X = numericData.map(row => features.map(f => row[f]));
        const Y = numericData.map(row => row[targetColumn]);

        // Normalize
        const xMin = features.map((_, i) => Math.min(...X.map(r => r[i])));
        const xMax = features.map((_, i) => Math.max(...X.map(r => r[i])));
        const xNorm = X.map(row => row.map((v, i) => xMax[i] - xMin[i] !== 0 ? (v - xMin[i]) / (xMax[i] - xMin[i]) : 0));
        const yMin = Math.min(...Y);
        const yMax = Math.max(...Y);
        const yNorm = Y.map(v => yMax - yMin !== 0 ? (v - yMin) / (yMax - yMin) : 0);

        // Split
        const splitIdx = Math.floor(xNorm.length * 0.8);
        const xTrain = xNorm.slice(0, splitIdx);
        const yTrain = yNorm.slice(0, splitIdx);
        const xTest = xNorm.slice(splitIdx);
        const yTest = yNorm.slice(splitIdx);

        const xTrainTensor = tf.tensor2d(xTrain);
        const yTrainTensor = tf.tensor1d(yTrain);
        const xTestTensor = tf.tensor2d(xTest);
        const yTestTensor = tf.tensor1d(yTest);

        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          self.postMessage({ type: 'progress', current: i, config });

          try {
            const model = tf.sequential();
            config.layers.forEach((units, idx) => {
              model.add(tf.layers.dense({
                units,
                activation: 'relu',
                inputShape: idx === 0 ? [features.length] : undefined
              }));
            });
            model.add(tf.layers.dense({ units: 1 }));

            model.compile({
              optimizer: tf.train.adam(config.learningRate),
              loss: 'meanSquaredError'
            });

            const history = await model.fit(xTrainTensor, yTrainTensor, {
              epochs: 30,
              batchSize: config.batchSize,
              validationSplit: 0.2,
              verbose: 0
            });

            const testLoss = model.evaluate(xTestTensor, yTestTensor).dataSync()[0];
            const trainLoss = history.history.loss[history.history.loss.length - 1];

            self.postMessage({
              type: 'result',
              config,
              trainLoss,
              testLoss,
              index: i
            });

            model.dispose();
          } catch (err) {
            self.postMessage({
              type: 'result',
              config,
              trainLoss: Infinity,
              testLoss: Infinity,
              index: i,
              error: err.message
            });
          }
        }

        xTrainTensor.dispose();
        yTrainTensor.dispose();
        xTestTensor.dispose();
        yTestTensor.dispose();

        self.postMessage({ type: 'done' });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    const configs = [];
    const learningRatesArr = [0.001, 0.01, 0.05, 0.1];
    const batchSizesArr = [16, 32, 64];
    const layerConfigsArr = [[32], [64, 32], [128, 64], [64, 32, 16]];

    for (const lr of learningRatesArr) {
      for (const bs of batchSizesArr) {
        for (const layers of layerConfigsArr) {
          configs.push({ learningRate: lr, batchSize: bs, layers });
        }
      }
    }

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(prev => ({ ...prev, current: msg.current + 1, currentConfig: msg.config }));
      } else if (msg.type === 'result') {
        setResults(prev => {
          const newResults = [...prev, msg];
          const sorted = newResults.filter(r => r.testLoss !== Infinity).sort((a, b) => a.testLoss - b.testLoss);
          if (sorted.length > 0) setBestResult(sorted[0]);
          return newResults;
        });
      } else if (msg.type === 'done') {
        setRunning(false);
        worker.terminate();
      } else if (msg.type === 'error') {
        setRunning(false);
        worker.terminate();
      }
    };

    worker.postMessage({
      data: parsedData,
      columns: dataset.columns,
      targetColumn,
      configs
    });
  };

  const stopSearch = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-50">AutoML</h2>
        <p className="text-purple-300/50 mt-1">Automatic hyperparameter search to find the best model configuration</p>
      </div>

      {/* Dataset Selection */}
      {!dataset ? (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white"><FolderOpen className="w-5 h-5 inline mr-1" /> Select Dataset</h3>
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center border-purple-500/30 hover:border-dark-400 cursor-pointer transition-colors"
            onClick={() => document.getElementById('automl-file-input').click()}
          >
            <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-dark-200">Drop CSV or click to browse</p>
            <input
              id="automl-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => loadSample('iris')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white"><Flower2 className="w-4 h-4 inline mr-1" /> Iris</div>
            </button>
            <button onClick={() => loadSample('housing')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white"><Home className="w-4 h-4 inline mr-1" /> Housing</div>
            </button>
            <button onClick={() => loadSample('sequence')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white"><TrendingUp className="w-4 h-4 inline mr-1" /> Sine Wave</div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Config */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="font-medium text-white">{dataset.name}</p>
                  <p className="text-sm text-purple-300/50">{dataset.rows} rows · {dataset.columns.length} columns</p>
                </div>
              </div>
              <button onClick={() => { setDataset(null); setResults([]); setBestResult(null); }} className="text-purple-300/50 hover:text-red-400 text-sm">
                Change
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-purple-200/70 mb-1">Target Column</label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="input-field w-full"
                >
                  {dataset.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {!running ? (
                  <button onClick={startSearch} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" /> Start Hyperparameter Search
                  </button>
                ) : (
                  <button onClick={stopSearch} className="w-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors">
                    ⏹ Stop Search
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-dark-800/40 rounded-lg border border-purple-500/30">
              <p className="text-xs text-purple-300/50 mb-2">Search Space:</p>
              <div className="grid grid-cols-3 gap-4 text-xs text-purple-200/70">
                <div><span className="text-purple-300/40">Learning Rates:</span> 0.001, 0.01, 0.05, 0.1</div>
                <div><span className="text-purple-300/40">Batch Sizes:</span> 16, 32, 64</div>
                <div><span className="text-purple-300/40">Architectures:</span> [32], [64,32], [128,64], [64,32,16]</div>
              </div>
              <p className="text-xs text-purple-300/40 mt-2">Total configurations: 48 · 30 epochs each</p>
            </div>
          </div>

          {/* Progress */}
          {(running || results.length > 0) && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">
                                {running ? <><Loader className="w-4 h-4 inline animate-spin mr-1" /> Search Progress</> : <><CheckCircle2 className="w-4 h-4 inline mr-1" /> Search Complete</>}
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-purple-300/50 mb-1">
                  <span>Configuration {progress.current} / {progress.total}</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-purple-500/15 rounded-full h-3">
                  <div
                    className="bg-gradient-btn h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                {progress.currentConfig && running && (
                  <p className="text-xs text-purple-300/40 mt-2">
                    Testing: LR={progress.currentConfig.learningRate}, Batch={progress.currentConfig.batchSize}, Layers=[{progress.currentConfig.layers.join(',')}]
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Best Result */}
          {bestResult && (
            <div className="card border-primary-500/30">
              <h3 className="text-lg font-semibold text-purple-400 mb-3"><Trophy className="w-5 h-5 inline mr-1" /> Best Configuration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-800/40 rounded-lg p-3">
                  <p className="text-xs text-purple-300/50">Learning Rate</p>
                  <p className="text-lg font-bold text-white">{bestResult.config.learningRate}</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-3">
                  <p className="text-xs text-purple-300/50">Batch Size</p>
                  <p className="text-lg font-bold text-white">{bestResult.config.batchSize}</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-3">
                  <p className="text-xs text-purple-300/50">Architecture</p>
                  <p className="text-lg font-bold text-white">[{bestResult.config.layers.join(', ')}]</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-3">
                  <p className="text-xs text-purple-300/50">Test Loss</p>
                  <p className="text-lg font-bold text-green-400">{bestResult.testLoss.toFixed(6)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4"><ClipboardList className="w-5 h-5 inline mr-1" /> All Results (Ranked)</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-dark-900">
                    <tr className="border-b border-purple-500/20">
                      <th className="text-left py-2 px-3 text-purple-300/50">#</th>
                      <th className="text-left py-2 px-3 text-purple-300/50">Layers</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">LR</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Batch</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Train Loss</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Test Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...results]
                      .filter(r => r.testLoss !== Infinity)
                      .sort((a, b) => a.testLoss - b.testLoss)
                      .map((r, i) => (
                        <tr key={i} className={`border-b border-dark-800 ${i === 0 ? 'bg-primary-500/5' : 'hover:bg-purple-500/10/50'}`}>
                          <td className="py-2 px-3 text-purple-200/70">{i + 1}</td>
                          <td className="py-2 px-3 text-dark-200 font-mono">[{r.config.layers.join(',')}]</td>
                          <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{r.config.learningRate}</td>
                          <td className="text-right py-2 px-3 text-purple-200/70">{r.config.batchSize}</td>
                          <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{r.trainLoss.toFixed(6)}</td>
                          <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{r.testLoss.toFixed(6)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
