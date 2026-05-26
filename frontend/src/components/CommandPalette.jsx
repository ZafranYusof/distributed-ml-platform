import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGES = [
  { name: 'Dashboard', path: '/', icon: '⚡' },
  { name: 'Live Sessions', path: '/live', icon: '🔴' },
  { name: 'AutoML', path: '/automl', icon: '🤖' },
  { name: 'Experiments', path: '/experiments', icon: '🧪' },
  { name: 'Transfer Learning', path: '/transfer-learning', icon: '🔄' },
  { name: 'Custom Loss', path: '/custom-loss', icon: '📐' },
  { name: 'GPU Acceleration', path: '/gpu', icon: '🎮' },
  { name: 'Datasets', path: '/datasets', icon: '📁' },
  { name: 'Data Explorer', path: '/data-explorer', icon: '📊' },
  { name: 'Augmentation', path: '/augmentation', icon: '🔀' },
  { name: 'Annotations', path: '/annotations', icon: '🏷' },
  { name: 'Model Versions', path: '/model-versions', icon: '📦' },
  { name: 'Compression', path: '/compression', icon: '🗜' },
  { name: 'Inference', path: '/inference', icon: '🔮' },
  { name: 'Distributed Inference', path: '/distributed-inference', icon: '⚙️' },
  { name: 'Inference API', path: '/inference-api', icon: '🌐' },
  { name: 'A/B Testing', path: '/ab-testing', icon: '🔬' },
  { name: 'Monitoring', path: '/monitoring', icon: '📡' },
  { name: 'Data Lineage', path: '/lineage', icon: '🔗' },
  { name: 'Model Cards', path: '/model-cards', icon: '📋' },
  { name: 'Feature Store', path: '/feature-store', icon: '🗃️' },
  { name: 'Hyperparam Viz', path: '/hyperparam-viz', icon: '📉' },
  { name: 'Ensemble', path: '/ensemble', icon: '🎯' },
  { name: 'Explainability', path: '/explainability', icon: '🔍' },
  { name: 'Federated', path: '/federated', icon: '🔒' },
  { name: 'Active Learning', path: '/active-learning', icon: '🎓' },
  { name: 'Auto Features', path: '/auto-features', icon: '🧮' },
  { name: 'Pipeline', path: '/pipeline', icon: '🔗' },
  { name: 'Notebook', path: '/notebook', icon: '📓' },
  { name: 'Schedules', path: '/schedules', icon: '⏰' },
  { name: 'Marketplace', path: '/marketplace', icon: '🏪' },
  { name: 'Compare', path: '/compare', icon: '📈' },
  { name: 'History', path: '/history', icon: '📜' },
  { name: 'Organizations', path: '/organizations', icon: '🏢' },
  { name: 'GPU Cluster', path: '/cluster', icon: '🖥️' },
  { name: 'Orchestration', path: '/orchestration', icon: '🔀' },
  { name: 'MLOps CI/CD', path: '/mlops-cicd', icon: '🚀' },
  { name: 'NAS', path: '/nas', icon: '🧬' },
  { name: 'Streaming ML', path: '/streaming', icon: '🌊' },
  { name: 'Debug Studio', path: '/debug-studio', icon: '🐛' },
  { name: 'Synthetic Data', path: '/synthetic-data', icon: '🎲' },
  { name: 'Multi-Modal', path: '/multimodal', icon: '🎭' },
  { name: 'RL Playground', path: '/rl-playground', icon: '🎮' },
  { name: 'Admin Dashboard', path: '/admin', icon: '👑' },
  { name: 'Analytics', path: '/analytics', icon: '📊' },
  { name: 'Data Catalog', path: '/data-catalog', icon: '🗂️' },
  { name: 'GitHub Integration', path: '/integrations/github', icon: '🐙' },
  { name: 'Webhooks', path: '/integrations/webhooks', icon: '🔔' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('distml-recent-searches') || '[]');
    } catch { return []; }
  });
  const inputRef = useRef(null);
  const paletteRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const fuzzyMatch = useCallback((text, search) => {
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    if (textLower.includes(searchLower)) return true;
    let si = 0;
    for (let i = 0; i < textLower.length && si < searchLower.length; i++) {
      if (textLower[i] === searchLower[si]) si++;
    }
    return si === searchLower.length;
  }, []);

  const results = query
    ? PAGES.filter(p => fuzzyMatch(p.name, query))
    : recentSearches.length > 0
      ? PAGES.filter(p => recentSearches.includes(p.path)).slice(0, 5)
      : PAGES.slice(0, 8);

  const handleSelect = (item) => {
    navigate(item.path);
    setOpen(false);
    const updated = [item.path, ...recentSearches.filter(p => p !== item.path)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('distml-recent-searches', JSON.stringify(updated));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[9990]" onClick={() => setOpen(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[9991]" ref={paletteRef}>
        <div className="bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="flex items-center gap-3 p-4 border-b border-dark-700">
            <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, models, datasets..."
              className="flex-1 bg-transparent text-white placeholder-dark-400 outline-none text-sm"
            />
            <kbd className="text-xs text-dark-500 bg-dark-700 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {!query && recentSearches.length > 0 && (
              <p className="text-xs text-dark-500 px-3 py-1">Recent</p>
            )}
            {results.length === 0 ? (
              <div className="p-6 text-center text-dark-400 text-sm">No results found</div>
            ) : (
              results.map((item, i) => (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    i === selectedIndex ? 'bg-primary-500/10 text-primary-400' : 'text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                  {i === selectedIndex && (
                    <span className="ml-auto text-xs text-dark-500">↵ Enter</span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-4 px-4 py-2 border-t border-dark-700 text-xs text-dark-500">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
