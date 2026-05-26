import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useFormValidation } from '../components/ui/hooks';
import { FolderOpen, Upload, Flower2, Home, TrendingUp, BarChart3, Settings, Wrench, Rocket } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [dataset, setDataset] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [modelConfig, setModelConfig] = useState({
    type: 'neural-network',
    layers: [64, 32],
    learningRate: 0.01,
    epochs: 50,
    batchSize: 32,
    numWorkers: 4,
    targetColumn: '',
    taskType: 'regression',
    filters: [32, 64],
    kernelSizes: [3, 3],
    poolSizes: [2, 2],
    rnnUnits: [64, 32],
    rnnType: 'lstm',
    sequenceLength: 10,
    preprocessing: {
      normalization: 'min-max',
      trainTestSplit: 0.8,
      selectedFeatures: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [showPreprocessing, setShowPreprocessing] = useState(false);

  const { validateField, getFieldError, validateAll } = useFormValidation({
    learningRate: [
      { min: 0.0001, message: 'Learning rate must be at least 0.0001' },
      { max: 1, message: 'Learning rate must be at most 1' },
    ],
    epochs: [
      { min: 1, message: 'Epochs must be at least 1' },
    ],
    batchSize: [
      { min: 1, message: 'Batch size must be at least 1' },
    ],
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const parseCSV = (content, filename) => {
    const result = Papa.parse(content, { header: true, dynamicTyping: true, skipEmptyLines: true });
    setParsedData(result);
    setDataset({ name: filename, content, rows: result.data.length, columns: result.meta.fields });
    if (result.meta.fields.length > 0) {
      const target = result.meta.fields[result.meta.fields.length - 1];
      setModelConfig(prev => ({
        ...prev,
        targetColumn: target,
        preprocessing: { ...prev.preprocessing, selectedFeatures: result.meta.fields.filter(c => c !== target) }
      }));
    }
    toast.success(`Loaded ${filename} (${result.data.length} rows)`);
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
    setLoading(true);
    try {
      const res = await fetch(`/api/samples/${sampleId}`);
      const data = await res.json();
      parseCSV(data.content, data.name);
      if (data.type === 'classification') {
        setModelConfig(prev => ({ ...prev, taskType: 'classification' }));
      } else if (data.type === 'sequence') {
        setModelConfig(prev => ({ ...prev, taskType: 'regression', type: 'rnn' }));
      } else {
        setModelConfig(prev => ({ ...prev, taskType: 'regression' }));
      }
    } catch (err) {
      toast.error('Failed to load sample dataset');
    }
    setLoading(false);
  };

  const startTraining = () => {
    if (!dataset || !modelConfig.targetColumn) {
      toast.warning('Please upload a dataset and select a target column');
      return;
    }
    const sessionId = crypto.randomUUID();
    const trainingData = {
      dataset: dataset.content,
      columns: dataset.columns,
      config: modelConfig,
      datasetName: dataset.name
    };
    sessionStorage.setItem(`training-${sessionId}`, JSON.stringify(trainingData));
    toast.info('Starting distributed training...');
    navigate(`/training/${sessionId}`);
  };

  const updateLayers = (value) => {
    const layers = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
    setModelConfig(prev => ({ ...prev, layers }));
  };

  const toggleFeature = (col) => {
    setModelConfig(prev => {
      const selected = prev.preprocessing.selectedFeatures;
      const newSelected = selected.includes(col)
        ? selected.filter(c => c !== col)
        : [...selected, col];
      return { ...prev, preprocessing: { ...prev.preprocessing, selectedFeatures: newSelected } };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-50">Training Dashboard</h1>
        <p className="text-purple-300/50 mt-1">Upload data, configure model, and start distributed training</p>
      </div>

      {/* Dataset Upload */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4"><FolderOpen className="w-5 h-5 inline mr-1" /> Dataset</h2>

        {!dataset ? (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-primary-400 bg-primary-500/5 scale-[1.01]'
                  : 'border-purple-500/30 hover:border-dark-400'
              }`}
              onClick={() => document.getElementById('file-input').click()}
              role="button"
              tabIndex={0}
              aria-label="Upload CSV file by dropping or clicking"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input').click(); }}
            >
              <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3" aria-hidden="true" />
              <p className="text-dark-200 font-medium">Drop CSV file here or click to browse</p>
              <p className="text-purple-300/40 text-sm mt-1">Supports .csv files up to 50MB</p>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                aria-label="Choose CSV file"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-purple-500/15"></div>
              <span className="text-purple-300/40 text-sm">or use a sample dataset</span>
              <div className="flex-1 h-px bg-purple-500/15"></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => loadSample('iris')}
                disabled={loading}
                className="card card-hover text-left"
              >
                <div className="text-sm font-medium text-white"><Flower2 className="w-4 h-4 inline mr-1" /> Iris Dataset</div>
                <div className="text-xs text-purple-300/50 mt-1">Classification · 150 samples · 4 features</div>
              </button>
              <button
                onClick={() => loadSample('housing')}
                disabled={loading}
                className="card card-hover text-left"
              >
                <div className="text-sm font-medium text-white"><Home className="w-4 h-4 inline mr-1" /> Housing Prices</div>
                <div className="text-xs text-purple-300/50 mt-1">Regression · 200 samples · 4 features</div>
              </button>
              <button
                onClick={() => loadSample('sequence')}
                disabled={loading}
                className="card card-hover text-left"
              >
                <div className="text-sm font-medium text-white"><TrendingUp className="w-4 h-4 inline mr-1" /> Sine Wave</div>
                <div className="text-xs text-purple-300/50 mt-1">Sequence · 500 samples · RNN ready</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-400" aria-hidden="true" />
                <div>
                  <p className="font-medium text-white">{dataset.name}</p>
                  <p className="text-sm text-purple-300/50">{dataset.rows} rows · {dataset.columns.length} columns</p>
                </div>
              </div>
              <button
                onClick={() => { setDataset(null); setParsedData(null); }}
                className="text-purple-300/50 hover:text-red-400 text-sm transition-colors"
                aria-label="Remove dataset"
              >
                Remove
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dataset.columns.map(col => (
                <span key={col} className="px-2 py-1 bg-dark-800/40 rounded text-xs text-purple-200/70">
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Model Configuration */}
      {dataset && (
        <div className="card animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4"><Settings className="w-5 h-5 inline mr-1" /> Model Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="model-type">Model Architecture</label>
              <select
                id="model-type"
                value={modelConfig.type}
                onChange={(e) => setModelConfig(prev => ({ ...prev, type: e.target.value }))}
                className="input-field w-full"
              >
                <option value="linear">Linear Regression</option>
                <option value="neural-network">Neural Network (MLP)</option>
                <option value="cnn">CNN (Convolutional)</option>
                <option value="rnn">RNN (Recurrent)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="target-col">Target Column</label>
              <select
                id="target-col"
                value={modelConfig.targetColumn}
                onChange={(e) => setModelConfig(prev => ({ ...prev, targetColumn: e.target.value }))}
                className="input-field w-full"
              >
                {dataset.columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="task-type">Task Type</label>
              <select
                id="task-type"
                value={modelConfig.taskType}
                onChange={(e) => setModelConfig(prev => ({ ...prev, taskType: e.target.value }))}
                className="input-field w-full"
              >
                <option value="regression">Regression</option>
                <option value="classification">Classification</option>
              </select>
            </div>

            {modelConfig.type === 'neural-network' && (
              <div>
                <label className="block text-sm text-purple-200/70 mb-1" htmlFor="layers">Hidden Layers (comma-separated)</label>
                <input
                  id="layers"
                  type="text"
                  value={modelConfig.layers.join(', ')}
                  onChange={(e) => updateLayers(e.target.value)}
                  className="input-field w-full"
                  placeholder="64, 32"
                />
              </div>
            )}

            {modelConfig.type === 'cnn' && (
              <>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">Filters (comma-separated)</label>
                  <input
                    type="text"
                    value={modelConfig.filters.join(', ')}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, filters: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0) }))}
                    className="input-field w-full"
                    placeholder="32, 64"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">Kernel Sizes</label>
                  <input
                    type="text"
                    value={modelConfig.kernelSizes.join(', ')}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, kernelSizes: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0) }))}
                    className="input-field w-full"
                    placeholder="3, 3"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">Dense Layers After Conv</label>
                  <input
                    type="text"
                    value={modelConfig.layers.join(', ')}
                    onChange={(e) => updateLayers(e.target.value)}
                    className="input-field w-full"
                    placeholder="64, 32"
                  />
                </div>
              </>
            )}

            {modelConfig.type === 'rnn' && (
              <>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">RNN Type</label>
                  <select
                    value={modelConfig.rnnType}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, rnnType: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="lstm">LSTM</option>
                    <option value="gru">GRU</option>
                    <option value="simple">Simple RNN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">RNN Units (comma-separated)</label>
                  <input
                    type="text"
                    value={modelConfig.rnnUnits.join(', ')}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, rnnUnits: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0) }))}
                    className="input-field w-full"
                    placeholder="64, 32"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">Sequence Length</label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={modelConfig.sequenceLength}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, sequenceLength: parseInt(e.target.value) }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1">Dense Layers After RNN</label>
                  <input
                    type="text"
                    value={modelConfig.layers.join(', ')}
                    onChange={(e) => updateLayers(e.target.value)}
                    className="input-field w-full"
                    placeholder="32"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="lr">Learning Rate</label>
              <input
                id="lr"
                type="number"
                step="0.001"
                min="0.0001"
                max="1"
                value={modelConfig.learningRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setModelConfig(prev => ({ ...prev, learningRate: val }));
                  validateField('learningRate', val);
                }}
                className={`input-field w-full ${getFieldError('learningRate') ? 'input-error' : ''}`}
                aria-invalid={!!getFieldError('learningRate')}
              />
              {getFieldError('learningRate') && <p className="field-error">{getFieldError('learningRate')}</p>}
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="epochs">Epochs</label>
              <input
                id="epochs"
                type="number"
                min="1"
                max="500"
                value={modelConfig.epochs}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setModelConfig(prev => ({ ...prev, epochs: val }));
                  validateField('epochs', val);
                }}
                className={`input-field w-full ${getFieldError('epochs') ? 'input-error' : ''}`}
                aria-invalid={!!getFieldError('epochs')}
              />
              {getFieldError('epochs') && <p className="field-error">{getFieldError('epochs')}</p>}
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="batch-size">Batch Size</label>
              <input
                id="batch-size"
                type="number"
                min="1"
                max="512"
                value={modelConfig.batchSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setModelConfig(prev => ({ ...prev, batchSize: val }));
                  validateField('batchSize', val);
                }}
                className={`input-field w-full ${getFieldError('batchSize') ? 'input-error' : ''}`}
                aria-invalid={!!getFieldError('batchSize')}
              />
              {getFieldError('batchSize') && <p className="field-error">{getFieldError('batchSize')}</p>}
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="workers">Number of Workers (Nodes)</label>
              <input
                id="workers"
                type="number"
                min="1"
                max="8"
                value={modelConfig.numWorkers}
                onChange={(e) => setModelConfig(prev => ({ ...prev, numWorkers: parseInt(e.target.value) }))}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Preprocessing Section */}
          <div className="mt-6 border-t border-purple-500/20 pt-4">
            <button
              onClick={() => setShowPreprocessing(!showPreprocessing)}
              className="flex items-center gap-2 text-dark-200 hover:text-dark-50 transition-colors"
              aria-expanded={showPreprocessing}
            >
              <span aria-hidden="true">{showPreprocessing ? '▼' : '▶'}</span>
              <span className="font-medium"><Wrench className="w-4 h-4 inline mr-1" /> Preprocessing Options</span>
            </button>

            {showPreprocessing && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-sm text-purple-200/70 mb-1" htmlFor="normalization">Normalization</label>
                  <select
                    id="normalization"
                    value={modelConfig.preprocessing.normalization}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, preprocessing: { ...prev.preprocessing, normalization: e.target.value } }))}
                    className="input-field w-full"
                  >
                    <option value="min-max">Min-Max Scaling (0-1)</option>
                    <option value="z-score">Z-Score (Standard)</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-purple-200/70 mb-1" htmlFor="split-ratio">Train/Test Split Ratio</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="split-ratio"
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={modelConfig.preprocessing.trainTestSplit}
                      onChange={(e) => setModelConfig(prev => ({ ...prev, preprocessing: { ...prev.preprocessing, trainTestSplit: parseFloat(e.target.value) } }))}
                      className="flex-1"
                      aria-valuetext={`${Math.round(modelConfig.preprocessing.trainTestSplit * 100)}% train, ${Math.round((1 - modelConfig.preprocessing.trainTestSplit) * 100)}% test`}
                    />
                    <span className="text-sm text-dark-200 w-20 text-right">
                      {Math.round(modelConfig.preprocessing.trainTestSplit * 100)}% / {Math.round((1 - modelConfig.preprocessing.trainTestSplit) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/40 mt-1">Train / Test</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-purple-200/70 mb-2">Feature Selection</label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Feature selection">
                    {dataset.columns.filter(c => c !== modelConfig.targetColumn).map(col => (
                      <button
                        key={col}
                        onClick={() => toggleFeature(col)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          modelConfig.preprocessing.selectedFeatures.includes(col)
                            ? 'bg-primary-500/20 text-purple-300 border border-primary-500/30'
                            : 'bg-dark-800 text-purple-300/50 border border-purple-500/30 hover:border-dark-400'
                        }`}
                        aria-pressed={modelConfig.preprocessing.selectedFeatures.includes(col)}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-purple-300/40 mt-1">Click to toggle features. Selected features will be used for training.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={startTraining} className="btn-primary flex items-center gap-2">
              <Rocket className="w-4 h-4" aria-hidden="true" />
              <span>Start Distributed Training</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
