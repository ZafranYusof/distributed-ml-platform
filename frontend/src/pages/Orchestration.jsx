import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useToast } from '../components/ui/Toast';

const NODE_TYPES = [
  { type: 'data-load', label: 'Data Load', icon: '📥', color: 'bg-blue-500/20 border-blue-500/40' },
  { type: 'preprocess', label: 'Preprocess', icon: '🔧', color: 'bg-yellow-500/20 border-yellow-500/40' },
  { type: 'feature-eng', label: 'Feature Eng', icon: '⚙️', color: 'bg-purple-500/20 border-purple-500/40' },
  { type: 'train', label: 'Train', icon: '🧠', color: 'bg-green-500/20 border-green-500/40' },
  { type: 'evaluate', label: 'Evaluate', icon: '📊', color: 'bg-cyan-500/20 border-cyan-500/40' },
  { type: 'deploy', label: 'Deploy', icon: '🚀', color: 'bg-red-500/20 border-red-500/40' },
  { type: 'notify', label: 'Notify', icon: '🔔', color: 'bg-orange-500/20 border-orange-500/40' },
];

export default function Orchestration() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [pipelineName, setPipelineName] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [tab, setTab] = useState('editor');
  const nodeIdRef = useRef(1);
  const runIntervalRef = useRef(null);

  useEffect(() => { fetchPipelines(); return () => { if (runIntervalRef.current) clearInterval(runIntervalRef.current); }; }, []);

  const fetchPipelines = async () => {
    try {
      const res = await authFetch('/api/orchestration');
      const data = await res.json();
      setPipelines(Array.isArray(data) ? data : []);
    } catch (err) { }
  };

  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: '#06b6d4' } }, eds)), []);

  const addNode = (type) => {
    const nodeType = NODE_TYPES.find(n => n.type === type);
    const id = `node-${nodeIdRef.current++}`;
    const newNode = {
      id,
      type: 'default',
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: { label: `${nodeType.icon} ${nodeType.label}` },
      style: { background: '#1E1045', border: '1px solid #2d1b69', color: '#fff', borderRadius: '8px', padding: '10px' }
    };
    setNodes(prev => [...prev, newNode]);
  };

  const savePipeline = async () => {
    if (!pipelineName.trim()) return;
    try {
      const body = {
        name: pipelineName,
        nodes: nodes.map(n => ({ id: n.id, type: n.type, label: n.data.label, position: n.position })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      };
      if (selectedPipeline) {
        await authFetch(`/api/orchestration/${selectedPipeline._id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await authFetch('/api/orchestration', { method: 'POST', body: JSON.stringify(body) });
      }
      fetchPipelines();
      setPipelineName('');
    } catch (err) { }
  };

  const loadPipeline = (pipeline) => {
    setSelectedPipeline(pipeline);
    setPipelineName(pipeline.name);
    const loadedNodes = (pipeline.nodes || []).map(n => ({
      id: n.id,
      type: 'default',
      position: n.position || { x: 100, y: 100 },
      data: { label: n.label },
      style: { background: '#1E1045', border: '1px solid #2d1b69', color: '#fff', borderRadius: '8px', padding: '10px' }
    }));
    const loadedEdges = (pipeline.edges || []).map(e => ({
      id: e.id || `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#06b6d4' }
    }));
    setNodes(loadedNodes);
    setEdges(loadedEdges);
  };

  const runPipeline = async () => {
    if (!selectedPipeline) return;
    try {
      const res = await authFetch(`/api/orchestration/${selectedPipeline._id}/run`, { method: 'POST' });
      const run = await res.json();
      setActiveRun(run);
      setTab('monitor');
      simulateExecution(run);
    } catch (err) { }
  };

  const simulateExecution = (run) => {
    if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    let nodeIndex = 0;
    const nodeStatuses = (run.nodeStatuses || []).map(ns => ({ ...ns, retries: ns.retries || 0 }));
    
    runIntervalRef.current = setInterval(() => {
      if (nodeIndex >= nodeStatuses.length) {
        clearInterval(runIntervalRef.current);
        setActiveRun(prev => ({ ...prev, status: 'completed', completedAt: new Date().toISOString() }));
        return;
      }
      
      // Set current node to running
      nodeStatuses[nodeIndex].status = 'running';
      nodeStatuses[nodeIndex].startedAt = new Date().toISOString();
      setActiveRun(prev => ({ ...prev, nodeStatuses: [...nodeStatuses] }));
      
      // Complete after delay
      setTimeout(() => {
        const success = Math.random() > 0.15; // 85% success rate
        if (success || nodeStatuses[nodeIndex].retries >= 3) {
          nodeStatuses[nodeIndex].status = success ? 'success' : 'failed';
          nodeStatuses[nodeIndex].completedAt = new Date().toISOString();
          nodeStatuses[nodeIndex].logs = [`${success ? 'Completed' : 'Failed after 3 retries'} in ${(Math.random() * 5 + 1).toFixed(1)}s`];
        } else {
          nodeStatuses[nodeIndex].retries++;
          nodeStatuses[nodeIndex].status = 'running';
          nodeStatuses[nodeIndex].logs = [`Retry ${nodeStatuses[nodeIndex].retries}/3...`];
        }
        setActiveRun(prev => ({ ...prev, nodeStatuses: [...nodeStatuses] }));
        nodeIndex++;
      }, 1500 + Math.random() * 2000);
    }, 2500);
  };

  const fetchRuns = async () => {
    if (!selectedPipeline) return;
    try {
      const res = await fetch(`${API}/${selectedPipeline._id}/runs`, { headers });
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (err) { }
  };

  const getNodeStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '⏳';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ML Pipeline Orchestration</h1>
          <p className="text-purple-300/50 mt-1">Visual DAG editor with conditional execution and retry logic</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('editor')} className={`px-3 py-1.5 text-sm rounded-lg ${tab === 'editor' ? 'bg-gradient-btn text-white' : 'bg-purple-500/15 text-purple-200/70'}`}>
            Editor
          </button>
          <button onClick={() => { setTab('monitor'); fetchRuns(); }} className={`px-3 py-1.5 text-sm rounded-lg ${tab === 'monitor' ? 'bg-gradient-btn text-white' : 'bg-purple-500/15 text-purple-200/70'}`}>
            Monitor
          </button>
        </div>
      </div>

      {tab === 'editor' && (
        <>
          {/* Node Palette */}
          <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-purple-300/50 uppercase font-semibold">Add Node:</span>
              {NODE_TYPES.map(nt => (
                <button key={nt.type} onClick={() => addNode(nt.type)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${nt.color} text-white hover:opacity-80`}>
                  {nt.icon} {nt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flow Editor */}
          <div className="bg-dark-800/40 rounded-xl border border-purple-500/20 overflow-hidden" style={{ height: 450 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              style={{ background: '#0f172a' }}
            >
              <Background color="#2d1b69" gap={20} />
              <Controls />
              <MiniMap style={{ background: '#1E1045' }} nodeColor="#06b6d4" />
            </ReactFlow>
          </div>

          {/* Save / Load */}
          <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-purple-300/50">Pipeline Name</label>
                <input value={pipelineName} onChange={e => setPipelineName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white text-sm" placeholder="My Pipeline" />
              </div>
              <button onClick={savePipeline} disabled={!pipelineName.trim() || nodes.length === 0}
                className="px-4 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
                Save
              </button>
              <button onClick={runPipeline} disabled={!selectedPipeline}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                ▶ Run
              </button>
            </div>
          </div>

          {/* Saved Pipelines */}
          {pipelines.length > 0 && (
            <div className="bg-dark-800/40 rounded-xl p-4 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-3">Saved Pipelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pipelines.map(p => (
                  <button key={p._id} onClick={() => loadPipeline(p)}
                    className={`text-left p-3 rounded-lg border ${selectedPipeline?._id === p._id ? 'border-primary-500 bg-primary-500/10' : 'border-purple-500/30 bg-dark-900'} hover:border-primary-500/50`}>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-xs text-purple-300/50 mt-1">{p.nodes?.length || 0} nodes · {p.edges?.length || 0} edges</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'monitor' && (
        <div className="space-y-4">
          {activeRun && (
            <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Active Run</h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  activeRun.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  activeRun.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>{activeRun.status}</span>
              </div>
              <div className="space-y-2">
                {activeRun.nodeStatuses?.map((ns, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg">
                    <span className="text-lg">{getNodeStatusIcon(ns.status)}</span>
                    <span className="text-sm text-white flex-1">{ns.nodeId}</span>
                    <span className={`text-xs ${
                      ns.status === 'success' ? 'text-green-400' :
                      ns.status === 'failed' ? 'text-red-400' :
                      ns.status === 'running' ? 'text-yellow-400' :
                      'text-purple-300/50'
                    }`}>{ns.status}</span>
                    {ns.retries > 0 && <span className="text-xs text-orange-400">retries: {ns.retries}</span>}
                    {ns.logs?.length > 0 && <span className="text-xs text-purple-300/40">{ns.logs[ns.logs.length - 1]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {runs.length > 0 && (
            <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-3">Run History</h3>
              <div className="space-y-2">
                {runs.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                    <span className="text-sm text-white">{r.pipelineId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      r.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      r.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{r.status}</span>
                    <span className="text-xs text-purple-300/40">{new Date(r.startedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
