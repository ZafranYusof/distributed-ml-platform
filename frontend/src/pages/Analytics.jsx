import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function Analytics() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [myStats, setMyStats] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [myRes, platformRes] = await Promise.all([
        authFetch('/api/analytics/my-stats'),
        authFetch('/api/analytics/platform')
      ]);
      if (myRes.ok) setMyStats(await myRes.json());
      if (platformRes.ok) setPlatform(await platformRes.json());
    } catch (err) {
      }
    setLoading(false);
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
        <span className="text-2xl">📊</span>
        <div>
          <h1 className="text-2xl font-bold text-white">Usage Analytics</h1>
          <p className="text-purple-300/50 text-sm">Track your usage and platform-wide statistics</p>
        </div>
      </div>

      {/* My Stats */}
      <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Your Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{myStats?.totalEvents || 0}</p>
            <p className="text-xs text-purple-300/50 mt-1">Total Events</p>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{myStats?.pageVisits?.length || 0}</p>
            <p className="text-xs text-purple-300/50 mt-1">Pages Visited</p>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{myStats?.recentEvents?.length || 0}</p>
            <p className="text-xs text-purple-300/50 mt-1">Recent Actions</p>
          </div>
        </div>

        {/* Top Pages */}
        {myStats?.pageVisits?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-purple-200/70 mb-2">Most Visited Pages</h4>
            <div className="space-y-2">
              {myStats.pageVisits.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-purple-300/40 w-16">{p._id || 'Unknown'}</span>
                  <div className="flex-1 bg-purple-500/15 rounded-full h-3">
                    <div
                      className="bg-primary-500/60 h-3 rounded-full"
                      style={{ width: `${(p.count / myStats.pageVisits[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-purple-300/50">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Platform Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage Heatmap */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Usage Heatmap</h3>
          {(platform?.pageHeatmap || []).length === 0 ? (
            <p className="text-purple-300/50 text-sm">No usage data yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {platform.pageHeatmap.slice(0, 12).map((p, i) => {
                const maxCount = platform.pageHeatmap[0].count;
                const intensity = Math.max(0.2, p.count / maxCount);
                return (
                  <div
                    key={i}
                    className="rounded-lg p-2 text-center border border-purple-500/30"
                    style={{ backgroundColor: `rgba(99, 102, 241, ${intensity * 0.3})` }}
                  >
                    <p className="text-xs text-dark-200 truncate">{p._id || '/'}</p>
                    <p className="text-xs text-purple-300/50">{p.count}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Peak Hours</h3>
          {(platform?.peakHours || []).length === 0 ? (
            <p className="text-purple-300/50 text-sm">No data yet</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 24 }, (_, h) => {
                const hourData = platform.peakHours.find(p => p._id === h);
                const count = hourData?.count || 0;
                const maxCount = Math.max(...platform.peakHours.map(p => p.count));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-primary-500/60 rounded-t"
                      style={{ height: `${Math.max(2, height)}%` }}
                    />
                    {h % 4 === 0 && (
                      <span className="text-[10px] text-purple-300/40 mt-1">{h}h</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
