import { useState, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeStyles = {
  'data-source': { bg: 'bg-blue-500/20', border: 'border-blue-500/40', icon: '📁', color: '#3b82f6' },
  'preprocessing': { bg: 'bg-purple-500/20', border: 'border-purple-500/40', icon: '🔧', color: '#a855f7' },
  'model': { bg: 'bg-primary-500/20', border: 'border-primary-500/40', icon: '🧠', color: '#06b6d4' },
  'training': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', icon: '🚀', color: '#eab308' },
  'evaluation': { bg: 'bg-green-500/20', border: 'border-green-500/40', icon: '📊', color: '#22c55e' },
  'export': { bg: 'bg-orange-500/20', border: 'border-orange-500/40', icon: '💾', color: '#f97316' },
};

function PipelineNode({ data }) {
  const style = nodeStyles[data.nodeType] || nodeStyles['model'];
  return (
    <div className={`px-4 py-3 rounded-lg border ${style.bg} ${style.border} min-w-[160px]`}>
      <Handle type="target" position={Position.Left} className="!bg-dark-400 !w-3 !h-3 !border-2 !border-dark-600" />
      <div className="flex items-center gap-2">
        <span className="text-lg">{style.icon}</span>
        <div>
          <p className="text-sm font-medium text-dark-100">{data.label}</p>
          <p className="text-xs text-dark-400">{data.description || data.nodeType}</p>
        </div>
      </div>
      {data.config && (
        <div className="mt-2 text-xs text-dark-500 border-t border-dark-600 pt-2">
          {Object.entries(data.config).slice(0, 3).map(([k, v]) => (
            <div key={k}>{k}: {String(v)}</div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-primary-400 !w-3 !h-3 !border-2 !border-primary-600" />
    </div>
  );
}

const nodeTypes = { pipelineNode: PipelineNode };

const defaultNodes = [
  {
    id: '1',
    type: 'pipelineNode',
    position: { x: 50, y: 150 },
    data: { label: 'Dataset', nodeType: 'data-source', description: 'CSV Upload', config: { format: 'csv' } }
  },
  {
    id: '2',
    type: 'pipelineNode',
    position: { x: 300, y: 150 },
    data: { label: 'Normalize', nodeType: 'preprocessing', description: 'Min-Max Scaling', config: { method: 'min-max' } }
  },
  {
    id: '3',
    type: 'pipelineNode',
    position: { x: 550, y: 150 },
    data: { label: 'Neural Network', nodeType: 'model', description: 'MLP [64, 32]', config: { layers: '64, 32', activation: 'relu' } }
  },
  {
    id: '4',
    type: 'pipelineNode',
    position: { x: 800, y: 150 },
    data: { label: 'Train', nodeType: 'training', description: '50 epochs', config: { epochs: 50, lr: 0.01 } }
  },
  {
    id: '5',
    type: 'pipelineNode',
    position: { x: 1050, y: 100 },
    data: { label: 'Evaluate', nodeType: 'evaluation', description: 'Test metrics', config: { split: '80/20' } }
  },
  {
    id: '6',
    type: 'pipelineNode',
    position: { x: 1050, y: 220 },
    data: { label: 'Export', nodeType: 'export', description: 'Save model', config: { format: 'json' } }
  }
];

const defaultEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#06b6d4' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#06b6d4' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#06b6d4' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#06b6d4' } },
  { id: 'e4-6', source: '4', target: '6', animated: true, style: { stroke: '#06b6d4' } },
];

export default function PipelineBuilder() {
  const [nodes, setNodes] = useState(defaultNodes);
  const [edges, setEdges] = useState(defaultEdges);
  const [executing, setExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#06b6d4' } }, eds)), []);

  const addNode = (type) => {
    const configs = {
      'data-source': { label: 'Data Source', description: 'CSV Upload', config: { format: 'csv' } },
      'preprocessing': { label: 'Preprocess', description: 'Data transform', config: { method: 'min-max' } },
      'model': { label: 'Model', description: 'Neural Network', config: { layers: '64, 32' } },
      'training': { label: 'Training', description: 'Train model', config: { epochs: 50 } },
      'evaluation': { label: 'Evaluate', description: 'Test metrics', config: {} },
      'export': { label: 'Export', description: 'Save model', config: { format: 'json' } },
    };
    const cfg = configs[type];
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'pipelineNode',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { ...cfg, nodeType: type }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const executePipeline = async () => {
    setExecuting(true);
    setExecutionLog([]);

    // Topological sort based on edges with cycle detection
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));
    const adjacency = new Map(nodes.map(n => [n.id, []]));
    edges.forEach(e => {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      adjacency.get(e.source)?.push(e.target);
    });

    const queue = [...inDegree.entries()].filter(([_, d]) => d === 0).map(([id]) => id);
    const order = [];

    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);
      for (const neighbor of (adjacency.get(current) || [])) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      }
    }

    // Cycle detection: if not all nodes are in order, there's a cycle
    if (order.length !== nodes.length) {
      setExecutionLog([{ nodeId: 'error', label: 'Cycle Detected', type: 'error', status: 'completed', duration: 0, startedAt: Date.now(), completedAt: Date.now() }]);
      setExecuting(false);
      return;
    }

    for (const nodeId of order) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const log = { nodeId, label: node.data.label, type: node.data.nodeType, status: 'running', startedAt: Date.now() };
      setExecutionLog(prev => [...prev, log]);

      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

      setExecutionLog(prev => prev.map(l =>
        l.nodeId === nodeId ? { ...l, status: 'completed', completedAt: Date.now(), duration: Date.now() - l.startedAt } : l
      ));
    }

    setExecuting(false);
  };

  const deleteSelected = () => {
    if (selectedNode) {
      setNodes(nds => nds.filter(n => n.id !== selectedNode));
      setEdges(eds => eds.filter(e => e.source !== selectedNode && e.target !== selectedNode));
      setSelectedNode(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Pipeline Builder</h2>
          <p className="text-dark-400 mt-1">Visual drag & drop ML pipeline editor</p>
        </div>
        <div className="flex gap-2">
          {selectedNode && (
            <button onClick={deleteSelected} className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
              🗑️ Delete Node
            </button>
          )}
          <button
            onClick={executePipeline}
            disabled={executing}
            className="btn-primary flex items-center gap-2"
          >
            {executing ? <><span className="animate-spin">⏳</span> Executing...</> : <><span>▶️</span> Execute Pipeline</>}
          </button>
        </div>
      </div>

      {/* Node Palette */}
      <div className="card">
        <p className="text-sm text-dark-400 mb-3">Add nodes to your pipeline:</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(nodeStyles).map(([type, style]) => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className={`px-3 py-2 rounded-lg border ${style.bg} ${style.border} text-sm text-dark-200 hover:opacity-80 transition-opacity flex items-center gap-2`}
            >
              <span>{style.icon}</span>
              <span className="capitalize">{type.replace('-', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flow Editor */}
      <div className="card p-0 overflow-hidden" style={{ height: '500px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node.id)}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
          className="bg-dark-950"
        >
          <Background color="#334155" gap={20} />
          <Controls className="!bg-dark-800 !border-dark-600 !rounded-lg [&>button]:!bg-dark-700 [&>button]:!border-dark-600 [&>button]:!text-dark-300" />
          <MiniMap
            nodeColor={() => '#06b6d4'}
            maskColor="rgba(2, 6, 23, 0.7)"
            className="!bg-dark-900 !border-dark-700 !rounded-lg"
          />
        </ReactFlow>
      </div>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">📋 Execution Log</h3>
          <div className="space-y-2">
            {executionLog.map((log, i) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg px-4 py-2 border border-dark-600">
                <span className="text-lg">
                  {log.status === 'running' ? '⏳' : '✅'}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-dark-200">{log.label}</p>
                  <p className="text-xs text-dark-500">{log.type}</p>
                </div>
                <div className="text-right">
                  {log.status === 'completed' ? (
                    <span className="text-xs text-green-400">{log.duration}ms</span>
                  ) : (
                    <span className="text-xs text-yellow-400 animate-pulse">Running...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
