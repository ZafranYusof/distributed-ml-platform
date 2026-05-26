import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Upload, Download } from 'lucide-react';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import { Store } from 'lucide-react';
import SearchFilterBar from '../components/ui/SearchFilterBar';
import HowToUse from '../components/ui/HowToUse';

export default function Marketplace() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showPublish, setShowPublish] = useState(false);
  const [publishForm, setPublishForm] = useState({
    name: '', description: '', tags: '', accuracy: '', loss: '', taskType: 'regression'
  });
  const [publishing, setPublishing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchModels();
  }, [sortBy]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('sort', sortBy);
      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setModels(data);
    } catch (err) {
      toast.error('Failed to load marketplace models');
    }
    setLoading(false);
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // Debounced search triggers fetch
    setTimeout(() => fetchModels(), 100);
  }, []);

  const handleSort = useCallback((value) => {
    setSortBy(value || 'createdAt');
  }, []);

  const validatePublishForm = () => {
    const errors = {};
    if (!publishForm.name.trim()) errors.name = 'Model name is required';
    if (!publishForm.description.trim()) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!validatePublishForm()) return;
    setPublishing(true);
    try {
      const res = await authFetch('/api/marketplace', {
        method: 'POST',
        body: JSON.stringify({
          name: publishForm.name,
          description: publishForm.description,
          tags: publishForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          metrics: {
            accuracy: parseFloat(publishForm.accuracy) || null,
            loss: parseFloat(publishForm.loss) || null,
            taskType: publishForm.taskType
          },
          modelConfig: { type: 'neural-network', layers: [64, 32] },
          weights: null,
          normalization: null
        })
      });
      if (res.ok) {
        setShowPublish(false);
        setPublishForm({ name: '', description: '', tags: '', accuracy: '', loss: '', taskType: 'regression' });
        setFormErrors({});
        fetchModels();
        toast.success('Model published to marketplace');
      }
    } catch (err) {
      toast.error('Failed to publish model');
    }
    setPublishing(false);
  };

  const handleDownload = async (modelId) => {
    try {
      const res = await fetch(`/api/marketplace/${modelId}/download`, { method: 'POST' });
      if (res.ok) {
        setModels(prev => prev.map(m => m._id === modelId ? { ...m, downloads: m.downloads + 1 } : m));
        toast.success('Model downloaded');
      }
    } catch (err) {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <HowToUse pageId="marketplace" steps={[
      'Browse community models.',
      'Search by name or tags.',
      'Click \'Download\' to use a model.',
      'Publish your own models for others.'
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Model Marketplace</h1>
          <p className="text-purple-300/50 mt-1">Browse, share, and download community models</p>
        </div>
        {user && (
          <button onClick={() => setShowPublish(!showPublish)} className="btn-primary flex items-center gap-2" aria-label="Publish a model">
            <Upload className="w-4 h-4" /> Publish Model
          </button>
        )}
      </div>

      {/* Publish Form */}
      {showPublish && (
        <div className="card border-primary-500/20 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4"><Upload className="w-5 h-5 inline mr-1" /> Publish a Model</h2>
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-purple-200/70 mb-1" htmlFor="model-name">Model Name</label>
                <input
                  id="model-name"
                  type="text"
                  value={publishForm.name}
                  onChange={(e) => { setPublishForm(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })); }}
                  className={`input-field w-full ${formErrors.name ? 'input-error' : ''}`}
                  placeholder="My Awesome Model"
                  required
                  aria-invalid={!!formErrors.name}
                />
                {formErrors.name && <p className="field-error">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-purple-200/70 mb-1" htmlFor="model-tags">Tags (comma-separated)</label>
                <input
                  id="model-tags"
                  type="text"
                  value={publishForm.tags}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="input-field w-full"
                  placeholder="classification, nlp, image"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="model-desc">Description</label>
              <textarea
                id="model-desc"
                value={publishForm.description}
                onChange={(e) => { setPublishForm(prev => ({ ...prev, description: e.target.value })); setFormErrors(prev => ({ ...prev, description: '' })); }}
                className={`input-field w-full h-20 resize-none ${formErrors.description ? 'input-error' : ''}`}
                placeholder="Describe what your model does..."
                required
                aria-invalid={!!formErrors.description}
              />
              {formErrors.description && <p className="field-error">{formErrors.description}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-purple-200/70 mb-1">Task Type</label>
                <select
                  value={publishForm.taskType}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, taskType: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="regression">Regression</option>
                  <option value="classification">Classification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-purple-200/70 mb-1">Accuracy</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={publishForm.accuracy}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, accuracy: e.target.value }))}
                  className="input-field w-full"
                  placeholder="0.95"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-200/70 mb-1">Loss</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={publishForm.loss}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, loss: e.target.value }))}
                  className="input-field w-full"
                  placeholder="0.05"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={publishing} className="btn-primary disabled:opacity-50">
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
              <button type="button" onClick={() => setShowPublish(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <SearchFilterBar
        onSearch={handleSearch}
        onSort={handleSort}
        placeholder="Search models by name, description, or tags..."
        sortOptions={[
          { value: 'createdAt', label: 'Newest' },
          { value: 'downloads', label: 'Most Downloaded' },
          { value: 'accuracy', label: 'Best Accuracy' },
        ]}
      />

      {/* Models Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : models.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No models published yet"
          description="Be the first to publish a model and share it with the community."
          actionLabel="Publish a Model"
          onAction={() => setShowPublish(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => (
            <div key={model._id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{model.name}</h3>
                  <p className="text-xs text-purple-300/40">by {model.authorName}</p>
                </div>
                <span className="text-xs bg-dark-800/40 px-2 py-1 rounded text-purple-300/50">
                  {model.metrics?.taskType || 'general'}
                </span>
              </div>
              <p className="text-sm text-purple-300/50 mb-3 line-clamp-2">{model.description}</p>
              
              {model.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {model.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-4 text-xs text-purple-300/50 mb-3">
                {model.metrics?.accuracy && (
                  <span>Acc: <span className="text-green-400">{(model.metrics.accuracy * 100).toFixed(1)}%</span></span>
                )}
                {model.metrics?.loss && (
                  <span>Loss: <span className="text-yellow-400">{model.metrics.loss.toFixed(4)}</span></span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-purple-500/20">
                <span className="text-xs text-purple-300/40"><Download className="w-3 h-3 inline mr-1" />{model.downloads} downloads</span>
                <button
                  onClick={() => handleDownload(model._id)}
                  className="text-xs bg-purple-500/10 text-purple-300 border border-primary-500/20 px-3 py-1 rounded-lg hover:bg-primary-500/20 transition-colors"
                  aria-label={`Download ${model.name}`}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
