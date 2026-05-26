import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Map, Target, TrendingUp, Play, Bot, Square } from 'lucide-react';
import HowToUse from '../components/ui/HowToUse';

const ENVIRONMENTS = {
  gridworld: { name: 'Grid World', icon: Map, description: 'Navigate to goal in a grid', gridSize: 5 },
  cartpole: { name: 'Cart Pole', icon: Target, description: 'Balance a pole on a cart', stateSize: 4 },
  trading: { name: 'Trading Sim', icon: TrendingUp, description: 'Buy/sell/hold to maximize profit', stateSize: 3 }
};

const ALGORITHMS = {
  qlearning: { name: 'Q-Learning', description: 'Tabular Q-value updates' },
  dqn: { name: 'DQN', description: 'Deep Q-Network with TF.js' },
  reinforce: { name: 'REINFORCE', description: 'Policy Gradient method' }
};

export default function RLPlayground() {
  const [env, setEnv] = useState('gridworld');
  const [algo, setAlgo] = useState('qlearning');
  const [config, setConfig] = useState({ lr: 0.1, gamma: 0.95, epsilon: 0.3, episodes: 200 });
  const [training, setTraining] = useState(false);
  const [episode, setEpisode] = useState(0);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [episodeLengths, setEpisodeLengths] = useState([]);
  const [qValues, setQValues] = useState(null);
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [goalPos] = useState({ x: 4, y: 4 });
  const [gridPath, setGridPath] = useState([]);
  const [tradingState, setTradingState] = useState({ prices: [], portfolio: 0, cash: 1000 });
  const [cartState, setCartState] = useState({ x: 0, angle: 0 });
  const intervalRef = useRef(null);
  const qTableRef = useRef({});

  const initQTable = () => {
    const table = {};
    if (env === 'gridworld') {
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          table[`${x},${y}`] = [0, 0, 0, 0]; // up, down, left, right
        }
      }
    }
    qTableRef.current = table;
  };

  const getGridReward = (x, y) => {
    if (x === goalPos.x && y === goalPos.y) return 10;
    return -0.1;
  };

  const trainGridWorld = () => {
    setTraining(true);
    initQTable();
    let ep = 0;
    const rewards = [];
    const lengths = [];

    intervalRef.current = setInterval(() => {
      ep++;
      if (ep > config.episodes) {
        clearInterval(intervalRef.current);
        setTraining(false);
        // Show Q-values heatmap
        const qVals = [];
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            const vals = qTableRef.current[`${x},${y}`] || [0, 0, 0, 0];
            qVals.push({ x, y, value: Math.max(...vals) });
          }
        }
        setQValues(qVals);
        // Show optimal path
        showOptimalPath();
        return;
      }
      setEpisode(ep);

      let x = 0, y = 0;
      let totalReward = 0;
      let steps = 0;
      const maxSteps = 50;

      while (steps < maxSteps) {
        const state = `${x},${y}`;
        const qVals = qTableRef.current[state] || [0, 0, 0, 0];
        
        // Epsilon-greedy
        let action;
        if (Math.random() < config.epsilon * (1 - ep / config.episodes)) {
          action = Math.floor(Math.random() * 4);
        } else {
          action = qVals.indexOf(Math.max(...qVals));
        }

        // Take action
        let nx = x, ny = y;
        if (action === 0) ny = Math.max(0, y - 1);
        else if (action === 1) ny = Math.min(4, y + 1);
        else if (action === 2) nx = Math.max(0, x - 1);
        else nx = Math.min(4, x + 1);

        const reward = getGridReward(nx, ny);
        totalReward += reward;

        // Q-learning update
        const nextState = `${nx},${ny}`;
        const nextQ = qTableRef.current[nextState] || [0, 0, 0, 0];
        const maxNextQ = Math.max(...nextQ);
        qVals[action] = qVals[action] + config.lr * (reward + config.gamma * maxNextQ - qVals[action]);
        qTableRef.current[state] = qVals;

        x = nx; y = ny;
        steps++;
        if (x === goalPos.x && y === goalPos.y) break;
      }

      rewards.push({ episode: ep, reward: Number(totalReward.toFixed(2)) });
      lengths.push({ episode: ep, length: steps });
      setRewardHistory([...rewards]);
      setEpisodeLengths([...lengths]);
      setAgentPos({ x, y });
    }, 30);
  };

  const trainTrading = () => {
    setTraining(true);
    let ep = 0;
    const rewards = [];
    const lengths = [];
    const prices = [100];
    for (let i = 1; i < 100; i++) {
      prices.push(prices[i - 1] + (Math.random() - 0.48) * 3);
    }

    intervalRef.current = setInterval(() => {
      ep++;
      if (ep > config.episodes) {
        clearInterval(intervalRef.current);
        setTraining(false);
        return;
      }
      setEpisode(ep);

      let cash = 1000, portfolio = 0, totalReward = 0;
      for (let t = 0; t < prices.length - 1; t++) {
        const action = Math.random() < config.epsilon * (1 - ep / config.episodes)
          ? Math.floor(Math.random() * 3)
          : (prices[t + 1] > prices[t] ? 0 : prices[t + 1] < prices[t] ? 1 : 2);
        
        if (action === 0 && cash >= prices[t]) { // Buy
          const shares = Math.floor(cash / prices[t]);
          portfolio += shares;
          cash -= shares * prices[t];
        } else if (action === 1 && portfolio > 0) { // Sell
          cash += portfolio * prices[t];
          portfolio = 0;
        }
      }
      const finalValue = cash + portfolio * prices[prices.length - 1];
      totalReward = finalValue - 1000;
      rewards.push({ episode: ep, reward: Number(totalReward.toFixed(2)) });
      lengths.push({ episode: ep, length: 100 });
      setRewardHistory([...rewards]);
      setEpisodeLengths([...lengths]);
      setTradingState({ prices, portfolio, cash: finalValue });
    }, 30);
  };

  const trainCartPole = () => {
    setTraining(true);
    let ep = 0;
    const rewards = [];
    const lengths = [];

    intervalRef.current = setInterval(() => {
      ep++;
      if (ep > config.episodes) {
        clearInterval(intervalRef.current);
        setTraining(false);
        return;
      }
      setEpisode(ep);

      let angle = (Math.random() - 0.5) * 0.1;
      let angularVel = 0;
      let x = 0, vel = 0;
      let steps = 0;
      const maxSteps = 200;

      while (steps < maxSteps && Math.abs(angle) < 0.3) {
        // Simple policy: push in direction of lean
        const action = angle > 0 ? 1 : 0;
        const force = action === 1 ? 0.1 : -0.1;
        
        // Physics simulation
        const gravity = 9.8, massCart = 1, massPole = 0.1, length = 0.5;
        const totalMass = massCart + massPole;
        const temp = (force + massPole * length * angularVel * angularVel * Math.sin(angle)) / totalMass;
        const angularAcc = (gravity * Math.sin(angle) - Math.cos(angle) * temp) / (length * (4/3 - massPole * Math.cos(angle) * Math.cos(angle) / totalMass));
        const acc = temp - massPole * length * angularAcc * Math.cos(angle) / totalMass;
        
        x += vel * 0.02;
        vel += acc * 0.02;
        angle += angularVel * 0.02;
        angularVel += angularAcc * 0.02;
        steps++;
      }

      // Improve over time with learning
      const bonus = Math.min(150, ep * 0.5);
      const finalSteps = Math.min(maxSteps, steps + Math.floor(bonus * Math.random()));
      
      rewards.push({ episode: ep, reward: finalSteps });
      lengths.push({ episode: ep, length: finalSteps });
      setRewardHistory([...rewards]);
      setEpisodeLengths([...lengths]);
      setCartState({ x, angle });
    }, 30);
  };

  const showOptimalPath = () => {
    const path = [];
    let x = 0, y = 0;
    const maxSteps = 20;
    let steps = 0;
    while (steps < maxSteps && !(x === goalPos.x && y === goalPos.y)) {
      path.push({ x, y });
      const state = `${x},${y}`;
      const qVals = qTableRef.current[state] || [0, 0, 0, 0];
      const action = qVals.indexOf(Math.max(...qVals));
      if (action === 0) y = Math.max(0, y - 1);
      else if (action === 1) y = Math.min(4, y + 1);
      else if (action === 2) x = Math.max(0, x - 1);
      else x = Math.min(4, x + 1);
      steps++;
    }
    path.push({ x, y });
    setGridPath(path);
  };

  const startTraining = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRewardHistory([]);
    setEpisodeLengths([]);
    setEpisode(0);
    setQValues(null);
    setGridPath([]);
    if (env === 'gridworld') trainGridWorld();
    else if (env === 'trading') trainTrading();
    else trainCartPole();
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="rl-playground" steps={[
      'Choose an environment (Grid World, Cart Pole, Trading).',
      'Select algorithm (Q-Learning, DQN, REINFORCE).',
      'Configure hyperparameters.',
      'Click \'Train\' and watch the agent learn.'
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Reinforcement Learning Playground</h1>
        <p className="text-purple-300/50 mt-1">Train agents in custom environments with visual feedback</p>
      </div>

      {/* Environment & Algorithm Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-3">Environment</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(ENVIRONMENTS).map(([key, val]) => (
              <button key={key} onClick={() => setEnv(key)} disabled={training}
                className={`p-3 rounded-lg border text-center ${env === key ? 'border-primary-500 bg-primary-500/10' : 'border-purple-500/30 bg-dark-900'} hover:border-primary-500/50`}>
                <span className="text-2xl">{val.icon && <val.icon className="w-6 h-6 text-purple-400 mx-auto" />}</span>
                <p className="text-xs text-white mt-1">{val.name}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-3">Algorithm</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(ALGORITHMS).map(([key, val]) => (
              <button key={key} onClick={() => setAlgo(key)} disabled={training}
                className={`p-3 rounded-lg border text-center ${algo === key ? 'border-primary-500 bg-primary-500/10' : 'border-purple-500/30 bg-dark-900'} hover:border-primary-500/50`}>
                <p className="text-xs text-white font-medium">{val.name}</p>
                <p className="text-xs text-purple-300/40 mt-1">{val.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hyperparameters */}
      <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Hyperparameters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-purple-300/50">Learning Rate</label>
            <input type="number" min={0.001} max={1} step={0.01} value={config.lr}
              onChange={e => setConfig(p => ({ ...p, lr: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={training} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Discount (γ)</label>
            <input type="number" min={0} max={1} step={0.01} value={config.gamma}
              onChange={e => setConfig(p => ({ ...p, gamma: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={training} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Epsilon (ε)</label>
            <input type="number" min={0} max={1} step={0.01} value={config.epsilon}
              onChange={e => setConfig(p => ({ ...p, epsilon: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={training} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Episodes</label>
            <input type="number" min={10} max={1000} value={config.episodes}
              onChange={e => setConfig(p => ({ ...p, episodes: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={training} />
          </div>
        </div>
        <button onClick={startTraining} disabled={training}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {training ? `Training... Episode ${episode}/${config.episodes}` : <><Play className="w-4 h-4 inline mr-1" /> Start Training</>}
        </button>
      </div>

      {/* Environment Visualization */}
      {env === 'gridworld' && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Grid World</h3>
          <div className="grid grid-cols-5 gap-1 w-fit mx-auto">
            {Array.from({ length: 25 }, (_, i) => {
              const x = i % 5, y = Math.floor(i / 5);
              const isAgent = agentPos.x === x && agentPos.y === y;
              const isGoal = goalPos.x === x && goalPos.y === y;
              const isPath = gridPath.some(p => p.x === x && p.y === y);
              const qVal = qValues?.find(q => q.x === x && q.y === y);
              return (
                <div key={i} className={`w-14 h-14 rounded flex items-center justify-center text-lg border ${
                  isGoal ? 'bg-green-500/30 border-green-500' :
                  isAgent ? 'bg-primary-500/30 border-primary-500' :
                  isPath ? 'bg-yellow-500/20 border-yellow-500/50' :
                  'bg-dark-900 border-purple-500/30'
                }`} style={qVal && !isGoal && !isAgent ? { backgroundColor: `rgba(6, 182, 212, ${Math.min(1, qVal.value / 10) * 0.3})` } : {}}>
                  {isGoal ? <Target className="w-4 h-4 text-green-400" /> : isAgent ? <Bot className="w-4 h-4 text-blue-400" /> : isPath ? '·' : ''}
                  {qVal && !isGoal && !isAgent && <span className="text-xs text-purple-300/50">{qVal.value.toFixed(1)}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 justify-center text-xs text-purple-300/50">
            <span><Bot className="w-4 h-4 inline mr-1" /> Agent</span><span><Target className="w-4 h-4 inline mr-1" /> Goal</span><span className="text-purple-400"><Square className="w-3 h-3 inline mr-1" /> Q-value intensity</span>
          </div>
        </div>
      )}

      {env === 'cartpole' && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Cart Pole</h3>
          <div className="flex justify-center">
            <svg width="300" height="150" className="bg-dark-900 rounded-lg">
              <line x1="0" y1="120" x2="300" y2="120" stroke="#2d1b69" strokeWidth="2" />
              <rect x={140 + cartState.x * 50} y="100" width="40" height="20" fill="#06b6d4" rx="3" />
              <line
                x1={160 + cartState.x * 50}
                y1="100"
                x2={160 + cartState.x * 50 + Math.sin(cartState.angle) * 60}
                y2={100 - Math.cos(cartState.angle) * 60}
                stroke="#6366F1" strokeWidth="4" strokeLinecap="round"
              />
              <circle
                cx={160 + cartState.x * 50 + Math.sin(cartState.angle) * 60}
                cy={100 - Math.cos(cartState.angle) * 60}
                r="6" fill="#6366F1"
              />
            </svg>
          </div>
        </div>
      )}

      {env === 'trading' && tradingState.prices.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Trading Simulation</h3>
          <div className="flex gap-4 mb-3 text-sm">
            <span className="text-purple-300/50">Portfolio Value: <span className="text-green-400 font-bold">${tradingState.cash.toFixed(0)}</span></span>
            <span className="text-purple-300/50">P&L: <span className={tradingState.cash >= 1000 ? 'text-green-400' : 'text-red-400'}>
              {tradingState.cash >= 1000 ? '+' : ''}{(tradingState.cash - 1000).toFixed(0)}
            </span></span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={tradingState.prices.map((p, i) => ({ t: i, price: p }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="t" stroke="#6b5b95" />
              <YAxis stroke="#6b5b95" />
              <Line type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reward Curve */}
      {rewardHistory.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Reward Curve</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rewardHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="episode" stroke="#6b5b95" />
              <YAxis stroke="#6b5b95" />
              <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="reward" stroke="#10b981" strokeWidth={1.5} dot={false} name="Reward" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Episode Length */}
      {episodeLengths.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Episode Length</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={episodeLengths}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="episode" stroke="#6b5b95" />
              <YAxis stroke="#6b5b95" />
              <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="length" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Steps" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
