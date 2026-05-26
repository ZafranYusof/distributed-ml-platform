import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MultiModal() {
  const [tabularData, setTabularData] = useState('');
  const [textData, setTextData] = useState('');
  const [imageFeatures, setImageFeatures] = useState(null);
  const [fusionStrategy, setFusionStrategy] = useState('early');
  const [encoderConfig, setEncoderConfig] = useState({
    tabular: { layers: [16, 8], activation: 'relu' },
    text: { embeddingDim: 32, maxLen: 50 },
    image: { convFilters: 16, poolSize: 2 }
  });
  const [training, setTraining] = useState(false);
  const [metrics, setMetrics] = useState([]);
  const [contributions, setContributions] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [attention, setAttention] = useState(null);
  const intervalRef = useRef(null);

  const generateSampleData = () => {
    // Generate sample tabular data
    const csv = 'age,income,score\n' + Array.from({ length: 50 }, () =>
      `${Math.floor(20 + Math.random() * 50)},${Math.floor(30000 + Math.random() * 70000)},${(Math.random() * 100).toFixed(1)}`
    ).join('\n');
    setTabularData(csv);
    setTextData('The product quality is excellent and delivery was fast. Customer satisfaction is high with repeat purchases.');
    setImageFeatures(Array.from({ length: 64 }, () => Math.random()));
  };

  const trainModel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTraining(true);
    setMetrics([]);
    setPredictions([]);
    let epoch = 0;
    const maxEpochs = 30;

    intervalRef.current = setInterval(() => {
      epoch++;
      if (epoch > maxEpochs) {
        clearInterval(intervalRef.current);
        setTraining(false);
        // Generate final contributions
        const tabContrib = 0.3 + Math.random() * 0.3;
        const textContrib = 0.2 + Math.random() * 0.2;
        const imgContrib = 1 - tabContrib - textContrib;
        setContributions({ tabular: tabContrib, text: textContrib, image: imgContrib });
        // Generate attention map
        const words = textData.split(' ').slice(0, 10);
        const attentionWeights = words.map(() => Math.random());
        const maxAtt = Math.max(...attentionWeights);
        setAttention(words.map((w, i) => ({ word: w, weight: attentionWeights[i] / maxAtt })));
        return;
      }

      const baseLoss = 2.0 * Math.exp(-epoch * 0.12);
      const fusionBonus = fusionStrategy === 'hybrid' ? 0.05 : fusionStrategy === 'late' ? 0.02 : 0;
      const loss = Math.max(0.05, baseLoss - fusionBonus + (Math.random() - 0.5) * 0.1);
      const accuracy = Math.min(0.98, 1 - loss / 3 + (Math.random() - 0.5) * 0.05);

      setMetrics(prev => [...prev, { epoch, loss: Number(loss.toFixed(4)), accuracy: Number(accuracy.toFixed(4)) }]);

      if (epoch % 5 === 0) {
        setPredictions(prev => [...prev, {
          epoch,
          tabularPred: (0.5 + Math.random() * 0.4).toFixed(3),
          textPred: (0.4 + Math.random() * 0.5).toFixed(3),
          imagePred: (0.3 + Math.random() * 0.5).toFixed(3),
          fusedPred: (accuracy).toFixed(3)
        }]);
      }
    }, 600);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Multi-Modal Learning</h1>
        <p className="text-purple-300/50 mt-1">Train models on multiple data types with configurable fusion strategies</p>
      </div>

      {/* Data Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 mb-3">📊 Tabular Data</h3>
          <textarea value={tabularData} onChange={e => setTabularData(e.target.value)}
            className="w-full h-32 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white text-xs font-mono resize-none"
            placeholder="CSV data..." />
          <p className="text-xs text-purple-300/40 mt-1">{tabularData ? tabularData.split('\n').length - 1 : 0} rows</p>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 mb-3">📝 Text Data</h3>
          <textarea value={textData} onChange={e => setTextData(e.target.value)}
            className="w-full h-32 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white text-xs resize-none"
            placeholder="Enter text..." />
          <p className="text-xs text-purple-300/40 mt-1">{textData ? textData.split(' ').length : 0} words</p>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 mb-3">🖼️ Image Features</h3>
          {imageFeatures ? (
            <div className="h-32 overflow-hidden">
              <div className="grid grid-cols-8 gap-0.5">
                {imageFeatures.slice(0, 64).map((v, i) => (
                  <div key={i} className="w-full aspect-square rounded-sm"
                    style={{ backgroundColor: `rgba(6, 182, 212, ${v})` }}></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-purple-300/40 text-sm">No image loaded</div>
          )}
          <p className="text-xs text-purple-300/40 mt-1">{imageFeatures ? '64-dim feature vector' : 'Upload or generate'}</p>
        </div>
      </div>

      <button onClick={generateSampleData} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 rounded-lg hover:bg-purple-500/20">
        Generate Sample Data
      </button>

      {/* Encoder & Fusion Config */}
      <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-purple-300/50">Fusion Strategy</label>
            <select value={fusionStrategy} onChange={e => setFusionStrategy(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={training}>
              <option value="early">Early Fusion (concat features)</option>
              <option value="late">Late Fusion (combine predictions)</option>
              <option value="hybrid">Hybrid (attention-based)</option>
            </select>
            <p className="text-xs text-purple-300/40 mt-1">
              {fusionStrategy === 'early' && 'Concatenate all features before the model'}
              {fusionStrategy === 'late' && 'Separate models per modality, combine outputs'}
              {fusionStrategy === 'hybrid' && 'Cross-modal attention with learned weights'}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-purple-300/50">Tabular Encoder</label>
              <p className="text-sm text-white font-mono">[{encoderConfig.tabular.layers.join(' → ')}] · {encoderConfig.tabular.activation}</p>
            </div>
            <div>
              <label className="text-xs text-purple-300/50">Text Encoder</label>
              <p className="text-sm text-white font-mono">Embedding({encoderConfig.text.embeddingDim}) · maxLen={encoderConfig.text.maxLen}</p>
            </div>
            <div>
              <label className="text-xs text-purple-300/50">Image Encoder</label>
              <p className="text-sm text-white font-mono">Conv({encoderConfig.image.convFilters}) · Pool({encoderConfig.image.poolSize})</p>
            </div>
          </div>
        </div>
        <button onClick={trainModel} disabled={training || (!tabularData && !textData && !imageFeatures)}
          className="mt-4 px-6 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
          {training ? 'Training...' : 'Train Multi-Modal Model'}
        </button>
      </div>

      {/* Training Metrics */}
      {metrics.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Training Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="epoch" stroke="#6b5b95" />
              <YAxis stroke="#6b5b95" />
              <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} name="Loss" dot={false} />
              <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} name="Accuracy" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modality Contributions */}
        {contributions && (
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Modality Contributions</h3>
            <div className="space-y-4">
              {Object.entries(contributions).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-purple-200/70 w-20 capitalize">{key}</span>
                  <div className="flex-1 h-6 bg-purple-500/15 rounded overflow-hidden">
                    <div className={`h-full ${
                      key === 'tabular' ? 'bg-blue-500' : key === 'text' ? 'bg-green-500' : 'bg-purple-500'
                    }`} style={{ width: `${value * 100}%` }}></div>
                  </div>
                  <span className="text-sm text-white w-14 text-right">{(value * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cross-Modal Attention */}
        {attention && (
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Cross-Modal Attention (Text → Image)</h3>
            <div className="flex flex-wrap gap-2">
              {attention.map((item, i) => (
                <span key={i} className="px-2 py-1 rounded text-sm"
                  style={{
                    backgroundColor: `rgba(6, 182, 212, ${item.weight * 0.5})`,
                    border: `1px solid rgba(6, 182, 212, ${item.weight})`,
                    color: item.weight > 0.5 ? '#fff' : '#A78BFA'
                  }}>
                  {item.word}
                </span>
              ))}
            </div>
            <p className="text-xs text-purple-300/40 mt-3">Brighter = higher attention weight from image features</p>
          </div>
        )}
      </div>

      {/* Per-modality predictions */}
      {predictions.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Per-Modality Predictions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left py-2 px-3 text-purple-300/50">Epoch</th>
                  <th className="text-left py-2 px-3 text-blue-400">Tabular</th>
                  <th className="text-left py-2 px-3 text-green-400">Text</th>
                  <th className="text-left py-2 px-3 text-purple-400">Image</th>
                  <th className="text-left py-2 px-3 text-purple-400">Fused</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i} className="border-b border-purple-500/20/50">
                    <td className="py-2 px-3 text-white">{p.epoch}</td>
                    <td className="py-2 px-3 text-blue-300 font-mono">{p.tabularPred}</td>
                    <td className="py-2 px-3 text-green-300 font-mono">{p.textPred}</td>
                    <td className="py-2 px-3 text-purple-300 font-mono">{p.imagePred}</td>
                    <td className="py-2 px-3 text-purple-300 font-mono font-bold">{p.fusedPred}</td>
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
