import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { Trash2, Download } from 'lucide-react';
import { Tag, MousePointer } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function Annotations() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ name: '', labels: 'positive,negative,neutral', data: '' });
  const [annotator, setAnnotator] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProjects();
    setAnnotator(user?.username || 'annotator1');
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/annotations');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      toast.error('Failed to load annotation projects');
    }
    setLoading(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(prev => ({ ...prev, data: ev.target.result }));
    reader.readAsText(file);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Project name is required';
    if (!form.labels.trim()) errors.labels = 'At least one label is required';
    if (!form.data) errors.data = 'Please upload a CSV file';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const labels = form.labels.split(',').map(l => l.trim()).filter(Boolean);
      await authFetch('/api/annotations', { method: 'POST', body: JSON.stringify({ name: form.name, labels, data: form.data }) });
      setShowCreate(false);
      setForm({ name: '', labels: 'positive,negative,neutral', data: '' });
      setFormErrors({});
      fetchProjects();
      toast.success('Annotation project created');
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const selectProject = async (id) => {
    setSelectedProject(id);
    try {
      const [dataRes, statsRes] = await Promise.all([
        authFetch(`/api/annotations/${id}`),
        authFetch(`/api/annotations/${id}/stats`)
      ]);
      const data = await dataRes.json();
      const statsData = await statsRes.json();
      setProjectData(data);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to load project data');
    }
  };

  const handleAnnotate = async (rowIndex, label) => {
    try {
      await authFetch(`/api/annotations/${selectedProject}/annotate`, {
        method: 'POST', body: JSON.stringify({ rowIndex, label, annotator })
      });
      const statsRes = await authFetch(`/api/annotations/${selectedProject}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
      const dataRes = await authFetch(`/api/annotations/${selectedProject}`);
      const data = await dataRes.json();
      setProjectData(data);
    } catch (err) {
      toast.error('Failed to save annotation');
    }
  };

  const handleExport = async () => {
    try {
      const res = await authFetch(`/api/annotations/${selectedProject}/export`);
      const data = await res.json();
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectData.name}_annotated.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported annotations');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Annotation Project',
      message: 'Are you sure? All annotations and data in this project will be permanently deleted.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await authFetch(`/api/annotations/${id}`, { method: 'DELETE' });
      if (selectedProject === id) { setSelectedProject(null); setProjectData(null); setStats(null); }
      fetchProjects();
      toast.success('Project deleted');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const getRowAnnotations = (rowIndex) => {
    if (!projectData?.annotations) return [];
    return projectData.annotations.filter(a => a.rowIndex === rowIndex);
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to manage annotations</div>;

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Collaborative Annotations</h1>
          <p className="text-purple-300/50 mt-1">Label data collaboratively with agreement metrics and consensus voting</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary" aria-label="Create new annotation project">
          + New Project
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6 space-y-4 animate-fade-in" noValidate>
          <h2 className="text-lg font-semibold text-white">Create Annotation Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-purple-300/50 mb-1" htmlFor="ann-name">Project Name</label>
              <input
                id="ann-name"
                type="text"
                value={form.name}
                onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })); }}
                required
                className={`w-full input-field ${formErrors.name ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.name}
              />
              {formErrors.name && <p className="field-error">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-purple-300/50 mb-1" htmlFor="ann-labels">Labels (comma-separated)</label>
              <input
                id="ann-labels"
                type="text"
                value={form.labels}
                onChange={(e) => { setForm(prev => ({ ...prev, labels: e.target.value })); setFormErrors(prev => ({ ...prev, labels: '' })); }}
                className={`w-full input-field ${formErrors.labels ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.labels}
              />
              {formErrors.labels && <p className="field-error">{formErrors.labels}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm text-purple-300/50 mb-1">Upload CSV Data</label>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="text-purple-200/70 text-sm" aria-label="Upload CSV data file" />
            {formErrors.data && <p className="field-error">{formErrors.data}</p>}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary disabled:opacity-50" disabled={!form.data}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-purple-300/50 uppercase tracking-wide">Projects</h3>
          {loading ? (
            <CardSkeleton count={3} />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No annotation projects"
              description="Create a project to start labeling data collaboratively."
              actionLabel="New Project"
              onAction={() => setShowCreate(true)}
            />
          ) : (
            projects.map(p => (
              <div
                key={p._id}
                onClick={() => selectProject(p._id)}
                className={`card card-hover p-3 cursor-pointer ${selectedProject === p._id ? 'border-primary-500' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') selectProject(p._id); }}
                aria-selected={selectedProject === p._id}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                    className="text-purple-300/40 hover:text-red-400 text-xs transition-colors"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-purple-300/40">
                  <span>{p.totalRows} rows</span>
                  <span>{p.labels?.length} labels</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Annotation Area */}
        <div className="lg:col-span-2">
          {!selectedProject ? (
            <EmptyState
              icon={MousePointer}
              title="Select a project"
              description="Choose an annotation project from the list to start labeling data."
            />
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="card p-3 text-center">
                    <p className="text-xl font-bold text-purple-400">{stats.progress.toFixed(1)}%</p>
                    <p className="text-xs text-purple-300/50">Progress</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-xl font-bold text-green-400">{stats.annotatedRows}/{stats.totalRows}</p>
                    <p className="text-xs text-purple-300/50">Annotated</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-xl font-bold text-yellow-400">{(stats.agreement * 100).toFixed(1)}%</p>
                    <p className="text-xs text-purple-300/50">Agreement (κ)</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-xl font-bold text-white">{stats.annotators?.length || 0}</p>
                    <p className="text-xs text-purple-300/50">Annotators</p>
                  </div>
                </div>
              )}

              {/* Annotator Name */}
              <div className="flex items-center gap-3 card p-3">
                <label htmlFor="annotator-name" className="text-sm text-purple-300/50">Annotating as:</label>
                <input
                  id="annotator-name"
                  type="text"
                  value={annotator}
                  onChange={(e) => setAnnotator(e.target.value)}
                  className="input-field text-sm"
                />
                <button onClick={handleExport} className="ml-auto btn-secondary btn-sm" aria-label="Export annotations as CSV">
                  <Download className="w-4 h-4 inline mr-1" /> Export CSV
                </button>
              </div>

              {/* Data Table with Annotation */}
              {projectData?.data && (
                <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs" role="table" aria-label="Annotation data">
                      <thead className="sticky top-0 bg-dark-800/40">
                        <tr className="text-purple-300/50 border-b border-purple-500/20">
                          <th className="text-left py-2 px-3" scope="col">#</th>
                          {projectData.data[0]?.map((col, i) => (
                            <th key={i} className="text-left py-2 px-3" scope="col">{col}</th>
                          ))}
                          <th className="text-left py-2 px-3" scope="col">Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectData.data.slice(1, 51).map((row, idx) => {
                          const rowAnns = getRowAnnotations(idx + 1);
                          const currentLabel = rowAnns.length > 0 ? rowAnns[rowAnns.length - 1].label : null;
                          return (
                            <tr key={idx} className="border-b border-purple-500/20/30 hover:bg-purple-500/15/20 transition-colors">
                              <td className="py-2 px-3 text-purple-300/40">{idx + 1}</td>
                              {row.map((cell, i) => (
                                <td key={i} className="py-2 px-3 text-purple-200/70 max-w-32 truncate">{cell}</td>
                              ))}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={`Labels for row ${idx + 1}`}>
                                  {projectData.labels?.map(label => (
                                    <button
                                      key={label}
                                      onClick={() => handleAnnotate(idx + 1, label)}
                                      className={`px-2 py-0.5 rounded text-xs transition-colors ${currentLabel === label ? 'bg-gradient-btn text-white' : 'bg-purple-500/15 text-purple-300/50 hover:text-white hover:bg-purple-500/20'}`}
                                      aria-pressed={currentLabel === label}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {projectData.data.length > 51 && (
                    <div className="p-2 text-center text-xs text-purple-300/40 border-t border-purple-500/20">
                      Showing first 50 rows of {projectData.data.length - 1}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
