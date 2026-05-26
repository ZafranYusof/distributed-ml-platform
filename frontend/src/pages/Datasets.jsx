import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { Link2, Lock } from 'lucide-react';
import { Database } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import SearchFilterBar from '../components/ui/SearchFilterBar';
import KaggleImport from '../components/KaggleImport';
import HowToUse from '../components/ui/HowToUse';

export default function Datasets() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [datasets, setDatasets] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tag: '', category: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', tags: '', category: 'uncategorized', description: '', shared: false, data: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchDatasets();
  }, [filter]);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      let url = `/api/managed-datasets?`;
      if (filter.tag) url += `tag=${filter.tag}&`;
      if (filter.category) url += `category=${filter.category}&`;
      const res = await authFetch(url);
      const data = await res.json();
      setDatasets(data);
    } catch (err) {
      toast.error('Failed to load datasets');
    }
    setLoading(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, data: ev.target.result, name: prev.name || file.name.replace('.csv', '') }));
    };
    reader.readAsText(file);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.data) errors.data = 'Please upload a CSV file';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const body = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      await authFetch('/api/managed-datasets', { method: 'POST', body: JSON.stringify(body) });
      setShowUpload(false);
      setForm({ name: '', tags: '', category: 'uncategorized', description: '', shared: false, data: '' });
      setFormErrors({});
      fetchDatasets();
      toast.success('Dataset uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload dataset');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Dataset',
      message: 'Are you sure you want to delete this dataset? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await authFetch(`/api/managed-datasets/${id}`, { method: 'DELETE' });
      fetchDatasets();
      toast.success('Dataset deleted');
    } catch (err) {
      toast.error('Failed to delete dataset');
    }
  };

  const toggleShare = async (ds) => {
    try {
      await authFetch(`/api/managed-datasets/${ds._id}`, {
        method: 'PUT', body: JSON.stringify({ shared: !ds.shared })
      });
      fetchDatasets();
      toast.info(ds.shared ? 'Dataset set to private' : 'Dataset shared');
    } catch (err) {
      toast.error('Failed to update sharing');
    }
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryFilter = useCallback((category) => {
    setFilter(prev => ({ ...prev, category: prev.category === category ? '' : category }));
  }, []);

  const filteredDatasets = datasets.filter(ds => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ds.name?.toLowerCase().includes(q) || ds.description?.toLowerCase().includes(q) || ds.tags?.some(t => t.toLowerCase().includes(q));
  });

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to manage datasets</div>;

  return (
    <div className="space-y-6">
      <HowToUse pageId="datasets" steps={[
      'Drag & drop a CSV file or click to browse.',
      'Or select a sample dataset (Iris, Housing, Sine Wave).',
      'Tag and organize datasets.',
      'Use version control to track changes.'
      ]} />
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dataset Management</h1>
          <p className="text-purple-300/50 mt-1">Upload, organize, version, and share datasets</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary"
          aria-label="Upload new dataset"
        >
          + Upload Dataset
        </button>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        onSearch={handleSearch}
        placeholder="Search datasets..."
        sortOptions={[
          { value: 'name', label: 'Name' },
          { value: 'date', label: 'Date' },
          { value: 'size', label: 'Size' },
        ]}
        filters={[
          { value: 'classification', label: 'Classification' },
          { value: 'regression', label: 'Regression' },
          { value: 'timeseries', label: 'Time Series' },
          { value: 'uncategorized', label: 'Uncategorized' },
        ]}
        activeFilters={filter.category ? [filter.category] : []}
        onFilterChange={handleCategoryFilter}
      />

      {/* Upload Form */}
      {showUpload && (
        <form onSubmit={handleSubmit} className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6 space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-white">Upload New Dataset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })); }}
                required
                className={`w-full input-field ${formErrors.name ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && <p id="name-error" className="field-error">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full input-field">
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
                <option value="timeseries">Time Series</option>
                <option value="uncategorized">Uncategorized</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="e.g. nlp, sentiment, large" className="w-full input-field" />
            </div>
            <div>
              <label className="block text-sm text-purple-300/50 mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className="w-full input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-purple-300/50 mb-1">CSV File</label>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="text-purple-200/70 text-sm" aria-label="Upload CSV file" />
            {formErrors.data && <p className="field-error">{formErrors.data}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.shared} onChange={(e) => setForm(prev => ({ ...prev, shared: e.target.checked }))} className="rounded border-purple-500/30" id="share-checkbox" />
            <label htmlFor="share-checkbox" className="text-sm text-purple-200/70">Share with other users</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={!form.data} className="btn-primary disabled:opacity-50">Upload</button>
            <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Dataset List */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : filteredDatasets.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No datasets yet"
          description="Upload your first dataset to get started with training and experiments."
          actionLabel="Upload a Dataset"
          onAction={() => setShowUpload(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.map(ds => (
            <div key={ds._id} className="card card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{ds.name}</h3>
                  <p className="text-purple-300/50 text-xs mt-1">{ds.description || 'No description'}</p>
                </div>
                <span className="text-xs bg-purple-500/15 text-purple-200/70 px-2 py-0.5 rounded">v{ds.version}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {ds.tags?.map(tag => (
                  <span key={tag} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
                <span className="text-xs bg-purple-500/15 text-purple-300/50 px-2 py-0.5 rounded-full">{ds.category}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-purple-300/40">
                <span>{ds.rows} rows</span>
                <span>{ds.columns} cols</span>
                <span>{(ds.fileSize / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-500/20">
                <button
                  onClick={() => toggleShare(ds)}
                  className={`text-xs px-2 py-1 rounded ${ds.shared ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/15 text-purple-300/50'}`}
                  aria-label={ds.shared ? 'Make private' : 'Share dataset'}
                >
                  {ds.shared ? <><Link2 className="w-3 h-3 inline mr-1" /> Shared</> : <><Lock className="w-3 h-3 inline mr-1" /> Private</>}
                </button>
                <button
                  onClick={() => handleDelete(ds._id)}
                  className="text-xs px-2 py-1 rounded bg-purple-500/15 text-red-400 hover:bg-red-500/10 ml-auto"
                  aria-label={`Delete ${ds.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kaggle Import Section */}
      <KaggleImport onImport={(dataset) => {
        toast.success(`Imported ${dataset.name} from Kaggle`);
        fetchDatasets();
      }} />
    </div>
  );
}
