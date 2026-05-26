import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

export default function DataCatalog() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const [datasetsRes, experimentsRes, modelsRes] = await Promise.all([
        authFetch('/api/managed-datasets'),
        authFetch('/api/experiments'),
        authFetch('/api/model-versions')
      ]);

      const catalogItems = [];

      if (datasetsRes.ok) {
        const datasets = await datasetsRes.json();
        (Array.isArray(datasets) ? datasets : []).forEach(d => {
          catalogItems.push({ ...d, catalogType: 'dataset', icon: '📁' });
        });
      }

      if (experimentsRes.ok) {
        const experiments = await experimentsRes.json();
        (Array.isArray(experiments) ? experiments : []).forEach(e => {
          catalogItems.push({ ...e, catalogType: 'experiment', icon: '🧪' });
        });
      }

      if (modelsRes.ok) {
        const models = await modelsRes.json();
        (Array.isArray(models) ? models : []).forEach(m => {
          catalogItems.push({ ...m, catalogType: 'model', icon: '📦' });
        });
      }

      setItems(catalogItems);
    } catch (err) {
      toast.error('Failed to load catalog');
    }
    setLoading(false);
  };

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.catalogType !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = (item.name || item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes(s) || desc.includes(s);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🗂️</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Data Catalog</h1>
            <p className="text-dark-400 text-sm">Search and browse all datasets, models, and experiments</p>
          </div>
        </div>
        <CardSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🗂️</span>
        <div>
          <h1 className="text-2xl font-bold text-white">Data Catalog</h1>
          <p className="text-dark-400 text-sm">Search and browse all datasets, models, and experiments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-10 pr-4 py-2 input-field"
            aria-label="Search catalog"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter by type">
          {['all', 'dataset', 'experiment', 'model'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filter === f
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                  : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500'
              }`}
              aria-pressed={filter === f}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-dark-400" aria-live="polite">{filtered.length} items found</p>

      {/* Catalog Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No items match your search"
          description="Try adjusting your search terms or filters to find what you're looking for."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <div key={i} className="card card-hover p-4 animate-fade-in">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.catalogType === 'dataset' ? 'bg-blue-500/20 text-blue-400' :
                  item.catalogType === 'experiment' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {item.catalogType}
                </span>
              </div>
              <h3 className="text-sm font-medium text-white truncate">{item.name || item.title || 'Untitled'}</h3>
              <p className="text-xs text-dark-400 mt-1 line-clamp-2">{item.description || 'No description'}</p>
              <div className="flex items-center gap-2 mt-3">
                {item.createdAt && (
                  <span className="text-xs text-dark-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                )}
                {item.tags && item.tags.slice(0, 2).map((tag, j) => (
                  <span key={j} className="text-xs bg-dark-700 text-dark-300 px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
