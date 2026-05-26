import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';
import SearchFilterBar from '../components/ui/SearchFilterBar';

export default function Experiments() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tag: '', status: '', search: '' });
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', tags: '', params: '{}', metrics: '{}' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchExperiments();
  }, [filter]);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      let url = `/api/experiments?`;
      if (filter.tag) url += `tag=${filter.tag}&`;
      if (filter.status) url += `status=${filter.status}&`;
      if (filter.search) url += `search=${filter.search}&`;
      const res = await authFetch(url);
      const data = await res.json();
      setExperiments(data);
    } catch (err) {
      toast.error('Failed to load experiments');
    }
    setLoading(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Experiment name is required';
    try { JSON.parse(form.params); } catch { errors.params = 'Invalid JSON format'; }
    try { JSON.parse(form.metrics); } catch { errors.metrics = 'Invalid JSON format'; }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      let params = {}, metrics = {};
      try { params = JSON.parse(form.params); } catch (e) {}
      try { metrics = JSON.parse(form.metrics); } catch (e) {}
      await authFetch('/api/experiments', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), params, metrics, status: 'completed' })
      });
      setShowCreate(false);
      setForm({ name: '', tags: '', params: '{}', metrics: '{}' });
      setFormErrors({});
      fetchExperiments();
      toast.success('Experiment logged successfully');
    } catch (err) {
      toast.error('Failed to log experiment');
    }
  };

  const handleCompare = async () => {
    if (compareIds.length < 2) return;
    try {
      const res = await authFetch('/api/experiments/compare', { method: 'POST', body: JSON.stringify({ ids: compareIds }) });
      const data = await res.json();
      setCompareData(data);
      toast.info(`Comparing ${compareIds.length} experiments`);
    } catch (err) {
      toast.error('Failed to compare experiments');
    }
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Experiment',
      message: 'Are you sure you want to delete this experiment? All associated data will be lost.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await authFetch(`/api/experiments/${id}`, { method: 'DELETE' });
      fetchExperiments();
      toast.success('Experiment deleted');
    } catch (err) {
      toast.error('Failed to delete experiment');
    }
  };

  const handleSearch = useCallback((query) => {
    setFilter(prev => ({ ...prev, search: query }));
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setFilter(prev => ({ ...prev, status: prev.status === status ? '' : status }));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'running': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-dark-700 text-dark-400';
    }
  };

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to track experiments</div>;

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Experiment Tracking</h1>
          <p className="text-dark-400 mt-1">Log, compare, and analyze training experiments</p>
        </div>
        <div className="flex gap-2">
          {compareIds.length >= 2 && (
            <button onClick={handleCompare} className="btn-primary">
              Compare ({compareIds.length})
            </button>
          )}
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary" aria-label="Log new experiment">
            + Log Experiment
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        onSearch={handleSearch}
        placeholder="Search experiments..."
        sortOptions={[
          { value: 'date', label: 'Date' },
          { value: 'name', label: 'Name' },
          { value: 'status', label: 'Status' },
        ]}
        filters={[
          { value: 'running', label: 'Running' },
          { value: 'completed', label: 'Completed' },
          { value: 'failed', label: 'Failed' },
        ]}
        activeFilters={filter.status ? [filter.status] : []}
        onFilterChange={handleStatusFilter}
      />

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-white">Log New Experiment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })); }}
                required
                className={`w-full input-field ${formErrors.name ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.name}
              />
              {formErrors.name && <p className="field-error">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} className="w-full input-field" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Params (JSON)</label>
              <textarea
                value={form.params}
                onChange={(e) => { setForm(prev => ({ ...prev, params: e.target.value })); setFormErrors(prev => ({ ...prev, params: '' })); }}
                rows={3}
                className={`w-full input-field font-mono text-sm ${formErrors.params ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.params}
              />
              {formErrors.params && <p className="field-error">{formErrors.params}</p>}
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Metrics (JSON)</label>
              <textarea
                value={form.metrics}
                onChange={(e) => { setForm(prev => ({ ...prev, metrics: e.target.value })); setFormErrors(prev => ({ ...prev, metrics: '' })); }}
                rows={3}
                className={`w-full input-field font-mono text-sm ${formErrors.metrics ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.metrics}
              />
              {formErrors.metrics && <p className="field-error">{formErrors.metrics}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Log Experiment</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Comparison View */}
      {compareData && (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Experiment Comparison</h3>
            <button onClick={() => { setCompareData(null); setCompareIds([]); }} className="text-sm text-dark-400 hover:text-white" aria-label="Close comparison">✕ Close</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="text-dark-400 border-b border-dark-700">
                  <th className="text-left py-2 px-3" scope="col">Property</th>
                  {compareData.map(exp => <th key={exp._id} className="text-left py-2 px-3" scope="col">{exp.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-dark-700/50">
                  <td className="py-2 px-3 text-dark-400">Status</td>
                  {compareData.map(exp => <td key={exp._id} className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(exp.status)}`}>{exp.status}</span></td>)}
                </tr>
                <tr className="border-b border-dark-700/50">
                  <td className="py-2 px-3 text-dark-400">Params</td>
                  {compareData.map(exp => <td key={exp._id} className="py-2 px-3 text-dark-300 text-xs font-mono">{JSON.stringify(exp.params)}</td>)}
                </tr>
                <tr className="border-b border-dark-700/50">
                  <td className="py-2 px-3 text-dark-400">Metrics</td>
                  {compareData.map(exp => <td key={exp._id} className="py-2 px-3 text-dark-300 text-xs font-mono">{JSON.stringify(exp.metrics)}</td>)}
                </tr>
                <tr className="border-b border-dark-700/50">
                  <td className="py-2 px-3 text-dark-400">Tags</td>
                  {compareData.map(exp => <td key={exp._id} className="py-2 px-3 text-dark-300">{exp.tags?.join(', ')}</td>)}
                </tr>
                <tr>
                  <td className="py-2 px-3 text-dark-400">Date</td>
                  {compareData.map(exp => <td key={exp._id} className="py-2 px-3 text-dark-300">{new Date(exp.createdAt).toLocaleDateString()}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Experiments List */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : experiments.length === 0 ? (
        <EmptyState
          icon="🧪"
          title="No experiments yet"
          description="Run your first experiment to start tracking metrics, parameters, and results."
          actionLabel="Log an Experiment"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Experiments list">
            <thead>
              <tr className="text-dark-400 border-b border-dark-700">
                <th className="text-left py-3 px-3 w-8" scope="col"><span className="sr-only">Select</span></th>
                <th className="text-left py-3 px-3" scope="col">Name</th>
                <th className="text-left py-3 px-3" scope="col">Status</th>
                <th className="text-left py-3 px-3" scope="col">Tags</th>
                <th className="text-left py-3 px-3" scope="col">Metrics</th>
                <th className="text-left py-3 px-3" scope="col">Date</th>
                <th className="text-left py-3 px-3" scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {experiments.map(exp => (
                <tr key={exp._id} className={`border-b border-dark-700/50 hover:bg-dark-800/50 transition-colors ${compareIds.includes(exp._id) ? 'bg-primary-500/5' : ''}`}>
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(exp._id)}
                      onChange={() => toggleCompare(exp._id)}
                      className="rounded border-dark-600"
                      aria-label={`Select ${exp.name} for comparison`}
                    />
                  </td>
                  <td className="py-3 px-3 text-white font-medium">{exp.name}</td>
                  <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(exp.status)}`}>{exp.status}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 flex-wrap">{exp.tags?.map(t => <span key={t} className="text-xs bg-dark-700 text-dark-300 px-1.5 py-0.5 rounded">{t}</span>)}</div>
                  </td>
                  <td className="py-3 px-3 text-dark-300 text-xs font-mono max-w-xs truncate">{JSON.stringify(exp.metrics)}</td>
                  <td className="py-3 px-3 text-dark-400">{new Date(exp.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="text-dark-500 hover:text-red-400 text-xs transition-colors"
                      aria-label={`Delete ${exp.name}`}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
