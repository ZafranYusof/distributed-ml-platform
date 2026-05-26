import { useState, useRef, useEffect } from 'react';

export default function TransferLearning() {
  const [selectedModel, setSelectedModel] = useState('');
  const [layers, setLayers] = useState([]);
  const [customHead, setCustomHead] = useState([{ units: 128, activation: 'relu' }, { units: 10, activation: 'softmax' }]);
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const intervalRef = useRef(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pretrainedModels = [
    { id: 'mobilenet', name: 'MobileNet V2', type: 'Image Classification', params: '3.4M', inputShape: '224x224x3', layers: [
      { name: 'conv1', type: 'Conv2D', frozen: true, params: 864 },
      { name: 'block1_conv', type: 'DepthwiseConv2D', frozen: true, params: 288 },
      { name: 'block1_project', type: 'Conv2D', frozen: true, params: 512 },
      { name: 'block2_conv', type: 'DepthwiseConv2D', frozen: true, params: 1152 },
      { name: 'block2_project', type: 'Conv2D', frozen: true, params: 2048 },
      { name: 'block3_conv', type: 'DepthwiseConv2D', frozen: true, params: 2304 },
      { name: 'block3_project', type: 'Conv2D', frozen: true, params: 4096 },
      { name: 'block4_conv', type: 'DepthwiseConv2D', frozen: true, params: 4608 },
      { name: 'block4_project', type: 'Conv2D', frozen: true, params: 8192 },
      { name: 'global_pool', type: 'GlobalAveragePooling2D', frozen: true, params: 0 },
    ]},
    { id: 'use', name: 'Universal Sentence Encoder', type: 'Text Embedding', params: '67M', inputShape: 'string[]', layers: [
      { name: 'embedding', type: 'Embedding', frozen: true, params: 256000 },
      { name: 'transformer_1', type: 'TransformerBlock', frozen: true, params: 1048576 },
      { name: 'transformer_2', type: 'TransformerBlock', frozen: true, params: 1048576 },
      { name: 'transformer_3', type: 'TransformerBlock', frozen: true, params: 1048576 },
      { name: 'pooling', type: 'MeanPooling', frozen: true, params: 0 },
      { name: 'dense_output', type: 'Dense', frozen: true, params: 131072 },
    ]},
  ];

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId);
    const model = pretrainedModels.find(m => m.id === modelId);
    if (model) setLayers(model.layers.map(l => ({ ...l })));
    setResults(null);
  };

  const toggleFreeze = (idx) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, frozen: !l.frozen } : l));
  };

  const addHeadLayer = () => {
    setCustomHead(prev => [...prev, { units: 64, activation: 'relu' }]);
  };

  const removeHeadLayer = (idx) => {
    setCustomHead(prev => prev.filter((_, i) => i !== idx));
  };

  const updateHeadLayer = (idx, field, value) => {
    setCustomHead(prev => prev.map((l, i) => i === idx ? { ...l, [field]: field === 'units' ? Number(value) : value } : l));
  };

  const handleFineTune = () => {
    setTraining(true);
    setProgress({ epoch: 0, totalEpochs: 10, loss: 2.5, accuracy: 0.1 });

    let epoch = 0;
    const interval = setInterval(() => {
      epoch++;
      const loss = 2.5 * Math.exp(-0.3 * epoch) + Math.random() * 0.1;
      const accuracy = 1 - Math.exp(-0.4 * epoch) + Math.random() * 0.05;
      setProgress({ epoch, totalEpochs: 10, loss, accuracy: Math.min(accuracy, 0.98) });

      if (epoch >= 10) {
        clearInterval(interval);
        intervalRef.current = null;
        setTraining(false);
        setResults({
          finalLoss: loss,
          finalAccuracy: Math.min(accuracy, 0.98),
          frozenLayers: layers.filter(l => l.frozen).length,
          trainableLayers: layers.filter(l => !l.frozen).length + customHead.length,
          totalEpochs: 10
        });
      }
    }, 500);
    intervalRef.current = interval;
  };

  const frozenCount = layers.filter(l => l.frozen).length;
  const trainableCount = layers.filter(l => !l.frozen).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Transfer Learning</h1>
        <p className="text-purple-300/50 mt-1">Load pre-trained models, freeze layers, add custom heads, and fine-tune</p>
      </div>

      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pretrainedModels.map(model => (
          <div
            key={model.id}
            onClick={() => handleSelectModel(model.id)}
            className={`bg-dark-800/40 border rounded-lg p-4 cursor-pointer transition-colors ${selectedModel === model.id ? 'border-primary-500 bg-primary-500/5' : 'border-purple-500/20 hover:border-purple-500/30'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">{model.name}</h3>
              <span className="text-xs bg-purple-500/15 text-purple-200/70 px-2 py-0.5 rounded">{model.type}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-purple-300/50">
              <span>{model.params} params</span>
              <span>Input: {model.inputShape}</span>
              <span>{model.layers.length} layers</span>
            </div>
          </div>
        ))}
      </div>

      {/* Layer Configuration */}
      {selectedModel && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Base Model Layers</h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-blue-400">🧊 Frozen: {frozenCount}</span>
              <span className="text-green-400">🔥 Trainable: {trainableCount}</span>
            </div>
          </div>
          <div className="space-y-2">
            {layers.map((layer, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${layer.frozen ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-green-500/5 border border-green-500/10'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-purple-200/70">{layer.name}</span>
                  <span className="text-xs text-purple-300/40">{layer.type}</span>
                  <span className="text-xs text-purple-300/40">{layer.params.toLocaleString()} params</span>
                </div>
                <button
                  onClick={() => toggleFreeze(idx)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${layer.frozen ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                >
                  {layer.frozen ? '🧊 Frozen' : '🔥 Trainable'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Head */}
      {selectedModel && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Custom Head (New Layers)</h3>
            <button onClick={addHeadLayer} className="px-3 py-1.5 bg-purple-500/15 text-purple-200/70 hover:text-white rounded-lg text-sm transition-colors">+ Add Layer</button>
          </div>
          <div className="space-y-3">
            {customHead.map((layer, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-dark-900 rounded-lg p-3">
                <span className="text-xs text-purple-300/40 w-16">Layer {idx + 1}</span>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs text-purple-300/50">Units:</label>
                  <input type="number" value={layer.units} onChange={(e) => updateHeadLayer(idx, 'units', e.target.value)} className="w-20 bg-dark-800/40 border border-purple-500/30 text-dark-200 rounded px-2 py-1 text-sm" />
                  <label className="text-xs text-purple-300/50 ml-2">Activation:</label>
                  <select value={layer.activation} onChange={(e) => updateHeadLayer(idx, 'activation', e.target.value)} className="bg-dark-800/40 border border-purple-500/30 text-dark-200 rounded px-2 py-1 text-sm">
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="softmax">Softmax</option>
                    <option value="tanh">Tanh</option>
                    <option value="linear">Linear</option>
                  </select>
                </div>
                <button onClick={() => removeHeadLayer(idx)} className="text-purple-300/40 hover:text-red-400 text-sm">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training */}
      {selectedModel && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleFineTune}
            disabled={training}
            className="px-6 py-3 bg-gradient-btn text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {training ? '⏳ Fine-tuning...' : '🚀 Start Fine-tuning'}
          </button>
        </div>
      )}

      {/* Progress */}
      {progress && training && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Training Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-300/50">Epoch {progress.epoch}/{progress.totalEpochs}</span>
              <span className="text-purple-300/50">{((progress.epoch / progress.totalEpochs) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-purple-500/15 rounded-full h-3">
              <div className="bg-gradient-btn h-3 rounded-full transition-all" style={{ width: `${(progress.epoch / progress.totalEpochs) * 100}%` }}></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="bg-dark-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-yellow-400">{progress.loss.toFixed(4)}</p>
                <p className="text-xs text-purple-300/50">Loss</p>
              </div>
              <div className="bg-dark-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-400">{(progress.accuracy * 100).toFixed(1)}%</p>
                <p className="text-xs text-purple-300/50">Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-dark-800/40 border border-green-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4">✓ Fine-tuning Complete</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{(results.finalAccuracy * 100).toFixed(1)}%</p>
              <p className="text-xs text-purple-300/50 mt-1">Final Accuracy</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{results.finalLoss.toFixed(4)}</p>
              <p className="text-xs text-purple-300/50 mt-1">Final Loss</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{results.frozenLayers}</p>
              <p className="text-xs text-purple-300/50 mt-1">Frozen Layers</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{results.trainableLayers}</p>
              <p className="text-xs text-purple-300/50 mt-1">Trainable Layers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
