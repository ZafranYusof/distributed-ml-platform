import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield } from 'lucide-react';
import HowToUse from '../components/ui/HowToUse';

export default function Federated() {
  const { user } = useAuth();
  const [numClients, setNumClients] = useState(4);
  const [rounds, setRounds] = useState(10);
  const [localEpochs, setLocalEpochs] = useState(3);
  const [diffPrivacy, setDiffPrivacy] = useState(false);
  const [noiseScale, setNoiseScale] = useState(0.1);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const runFederated = () => {
    setRunning(true);
    setProgress(0);
    setResults(null);

    // Simulate federated learning
    const clientData = Array.from({ length: numClients }, (_, clientIdx) => {
      // Each client has a private data partition (simulated)
      const numSamples = 50 + Math.floor(Math.random() * 50);
      const bias = (clientIdx / numClients) * 0.3; // Non-IID: each client has slightly different distribution
      return Array.from({ length: numSamples }, () => ({
        x: Math.random() + bias,
        y: Math.random() > 0.5 + bias * 0.2 ? 1 : 0
      }));
    });

    // Simulate training rounds
    let globalWeights = [Math.random() * 0.1, Math.random() * 0.1]; // Simple 2-weight model
    const roundResults = [];
    const clientMetrics = Array.from({ length: numClients }, () => []);

    const simulateRound = (round) => {
      if (round >= rounds) {
        setResults({ roundResults, clientMetrics, numClients, rounds });
        setRunning(false);
        return;
      }

      setProgress(((round + 1) / rounds) * 100);

      // Each client trains locally
      const clientUpdates = clientData.map((data, clientIdx) => {
        let localWeights = [...globalWeights];

        // Simulate local SGD
        for (let epoch = 0; epoch < localEpochs; epoch++) {
          for (const sample of data) {
            const pred = 1 / (1 + Math.exp(-(localWeights[0] * sample.x + localWeights[1])));
            const error = sample.y - pred;
            const lr = 0.01;
            localWeights[0] += lr * error * sample.x;
            localWeights[1] += lr * error;
          }
        }

        // Add differential privacy noise
        if (diffPrivacy) {
          localWeights = localWeights.map(w => w + (Math.random() - 0.5) * noiseScale * 2);
        }

        // Calculate local accuracy
        let correct = 0;
        for (const sample of data) {
          const pred = 1 / (1 + Math.exp(-(localWeights[0] * sample.x + localWeights[1])));
          if ((pred >= 0.5 ? 1 : 0) === sample.y) correct++;
        }
        const accuracy = correct / data.length;
        clientMetrics[clientIdx].push({ round: round + 1, accuracy: parseFloat((accuracy * 100).toFixed(1)) });

        // Return gradient (difference from global)
        return localWeights.map((w, i) => w - globalWeights[i]);
      });

      // FedAvg: average the updates
      const avgUpdate = globalWeights.map((_, i) => {
        const sum = clientUpdates.reduce((s, update) => s + update[i], 0);
        return sum / numClients;
      });

      globalWeights = globalWeights.map((w, i) => w + avgUpdate[i]);

      // Calculate global accuracy (on all data combined)
      let totalCorrect = 0;
      let totalSamples = 0;
      for (const data of clientData) {
        for (const sample of data) {
          const pred = 1 / (1 + Math.exp(-(globalWeights[0] * sample.x + globalWeights[1])));
          if ((pred >= 0.5 ? 1 : 0) === sample.y) totalCorrect++;
          totalSamples++;
        }
      }
      const globalAccuracy = totalCorrect / totalSamples;

      roundResults.push({
        round: round + 1,
        globalAccuracy: parseFloat((globalAccuracy * 100).toFixed(1)),
        avgClientAccuracy: parseFloat((clientMetrics.reduce((s, cm) => s + cm[cm.length - 1].accuracy, 0) / numClients).toFixed(1))
      });

      timeoutRef.current = setTimeout(() => simulateRound(round + 1), 100);
    };

    simulateRound(0);
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to use Federated Learning</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="federated" steps={[
      'Configure number of clients (2-10).',
      'Set privacy options (differential privacy).',
      'Click \'Start\' to begin federated training.',
      'Watch per-client metrics and global convergence.'
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Federated Learning</h1>
        <p className="text-purple-300/50 mt-1">Simulate privacy-preserving distributed training with FedAvg aggregation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-purple-300/50 text-sm">Number of Clients</label>
              <input type="range" min={2} max={10} value={numClients} onChange={e => setNumClients(parseInt(e.target.value))}
                className="w-full mt-1 accent-cyan-500" />
              <span className="text-dark-200 text-sm">{numClients} clients</span>
            </div>
            <div>
              <label className="text-purple-300/50 text-sm">Communication Rounds</label>
              <input type="range" min={5} max={30} value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                className="w-full mt-1 accent-cyan-500" />
              <span className="text-dark-200 text-sm">{rounds} rounds</span>
            </div>
            <div>
              <label className="text-purple-300/50 text-sm">Local Epochs per Round</label>
              <input type="range" min={1} max={10} value={localEpochs} onChange={e => setLocalEpochs(parseInt(e.target.value))}
                className="w-full mt-1 accent-cyan-500" />
              <span className="text-dark-200 text-sm">{localEpochs} epochs</span>
            </div>
            <div className="border-t border-purple-500/20 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={diffPrivacy} onChange={e => setDiffPrivacy(e.target.checked)} className="accent-cyan-500" />
                <span className="text-dark-200 text-sm">Differential Privacy</span>
              </label>
              {diffPrivacy && (
                <div className="mt-3">
                  <label className="text-purple-300/50 text-xs">Noise Scale (ε)</label>
                  <input type="range" min={0.01} max={1} step={0.01} value={noiseScale} onChange={e => setNoiseScale(parseFloat(e.target.value))}
                    className="w-full mt-1 accent-cyan-500" />
                  <span className="text-dark-200 text-xs">{noiseScale.toFixed(2)}</span>
                </div>
              )}
            </div>
            <button onClick={runFederated} disabled={running}
              className="w-full px-4 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {running ? `Training... ${progress.toFixed(0)}%` : 'Start Federated Training'}
            </button>
          </div>

          {/* Client visualization */}
          <div className="mt-6">
            <p className="text-purple-300/50 text-xs mb-2">Clients:</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: numClients }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${running ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-purple-500/15 text-purple-300/50'}`}>
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {running && (
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full"></div>
                <span className="text-dark-200">Training in progress... Round {Math.ceil(progress / 100 * rounds)}/{rounds}</span>
              </div>
              <div className="mt-3 w-full bg-purple-500/15 rounded-full h-2">
                <div className="bg-gradient-btn h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {results && (
            <>
              {/* Global convergence */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Global Model Convergence</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={results.roundResults}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis dataKey="round" stroke="#6b5b95" />
                    <YAxis stroke="#6b5b95" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                    <Legend />
                    <Line type="monotone" dataKey="globalAccuracy" name="Global Accuracy" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="avgClientAccuracy" name="Avg Client Accuracy" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Per-client metrics */}
              <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Per-Client Accuracy</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis dataKey="round" stroke="#6b5b95" type="number" domain={[1, results.rounds]} />
                    <YAxis stroke="#6b5b95" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69' }} />
                    <Legend />
                    {results.clientMetrics.map((metrics, i) => (
                      <Line key={i} data={metrics} type="monotone" dataKey="accuracy" name={`Client ${i + 1}`}
                        stroke={['#06b6d4', '#6366F1', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'][i]}
                        strokeWidth={1.5} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-purple-300/50 text-xs">Final Global Acc</p>
                  <p className="text-2xl font-bold text-purple-400">{results.roundResults[results.roundResults.length - 1].globalAccuracy}%</p>
                </div>
                <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-purple-300/50 text-xs">Clients</p>
                  <p className="text-2xl font-bold text-dark-200">{results.numClients}</p>
                </div>
                <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-purple-300/50 text-xs">Rounds</p>
                  <p className="text-2xl font-bold text-dark-200">{results.rounds}</p>
                </div>
                <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-purple-300/50 text-xs">Privacy</p>
                  <p className="text-lg font-bold text-dark-200">{diffPrivacy ? `ε=${noiseScale}` : 'Off'}</p>
                </div>
              </div>
            </>
          )}

          {!results && !running && (
            <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-6 flex items-center justify-center h-64">
              <div className="text-center text-purple-300/50">
                <Shield className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                <p>Configure and start federated training to see results</p>
                <p className="text-xs mt-2">Each client trains locally, only gradients are shared</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
