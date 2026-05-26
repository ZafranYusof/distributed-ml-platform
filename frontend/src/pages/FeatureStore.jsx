import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

export default function FeatureStore() {
  const { user, token } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', code: '', datasetId: '', datasetName: '', tags: '' });
  const [selectedFeature, setSelectedFeature] = useState(null);

  const API = 'http://localhost:5005/api';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) fetchFeatures();
  }, [token, search]);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      let url = `${API}/feature-store?`;
      if (search) url += `search=${search}&`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setFeatures(data);
    } catch (err) {
      toast.error('Failed to load features');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/feature-store`, {
        method: 'POST', headers,
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          code: form.code,
          datasetId: form.datasetId,
          datasetName: form.datasetName,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      setShowCreate(false);
      setForm({ name: '', description: '', code: '', datasetId: '', datasetName: '', tags: '' });
      fetchFeatures();
      toast.success('Feature created');
    } catch (err) {
      toast.error('Failed to create feature');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Feature',
      message: 'Are you sure you want to delete this feature? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await fetch(`${API}/feature-store/${id}`, { method: 'DELETE', headers });
      fetchFeatures();
      toast.success('Feature deleted');
    } catch (err) {
      toast.error('Failed to delete feature');
    }
  };

  const computeFeature = (feature) => {
    try {
      const sampleData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const fn = new Function('data', feature.code);
      const result = fn(sampleData);
      setSelectedFeature({ ...feature, computedResult: result });
      toast.success('Feature computed successfully');
    } catch (err) {
      setSelectedFeature({ ...feature, computedResult: `Error: ${err.message}` });
      toast.error('Feature computation failed');
    }
  };

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to access Feature Store</div>;

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Feature Store</h1>
          <p className="text-dark-400 mt-1">Centralized feature repository with versioning and lineage tracking</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" aria-label="Create new feature">
          + New Feature
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search features..."
          className="flex-1 input-field"
          aria-label="Search features"
        />
      </div>

      {/* Features Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : features.length === 0 ? (
        <EmptyState
          icon="🗃️"
          title="No features yet"
          description="Create your first feature transformation to build a reusable feature pipeline."
          actionLabel="New Feature"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f._id} className="card card-hover p-5 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{f.name}</h3>
                  <p className="text-dark-400 text-sm mt-1">v{f.version}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => computeFeature(f)} className="text-primary-400 hover:text-primary-300 text-sm transition-colors" aria-label={`Run ${f.name}`}>▶ Run</button>
                  <button onClick={() => handleDelete(f._id)} className="text-red-400 hover:text-red-300 text-sm transition-colors" aria-label={`Delete ${f.name}`}>✕</button>
                </div>
              </div>
              {f.description && <p className="text-dark-400 text-sm mt-2">{f.description}</p>}
              {f.code && (
                <pre className="mt-3 bg-dark-900 rounded-lg p-3 text-xs text-dark-300 overflow-x-auto max-h-24">{f.code}</pre>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {f.tags?.map(tag => (
                  <span key={tag} className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
              {f.datasetName && (
                <p className="text-xs text-dark-500 mt-2">Dataset: {f.datasetName}</p>
              )}
              <p className="text-xs text-dark-500 mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Computed Result Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Feature result">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-lg animate-fade-in">
            <h2 className="text-white font-semibold mb-2">Feature: {selectedFeature.name} (v{selectedFeature.version})</h2>
            <p className="text-dark-400 text-sm mb-4">Computed Result:</p>
            <pre className="bg-dark-900 rounded-lg p-4 text-sm text-dark-200 overflow-auto max-h-64">
              {JSON.stringify(selectedFeature.computedResult, null, 2)}
            </pre>
            <button onClick={() => setSelectedFeature(null)} className="mt-4 w-full btn-secondary">Close</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Create feature">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <h2 className="text-white font-semibold mb-4">Create Feature</h2>
            <form onSubmit={handleCreate} className="space-y-4" noValidate>
              <div>
                <label className="text-dark-400 text-sm" htmlFor="feat-name">Name</label>
                <input id="feat-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full mt-1 input-field" placeholder="age_normalized" />
              </div>
              <div>
                <label className="text-dark-400 text-sm" htmlFor="feat-desc">Description</label>
                <input id="feat-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 input-field" placeholder="Normalize age to 0-1 range" />
              </div>
              <div>
                <label className="text-dark-400 text-sm" htmlFor="feat-code">Transformation Code (JS function body, receives `data` array)</label>
                <textarea id="feat-code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} rows={5}
                  className="w-full mt-1 input-field font-mono text-sm"
                  placeholder="const max = Math.max(...data);\nreturn data.map(x => x / max);" />
              </div>
              <div>
                <label className="text-dark-400 text-sm" htmlFor="feat-dataset">Dataset Name (optional)</label>
                <input id="feat-dataset" value={form.datasetName} onChange={e => setForm({ ...form, datasetName: e.target.value })}
                  className="w-full mt-1 input-field" />
              </div>
              <div>
                <label className="text-dark-400 text-sm" htmlFor="feat-tags">Tags (comma-separated)</label>
                <input id="feat-tags" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full mt-1 input-field" placeholder="normalization, preprocessing" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
