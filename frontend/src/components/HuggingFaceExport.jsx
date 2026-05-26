import { useState } from 'react';

export default function HuggingFaceExport({ modelName = 'my-model' }) {
  const [config, setConfig] = useState({
    name: modelName,
    description: '',
    tags: '',
    private: false
  });
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleExport = async (e) => {
    e.preventDefault();
    setExporting(true);
    // Simulate push to HuggingFace
    await new Promise(resolve => setTimeout(resolve, 2000));
    const username = 'user';
    const hfUrl = `https://huggingface.co/${username}/${config.name.replace(/\s+/g, '-').toLowerCase()}`;
    setResult({ success: true, url: hfUrl });
    setExporting(false);
  };

  const handleReset = () => {
    setResult(null);
    setConfig(prev => ({ ...prev, description: '', tags: '' }));
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤗</span>
        <h3 className="text-lg font-semibold text-white">Push to HuggingFace</h3>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">✓</span>
              <p className="text-sm text-green-400 font-medium">Model pushed successfully!</p>
            </div>
            <p className="text-sm text-dark-300">Your model is now available at:</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 break-all"
            >
              {result.url}
            </a>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-dark-600 text-dark-300 rounded-lg text-sm hover:bg-dark-700 transition-colors"
          >
            Push Another Model
          </button>
        </div>
      ) : (
        <form onSubmit={handleExport} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-1">Model Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="my-awesome-model"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A brief description of your model..."
              rows={3}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={config.tags}
              onChange={(e) => setConfig(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="pytorch, classification, nlp"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hf-private"
              checked={config.private}
              onChange={(e) => setConfig(prev => ({ ...prev, private: e.target.checked }))}
              className="rounded border-dark-600 bg-dark-700 text-primary-500"
            />
            <label htmlFor="hf-private" className="text-sm text-dark-300">Private model</label>
          </div>
          <button
            type="submit"
            disabled={exporting || !config.name}
            className="px-4 py-2 bg-yellow-500/80 text-white rounded-lg text-sm hover:bg-yellow-500 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Pushing...
              </>
            ) : (
              <>🤗 Push to Hub</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
