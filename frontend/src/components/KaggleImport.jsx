import { useState } from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

const KAGGLE_DATASETS = [
  { id: 'titanic', name: 'Titanic - Machine Learning from Disaster', author: 'Kaggle', size: '34 KB', downloads: '250K', tags: ['classification', 'tabular'] },
  { id: 'house-prices', name: 'House Prices - Advanced Regression', author: 'Kaggle', size: '200 KB', downloads: '180K', tags: ['regression', 'tabular'] },
  { id: 'mnist', name: 'Digit Recognizer (MNIST)', author: 'Kaggle', size: '15 MB', downloads: '320K', tags: ['classification', 'image'] },
  { id: 'imdb', name: 'IMDB Dataset of 50K Movie Reviews', author: 'lakshmi25npathi', size: '64 MB', downloads: '95K', tags: ['nlp', 'sentiment'] },
  { id: 'credit-card', name: 'Credit Card Fraud Detection', author: 'mlg-ulb', size: '144 MB', downloads: '210K', tags: ['classification', 'anomaly'] },
  { id: 'covid19', name: 'COVID-19 Open Research Dataset', author: 'allen-ai', size: '1.2 GB', downloads: '45K', tags: ['nlp', 'research'] },
  { id: 'wine-quality', name: 'Wine Quality Dataset', author: 'uciml', size: '12 KB', downloads: '120K', tags: ['classification', 'regression'] },
  { id: 'spam', name: 'SMS Spam Collection', author: 'uciml', size: '204 KB', downloads: '88K', tags: ['nlp', 'classification'] },
];

export default function KaggleImport({ onImport }) {
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(null);
  const [imported, setImported] = useState([]);

  const filtered = KAGGLE_DATASETS.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.includes(search.toLowerCase()))
  );

  const handleImport = async (dataset) => {
    setImporting(dataset.id);
    // Simulate import delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setImported(prev => [...prev, dataset.id]);
    setImporting(null);
    onImport?.(dataset);
  };

  return (
    <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Import from Kaggle</h3>
        </div>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Kaggle datasets..."
          className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
        />
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.map(dataset => (
          <div key={dataset.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg hover:bg-purple-500/15 transition-colors">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm text-white font-medium truncate">{dataset.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-purple-300/50">by {dataset.author}</span>
                <span className="text-xs text-purple-300/40">•</span>
                <span className="text-xs text-purple-300/50">{dataset.size}</span>
                <span className="text-xs text-purple-300/40">•</span>
                <span className="text-xs text-purple-300/50">↓ {dataset.downloads}</span>
              </div>
              <div className="flex gap-1 mt-1">
                {dataset.tags.map(tag => (
                  <span key={tag} className="text-xs bg-dark-600 text-purple-200/70 px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleImport(dataset)}
              disabled={importing === dataset.id || imported.includes(dataset.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex-shrink-0 ${
                imported.includes(dataset.id)
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : importing === dataset.id
                    ? 'bg-dark-600 border-dark-500 text-purple-200/70'
                    : 'bg-primary-500/10 border-primary-500/30 text-purple-400 hover:bg-primary-500/20'
              }`}
            >
              {imported.includes(dataset.id) ? <><CheckCircle2 className="w-3 h-3 inline" /> Imported</> : importing === dataset.id ? 'Importing...' : 'Import'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
