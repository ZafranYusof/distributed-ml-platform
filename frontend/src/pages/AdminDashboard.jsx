import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Crown, Users, Dumbbell, BarChart3, FolderOpen } from 'lucide-react';

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [usersOverTime, setUsersOverTime] = useState([]);
  const [trainingPerDay, setTrainingPerDay] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, trainingRes] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch('/api/admin/users-over-time'),
        authFetch('/api/admin/training-per-day')
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsersOverTime(await usersRes.json());
      if (trainingRes.ok) setTrainingPerDay(await trainingRes.json());
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
                <Crown className="w-6 h-6 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-purple-300/50 text-sm">Platform overview and management</p>
        </div>
        <span className="ml-3 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">Admin</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="blue" />
        <StatCard title="Training Jobs Today" value={stats?.todaySessions || 0} icon={Dumbbell} color="green" />
        <StatCard title="Total Sessions" value={stats?.totalSessions || 0} icon={BarChart3} color="purple" />
        <StatCard title="Total Datasets" value={stats?.totalDatasets || 0} icon={FolderOpen} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Models */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Popular Models (Top 5)</h3>
          <div className="space-y-3">
            {(stats?.popularModels || []).length === 0 ? (
              <p className="text-purple-300/50 text-sm">No training data yet</p>
            ) : (
              stats.popularModels.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-300/40">#{i + 1}</span>
                    <span className="text-sm text-dark-200">{m.model}</span>
                  </div>
                  <span className="text-sm text-purple-400 font-medium">{m.count} runs</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Over Time */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">User Registrations (30d)</h3>
          {usersOverTime.length === 0 ? (
            <p className="text-purple-300/50 text-sm">No data available</p>
          ) : (
            <div className="space-y-2">
              {usersOverTime.slice(-10).map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-purple-300/40 w-20">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-purple-500/15 rounded-full h-4">
                    <div
                      className="bg-gradient-btn h-4 rounded-full"
                      style={{ width: `${Math.min(100, (d.count / Math.max(...usersOverTime.map(x => x.count))) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-purple-200/70 w-8">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Training Per Day */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Training Jobs (30d)</h3>
          {trainingPerDay.length === 0 ? (
            <p className="text-purple-300/50 text-sm">No data available</p>
          ) : (
            <div className="space-y-2">
              {trainingPerDay.slice(-10).map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-purple-300/40 w-20">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-purple-500/15 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${Math.min(100, (d.count / Math.max(...trainingPerDay.map(x => x.count))) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-purple-200/70 w-8">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(stats?.recentActivity || []).length === 0 ? (
              <p className="text-purple-300/50 text-sm">No recent activity</p>
            ) : (
              stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-purple-300/40">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  <span className="text-purple-200/70">{a.userId?.username || 'User'}</span>
                  <span className="text-purple-300/40">—</span>
                  <span className="text-dark-200">{a.event}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-6 h-6" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm mt-2 opacity-80">{title}</p>
    </div>
  );
}
