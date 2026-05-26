import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Wand2, FlaskConical, ArrowRightLeft, Code2, Monitor,
  Database, BarChart3, Layers, Tag,
  GitBranch, Minimize2, Zap, Settings, Globe, Split,
  Activity, GitGraph, FileText, Package,
  LineChart, Boxes, Eye, Share2, GraduationCap, Sparkles,
  Workflow, BookOpen, Clock, Store, GitCompare, History,
  Users, Server, Network, Rocket,
  Dna, Waves, Bug, FlaskRound, Clapperboard, Gamepad2,
  Shield, TrendingUp, Search, Github, Webhook
} from 'lucide-react';

const PAGES = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Sessions', path: '/live', icon: Radio },
  { name: 'AutoML', path: '/automl', icon: Wand2 },
  { name: 'Experiments', path: '/experiments', icon: FlaskConical },
  { name: 'Transfer Learning', path: '/transfer-learning', icon: ArrowRightLeft },
  { name: 'Custom Loss', path: '/custom-loss', icon: Code2 },
  { name: 'GPU Acceleration', path: '/gpu', icon: Monitor },
  { name: 'Datasets', path: '/datasets', icon: Database },
  { name: 'Data Explorer', path: '/data-explorer', icon: BarChart3 },
  { name: 'Augmentation', path: '/augmentation', icon: Layers },
  { name: 'Annotations', path: '/annotations', icon: Tag },
  { name: 'Model Versions', path: '/model-versions', icon: GitBranch },
  { name: 'Compression', path: '/compression', icon: Minimize2 },
  { name: 'Inference', path: '/inference', icon: Zap },
  { name: 'Distributed Inference', path: '/distributed-inference', icon: Settings },
  { name: 'Inference API', path: '/inference-api', icon: Globe },
  { name: 'A/B Testing', path: '/ab-testing', icon: Split },
  { name: 'Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Data Lineage', path: '/lineage', icon: GitGraph },
  { name: 'Model Cards', path: '/model-cards', icon: FileText },
  { name: 'Feature Store', path: '/feature-store', icon: Package },
  { name: 'Hyperparam Viz', path: '/hyperparam-viz', icon: LineChart },
  { name: 'Ensemble', path: '/ensemble', icon: Boxes },
  { name: 'Explainability', path: '/explainability', icon: Eye },
  { name: 'Federated', path: '/federated', icon: Share2 },
  { name: 'Active Learning', path: '/active-learning', icon: GraduationCap },
  { name: 'Auto Features', path: '/auto-features', icon: Sparkles },
  { name: 'Pipeline', path: '/pipeline', icon: Workflow },
  { name: 'Notebook', path: '/notebook', icon: BookOpen },
  { name: 'Schedules', path: '/schedules', icon: Clock },
  { name: 'Marketplace', path: '/marketplace', icon: Store },
  { name: 'Compare', path: '/compare', icon: GitCompare },
  { name: 'History', path: '/history', icon: History },
  { name: 'Organizations', path: '/organizations', icon: Users },
  { name: 'GPU Cluster', path: '/cluster', icon: Server },
  { name: 'Orchestration', path: '/orchestration', icon: Network },
  { name: 'MLOps CI/CD', path: '/mlops-cicd', icon: Rocket },
  { name: 'NAS', path: '/nas', icon: Dna },
  { name: 'Streaming ML', path: '/streaming', icon: Waves },
  { name: 'Debug Studio', path: '/debug-studio', icon: Bug },
  { name: 'Synthetic Data', path: '/synthetic-data', icon: FlaskRound },
  { name: 'Multi-Modal', path: '/multimodal', icon: Clapperboard },
  { name: 'RL Playground', path: '/rl-playground', icon: Gamepad2 },
  { name: 'Admin Dashboard', path: '/admin', icon: Shield },
  { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  { name: 'Data Catalog', path: '/data-catalog', icon: Search },
  { name: 'GitHub Integration', path: '/integrations/github', icon: Github },
  { name: 'Webhooks', path: '/integrations/webhooks', icon: Webhook },
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
        <div className="bg-dark-800/40 border border-dark-600 rounded-xl shadow-2xl overflow-hidden" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="flex items-center gap-3 p-4 border-b border-purple-500/20">
            <Search className="w-5 h-5 text-purple-300/50" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, models, datasets..."
              className="flex-1 bg-transparent text-white placeholder-dark-400 outline-none text-sm"
            />
            <kbd className="text-xs text-purple-300/40 bg-dark-700 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {!query && recentSearches.length > 0 && (
              <p className="text-xs text-purple-300/40 px-3 py-1">Recent</p>
            )}
            {results.length === 0 ? (
              <div className="p-6 text-center text-purple-300/50 text-sm">No results found</div>
            ) : (
              results.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      i === selectedIndex ? 'bg-primary-500/10 text-purple-400' : 'text-purple-200/70 hover:bg-purple-500/15'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {i === selectedIndex && (
                      <span className="ml-auto text-xs text-purple-300/40">↵ Enter</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 px-4 py-2 border-t border-purple-500/20 text-xs text-purple-300/40">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
