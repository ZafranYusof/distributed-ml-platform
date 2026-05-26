import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { useToast } from '../components/ui/Toast';

export default function DataExplorer() {
  const toast = useToast();
  const [dataset, setDataset] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [stats, setStats] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [outliers, setOutliers] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const computeStats = (data, fields) => {
    const numericFields = fields.filter(f => {
      return data.some(row => typeof row[f] === 'number' && !isNaN(row[f]));
    });

    const statsMap = {};
    const missing = {};

    fields.forEach(f => {
      const values = data.map(r => r[f]);
      const missingCount = values.filter(v => v === null || v === undefined || v === '').length;
      missing[f] = missingCount;

      const numValues = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
      if (numValues.length > 0) {
        const sum = numValues.reduce((a, b) => a + b, 0);
        const mean = sum / numValues.length;
        const median = numValues.length % 2 === 0
          ? (numValues[numValues.length / 2 - 1] + numValues[numValues.length / 2]) / 2
          : numValues[Math.floor(numValues.length / 2)];
        const variance = numValues.reduce((acc, v) => acc + (v - mean) ** 2, 0) / numValues.length;
        const std = Math.sqrt(variance);
        const min = numValues[0];
        const max = numValues[numValues.length - 1];
        const q1 = numValues[Math.floor(numValues.length * 0.25)];
        const q3 = numValues[Math.floor(numValues.length * 0.75)];
        const iqr = q3 - q1;

        statsMap[f] = { mean, median, std, min, max, q1, q3, iqr, count: numValues.length };
      }
    });

    // Compute correlations between numeric fields
    const corrMatrix = {};
    numericFields.forEach(f1 => {
      corrMatrix[f1] = {};
      numericFields.forEach(f2 => {
        if (f1 === f2) { corrMatrix[f1][f2] = 1; return; }
        const pairs = data.filter(r => typeof r[f1] === 'number' && typeof r[f2] === 'number');
        if (pairs.length < 3) { corrMatrix[f1][f2] = 0; return; }
        const vals1 = pairs.map(r => r[f1]);
        const vals2 = pairs.map(r => r[f2]);
        const mean1 = vals1.reduce((a, b) => a + b, 0) / vals1.length;
        const mean2 = vals2.reduce((a, b) => a + b, 0) / vals2.length;
        const num = vals1.reduce((acc, v, i) => acc + (v - mean1) * (vals2[i] - mean2), 0);
        const den1 = Math.sqrt(vals1.reduce((acc, v) => acc + (v - mean1) ** 2, 0));
        const den2 = Math.sqrt(vals2.reduce((acc, v) => acc + (v - mean2) ** 2, 0));
        corrMatrix[f1][f2] = den1 && den2 ? num / (den1 * den2) : 0;
      });
    });

    // Detect outliers using IQR method
    const outlierMap = {};
    numericFields.forEach(f => {
      const s = statsMap[f];
      if (!s) return;
      const lower = s.q1 - 1.5 * s.iqr;
      const upper = s.q3 + 1.5 * s.iqr;
      const outlierRows = data.filter(r => typeof r[f] === 'number' && (r[f] < lower || r[f] > upper));
      outlierMap[f] = { count: outlierRows.length, lower, upper };
    });

    setStats({ columns: statsMap, missing, numericFields });
    setCorrelations(corrMatrix);
    setOutliers(outlierMap);
    if (numericFields.length > 0) setSelectedCol(numericFields[0]);
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = Papa.parse(ev.target.result, { header: true, dynamicTyping: true, skipEmptyLines: true });
      setParsedData(result.data);
      setDataset({ name: file.name, rows: result.data.length, columns: result.meta.fields });
      computeStats(result.data, result.meta.fields);
    };
    reader.readAsText(file);
  };

  const loadSample = async (sampleId) => {
    const res = await fetch(`/api/samples/${sampleId}`);
    const data = await res.json();
    const result = Papa.parse(data.content, { header: true, dynamicTyping: true, skipEmptyLines: true });
    setParsedData(result.data);
    setDataset({ name: data.name, rows: result.data.length, columns: result.meta.fields });
    computeStats(result.data, result.meta.fields);
  };

  const getHistogramData = (col) => {
    if (!parsedData || !col) return [];
    const values = parsedData.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binWidth = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}`,
      count: 0
    }));
    values.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
      bins[idx].count++;
    });
    return bins;
  };

  const getCorrelationColor = (val) => {
    if (val > 0.7) return 'bg-gradient-btn';
    if (val > 0.3) return 'bg-primary-700';
    if (val > -0.3) return 'bg-dark-600';
    if (val > -0.7) return 'bg-red-700';
    return 'bg-red-500';
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-50">Data Explorer</h2>
        <p className="text-purple-300/50 mt-1">Visualize and analyze your dataset</p>
      </div>

      {!dataset ? (
        <div className="card space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary-400 bg-primary-500/5' : 'border-purple-500/30 hover:border-dark-400'
            }`}
            onClick={() => document.getElementById('explorer-file-input').click()}
          >
            <div className="text-4xl mb-3">📊</div>
            <p className="text-dark-200 font-medium">Drop CSV file here to explore</p>
            <p className="text-purple-300/40 text-sm mt-1">Supports .csv files</p>
            <input
              id="explorer-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-purple-500/15"></div>
            <span className="text-purple-300/40 text-sm">or use a sample</span>
            <div className="flex-1 h-px bg-purple-500/15"></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => loadSample('iris')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white">🌸 Iris</div>
            </button>
            <button onClick={() => loadSample('housing')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white">🏠 Housing</div>
            </button>
            <button onClick={() => loadSample('sequence')} className="card hover:border-primary-500/50 transition-colors text-left">
              <div className="text-sm font-medium text-white">📈 Sine Wave</div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Dataset Info */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-white">{dataset.name}</p>
                  <p className="text-sm text-purple-300/50">{dataset.rows} rows · {dataset.columns.length} columns</p>
                </div>
              </div>
              <button onClick={() => { setDataset(null); setParsedData(null); setStats(null); }} className="text-purple-300/50 hover:text-red-400 text-sm">
                Reset
              </button>
            </div>
          </div>

          {/* Basic Stats */}
          {stats && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Basic Statistics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-purple-500/20">
                      <th className="text-left py-2 px-3 text-purple-300/50">Column</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Mean</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Median</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Std</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Min</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Max</th>
                      <th className="text-right py-2 px-3 text-purple-300/50">Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.columns).map(([col, s]) => (
                      <tr key={col} className="border-b border-dark-800 hover:bg-purple-500/10/50">
                        <td className="py-2 px-3 text-dark-200 font-medium">{col}</td>
                        <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{s.mean.toFixed(3)}</td>
                        <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{s.median.toFixed(3)}</td>
                        <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{s.std.toFixed(3)}</td>
                        <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{s.min.toFixed(3)}</td>
                        <td className="text-right py-2 px-3 text-purple-200/70 font-mono">{s.max.toFixed(3)}</td>
                        <td className="text-right py-2 px-3 text-purple-200/70">{stats.missing[col]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Histogram */}
          {stats && stats.numericFields.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Distribution</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                {stats.numericFields.map(col => (
                  <button
                    key={col}
                    onClick={() => setSelectedCol(col)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      selectedCol === col
                        ? 'bg-primary-500/20 text-purple-300 border border-primary-500/30'
                        : 'bg-dark-800 text-purple-300/50 border border-purple-500/30 hover:border-dark-400'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getHistogramData(selectedCol)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
                    <XAxis dataKey="range" tick={{ fill: '#A78BFA', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#A78BFA', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Correlation Matrix */}
          {correlations && stats && stats.numericFields.length > 1 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">🔗 Correlation Matrix</h3>
              <div className="overflow-x-auto">
                <table className="text-xs">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {stats.numericFields.map(f => (
                        <th key={f} className="p-2 text-purple-300/50 font-normal truncate max-w-[80px]">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.numericFields.map(f1 => (
                      <tr key={f1}>
                        <td className="p-2 text-purple-300/50 font-medium truncate max-w-[80px]">{f1}</td>
                        {stats.numericFields.map(f2 => {
                          const val = correlations[f1]?.[f2] || 0;
                          return (
                            <td key={f2} className="p-1">
                              <div
                                className={`w-12 h-8 rounded flex items-center justify-center text-xs font-mono ${getCorrelationColor(val)}`}
                                title={`${f1} vs ${f2}: ${val.toFixed(3)}`}
                              >
                                <span className="text-white/80">{val.toFixed(2)}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Missing Values */}
          {stats && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">❓ Missing Values</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dataset.columns.map(col => (
                  <div key={col} className="bg-dark-800/40 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-xs text-purple-300/50 truncate">{col}</p>
                    <p className={`text-lg font-bold ${stats.missing[col] > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {stats.missing[col]}
                    </p>
                    <p className="text-xs text-purple-300/40">
                      {((stats.missing[col] / dataset.rows) * 100).toFixed(1)}% missing
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outliers */}
          {outliers && Object.keys(outliers).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">⚠️ Outlier Detection (IQR Method)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(outliers).map(([col, info]) => (
                  <div key={col} className="bg-dark-800/40 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-xs text-purple-300/50 truncate">{col}</p>
                    <p className={`text-lg font-bold ${info.count > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                      {info.count} outliers
                    </p>
                    <p className="text-xs text-purple-300/40">
                      Range: [{info.lower.toFixed(2)}, {info.upper.toFixed(2)}]
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
