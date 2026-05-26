import { useState, useRef, useCallback, useEffect } from 'react';

export default function GPUCluster() {
  const [clusterConfig, setClusterConfig] = useState({ machines: 4, workersPerMachine: 2 });
  const [cluster, setCluster] = useState(null);
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(20);
  const [checkpoints, setCheckpoints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const workersRef = useRef([]);
  const intervalRef = useRef(null);

  const initCluster = () => {
    const machines = [];
    for (let i = 0; i < clusterConfig.machines; i++) {
      const workers = [];
      for (let j = 0; j < clusterConfig.workersPerMachine; j++) {
        workers.push({ id: `m${i}-w${j}`, status: 'active', progress: 0, assignedWork: null });
      }
      machines.push({ id: `machine-${i}`, status: 'active', workers });
    }
    setCluster(machines);
    setLogs([`[${new Date().toLocaleTimeString()}] Cluster initialized: ${clusterConfig.machines} machines, ${clusterConfig.workersPerMachine} workers each`]);
    setEpoch(0);
    setCheckpoints([]);
    setMetrics([]);
  };

  const startTraining = () => {
    if (!cluster) return;
    setTraining(true);
    setEpoch(0);
    setMetrics([]);
    addLog('Training started');
    runTrainingLoop();
  };

  const runTrainingLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let currentEpoch = 0;
    intervalRef.current = setInterval(() => {
      currentEpoch++;
      if (currentEpoch > totalEpochs) {
        clearInterval(intervalRef.current);
        setTraining(false);
        addLog('Training completed!');
        return;
      }
      setEpoch(currentEpoch);
      
      // Update worker progress
      setCluster(prev => {
        if (!prev) return prev;
        return prev.map(machine => ({
          ...machine,
          workers: machine.workers.map(w => ({
            ...w,
            progress: w.status === 'active' ? Math.min(100, (currentEpoch / totalEpochs) * 100) : w.progress
          }))
        }));
      });

      // Generate metrics
      const loss = Math.max(0.01, 2.0 * Math.exp(-currentEpoch * 0.15) + (Math.random() - 0.5) * 0.1);
      const accuracy = Math.min(0.99, 1 - loss / 2 + (Math.random() - 0.5) * 0.05);
      setMetrics(prev => [...prev, { epoch: currentEpoch, loss: Number(loss.toFixed(4)), accuracy: Number(accuracy.toFixed(4)) }]);

      // Checkpoint every 5 epochs
      if (currentEpoch % 5 === 0) {
        setCheckpoints(prev => [...prev, { epoch: currentEpoch, timestamp: new Date().toISOString(), loss: Number(loss.toFixed(4)) }]);
        addLog(`Checkpoint saved at epoch ${currentEpoch}`);
      }
    }, 800);
  };

  const killRandomWorker = () => {
    if (!cluster || !training) return;
    const activeWorkers = [];
    cluster.forEach((m, mi) => m.workers.forEach((w, wi) => {
      if (w.status === 'active') activeWorkers.push({ mi, wi, id: w.id });
    }));
    if (activeWorkers.length === 0) return;
    const target = activeWorkers[Math.floor(Math.random() * activeWorkers.length)];
    setCluster(prev => {
      const updated = [...prev];
      updated[target.mi] = {
        ...updated[target.mi],
        workers: updated[target.mi].workers.map((w, i) =>
          i === target.wi ? { ...w, status: 'failed' } : w
        )
      };
      return updated;
    });
    addLog(`⚠️ Worker ${target.id} FAILED! Auto-recovering...`);
    
    // Auto-recover after 2 seconds
    setTimeout(() => {
      setCluster(prev => {
        if (!prev) return prev;
        const updated = [...prev];
        updated[target.mi] = {
          ...updated[target.mi],
          workers: updated[target.mi].workers.map((w, i) =>
            i === target.wi ? { ...w, status: 'recovering' } : w
          )
        };
        return updated;
      });
      setTimeout(() => {
        setCluster(prev => {
          if (!prev) return prev;
          const updated = [...prev];
          updated[target.mi] = {
            ...updated[target.mi],
            workers: updated[target.mi].workers.map((w, i) =>
              i === target.wi ? { ...w, status: 'active' } : w
            )
          };
          return updated;
        });
        addLog(`✅ Worker ${target.id} recovered`);
      }, 1500);
    }, 2000);
  };

  const addNode = () => {
    if (!cluster) return;
    const newId = cluster.length;
    const workers = [];
    for (let j = 0; j < clusterConfig.workersPerMachine; j++) {
      workers.push({ id: `m${newId}-w${j}`, status: 'active', progress: 0, assignedWork: null });
    }
    setCluster(prev => [...prev, { id: `machine-${newId}`, status: 'active', workers }]);
    addLog(`➕ Added machine-${newId} with ${clusterConfig.workersPerMachine} workers`);
  };

  const removeNode = () => {
    if (!cluster || cluster.length <= 1) return;
    const removed = cluster[cluster.length - 1];
    setCluster(prev => prev.slice(0, -1));
    addLog(`➖ Removed ${removed.id}`);
  };

  const resumeFromCheckpoint = () => {
    if (checkpoints.length === 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const cp = checkpoints[checkpoints.length - 1];
    setEpoch(cp.epoch);
    addLog(`🔄 Resumed from checkpoint at epoch ${cp.epoch}`);
    setTraining(true);
    let currentEpoch = cp.epoch;
    intervalRef.current = setInterval(() => {
      currentEpoch++;
      if (currentEpoch > totalEpochs) {
        clearInterval(intervalRef.current);
        setTraining(false);
        addLog('Training completed!');
        return;
      }
      setEpoch(currentEpoch);
      setCluster(prev => prev?.map(machine => ({
        ...machine,
        workers: machine.workers.map(w => ({
          ...w,
          progress: w.status === 'active' ? Math.min(100, (currentEpoch / totalEpochs) * 100) : w.progress
        }))
      })));
      const loss = Math.max(0.01, 2.0 * Math.exp(-currentEpoch * 0.15) + (Math.random() - 0.5) * 0.1);
      const accuracy = Math.min(0.99, 1 - loss / 2 + (Math.random() - 0.5) * 0.05);
      setMetrics(prev => [...prev, { epoch: currentEpoch, loss: Number(loss.toFixed(4)), accuracy: Number(accuracy.toFixed(4)) }]);
      if (currentEpoch % 5 === 0) {
        setCheckpoints(prev => [...prev, { epoch: currentEpoch, timestamp: new Date().toISOString(), loss: Number(loss.toFixed(4)) }]);
        addLog(`Checkpoint saved at epoch ${currentEpoch}`);
      }
    }, 800);
  };

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'recovering': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-dark-600';
    }
  };

  const totalWorkers = cluster ? cluster.reduce((sum, m) => sum + m.workers.length, 0) : 0;
  const activeWorkers = cluster ? cluster.reduce((sum, m) => sum + m.workers.filter(w => w.status === 'active').length, 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">GPU Cluster Simulation</h1>
        <p className="text-dark-400 mt-1">Simulate distributed training with fault tolerance and elastic scaling</p>
      </div>

      {/* Config */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Cluster Configuration</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-dark-400">Machines</label>
            <input type="number" min={1} max={12} value={clusterConfig.machines}
              onChange={e => setClusterConfig(p => ({ ...p, machines: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white" disabled={training} />
          </div>
          <div>
            <label className="text-xs text-dark-400">Workers/Machine</label>
            <input type="number" min={1} max={8} value={clusterConfig.workersPerMachine}
              onChange={e => setClusterConfig(p => ({ ...p, workersPerMachine: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white" disabled={training} />
          </div>
          <div>
            <label className="text-xs text-dark-400">Total Epochs</label>
            <input type="number" min={5} max={100} value={totalEpochs}
              onChange={e => setTotalEpochs(+e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white" disabled={training} />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={initCluster} disabled={training} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
            Initialize Cluster
          </button>
          <button onClick={startTraining} disabled={!cluster || training} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            Start Training
          </button>
          <button onClick={resumeFromCheckpoint} disabled={!checkpoints.length || training} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
            Resume Checkpoint
          </button>
        </div>
      </div>

      {/* Controls */}
      {cluster && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={killRandomWorker} disabled={!training} className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 border border-red-500/30 disabled:opacity-50">
            💀 Kill Random Worker
          </button>
          <button onClick={addNode} className="px-3 py-1.5 text-sm bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 border border-green-500/30">
            ➕ Add Node
          </button>
          <button onClick={removeNode} disabled={cluster.length <= 1} className="px-3 py-1.5 text-sm bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 border border-yellow-500/30 disabled:opacity-50">
            ➖ Remove Node
          </button>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-dark-400">Epoch: <span className="text-white font-mono">{epoch}/{totalEpochs}</span></span>
            <span className="text-dark-400">Workers: <span className="text-green-400">{activeWorkers}</span>/<span className="text-white">{totalWorkers}</span></span>
          </div>
        </div>
      )}

      {/* Cluster Map */}
      {cluster && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Cluster Map</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cluster.map(machine => (
              <div key={machine.id} className="bg-dark-900 rounded-lg p-4 border border-dark-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🖥️</span>
                  <span className="text-sm text-white font-medium">{machine.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {machine.workers.map(worker => (
                    <div key={worker.id} className="flex items-center gap-2 p-2 bg-dark-800 rounded">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(worker.status)}`}></div>
                      <span className="text-xs text-dark-300">{worker.id.split('-')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-dark-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Failed</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Recovering</span>
          </div>
        </div>
      )}

      {/* Metrics & Checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.length > 0 && (
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Training Metrics</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {metrics.slice(-10).map((m, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-dark-700">
                  <span className="text-dark-400">Epoch {m.epoch}</span>
                  <span className="text-red-400">Loss: {m.loss}</span>
                  <span className="text-green-400">Acc: {(m.accuracy * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkpoints.length > 0 && (
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Checkpoints</h3>
            <div className="space-y-2">
              {checkpoints.map((cp, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-2 px-3 bg-dark-900 rounded-lg">
                  <span className="text-white">Epoch {cp.epoch}</span>
                  <span className="text-dark-400">Loss: {cp.loss}</span>
                  <span className="text-xs text-dark-500">{new Date(cp.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-sm font-semibold text-dark-300 uppercase mb-4">Logs</h3>
          <div className="bg-dark-900 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-dark-300">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
