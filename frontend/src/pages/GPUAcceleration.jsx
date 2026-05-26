import { useState } from 'react';

export default function GPUAcceleration() {
  const [gpuAvailable, setGpuAvailable] = useState(null);
  const [gpuInfo, setGpuInfo] = useState(null);
  const [backend, setBackend] = useState('cpu');
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkWebGPU = async () => {
    setChecking(true);
    try {
      if (!navigator.gpu) {
        setGpuAvailable(false);
        setGpuInfo({ error: 'WebGPU not supported in this browser' });
        setChecking(false);
        return;
      }

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        setGpuAvailable(false);
        setGpuInfo({ error: 'No GPU adapter found' });
        setChecking(false);
        return;
      }

      const info = await adapter.requestAdapterInfo?.() || {};
      const device = await adapter.requestDevice();
      
      setGpuAvailable(true);
      setGpuInfo({
        vendor: info.vendor || 'Unknown',
        architecture: info.architecture || 'Unknown',
        device: info.device || 'Unknown',
        description: info.description || 'WebGPU Device',
        maxBufferSize: device.limits.maxBufferSize,
        maxComputeWorkgroupsPerDimension: device.limits.maxComputeWorkgroupsPerDimension
      });
    } catch (err) {
      setGpuAvailable(false);
      setGpuInfo({ error: err.message });
    }
    setChecking(false);
  };

  const runBenchmark = async () => {
    setBenchmarkRunning(true);
    setBenchmarkResults(null);

    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');

      async function benchmark(backendName) {
        await tf.setBackend(backendName === 'gpu' ? 'webgl' : 'cpu');
        await tf.ready();

        const sizes = [100, 500, 1000, 2000];
        const results = [];

        for (const size of sizes) {
          const a = tf.randomNormal([size, size]);
          const b = tf.randomNormal([size, size]);

          // Warmup
          const warmup = tf.matMul(a, b);
          await warmup.data();
          warmup.dispose();

          // Benchmark
          const start = performance.now();
          const iterations = 5;
          for (let i = 0; i < iterations; i++) {
            const c = tf.matMul(a, b);
            await c.data();
            c.dispose();
          }
          const elapsed = (performance.now() - start) / iterations;

          results.push({ size, time: elapsed });
          a.dispose();
          b.dispose();
        }

        return results;
      }

      self.onmessage = async function(e) {
        try {
          self.postMessage({ type: 'status', message: 'Running CPU benchmark...' });
          const cpuResults = await benchmark('cpu');
          
          self.postMessage({ type: 'status', message: 'Running GPU (WebGL) benchmark...' });
          const gpuResults = await benchmark('gpu');

          self.postMessage({ type: 'done', cpuResults, gpuResults });
        } catch (err) {
          self.postMessage({ type: 'error', message: err.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'done') {
        setBenchmarkResults({
          cpu: msg.cpuResults,
          gpu: msg.gpuResults
        });
        setBenchmarkRunning(false);
        worker.terminate();
      } else if (msg.type === 'error') {
        setBenchmarkResults({ error: msg.message });
        setBenchmarkRunning(false);
        worker.terminate();
      }
    };

    worker.postMessage({ start: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-50">GPU Acceleration</h2>
        <p className="text-dark-400 mt-1">Detect WebGPU availability and compare CPU vs GPU performance</p>
      </div>

      {/* Detection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">🔍 Hardware Detection</h3>
        
        {gpuAvailable === null ? (
          <div className="text-center py-8">
            <button
              onClick={checkWebGPU}
              disabled={checking}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              {checking ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Detecting...</span>
                </>
              ) : (
                <>
                  <span>🖥️</span>
                  <span>Detect GPU Capabilities</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${gpuAvailable ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{gpuAvailable ? '✅' : '⚠️'}</span>
                <div>
                  <p className={`font-medium ${gpuAvailable ? 'text-green-400' : 'text-yellow-400'}`}>
                    {gpuAvailable ? 'WebGPU Available' : 'WebGPU Not Available'}
                  </p>
                  <p className="text-sm text-dark-400">
                    {gpuAvailable
                      ? 'Your browser supports GPU acceleration for ML training'
                      : gpuInfo?.error || 'GPU acceleration not available, using CPU fallback'}
                  </p>
                </div>
              </div>
            </div>

            {gpuAvailable && gpuInfo && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-xs text-dark-400">Vendor</p>
                  <p className="text-sm font-medium text-dark-100">{gpuInfo.vendor}</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-xs text-dark-400">Architecture</p>
                  <p className="text-sm font-medium text-dark-100">{gpuInfo.architecture}</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-xs text-dark-400">Device</p>
                  <p className="text-sm font-medium text-dark-100">{gpuInfo.device}</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-xs text-dark-400">Max Buffer Size</p>
                  <p className="text-sm font-medium text-dark-100">{gpuInfo.maxBufferSize ? `${(gpuInfo.maxBufferSize / 1024 / 1024).toFixed(0)} MB` : 'N/A'}</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-xs text-dark-400">Max Workgroups</p>
                  <p className="text-sm font-medium text-dark-100">{gpuInfo.maxComputeWorkgroupsPerDimension || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backend Toggle */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">⚙️ Training Backend</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setBackend('cpu')}
            className={`flex-1 p-4 rounded-lg border transition-colors ${
              backend === 'cpu'
                ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-400'
            }`}
          >
            <div className="text-2xl mb-2">🖥️</div>
            <p className="font-medium">CPU (Web Workers)</p>
            <p className="text-xs mt-1 opacity-70">Distributed across multiple workers</p>
          </button>
          <button
            onClick={() => setBackend('gpu')}
            className={`flex-1 p-4 rounded-lg border transition-colors ${
              backend === 'gpu'
                ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-400'
            }`}
          >
            <div className="text-2xl mb-2">🎮</div>
            <p className="font-medium">GPU (WebGL/WebGPU)</p>
            <p className="text-xs mt-1 opacity-70">Hardware accelerated on GPU</p>
            {!gpuAvailable && gpuAvailable !== null && (
              <p className="text-xs text-yellow-400 mt-2">⚠️ Not available on this device</p>
            )}
          </button>
        </div>
        <p className="text-xs text-dark-500 mt-3">
          Selected backend: <span className="text-primary-400 font-medium">{backend === 'cpu' ? 'CPU (Web Workers)' : 'GPU (WebGL/WebGPU)'}</span>
          {' '}— This setting applies to new training sessions.
        </p>
      </div>

      {/* Benchmark */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">🏎️ Speed Comparison</h3>
        <p className="text-sm text-dark-400 mb-4">
          Run a matrix multiplication benchmark to compare CPU vs GPU performance on your hardware.
        </p>

        <button
          onClick={runBenchmark}
          disabled={benchmarkRunning}
          className="btn-primary flex items-center gap-2"
        >
          {benchmarkRunning ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Running Benchmark...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Run Benchmark</span>
            </>
          )}
        </button>

        {benchmarkResults && !benchmarkResults.error && (
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-2 px-3 text-dark-400">Matrix Size</th>
                    <th className="text-right py-2 px-3 text-dark-400">CPU (ms)</th>
                    <th className="text-right py-2 px-3 text-dark-400">GPU (ms)</th>
                    <th className="text-right py-2 px-3 text-dark-400">Speedup</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.cpu.map((cpuResult, i) => {
                    const gpuResult = benchmarkResults.gpu[i];
                    const speedup = cpuResult.time / gpuResult.time;
                    return (
                      <tr key={i} className="border-b border-dark-800">
                        <td className="py-2 px-3 text-dark-200 font-mono">{cpuResult.size}x{cpuResult.size}</td>
                        <td className="text-right py-2 px-3 text-dark-300 font-mono">{cpuResult.time.toFixed(1)}</td>
                        <td className="text-right py-2 px-3 text-dark-300 font-mono">{gpuResult.time.toFixed(1)}</td>
                        <td className={`text-right py-2 px-3 font-mono font-bold ${speedup > 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {speedup.toFixed(1)}x
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-dark-500 mt-3">
              Benchmark: Matrix multiplication (A×B) averaged over 5 iterations per size.
              {benchmarkResults.gpu.some((g, i) => benchmarkResults.cpu[i].time / g.time > 2) && (
                <span className="text-green-400"> GPU shows significant speedup for larger matrices!</span>
              )}
            </p>
          </div>
        )}

        {benchmarkResults?.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">Benchmark error: {benchmarkResults.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
