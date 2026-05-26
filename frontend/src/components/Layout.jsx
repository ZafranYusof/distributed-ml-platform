import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import NotificationCenter from './NotificationCenter';
import Breadcrumb from './ui/Breadcrumb';
import {
  LayoutDashboard, Radio as LiveIcon, Wand2, FlaskConical as ExperimentsIcon,
  ArrowRightLeft, Code2, Monitor,
  Database, BarChart3, Search, Layers, Tag,
  GitBranch, Minimize2, Zap, Settings as DistInfIcon, Globe, Split,
  Activity, GitGraph, FileText, Package,
  LineChart, Boxes, Eye, Share2, GraduationCap, Sparkles,
  Workflow, BookOpen, Clock, Store, GitCompare, History,
  Users, Server, Network, Rocket,
  Dna, Waves, Bug, FlaskRound, Clapperboard, Gamepad2,
  Github, Webhook,
  Shield, TrendingUp,
  Sun, Moon, X, Menu, Search as SearchIcon, Command
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { liveUsers, connected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navSections = [
    {
      label: 'Training',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
        { path: '/live', label: 'Live Sessions', icon: LiveIcon },
        { path: '/automl', label: 'AutoML', icon: Wand2 },
        { path: '/experiments', label: 'Experiments', icon: ExperimentsIcon, tourId: 'experiments' },
        { path: '/transfer-learning', label: 'Transfer Learning', icon: ArrowRightLeft },
        { path: '/custom-loss', label: 'Custom Loss', icon: Code2 },
        { path: '/gpu', label: 'GPU Accel', icon: Monitor, tourId: 'training' },
      ]
    },
    {
      label: 'Data',
      items: [
        { path: '/datasets', label: 'Datasets', icon: Database, tourId: 'datasets' },
        { path: '/data-explorer', label: 'Data Explorer', icon: BarChart3 },
        { path: '/data-catalog', label: 'Data Catalog', icon: Search },
        { path: '/augmentation', label: 'Augmentation', icon: Layers },
        { path: '/annotations', label: 'Annotations', icon: Tag },
      ]
    },
    {
      label: 'Models',
      items: [
        { path: '/model-versions', label: 'Versioning', icon: GitBranch },
        { path: '/compression', label: 'Compression', icon: Minimize2 },
        { path: '/inference', label: 'Inference', icon: Zap, tourId: 'inference' },
        { path: '/distributed-inference', label: 'Distributed Inf.', icon: DistInfIcon },
        { path: '/inference-api', label: 'Inference API', icon: Globe },
        { path: '/ab-testing', label: 'A/B Testing', icon: Split },
      ]
    },
    {
      label: 'MLOps',
      items: [
        { path: '/monitoring', label: 'Monitoring', icon: Activity, tourId: 'monitoring' },
        { path: '/lineage', label: 'Data Lineage', icon: GitGraph },
        { path: '/model-cards', label: 'Model Cards', icon: FileText },
        { path: '/feature-store', label: 'Feature Store', icon: Package },
      ]
    },
    {
      label: 'Advanced',
      items: [
        { path: '/hyperparam-viz', label: 'Hyperparam Viz', icon: LineChart },
        { path: '/ensemble', label: 'Ensemble', icon: Boxes },
        { path: '/explainability', label: 'Explainability', icon: Eye },
        { path: '/federated', label: 'Federated', icon: Share2 },
        { path: '/active-learning', label: 'Active Learning', icon: GraduationCap },
        { path: '/auto-features', label: 'Auto Features', icon: Sparkles },
      ]
    },
    {
      label: 'Tools',
      items: [
        { path: '/pipeline', label: 'Pipeline', icon: Workflow },
        { path: '/notebook', label: 'Notebook', icon: BookOpen },
        { path: '/schedules', label: 'Schedules', icon: Clock },
        { path: '/marketplace', label: 'Marketplace', icon: Store },
        { path: '/compare', label: 'Compare', icon: GitCompare },
        { path: '/history', label: 'History', icon: History },
      ]
    },
    {
      label: 'Platform',
      items: [
        { path: '/organizations', label: 'Organizations', icon: Users },
        { path: '/cluster', label: 'GPU Cluster', icon: Server },
        { path: '/orchestration', label: 'Orchestration', icon: Network },
        { path: '/mlops-cicd', label: 'MLOps CI/CD', icon: Rocket },
      ]
    },
    {
      label: 'Research',
      items: [
        { path: '/nas', label: 'NAS', icon: Dna },
        { path: '/streaming', label: 'Streaming ML', icon: Waves },
        { path: '/debug-studio', label: 'Debug Studio', icon: Bug },
        { path: '/synthetic-data', label: 'Synthetic Data', icon: FlaskRound },
        { path: '/multimodal', label: 'Multi-Modal', icon: Clapperboard },
        { path: '/rl-playground', label: 'RL Playground', icon: Gamepad2 },
      ]
    },
    {
      label: 'Integrations',
      items: [
        { path: '/integrations/github', label: 'GitHub', icon: Github },
        { path: '/integrations/webhooks', label: 'Webhooks', icon: Webhook },
      ]
    },
    {
      label: 'Admin',
      items: [
        { path: '/admin', label: 'Admin Dashboard', icon: Shield, badge: 'admin' },
        { path: '/analytics', label: 'Analytics', icon: TrendingUp },
      ]
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const trainingCount = liveUsers.filter(u => u.status === 'training').length;

  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(180deg, #0D0221 0%, #1A0533 100%)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: 'linear-gradient(180deg, #1A0533 0%, #0D0221 100%)' }}>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative p-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="text-gradient">DistML</span>
            </h1>
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 text-purple-300/60 hover:text-white rounded-lg hover:bg-purple-500/10 transition-colors"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {/* Close button on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-purple-300/60 hover:text-white rounded-lg hover:bg-purple-500/10 transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-purple-300/50 mt-1">Distributed Training Platform</p>
          {connected && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse shadow-glow-green"></div>
              <span className="text-xs text-purple-300/50">{liveUsers.length} online{trainingCount > 0 ? ` · ${trainingCount} training` : ''}</span>
            </div>
          )}
        </div>
        <nav className="relative flex-1 p-4 space-y-4 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-purple-400/50 uppercase tracking-wider mb-1 px-3">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      data-tour={item.tourId}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                        location.pathname === item.path
                          ? 'bg-purple-500/15 text-white border border-purple-500/30 shadow-glow-purple'
                          : 'text-purple-200/70 hover:text-white hover:bg-purple-500/10'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.path === '/live' && trainingCount > 0 && (
                        <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                          {trainingCount}
                        </span>
                      )}
                      {item.badge === 'admin' && (
                        <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                          admin
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="relative p-4 border-t border-purple-500/20">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-neural flex items-center justify-center shadow-glow-purple">
                  <span className="text-white text-sm font-bold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{user.username}</p>
                  <p className="text-xs text-purple-300/50 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-xs text-purple-300/50 hover:text-red-400 transition-colors px-2 py-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="block w-full text-center text-sm bg-gradient-btn text-white rounded-lg px-3 py-2 hover:shadow-glow-purple transition-all"
              >
                Sign In
              </Link>
              <p className="text-xs text-purple-300/50 text-center">Sign in to save training history</p>
            </div>
          )}
          <div className="text-xs text-purple-300/40 mt-3">
            <p>TensorFlow.js + Web Workers</p>
            <p className="mt-1">In-Browser ML Training</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top bar with hamburger, notifications */}
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-md border-b border-purple-500/10 px-4 py-3 flex items-center justify-between lg:justify-end">
          {/* Hamburger menu (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-purple-300/60 hover:text-white rounded-lg hover:bg-purple-500/10 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {/* Command palette hint */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-800/50 border border-purple-500/20 rounded-lg text-purple-300/60 text-sm hover:border-purple-500/40 hover:text-white transition-all"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="text-xs bg-purple-500/10 border border-purple-500/20 px-1 py-0.5 rounded">⌘K</kbd>
            </button>

            {/* Notifications */}
            <NotificationCenter />
          </div>
        </div>

        <div className="p-6" id="main-content">
          <Breadcrumb />
          <Outlet />
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-md border-t border-purple-500/10 flex items-center justify-around py-2 px-1 lg:hidden z-30">
          {[
            { path: '/', icon: LayoutDashboard, label: 'Home' },
            { path: '/experiments', icon: ExperimentsIcon, label: 'Experiments' },
            { path: '/datasets', icon: Database, label: 'Data' },
            { path: '/inference', icon: Zap, label: 'Inference' },
            { path: '/monitoring', icon: Activity, label: 'Monitor' },
          ].map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[44px] min-h-[44px] justify-center transition-all ${
                  location.pathname === item.path ? 'text-white shadow-glow-purple' : 'text-purple-300/50'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
