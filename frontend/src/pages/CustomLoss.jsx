import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Editor from 'react-simple-code-editor';
import { CheckCircle2, XCircle, Save, Ruler, Play } from 'lucide-react';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import { useToast } from '../components/ui/Toast';
import HowToUse from '../components/ui/HowToUse';

export default function CustomLoss() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const [losses, setLosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    code: `// Custom loss function\n// Parameters: yTrue (actual), yPred (predicted), tf (TensorFlow.js)\n// Must return a scalar tensor\n\nconst diff = tf.sub(yTrue, yPred);\nconst squared = tf.square(diff);\nreturn tf.mean(squared);`
  });
  const [validation, setValidation] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchLosses();
  }, []);

  const fetchLosses = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/custom-loss');
      const data = await res.json();
      setLosses(data);
    } catch (err) { }
    setLoading(false);
  };

  const handleValidate = async () => {
    try {
      const res = await authFetch('/api/custom-loss/validate', { method: 'POST', body: JSON.stringify({ code: form.code }) });
      const data = await res.json();
      setValidation(data);
    } catch (err) { setValidation({ valid: false, error: err.message }); }
  };

  const handleTest = () => {
    try {
      // Test with sample data
      const yTrue = [1, 0, 1, 0, 1];
      const yPred = [0.9, 0.1, 0.8, 0.2, 0.7];
      // Simple mock tf object for testing
      const mockTf = {
        sub: (a, b) => ({ data: a.map((v, i) => v - b[i]), _op: 'sub' }),
        square: (t) => ({ data: t.data.map(v => v * v), _op: 'square' }),
        mean: (t) => ({ data: [t.data.reduce((a, b) => a + b, 0) / t.data.length], _op: 'mean', scalar: true }),
        abs: (t) => ({ data: t.data.map(v => Math.abs(v)), _op: 'abs' }),
        log: (t) => ({ data: t.data.map(v => Math.log(v + 1e-7)), _op: 'log' }),
        mul: (a, b) => ({ data: a.data ? a.data.map((v, i) => v * (b.data ? b.data[i] : b)) : a.map((v, i) => v * (b.data ? b.data[i] : b[i])), _op: 'mul' }),
        add: (a, b) => ({ data: a.data.map((v, i) => v + (b.data ? b.data[i] : b)), _op: 'add' }),
      };
      const fn = new Function('yTrue', 'yPred', 'tf', form.code);
      const result = fn(yTrue, yPred, mockTf);
      setTestResult({ success: true, output: result.data ? result.data[0].toFixed(6) : JSON.stringify(result) });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await authFetch(`/api/custom-loss/${editing}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await authFetch('/api/custom-loss', { method: 'POST', body: JSON.stringify(form) });
      }
      setEditing(null);
      setForm({ name: '', description: '', code: form.code });
      setValidation(null);
      setTestResult(null);
      fetchLosses();
    } catch (err) { }
  };

  const handleEdit = (loss) => {
    setEditing(loss._id);
    setForm({ name: loss.name, description: loss.description, code: loss.code });
    setValidation(null);
    setTestResult(null);
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/custom-loss/${id}`, { method: 'DELETE', headers });
    fetchLosses();
  };

  if (!user) return <div className="text-purple-300/50 text-center py-20">Sign in to create custom loss functions</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="custom-loss" steps={[
      'Write a custom loss function in JavaScript.',
      'Click \'Validate\' to check syntax.',
      'Test with sample data.',
      'Save to your library for use in training.'
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Custom Loss Functions</h1>
        <p className="text-purple-300/50 mt-1">Write, validate, and test custom loss functions in JavaScript</p>
      </div>

      {/* Editor */}
      <div className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-purple-300/50 mb-1">Function Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. huber_loss" className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-purple-300/50 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description" className="w-full bg-dark-900 border border-purple-500/30 text-dark-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-purple-300/50 mb-1">Loss Function Code</label>
          <div className="bg-dark-900 border border-purple-500/30 rounded-lg overflow-hidden">
            <Editor
              value={form.code}
              onValueChange={(code) => setForm(prev => ({ ...prev, code }))}
              highlight={(code) => highlight(code, languages.javascript, 'javascript')}
              padding={16}
              style={{ fontFamily: '"Fira Code", "Fira Mono", monospace', fontSize: 13, minHeight: '200px', color: '#e2e8f0', backgroundColor: 'transparent' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleValidate} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 hover:text-white rounded-lg text-sm transition-colors"><CheckCircle2 className="w-4 h-4 inline mr-1" /> Validate Syntax</button>
          <button onClick={handleTest} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 hover:text-white rounded-lg text-sm transition-colors"><Play className="w-3 h-3 inline" /> Test with Sample</button>
          <button onClick={handleSave} disabled={!form.name} className="px-4 py-2 bg-gradient-btn text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
                        {editing ? <><Save className="w-4 h-4 inline mr-1" /> Update</> : <><Save className="w-4 h-4 inline mr-1" /> Save to Library</>}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: '', description: '', code: form.code }); }} className="px-4 py-2 bg-purple-500/15 text-purple-200/70 rounded-lg text-sm">Cancel Edit</button>}
        </div>

        {/* Validation Result */}
        {validation && (
          <div className={`p-3 rounded-lg text-sm ${validation.valid ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {validation.valid ? <><CheckCircle2 className="w-4 h-4 inline mr-1" /> Syntax is valid</> : <><XCircle className="w-4 h-4 inline mr-1" /> Syntax error: {validation.error}</>}
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {testResult.success ? <><CheckCircle2 className="w-4 h-4 inline mr-1" /> Test passed. Output: {testResult.output}</> : <><XCircle className="w-4 h-4 inline mr-1" /> Test failed: {testResult.error}</>}
          </div>
        )}
      </div>

      {/* Saved Loss Functions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Loss Function Library</h3>
        {loading ? (
          <div className="text-purple-300/50 text-center py-6"><div class="animate-pulse space-y-3"><div class="h-4 bg-purple-500/15 rounded w-3/4"></div><div class="h-4 bg-purple-500/15 rounded w-1/2"></div></div></div>
        ) : losses.length === 0 ? (
          <div className="text-center py-10 text-purple-300/50 bg-dark-800/40 border border-purple-500/20 rounded-lg">
            <Ruler className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p>No custom loss functions saved yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {losses.map(loss => (
              <div key={loss._id} className="bg-dark-800/40 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{loss.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${loss.validated ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {loss.validated ? 'Valid' : 'Unvalidated'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(loss)} className="text-xs px-2 py-1 bg-purple-500/15 text-purple-200/70 hover:text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(loss._id)} className="text-xs px-2 py-1 bg-purple-500/15 text-red-400 hover:bg-red-500/10 rounded">Delete</button>
                  </div>
                </div>
                {loss.description && <p className="text-purple-300/50 text-sm mt-1">{loss.description}</p>}
                <pre className="mt-2 text-xs text-purple-200/70 bg-dark-900 rounded p-3 overflow-auto max-h-24">{loss.code}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
