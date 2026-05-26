import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { BookOpen } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function Notebook() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [notebooks, setNotebooks] = useState([]);
  const [currentNotebook, setCurrentNotebook] = useState(null);
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const cellRefs = useRef({});

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      const res = await authFetch('/api/notebooks');
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data);
      }
    } catch (err) {
      toast.error('Failed to load notebooks');
    }
    setLoading(false);
  };

  const createNotebook = async () => {
    try {
      const res = await authFetch('/api/notebooks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled Notebook' })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentNotebook(data);
        setCells(data.cells);
        setTitle(data.title);
        fetchNotebooks();
        toast.success('Notebook created');
      }
    } catch (err) {
      toast.error('Failed to create notebook');
    }
  };

  const openNotebook = async (id) => {
    try {
      const res = await authFetch(`/api/notebooks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentNotebook(data);
        setCells(data.cells);
        setTitle(data.title);
      }
    } catch (err) {
      toast.error('Failed to open notebook');
    }
  };

  const saveNotebook = async () => {
    if (!currentNotebook) return;
    setSaving(true);
    try {
      await authFetch(`/api/notebooks/${currentNotebook._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, cells })
      });
      toast.success('Notebook saved');
    } catch (err) {
      toast.error('Failed to save notebook');
    }
    setSaving(false);
  };

  const deleteNotebook = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Notebook',
      message: 'Are you sure you want to delete this notebook? All cells and outputs will be lost.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await authFetch(`/api/notebooks/${id}`, { method: 'DELETE' });
      setNotebooks(prev => prev.filter(n => n._id !== id));
      if (currentNotebook?._id === id) {
        setCurrentNotebook(null);
        setCells([]);
      }
      toast.success('Notebook deleted');
    } catch (err) {
      toast.error('Failed to delete notebook');
    }
  };

  const addCell = (type = 'code', afterIndex = cells.length - 1) => {
    const newCell = {
      id: crypto.randomUUID(),
      type,
      content: type === 'markdown' ? '## New Section' : '// Write JavaScript code here\n',
      output: ''
    };
    const newCells = [...cells];
    newCells.splice(afterIndex + 1, 0, newCell);
    setCells(newCells);
  };

  const deleteCell = (id) => {
    setCells(prev => prev.filter(c => c.id !== id));
  };

  const updateCellContent = (id, content) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, content } : c));
  };

  const moveCell = (id, direction) => {
    const idx = cells.findIndex(c => c.id === id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cells.length) return;
    const newCells = [...cells];
    [newCells[idx], newCells[newIdx]] = [newCells[newIdx], newCells[idx]];
    setCells(newCells);
  };

  const executeCell = (id) => {
    const cell = cells.find(c => c.id === id);
    if (!cell || cell.type !== 'code') return;

    try {
      const logs = [];
      const mockConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args) => logs.push('ERROR: ' + args.map(a => String(a)).join(' ')),
        warn: (...args) => logs.push('WARN: ' + args.map(a => String(a)).join(' ')),
        info: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
      };

      const fn = new Function('console', 'tf', `
        "use strict";
        ${cell.content}
      `);

      const result = fn(mockConsole, window.tf || null);
      let output = logs.join('\n');
      if (result !== undefined && logs.length === 0) {
        output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      }

      setCells(prev => prev.map(c => c.id === id ? { ...c, output, executedAt: new Date().toISOString() } : c));
    } catch (err) {
      setCells(prev => prev.map(c => c.id === id ? { ...c, output: `Error: ${err.message}`, executedAt: new Date().toISOString() } : c));
    }
  };

  const renderMarkdown = (content) => {
    return content
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-dark-50 mt-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-dark-50 mt-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-dark-800/40 px-1 rounded text-purple-400">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  // Notebook list view
  if (!currentNotebook) {
    return (
      <div className="space-y-6">
        {ConfirmDialog}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Notebook Mode</h1>
            <p className="text-purple-300/50 mt-1">Jupyter-like interactive coding environment</p>
          </div>
          <button onClick={createNotebook} className="btn-primary flex items-center gap-2" aria-label="Create new notebook">
            <span aria-hidden="true">📓</span> New Notebook
          </button>
        </div>

        {loading ? (
          <CardSkeleton count={6} />
        ) : notebooks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No notebooks yet"
            description="Create a notebook to start coding interactively with executable cells."
            actionLabel="New Notebook"
            onAction={createNotebook}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map(nb => (
              <div
                key={nb._id}
                className="card card-hover cursor-pointer"
                onClick={() => openNotebook(nb._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') openNotebook(nb._id); }}
                aria-label={`Open notebook: ${nb.title}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{nb.title}</h3>
                    <p className="text-xs text-purple-300/50 mt-1">{nb.cellCount} cells</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotebook(nb._id); }}
                    className="text-purple-300/40 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${nb.title}`}
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-xs text-purple-300/40 mt-3">
                  Updated {new Date(nb.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Notebook editor view
  return (
    <div className="space-y-4">
      {ConfirmDialog}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setCurrentNotebook(null); setCells([]); }}
            className="text-purple-300/50 hover:text-dark-200 transition-colors"
            aria-label="Back to notebook list"
          >
            ← Back
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-xl font-bold text-dark-50 border-none outline-none focus:border-b focus:border-primary-500"
            placeholder="Notebook Title"
            aria-label="Notebook title"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveNotebook} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card py-3 px-4 flex items-center gap-3" role="toolbar" aria-label="Notebook toolbar">
        <button onClick={() => addCell('code')} className="text-xs bg-dark-800/40 text-purple-200/70 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:border-dark-400 transition-colors flex items-center gap-1">
          <span aria-hidden="true">+</span> Code
        </button>
        <button onClick={() => addCell('markdown')} className="text-xs bg-dark-800/40 text-purple-200/70 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:border-dark-400 transition-colors flex items-center gap-1">
          <span aria-hidden="true">+</span> Markdown
        </button>
        <div className="flex-1"></div>
        <span className="text-xs text-purple-300/40" aria-live="polite">{cells.length} cells</span>
      </div>

      {/* Cells */}
      <div className="space-y-2">
        {cells.map((cell, idx) => (
          <div key={cell.id} className="group card p-0 overflow-hidden animate-fade-in">
            {/* Cell Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-dark-800/50 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${cell.type === 'code' ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-500/10 text-purple-400'}`}>
                  {cell.type === 'code' ? '{ }' : 'Md'}
                </span>
                <span className="text-xs text-purple-300/40">Cell {idx + 1}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {cell.type === 'code' && (
                  <button
                    onClick={() => executeCell(cell.id)}
                    className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded hover:bg-green-500/20 transition-colors"
                    aria-label={`Run cell ${idx + 1}`}
                  >
                    ▶ Run
                  </button>
                )}
                <button onClick={() => moveCell(cell.id, 'up')} disabled={idx === 0} className="text-xs text-purple-300/50 hover:text-dark-200 px-1 disabled:opacity-30 transition-colors" aria-label="Move cell up">↑</button>
                <button onClick={() => moveCell(cell.id, 'down')} disabled={idx === cells.length - 1} className="text-xs text-purple-300/50 hover:text-dark-200 px-1 disabled:opacity-30 transition-colors" aria-label="Move cell down">↓</button>
                <button onClick={() => deleteCell(cell.id)} className="text-xs text-purple-300/50 hover:text-red-400 px-1 transition-colors" aria-label="Delete cell">✕</button>
              </div>
            </div>

            {/* Cell Content */}
            <div className="p-4">
              {cell.type === 'code' ? (
                <textarea
                  value={cell.content}
                  onChange={(e) => updateCellContent(cell.id, e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-sm p-3 rounded-lg border border-purple-500/20 focus:border-primary-500 focus:outline-none resize-none min-h-[80px]"
                  rows={Math.max(3, cell.content.split('\n').length)}
                  spellCheck={false}
                  aria-label={`Code cell ${idx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
                      e.preventDefault();
                      executeCell(cell.id);
                    }
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={cell.content}
                    onChange={(e) => updateCellContent(cell.id, e.target.value)}
                    className="w-full bg-transparent text-white text-sm p-3 rounded-lg border border-purple-500/20 focus:border-primary-500 focus:outline-none resize-none min-h-[60px]"
                    rows={Math.max(2, cell.content.split('\n').length)}
                    aria-label={`Markdown cell ${idx + 1}`}
                  />
                  <div
                    className="prose prose-invert prose-sm p-3 bg-dark-800/30 rounded-lg text-dark-200"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(cell.content) }}
                  />
                </div>
              )}

              {/* Output */}
              {cell.type === 'code' && cell.output && (
                <div className="mt-3 bg-transparent border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-300/40">Output</span>
                    {cell.executedAt && (
                      <span className="text-xs text-dark-600">{new Date(cell.executedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                  <pre className={`text-sm font-mono whitespace-pre-wrap ${cell.output.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`} role="log" aria-label={`Output for cell ${idx + 1}`}>
                    {cell.output}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Cell Button */}
      <div className="flex justify-center py-4">
        <div className="flex gap-2">
          <button onClick={() => addCell('code')} className="text-xs bg-dark-800/40 text-purple-300/50 border border-purple-500/30 px-4 py-2 rounded-lg hover:border-dark-400 transition-colors">
            + Code Cell
          </button>
          <button onClick={() => addCell('markdown')} className="text-xs bg-dark-800/40 text-purple-300/50 border border-purple-500/30 px-4 py-2 rounded-lg hover:border-dark-400 transition-colors">
            + Markdown Cell
          </button>
        </div>
      </div>
    </div>
  );
}
