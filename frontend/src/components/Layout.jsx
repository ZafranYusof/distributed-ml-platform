import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import NotificationCenter from './NotificationCenter';
import Breadcrumb from './ui/Breadcrumb';

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
        { path: '/', label: 'Dashboard', icon: '⚡', tourId: 'dashboard' },
        { path: '/live', label: 'Live Sessions', icon: '🔴' },
        { path: '/automl', label: 'AutoML', icon: '🤖' },
        { path: '/experiments', label: 'Experiments', icon: '🧪', tourId: 'experiments' },
        { path: '/transfer-learning', label: 'Transfer Learning', icon: '🔄' },
        { path: '/custom-loss', label: 'Custom Loss', icon: '📐' },
        { path: '/gpu', label: 'GPU Accel', icon: '🎮', tourId: 'training' },
      ]
    },
    {
      label: 'Data',
      items: [
        { path: '/datasets', label: 'Datasets', icon: '📁', tourId: 'datasets' },
        { path: '/data-explorer', label: 'Data Explorer', icon: '📊' },
        { path: '/data-catalog', label: 'Data Catalog', icon: '🗂️' },
        { path: '/augmentation', label: 'Augmentation', icon: '🔀' },
        { path: '/annotations', label: 'Annotations', icon: '🏷' },
      ]
    },
    {
      label: 'Models',
      items: [
        { path: '/model-versions', label: 'Versioning', icon: '📦' },
        { path: '/compression', label: 'Compression', icon: '🗜' },
        { path: '/inference', label: 'Inference', icon: '🔮', tourId: 'inference' },
        { path: '/distributed-inference', label: 'Distributed Inf.', icon: '⚙️' },
        { path: '/inference-api', label: 'Inference API', icon: '🌐' },
        { path: '/ab-testing', label: 'A/B Testing', icon: '🔬' },
      ]
    },
    {
      label: 'MLOps',
      items: [
        { path: '/monitoring', label: 'Monitoring', icon: '📡', tourId: 'monitoring' },
        { path: '/lineage', label: 'Data Lineage', icon: '🔗' },
        { path: '/model-cards', label: 'Model Cards', icon: '📋' },
        { path: '/feature-store', label: 'Feature Store', icon: '🗃️' },
      ]
    },
    {
      label: 'Advanced',
      items: [
        { path: '/hyperparam-viz', label: 'Hyperparam Viz', icon: '📉' },
        { path: '/ensemble', label: 'Ensemble', icon: '🎯' },
        { path: '/explainability', label: 'Explainability', icon: '🔍' },
        { path: '/federated', label: 'Federated', icon: '🔒' },
        { path: '/active-learning', label: 'Active Learning', icon: '🎓' },
        { path: '/auto-features', label: 'Auto Features', icon: '🧮' },
      ]
    },
    {
      label: 'Tools',
      items: [
        { path: '/pipeline', label: 'Pipeline', icon: '🔗' },
        { path: '/notebook', label: 'Notebook', icon: '📓' },
        { path: '/schedules', label: 'Schedules', icon: '⏰' },
        { path: '/marketplace', label: 'Marketplace', icon: '🏪' },
        { path: '/compare', label: 'Compare', icon: '📈' },
        { path: '/history', label: 'History', icon: '📜' },
      ]
    },
    {
      label: 'Platform',
      items: [
        { path: '/organizations', label: 'Organizations', icon: '🏢' },
        { path: '/cluster', label: 'GPU Cluster', icon: '🖥️' },
        { path: '/orchestration', label: 'Orchestration', icon: '🔀' },
        { path: '/mlops-cicd', label: 'MLOps CI/CD', icon: '🚀' },
      ]
    },
    {
      label: 'Research',
      items: [
        { path: '/nas', label: 'NAS', icon: '🧬' },
        { path: '/streaming', label: 'Streaming ML', icon: '🌊' },
        { path: '/debug-studio', label: 'Debug Studio', icon: '🐛' },
        { path: '/synthetic-data', label: 'Synthetic Data', icon: '🎲' },
        { path: '/multimodal', label: 'Multi-Modal', icon: '🎭' },
        { path: '/rl-playground', label: 'RL Playground', icon: '🎮' },
      ]
    },
    {
      label: 'Integrations',
      items: [
        { path: '/integrations/github', label: 'GitHub', icon: '🐙' },
        { path: '/integrations/webhooks', label: 'Webhooks', icon: '🔔' },
      ]
    },
    {
      label: 'Admin',
      items: [
        { path: '/admin', label: 'Admin Dashboard', icon: '👑', badge: 'admin' },
        { path: '/analytics', label: 'Analytics', icon: '📊' },
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
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-dark-900 border-r border-dark-700 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-400 flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span>DistML</span>
            </h1>
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {/* Close button on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-dark-400 mt-1">Distributed Training Platform</p>
          {connected && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-dark-500">{liveUsers.length} online{trainingCount > 0 ? ` · ${trainingCount} training` : ''}</span>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1 px-3">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    data-tour={item.tourId}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      location.pathname === item.path
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                        : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
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
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-dark-700">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-400 text-sm font-bold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-100 truncate">{user.username}</p>
                  <p className="text-xs text-dark-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-xs text-dark-400 hover:text-red-400 transition-colors px-2 py-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="block w-full text-center text-sm bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg px-3 py-2 hover:bg-primary-500/20 transition-colors"
              >
                Sign In
              </Link>
              <p className="text-xs text-dark-500 text-center">Sign in to save training history</p>
            </div>
          )}
          <div className="text-xs text-dark-500 mt-3">
            <p>TensorFlow.js + Web Workers</p>
            <p className="mt-1">In-Browser ML Training</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top bar with hamburger, notifications */}
        <div className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800 px-4 py-3 flex items-center justify-between lg:justify-end">
          {/* Hamburger menu (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {/* Command palette hint */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-dark-400 text-sm hover:border-dark-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
              <kbd className="text-xs bg-dark-700 px-1 py-0.5 rounded">⌘K</kbd>
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
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 flex items-center justify-around py-2 px-1 lg:hidden z-30">
          {[
            { path: '/', icon: '⚡', label: 'Home' },
            { path: '/experiments', icon: '🧪', label: 'Experiments' },
            { path: '/datasets', icon: '📁', label: 'Data' },
            { path: '/inference', icon: '🔮', label: 'Inference' },
            { path: '/monitoring', icon: '📡', label: 'Monitor' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[44px] min-h-[44px] justify-center transition-colors ${
                location.pathname === item.path ? 'text-primary-400' : 'text-dark-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
