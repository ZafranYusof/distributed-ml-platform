import { useSocket } from '../context/SocketContext';
import { Flame, Users, Ghost } from 'lucide-react';

export default function LiveSessions() {
  const { liveUsers, connected } = useSocket();

  const trainingUsers = liveUsers.filter(u => u.status === 'training');
  const idleUsers = liveUsers.filter(u => u.status === 'idle');
  const completedUsers = liveUsers.filter(u => u.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Live Sessions</h2>
          <p className="text-purple-300/50 mt-1">Real-time view of active training sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-sm text-purple-300/50">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-purple-400">{liveUsers.length}</div>
          <div className="text-sm text-purple-300/50 mt-1">Online Users</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-yellow-400">{trainingUsers.length}</div>
          <div className="text-sm text-purple-300/50 mt-1">Active Training</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-green-400">{completedUsers.length}</div>
          <div className="text-sm text-purple-300/50 mt-1">Completed</div>
        </div>
      </div>

      {/* Active Training Sessions */}
      {trainingUsers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4"><Flame className="w-5 h-5 inline mr-1 text-orange-400" /> Active Training</h3>
          <div className="space-y-3">
            {trainingUsers.map((user, i) => (
              <div key={i} className="bg-dark-800/40 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-purple-400 text-sm font-bold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-xs text-purple-300/50">{user.model || 'Neural Network'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-400 font-mono">
                      Epoch {user.currentEpoch || 0}/{user.totalEpochs || '?'}
                    </p>
                    <p className="text-xs text-purple-300/50">
                      {user.loss !== undefined ? `Loss: ${user.loss.toFixed(4)}` : ''}
                      {user.accuracy !== undefined ? ` | Acc: ${(user.accuracy * 100).toFixed(1)}%` : ''}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-purple-500/15 rounded-full h-2">
                  <div
                    className="bg-gradient-btn h-2 rounded-full transition-all duration-300"
                    style={{ width: `${user.progress || 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-purple-300/40">
                    Started {user.startedAt ? new Date(user.startedAt).toLocaleTimeString() : 'just now'}
                  </span>
                  <span className="text-xs text-purple-300/40">{Math.round(user.progress || 0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle Users */}
      {idleUsers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4"><Users className="w-5 h-5 inline mr-1" /> Online Users</h3>
          <div className="flex flex-wrap gap-3">
            {idleUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-2 bg-dark-800/40 rounded-lg px-3 py-2 border border-purple-500/30">
                <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
                  <span className="text-purple-200/70 text-xs font-bold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-sm text-purple-200/70">{user.username}</span>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {liveUsers.length === 0 && (
        <div className="card text-center py-12">
          <Ghost className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-purple-200/70 font-medium">No one is online right now</p>
          <p className="text-purple-300/40 text-sm mt-1">Start a training session to appear here</p>
        </div>
      )}
    </div>
  );
}
