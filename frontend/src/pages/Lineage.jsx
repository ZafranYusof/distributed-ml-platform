import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useToast } from '../components/ui/Toast';

const nodeTypes = {
  dataset: { color: '#f59e0b', icon: '📁' },
  preprocessing: { color: '#8b5cf6', icon: '🔧' },
  feature: { color: '#10b981', icon: '🧮' },
  model: { color: '#06b6d4', icon: '🧠' },
  prediction: { color: '#ec4899', icon: '📊' }
};

function CustomNode({ data }) {
  const typeInfo = nodeTypes[data.nodeType] || { color: '#64748b', icon: '⚙️' };
  return (
    <div className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[150px]" style={{ borderColor: typeInfo.color, backgroundColor: '#1e293b' }}>
      <div className="flex items-center gap-2">
        <span>{typeInfo.icon}</span>
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      {data.details && <p className="text-xs text-gray-400 mt-1">{data.details}</p>}
    </div>
  );
}

const customNodeTypes = { custom: CustomNode };

export default function Lineage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [graphs, setGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [graphName, setGraphName] = useState('');
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNode, setNewNode] = useState({ label: '', nodeType: 'dataset', details: '' });

  const API = 'http://localhost:5005/api';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) fetchGraphs();
  }, [token]);

  const fetchGraphs = async () => {
    try {
      const res = await fetch(`${API}/lineage`, { headers });
      const data = await res.json();
      setGraphs(data);
    } catch (err) { }
  };

  const loadGraph = (graph) => {
    setSelectedGraph(graph);
    const loadedNodes = (graph.nodes || []).map(n => ({
      id: n.id,
      type: 'custom',
      position: n.position || { x: 0, y: 0 },
      data: { label: n.label, nodeType: n.type, details: n.data?.details || '' }
    }));
    const loadedEdges = (graph.edges || []).map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || '',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
      style: { stroke: '#06b6d4' },
      labelStyle: { fill: '#94a3b8', fontSize: 11 }
    }));
    setNodes(loadedNodes);
    setEdges(loadedEdges);
  };

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      id: `e-${Date.now()}`,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
      style: { stroke: '#06b6d4' },
    }, eds));
  }, [setEdges]);

  const handleCreateGraph = async () => {
    try {
      const res = await fetch(`${API}/lineage`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: graphName || 'Untitled Pipeline', nodes: [], edges: [] })
      });
      const data = await res.json();
      setShowCreate(false);
      setGraphName('');
      fetchGraphs();
      loadGraph(data);
    } catch (err) { }
  };

  const handleSave = async () => {
    if (!selectedGraph) return;
    const saveNodes = nodes.map(n => ({
      id: n.id, type: n.data.nodeType, label: n.data.label,
      position: n.position, data: { details: n.data.details }
    }));
    const saveEdges = edges.map(e => ({
      id: e.id, source: e.source, target: e.target, label: e.label || ''
    }));
    try {
      await fetch(`${API}/lineage/${selectedGraph._id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ nodes: saveNodes, edges: saveEdges })
      });
      fetchGraphs();
    } catch (err) { }
  };

  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const newN = {
      id, type: 'custom',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: { label: newNode.label, nodeType: newNode.nodeType, details: newNode.details }
    };
    setNodes(nds => [...nds, newN]);
    setShowAddNode(false);
    setNewNode({ label: '', nodeType: 'dataset', details: '' });
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/lineage/${id}`, { method: 'DELETE', headers });
    if (selectedGraph?._id === id) {
      setSelectedGraph(null);
      setNodes([]);
      setEdges([]);
    }
    fetchGraphs();
  };

  const generateSamplePipeline = () => {
    const sampleNodes = [
      { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { label: 'Raw CSV Data', nodeType: 'dataset', details: 'iris.csv' } },
      { id: 'n2', type: 'custom', position: { x: 300, y: 50 }, data: { label: 'Clean & Normalize', nodeType: 'preprocessing', details: 'Remove nulls, scale 0-1' } },
      { id: 'n3', type: 'custom', position: { x: 300, y: 180 }, data: { label: 'Feature Engineering', nodeType: 'feature', details: 'PCA, interactions' } },
      { id: 'n4', type: 'custom', position: { x: 550, y: 100 }, data: { label: 'Neural Network', nodeType: 'model', details: '3-layer MLP' } },
      { id: 'n5', type: 'custom', position: { x: 780, y: 100 }, data: { label: 'Predictions', nodeType: 'prediction', details: 'Classification output' } },
    ];
    const sampleEdges = [
      { id: 'e1', source: 'n1', target: 'n2', markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }, style: { stroke: '#06b6d4' } },
      { id: 'e2', source: 'n1', target: 'n3', markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }, style: { stroke: '#06b6d4' } },
      { id: 'e3', source: 'n2', target: 'n4', markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }, style: { stroke: '#06b6d4' } },
      { id: 'e4', source: 'n3', target: 'n4', markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }, style: { stroke: '#06b6d4' } },
      { id: 'e5', source: 'n4', target: 'n5', markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }, style: { stroke: '#06b6d4' } },
    ];
    setNodes(sampleNodes);
    setEdges(sampleEdges);
  };

  if (!user) return <div className="text-dark-400 text-center py-20">Sign in to access Data Lineage</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Lineage & Provenance</h1>
          <p className="text-dark-400 mt-1">Visual DAG showing full pipeline from raw data to predictions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 text-sm">
            + New Graph
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Graph list */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Pipelines</h3>
          <div className="space-y-2">
            {graphs.map(g => (
              <div key={g._id} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedGraph?._id === g._id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-900 border border-dark-700 hover:border-dark-500'}`}>
                <div className="flex items-center justify-between">
                  <span onClick={() => loadGraph(g)} className="text-dark-200 text-sm flex-1">{g.name}</span>
                  <button onClick={() => handleDelete(g._id)} className="text-red-400 hover:text-red-300 text-xs ml-2">✕</button>
                </div>
                <p className="text-xs text-dark-500 mt-1">{g.nodes?.length || 0} nodes</p>
              </div>
            ))}
            {graphs.length === 0 && <p className="text-dark-500 text-xs">No pipelines yet</p>}
          </div>
        </div>

        {/* Main canvas */}
        <div className="lg:col-span-3 bg-dark-800 border border-dark-700 rounded-xl overflow-hidden" style={{ height: '500px' }}>
          {selectedGraph ? (
            <>
              <div className="flex items-center justify-between p-3 border-b border-dark-700 bg-dark-900">
                <span className="text-dark-200 text-sm font-medium">{selectedGraph.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddNode(true)} className="px-3 py-1 bg-dark-700 text-dark-300 rounded text-xs hover:bg-dark-600">+ Node</button>
                  <button onClick={generateSamplePipeline} className="px-3 py-1 bg-dark-700 text-dark-300 rounded text-xs hover:bg-dark-600">Sample</button>
                  <button onClick={handleSave} className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded text-xs hover:bg-primary-500/30">Save</button>
                </div>
              </div>
              <div style={{ height: 'calc(100% - 49px)' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={customNodeTypes}
                  fitView
                  className="bg-dark-950"
                >
                  <Background color="#334155" gap={20} />
                  <Controls className="bg-dark-800 border-dark-600" />
                  <MiniMap className="bg-dark-900" nodeColor="#06b6d4" />
                </ReactFlow>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-dark-400">
              <div className="text-center">
                <p className="text-4xl mb-4">🔗</p>
                <p>Select or create a pipeline to visualize lineage</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node type legend */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
        <p className="text-dark-400 text-sm mb-2">Node Types:</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(nodeTypes).map(([type, info]) => (
            <span key={type} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: info.color }}></span>
              <span className="text-dark-300">{info.icon} {type}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Create Graph Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">New Lineage Graph</h3>
            <input value={graphName} onChange={e => setGraphName(e.target.value)} placeholder="Pipeline name"
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleCreateGraph} className="flex-1 bg-primary-500 text-white rounded-lg py-2 hover:bg-primary-600">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-dark-700 text-dark-300 rounded-lg py-2 hover:bg-dark-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">Add Node</h3>
            <div className="space-y-3">
              <input value={newNode.label} onChange={e => setNewNode({ ...newNode, label: e.target.value })} placeholder="Node label"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
              <select value={newNode.nodeType} onChange={e => setNewNode({ ...newNode, nodeType: e.target.value })}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200">
                {Object.keys(nodeTypes).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newNode.details} onChange={e => setNewNode({ ...newNode, details: e.target.value })} placeholder="Details (optional)"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-dark-200" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddNode} className="flex-1 bg-primary-500 text-white rounded-lg py-2 hover:bg-primary-600">Add</button>
              <button onClick={() => setShowAddNode(false)} className="flex-1 bg-dark-700 text-dark-300 rounded-lg py-2 hover:bg-dark-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
