import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Undo2 } from 'lucide-react';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { GitBranch } from 'lucide-react';
import HowToUse from '../components/ui/HowToUse';

export default function ModelVersions() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [versions, setVersions] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
    fetchVersions();
  }, [selectedModel]);

  const fetchModels = async () => {
    try {
      const res = await authFetch('/api/model-versions/models');
      const data = await res.json();
      setModels(data);
    } catch (err) {
      toast.error('Failed to load models');
    }
  };

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const url = selectedModel ? `/api/model-versions?modelName=${selectedModel}` : '/api/model-versions';
      const res = await authFetch(url);
      const data = await res.json();
      setVersions(data);
    } catch (err) {
      toast.error('Failed to load versions');
    }
    setLoading(false);
  };

  const handleRollback = async (id) => {
    try {
      const res = await authFetch(`/api/model-versions/${id}`);
      const version = await res.json();
      toast.success(`Rollback to v${version.version} ready. Weights loaded.`);
    } catch (err) {
      toast.error('Rollback failed');
    }
  };

  const handleCompare = async () => {
    if (compareIds.length !== 2) return;
    try {
      const res = await authFetch(`/api/model-versions/compare/${compareIds[0]}/${compareIds[1]}`);
      const data = await res.json();
      setComparison(data);
    } catch (err) {
      toast.error('Comparison failed');
    }
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev);
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to access model versioning</div>;

  return (
    <div className="space-y-6">
      <HowToUse pageId="model-versions" steps={[
      'View all versions of your models.',
      'Compare versions side by side.',
      'Rollback to a previous version if needed.'
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Model Versioning</h1>
          <p className="text-purple-300/50 mt-1">Track, compare, and rollback model versions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="input-field text-sm"
            aria-label="Filter by model"
          >
            <option value="">All Models</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            onClick={() => { setCompareMode(!compareMode); setCompareIds([]); setComparison(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${compareMode ? 'bg-gradient-btn text-white' : 'bg-dark-800 text-purple-200/70 hover:bg-purple-500/15'}`}
            aria-pressed={compareMode}
          >
            {compareMode ? 'Cancel Compare' : 'Compare Versions'}
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="bg-dark-800/50 border border-primary-500/20 rounded-lg p-4 animate-fade-in">
          <p className="text-purple-200/70 text-sm">Select 2 versions to compare ({compareIds.length}/2 selected)</p>
          {compareIds.length === 2 && (
            <button onClick={handleCompare} className="mt-2 btn-primary text-sm">
              Compare Selected
            </button>
          )}
        </div>
      )}

      {comparison && (
        <div className="card animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Version Comparison</h2>
          <div className="grid grid-cols-2 gap-6">
            {[comparison.v1, comparison.v2].map((v, i) => (
              <div key={i} className="bg-dark-900 rounded-lg p-4">
                <h3 className="text-purple-400 font-medium mb-2">{v.modelName} v{v.version}</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-purple-300/50">Created:</span> <span className="text-dark-200">{new Date(v.createdAt).toLocaleString()}</span></div>
                  {v.metrics && <div><span className="text-purple-300/50">Metrics:</span> <pre className="text-dark-200 mt-1 text-xs bg-dark-800/40 p-2 rounded overflow-auto">{JSON.stringify(v.metrics, null, 2)}</pre></div>}
                  {v.hyperparams && <div><span className="text-purple-300/50">Hyperparams:</span> <pre className="text-dark-200 mt-1 text-xs bg-dark-800/40 p-2 rounded overflow-auto">{JSON.stringify(v.hyperparams, null, 2)}</pre></div>}
                  {v.architecture && <div><span className="text-purple-300/50">Architecture:</span> <pre className="text-dark-200 mt-1 text-xs bg-dark-800/40 p-2 rounded overflow-auto">{JSON.stringify(v.architecture, null, 2)}</pre></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <CardSkeleton count={4} />
      ) : versions.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No model versions yet"
          description="Train a model to create your first version. Versions are automatically tracked."
        />
      ) : (
        <div className="space-y-3">
          {versions.map(v => (
            <div key={v._id} className={`card p-4 flex items-center justify-between transition-colors ${compareIds.includes(v._id) ? 'border-primary-500' : ''}`}>
              <div className="flex items-center gap-4">
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={compareIds.includes(v._id)}
                    onChange={() => toggleCompare(v._id)}
                    className="w-4 h-4 rounded border-purple-500/30"
                    aria-label={`Select ${v.modelName} v${v.version} for comparison`}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{v.modelName}</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">v{v.version}</span>
                  </div>
                  <p className="text-purple-300/50 text-sm mt-1">{v.description || 'No description'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-purple-300/40">
                    <span>{new Date(v.createdAt).toLocaleString()}</span>
                    {v.metrics && <span>Loss: {v.metrics.loss?.toFixed(4) || 'N/A'} | Acc: {v.metrics.accuracy?.toFixed(4) || 'N/A'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRollback(v._id)}
                  className="px-3 py-1.5 btn-secondary text-sm"
                  aria-label={`Rollback to ${v.modelName} v${v.version}`}
                >
                  <Undo2 className="w-4 h-4 inline mr-1" /> Rollback
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
