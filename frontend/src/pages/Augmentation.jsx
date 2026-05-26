import { useState } from 'react';
import { BarChart3, Image, Dice5, Scale, Target, RotateCw, FlipHorizontal, ZoomIn, Save } from 'lucide-react';

export default function Augmentation() {
  const [dataType, setDataType] = useState('tabular');
  const [config, setConfig] = useState({
    noise: { enabled: false, factor: 0.1 },
    smote: { enabled: false, neighbors: 5 },
    sampling: { enabled: false, ratio: 0.5 },
    rotation: { enabled: false, degrees: 15 },
    flip: { enabled: false, horizontal: true, vertical: false },
    scale: { enabled: false, factor: 0.2 },
  });
  const [sampleData, setSampleData] = useState(null);
  const [augmentedPreview, setAugmentedPreview] = useState(null);
  const [savedPipelines, setSavedPipelines] = useState([]);
  const [pipelineName, setPipelineName] = useState('');

  const generateSampleData = () => {
    if (dataType === 'tabular') {
      const data = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        feature1: (Math.random() * 10).toFixed(2),
        feature2: (Math.random() * 5).toFixed(2),
        feature3: (Math.random() * 8).toFixed(2),
        label: i < 15 ? 'class_A' : 'class_B' // Imbalanced
      }));
      setSampleData(data);
    } else {
      const data = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        pixels: Array.from({ length: 64 }, () => Math.floor(Math.random() * 255)),
        width: 8, height: 8,
        label: `digit_${i % 3}`
      }));
      setSampleData(data);
    }
    setAugmentedPreview(null);
  };

  const applyAugmentation = () => {
    if (!sampleData) return;

    let augmented = [...sampleData];

    if (dataType === 'tabular') {
      // Add noise
      if (config.noise.enabled) {
        const noisy = sampleData.map(row => ({
          ...row,
          id: `${row.id}_noisy`,
          feature1: (parseFloat(row.feature1) + (Math.random() - 0.5) * config.noise.factor * 2).toFixed(2),
          feature2: (parseFloat(row.feature2) + (Math.random() - 0.5) * config.noise.factor * 2).toFixed(2),
          feature3: (parseFloat(row.feature3) + (Math.random() - 0.5) * config.noise.factor * 2).toFixed(2),
          augType: 'noise'
        }));
        augmented = [...augmented, ...noisy.slice(0, 5)];
      }

      // SMOTE for imbalanced classes
      if (config.smote.enabled) {
        const minority = sampleData.filter(d => d.label === 'class_B');
        const synthetic = Array.from({ length: 10 }, (_, i) => {
          const base = minority[i % minority.length];
          const neighbor = minority[(i + 1) % minority.length];
          const lambda = Math.random();
          return {
            id: `smote_${i}`,
            feature1: (parseFloat(base.feature1) * lambda + parseFloat(neighbor.feature1) * (1 - lambda)).toFixed(2),
            feature2: (parseFloat(base.feature2) * lambda + parseFloat(neighbor.feature2) * (1 - lambda)).toFixed(2),
            feature3: (parseFloat(base.feature3) * lambda + parseFloat(neighbor.feature3) * (1 - lambda)).toFixed(2),
            label: 'class_B',
            augType: 'smote'
          };
        });
        augmented = [...augmented, ...synthetic];
      }

      // Random sampling
      if (config.sampling.enabled) {
        const numSamples = Math.floor(sampleData.length * config.sampling.ratio);
        const sampled = Array.from({ length: numSamples }, (_, i) => {
          const src = sampleData[Math.floor(Math.random() * sampleData.length)];
          return { ...src, id: `sample_${i}`, augType: 'sampled' };
        });
        augmented = [...augmented, ...sampled];
      }
    } else {
      // Image augmentations
      if (config.rotation.enabled) {
        const rotated = sampleData.slice(0, 3).map(img => ({
          ...img, id: `${img.id}_rot`,
          pixels: img.pixels.map(p => Math.min(255, Math.max(0, p + Math.floor((Math.random() - 0.5) * 30)))),
          augType: 'rotation'
        }));
        augmented = [...augmented, ...rotated];
      }

      if (config.flip.enabled) {
        const flipped = sampleData.slice(0, 3).map(img => ({
          ...img, id: `${img.id}_flip`,
          pixels: config.flip.horizontal ? [...img.pixels].reverse() : img.pixels,
          augType: 'flip'
        }));
        augmented = [...augmented, ...flipped];
      }

      if (config.scale.enabled) {
        const scaled = sampleData.slice(0, 3).map(img => ({
          ...img, id: `${img.id}_scale`,
          pixels: img.pixels.map(p => Math.min(255, Math.floor(p * (1 + config.scale.factor)))),
          augType: 'scale'
        }));
        augmented = [...augmented, ...scaled];
      }
    }

    setAugmentedPreview(augmented);
  };

  const savePipeline = () => {
    if (!pipelineName) return;
    const enabledSteps = Object.entries(config).filter(([_, v]) => v.enabled).map(([k, v]) => ({ type: k, ...v }));
    setSavedPipelines(prev => [...prev, { name: pipelineName, dataType, steps: enabledSteps, createdAt: new Date().toISOString() }]);
    setPipelineName('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Data Augmentation</h1>
        <p className="text-purple-300/50 mt-1">Augment datasets with noise, SMOTE, rotation, and more</p>
      </div>

      {/* Data Type Selection */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setDataType('tabular'); setSampleData(null); setAugmentedPreview(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dataType === 'tabular' ? 'bg-gradient-btn text-white' : 'bg-dark-800 text-purple-200/70'}`}>
          <BarChart3 className="w-4 h-4 inline mr-1" /> Tabular Data
        </button>
        <button onClick={() => { setDataType('image'); setSampleData(null); setAugmentedPreview(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dataType === 'image' ? 'bg-gradient-btn text-white' : 'bg-dark-800 text-purple-200/70'}`}>
          <Image className="w-4 h-4 inline mr-1" /> Image-like Data
        </button>
        <button onClick={generateSampleData} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 hover:text-white rounded-lg text-sm transition-colors ml-auto">
          Generate Sample Data
        </button>
      </div>

      {/* Augmentation Config */}
      <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Augmentation Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataType === 'tabular' ? (
            <>
              {/* Noise */}
              <div className={`border rounded-lg p-4 transition-colors ${config.noise.enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-purple-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium"><Dice5 className="w-4 h-4 inline mr-1" /> Add Noise</span>
                  <input type="checkbox" checked={config.noise.enabled} onChange={(e) => setConfig(prev => ({ ...prev, noise: { ...prev.noise, enabled: e.target.checked } }))} className="rounded border-purple-500/30" />
                </div>
                <label className="text-xs text-purple-300/50">Factor: {config.noise.factor}</label>
                <input type="range" min="0.01" max="1" step="0.01" value={config.noise.factor} onChange={(e) => setConfig(prev => ({ ...prev, noise: { ...prev.noise, factor: parseFloat(e.target.value) } }))} className="w-full mt-1" />
              </div>

              {/* SMOTE */}
              <div className={`border rounded-lg p-4 transition-colors ${config.smote.enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-purple-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium"><Scale className="w-4 h-4 inline mr-1" /> SMOTE</span>
                  <input type="checkbox" checked={config.smote.enabled} onChange={(e) => setConfig(prev => ({ ...prev, smote: { ...prev.smote, enabled: e.target.checked } }))} className="rounded border-purple-500/30" />
                </div>
                <label className="text-xs text-purple-300/50">K-Neighbors: {config.smote.neighbors}</label>
                <input type="range" min="1" max="10" step="1" value={config.smote.neighbors} onChange={(e) => setConfig(prev => ({ ...prev, smote: { ...prev.smote, neighbors: parseInt(e.target.value) } }))} className="w-full mt-1" />
              </div>

              {/* Random Sampling */}
              <div className={`border rounded-lg p-4 transition-colors ${config.sampling.enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-purple-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium"><Target className="w-4 h-4 inline mr-1" /> Random Sampling</span>
                  <input type="checkbox" checked={config.sampling.enabled} onChange={(e) => setConfig(prev => ({ ...prev, sampling: { ...prev.sampling, enabled: e.target.checked } }))} className="rounded border-purple-500/30" />
                </div>
                <label className="text-xs text-purple-300/50">Ratio: {config.sampling.ratio}</label>
                <input type="range" min="0.1" max="2" step="0.1" value={config.sampling.ratio} onChange={(e) => setConfig(prev => ({ ...prev, sampling: { ...prev.sampling, ratio: parseFloat(e.target.value) } }))} className="w-full mt-1" />
              </div>
            </>
          ) : (
            <>
              {/* Rotation */}
              <div className={`border rounded-lg p-4 transition-colors ${config.rotation.enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-purple-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium"><RotateCw className="w-4 h-4 inline mr-1" /> Rotation</span>
                  <input type="checkbox" checked={config.rotation.enabled} onChange={(e) => setConfig(prev => ({ ...prev, rotation: { ...prev.rotation, enabled: e.target.checked } }))} className="rounded border-purple-500/30" />
                </div>
                <label className="text-xs text-purple-300/50">Degrees: ±{config.rotation.degrees}°</label>
                <input type="range" min="1" max="180" step="1" value={config.rotation.degrees} onChange={(e) => setConfig(prev => ({ ...prev, rotation: { ...prev.rotation, degrees: parseInt(e.target.value) } }))} className="w-full mt-1" />
              </div>

              {/* Flip */}
              <div className={`border rounded-lg p-4 transition-colors ${config.flip.enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-purple-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium"><FlipHorizontal className="w-4 h-4 inline mr-1" /> Flip</span>
                  <input type="checkbox" checked={config.flip.enabled} onChange={(e) => setConfig(prev => ({ ...prev, flip: { ...prev.flip, enabled: e.target.checked } }))} className="rounded border-purple-500/30" />
                </div>
                <div className="flex items-center gap-3 text-xs text-purple-300/50">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={config.flip.horizontal} onChange={(e) => setConfig(prev => ({ ...prev, flip: { ...prev.flip, horizontal: e.target.checked } }))} className="rounded border-purple-500/30" /> H</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={config.flip.vertical} onChange={(e) => setConfig(prev => ({ ...prev, flip: { ...prev.flip, vertical: e.target.checked } }))} className="rounded border-purple-500/30" /> V</label>
                </div>
              </div>

              {/* Scale */}
              <div className={`border rounded-lg p-4 transition-colors ${config.scale.enabled ? 'border-primary-500/30 bg-primary-500/5' : 'border-purple-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium"><ZoomIn className="w-4 h-4 inline mr-1" /> Scale</span>
                  <input type="checkbox" checked={config.scale.enabled} onChange={(e) => setConfig(prev => ({ ...prev, scale: { ...prev.scale, enabled: e.target.checked } }))} className="rounded border-purple-500/30" />
                </div>
                <label className="text-xs text-purple-300/50">Factor: ±{config.scale.factor}</label>
                <input type="range" min="0.05" max="1" step="0.05" value={config.scale.factor} onChange={(e) => setConfig(prev => ({ ...prev, scale: { ...prev.scale, factor: parseFloat(e.target.value) } }))} className="w-full mt-1" />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={applyAugmentation} disabled={!sampleData} className="px-4 py-2 bg-gradient-btn text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
            ▶ Preview Augmentation
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <input type="text" value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} placeholder="Pipeline name..." className="bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
            <button onClick={savePipeline} disabled={!pipelineName} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 hover:text-white rounded-lg text-sm disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4 inline mr-1" /> Save Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {augmentedPreview && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Augmented Preview</h3>
            <div className="text-sm text-purple-300/50">
              Original: {sampleData.length} → Augmented: {augmentedPreview.length} (+{augmentedPreview.length - sampleData.length})
            </div>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-purple-300/50 border-b border-purple-500/20">
                  <th className="text-left py-2 px-2">ID</th>
                  {dataType === 'tabular' ? (
                    <>
                      <th className="text-left py-2 px-2">Feature 1</th>
                      <th className="text-left py-2 px-2">Feature 2</th>
                      <th className="text-left py-2 px-2">Feature 3</th>
                      <th className="text-left py-2 px-2">Label</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-2 px-2">Size</th>
                      <th className="text-left py-2 px-2">Label</th>
                      <th className="text-left py-2 px-2">Preview</th>
                    </>
                  )}
                  <th className="text-left py-2 px-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {augmentedPreview.slice(0, 30).map((row, i) => (
                  <tr key={i} className={`border-b border-purple-500/20/30 ${row.augType ? 'text-purple-300' : 'text-purple-200/70'}`}>
                    <td className="py-1.5 px-2">{row.id}</td>
                    {dataType === 'tabular' ? (
                      <>
                        <td className="py-1.5 px-2">{row.feature1}</td>
                        <td className="py-1.5 px-2">{row.feature2}</td>
                        <td className="py-1.5 px-2">{row.feature3}</td>
                        <td className="py-1.5 px-2">{row.label}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-1.5 px-2">{row.width}x{row.height}</td>
                        <td className="py-1.5 px-2">{row.label}</td>
                        <td className="py-1.5 px-2 font-mono">[{row.pixels.slice(0, 4).join(',')}...]</td>
                      </>
                    )}
                    <td className="py-1.5 px-2"><span className={`px-1.5 py-0.5 rounded text-xs ${row.augType ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-500/15 text-purple-300/50'}`}>{row.augType || 'original'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saved Pipelines */}
      {savedPipelines.length > 0 && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Saved Pipelines</h3>
          <div className="space-y-2">
            {savedPipelines.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-900 rounded-lg p-3">
                <div>
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-purple-300/40 ml-2">({p.dataType})</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.steps.map((s, j) => (
                    <span key={j} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded">{s.type}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
