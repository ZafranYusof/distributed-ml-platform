import { useSocket } from '../context/SocketContext';

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
          <p className="text-dark-400 mt-1">Real-time view of active training sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-sm text-dark-400">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-primary-400">{liveUsers.length}</div>
          <div className="text-sm text-dark-400 mt-1">Online Users</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-yellow-400">{trainingUsers.length}</div>
          <div className="text-sm text-dark-400 mt-1">Active Training</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-green-400">{completedUsers.length}</div>
          <div className="text-sm text-dark-400 mt-1">Completed</div>
        </div>
      </div>

      {/* Active Training Sessions */}
      {trainingUsers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">🔥 Active Training</h3>
          <div className="space-y-3">
            {trainingUsers.map((user, i) => (
              <div key={i} className="bg-dark-800 rounded-lg p-4 border border-dark-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-primary-400 text-sm font-bold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-dark-100 font-medium">{user.username}</p>
                      <p className="text-xs text-dark-400">{user.model || 'Neural Network'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary-400 font-mono">
                      Epoch {user.currentEpoch || 0}/{user.totalEpochs || '?'}
                    </p>
                    <p className="text-xs text-dark-400">
                      {user.loss !== undefined ? `Loss: ${user.loss.toFixed(4)}` : ''}
                      {user.accuracy !== undefined ? ` | Acc: ${(user.accuracy * 100).toFixed(1)}%` : ''}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${user.progress || 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-dark-500">
                    Started {user.startedAt ? new Date(user.startedAt).toLocaleTimeString() : 'just now'}
                  </span>
                  <span className="text-xs text-dark-500">{Math.round(user.progress || 0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle Users */}
      {idleUsers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">👥 Online Users</h3>
          <div className="flex flex-wrap gap-3">
            {idleUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2 border border-dark-600">
                <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
                  <span className="text-dark-300 text-xs font-bold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-sm text-dark-300">{user.username}</span>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {liveUsers.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">👻</div>
          <p className="text-dark-300 font-medium">No one is online right now</p>
          <p className="text-dark-500 text-sm mt-1">Start a training session to appear here</p>
        </div>
      )}
    </div>
  );
}
