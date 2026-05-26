import { useState } from 'react';

export default function Compression() {
  const [technique, setTechnique] = useState('quantization');
  const [config, setConfig] = useState({
    quantization: { bits: 8 },
    pruning: { threshold: 0.1 },
    distillation: { teacherLayers: [128, 64, 32], studentLayers: [32, 16] }
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  // Simulate a model with random weights
  const generateModel = () => {
    const layers = [
      { name: 'dense_1', weights: Array.from({ length: 128 * 64 }, () => (Math.random() - 0.5) * 2) },
      { name: 'dense_2', weights: Array.from({ length: 64 * 32 }, () => (Math.random() - 0.5) * 2) },
      { name: 'dense_3', weights: Array.from({ length: 32 * 10 }, () => (Math.random() - 0.5) * 2) },
    ];
    return layers;
  };

  const runQuantization = () => {
    const model = generateModel();
    const bits = config.quantization.bits;
    const scale = Math.pow(2, bits - 1) - 1;
    const totalWeights = model.reduce((sum, l) => sum + l.weights.length, 0);
    const originalSize = totalWeights * 4; // float32 = 4 bytes
    const quantizedSize = totalWeights * (bits / 8);

    // Simulate accuracy impact
    const quantizationError = model.map(layer => {
      const quantized = layer.weights.map(w => Math.round(w * scale) / scale);
      const mse = layer.weights.reduce((sum, w, i) => sum + Math.pow(w - quantized[i], 2), 0) / layer.weights.length;
      return mse;
    });
    const avgError = quantizationError.reduce((a, b) => a + b, 0) / quantizationError.length;
    const accuracyDrop = avgError * 100;

    return {
      technique: 'Quantization',
      originalSize,
      compressedSize: quantizedSize,
      compressionRatio: ((1 - quantizedSize / originalSize) * 100).toFixed(1),
      accuracyImpact: `-${accuracyDrop.toFixed(2)}%`,
      details: { bits, totalWeights, avgQuantizationError: avgError.toFixed(6) }
    };
  };

  const runPruning = () => {
    const model = generateModel();
    const threshold = config.pruning.threshold;
    const totalWeights = model.reduce((sum, l) => sum + l.weights.length, 0);
    const originalSize = totalWeights * 4;

    let prunedCount = 0;
    const layerSparsity = model.map(layer => {
      const pruned = layer.weights.filter(w => Math.abs(w) < threshold).length;
      prunedCount += pruned;
      return { name: layer.name, sparsity: ((pruned / layer.weights.length) * 100).toFixed(1), pruned, total: layer.weights.length };
    });

    const sparsity = (prunedCount / totalWeights) * 100;
    const compressedSize = (totalWeights - prunedCount) * 4;
    const accuracyDrop = sparsity * 0.02; // Rough estimate

    return {
      technique: 'Pruning',
      originalSize,
      compressedSize,
      compressionRatio: ((1 - compressedSize / originalSize) * 100).toFixed(1),
      accuracyImpact: `-${accuracyDrop.toFixed(2)}%`,
      details: { threshold, sparsity: sparsity.toFixed(1) + '%', prunedWeights: prunedCount, totalWeights, layerSparsity }
    };
  };

  const runDistillation = () => {
    const teacherParams = config.distillation.teacherLayers.reduce((sum, l, i, arr) => {
      const prev = i === 0 ? 128 : arr[i - 1];
      return sum + prev * l;
    }, 0);
    const studentParams = config.distillation.studentLayers.reduce((sum, l, i, arr) => {
      const prev = i === 0 ? 128 : arr[i - 1];
      return sum + prev * l;
    }, 0);

    const teacherSize = teacherParams * 4;
    const studentSize = studentParams * 4;
    const teacherAccuracy = 0.95;
    const studentAccuracy = teacherAccuracy - (1 - studentParams / teacherParams) * 0.05;

    return {
      technique: 'Knowledge Distillation',
      originalSize: teacherSize,
      compressedSize: studentSize,
      compressionRatio: ((1 - studentSize / teacherSize) * 100).toFixed(1),
      accuracyImpact: `-${((teacherAccuracy - studentAccuracy) * 100).toFixed(2)}%`,
      details: {
        teacherParams, studentParams,
        teacherAccuracy: (teacherAccuracy * 100).toFixed(1) + '%',
        studentAccuracy: (studentAccuracy * 100).toFixed(1) + '%',
        teacherLayers: config.distillation.teacherLayers,
        studentLayers: config.distillation.studentLayers
      }
    };
  };

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      let result;
      switch (technique) {
        case 'quantization': result = runQuantization(); break;
        case 'pruning': result = runPruning(); break;
        case 'distillation': result = runDistillation(); break;
      }
      setResults(result);
      setRunning(false);
    }, 800);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Compression</h1>
        <p className="text-dark-400 mt-1">Reduce model size with quantization, pruning, and knowledge distillation</p>
      </div>

      {/* Technique Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'quantization', name: 'Quantization', icon: '🔢', desc: 'Reduce precision (float32 → int8)' },
          { id: 'pruning', name: 'Pruning', icon: '✂️', desc: 'Zero out small weights' },
          { id: 'distillation', name: 'Knowledge Distillation', icon: '🧪', desc: 'Train smaller student model' },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => { setTechnique(t.id); setResults(null); }}
            className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-colors ${technique === t.id ? 'border-primary-500 bg-primary-500/5' : 'border-dark-700 hover:border-dark-600'}`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <h3 className="text-white font-medium">{t.name}</h3>
            <p className="text-dark-400 text-xs mt-1">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Configuration */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>

        {technique === 'quantization' && (
          <div>
            <label className="block text-sm text-dark-400 mb-2">Target Bit Width: {config.quantization.bits}-bit</label>
            <input type="range" min="2" max="16" step="2" value={config.quantization.bits} onChange={(e) => setConfig(prev => ({ ...prev, quantization: { bits: parseInt(e.target.value) } }))} className="w-full max-w-md" />
            <div className="flex justify-between text-xs text-dark-500 max-w-md mt-1">
              <span>2-bit (aggressive)</span>
              <span>8-bit (standard)</span>
              <span>16-bit (mild)</span>
            </div>
          </div>
        )}

        {technique === 'pruning' && (
          <div>
            <label className="block text-sm text-dark-400 mb-2">Weight Threshold: {config.pruning.threshold.toFixed(2)}</label>
            <input type="range" min="0.01" max="1" step="0.01" value={config.pruning.threshold} onChange={(e) => setConfig(prev => ({ ...prev, pruning: { threshold: parseFloat(e.target.value) } }))} className="w-full max-w-md" />
            <p className="text-xs text-dark-500 mt-1">Weights with absolute value below this threshold will be zeroed out</p>
          </div>
        )}

        {technique === 'distillation' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-400 mb-2">Teacher Model Layers</label>
              <div className="flex items-center gap-2">
                {config.distillation.teacherLayers.map((l, i) => (
                  <span key={i} className="bg-dark-900 border border-dark-600 text-dark-200 px-3 py-1 rounded text-sm">{l}</span>
                ))}
                <span className="text-dark-500 text-xs">(fixed)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-2">Student Model Layers</label>
              <div className="flex items-center gap-2">
                {config.distillation.studentLayers.map((l, i) => (
                  <input key={i} type="number" value={l} onChange={(e) => {
                    const newLayers = [...config.distillation.studentLayers];
                    newLayers[i] = parseInt(e.target.value) || 1;
                    setConfig(prev => ({ ...prev, distillation: { ...prev.distillation, studentLayers: newLayers } }));
                  }} className="w-16 bg-dark-900 border border-dark-600 text-dark-200 rounded px-2 py-1 text-sm" />
                ))}
                <button onClick={() => setConfig(prev => ({ ...prev, distillation: { ...prev.distillation, studentLayers: [...prev.distillation.studentLayers, 8] } }))} className="text-primary-400 text-sm hover:text-primary-300">+ Add</button>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleRun} disabled={running} className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
          {running ? '⏳ Compressing...' : '🗜 Run Compression'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Compression Results — {results.technique}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{formatBytes(results.originalSize)}</p>
              <p className="text-xs text-dark-400 mt-1">Original Size</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{formatBytes(results.compressedSize)}</p>
              <p className="text-xs text-dark-400 mt-1">Compressed Size</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary-400">{results.compressionRatio}%</p>
              <p className="text-xs text-dark-400 mt-1">Size Reduction</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{results.accuracyImpact}</p>
              <p className="text-xs text-dark-400 mt-1">Accuracy Impact</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-dark-900 rounded-lg p-4">
            <h4 className="text-sm font-medium text-dark-300 mb-2">Details</h4>
            <pre className="text-xs text-dark-400 overflow-auto">{JSON.stringify(results.details, null, 2)}</pre>
          </div>

          {/* Visual comparison bar */}
          <div className="mt-4">
            <p className="text-sm text-dark-400 mb-2">Size Comparison</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-dark-400 w-20">Original</span>
                <div className="flex-1 bg-dark-700 rounded-full h-4">
                  <div className="bg-dark-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-dark-400">{formatBytes(results.originalSize)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-dark-400 w-20">Compressed</span>
                <div className="flex-1 bg-dark-700 rounded-full h-4">
                  <div className="bg-primary-500 h-4 rounded-full transition-all" style={{ width: `${(results.compressedSize / results.originalSize) * 100}%` }}></div>
                </div>
                <span className="text-xs text-primary-400">{formatBytes(results.compressedSize)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
