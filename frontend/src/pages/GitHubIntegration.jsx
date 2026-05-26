import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function GitHubIntegration() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [integration, setIntegration] = useState(null);
  const [commits, setCommits] = useState([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadIntegration();
  }, []);

  const loadIntegration = async () => {
    try {
      const res = await authFetch('/api/integrations/github');
      if (res.ok) {
        const data = await res.json();
        setIntegration(data);
        if (data) loadCommits();
      }
    } catch (err) {
      }
    setLoading(false);
  };

  const loadCommits = async () => {
    try {
      const res = await authFetch('/api/integrations/github/commits');
      if (res.ok) setCommits(await res.json());
    } catch {}
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!repoUrl || !token) return;
    setConnecting(true);
    try {
      const res = await authFetch('/api/integrations/github', {
        method: 'POST',
        body: JSON.stringify({ repoUrl, personalAccessToken: token })
      });
      if (res.ok) {
        const data = await res.json();
        setIntegration(data);
        setRepoUrl('');
        setToken('');
        loadCommits();
      }
    } catch (err) {
      }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    try {
      await authFetch('/api/integrations/github', { method: 'DELETE' });
      setIntegration(null);
      setCommits([]);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🐙</span>
        <div>
          <h1 className="text-2xl font-bold text-white">GitHub Integration</h1>
          <p className="text-purple-300/50 text-sm">Connect your repository to version models with commits</p>
        </div>
      </div>

      {!integration ? (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Connect Repository</h3>
          <form onSubmit={handleConnect} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-purple-200/70 mb-1">Repository URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full px-3 py-2 bg-purple-500/15 border border-purple-500/30 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1">Personal Access Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-purple-500/15 border border-purple-500/30 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-purple-300/40 mt-1">Needs repo read access</p>
            </div>
            <button
              type="submit"
              disabled={connecting || !repoUrl || !token}
              className="px-4 py-2 bg-gradient-btn text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {connecting ? 'Connecting...' : 'Connect Repository'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Connected Status */}
          <div className="bg-dark-800/40 border border-green-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <div>
                  <p className="text-white font-medium">{integration.repoName}</p>
                  <p className="text-xs text-purple-300/50">{integration.repoUrl}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Recent Commits */}
          <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Commits</h3>
            <div className="space-y-3">
              {commits.map((commit, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-dark-700/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-xs text-purple-200/70 flex-shrink-0">
                    {commit.sha.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-purple-400 bg-primary-500/10 px-1.5 py-0.5 rounded">{commit.sha}</code>
                      <span className="text-xs text-purple-300/40">{new Date(commit.date).toLocaleString()}</span>
                    </div>
                  </div>
                  <button className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap">
                    Link to model
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-version on push */}
          <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-2">Webhook: Auto-version on Push</h3>
            <p className="text-sm text-purple-300/50 mb-3">Automatically create a new model version when code is pushed to the repository.</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 bg-gradient-btn rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="text-sm text-purple-200/70">Enabled</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
