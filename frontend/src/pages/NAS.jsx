import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import HowToUse from '../components/ui/HowToUse';

export default function NAS() {
  const [config, setConfig] = useState({ populationSize: 20, generations: 10, inputSize: 4, outputSize: 3 });
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState([]);
  const [history, setHistory] = useState([]);
  const [bestArch, setBestArch] = useState(null);
  const [genTable, setGenTable] = useState([]);
  const workerRef = useRef(null);
  const intervalRef = useRef(null);

  const activations = ['relu', 'sigmoid', 'tanh', 'elu'];
  
  const randomArch = () => {
    const numLayers = Math.floor(Math.random() * 4) + 1;
    const layers = [];
    for (let i = 0; i < numLayers; i++) {
      layers.push({
        size: Math.floor(Math.random() * 64) + 8,
        activation: activations[Math.floor(Math.random() * activations.length)]
      });
    }
    return { layers, fitness: 0, id: Math.random().toString(36).slice(2, 8) };
  };

  const mutate = (arch) => {
    const mutated = { ...arch, layers: [...arch.layers.map(l => ({ ...l }))], id: Math.random().toString(36).slice(2, 8) };
    const mutation = Math.floor(Math.random() * 4);
    switch (mutation) {
      case 0: // Add layer
        if (mutated.layers.length < 6) {
          mutated.layers.splice(Math.floor(Math.random() * mutated.layers.length), 0, {
            size: Math.floor(Math.random() * 64) + 8,
            activation: activations[Math.floor(Math.random() * activations.length)]
          });
        }
        break;
      case 1: // Remove layer
        if (mutated.layers.length > 1) {
          mutated.layers.splice(Math.floor(Math.random() * mutated.layers.length), 1);
        }
        break;
      case 2: // Change size
        const idx = Math.floor(Math.random() * mutated.layers.length);
        mutated.layers[idx].size = Math.max(4, mutated.layers[idx].size + Math.floor((Math.random() - 0.5) * 32));
        break;
      case 3: // Change activation
        const idx2 = Math.floor(Math.random() * mutated.layers.length);
        mutated.layers[idx2].activation = activations[Math.floor(Math.random() * activations.length)];
        break;
    }
    return mutated;
  };

  const crossover = (parent1, parent2) => {
    const child = { layers: [], fitness: 0, id: Math.random().toString(36).slice(2, 8) };
    const maxLen = Math.max(parent1.layers.length, parent2.layers.length);
    for (let i = 0; i < maxLen; i++) {
      if (Math.random() > 0.5 && i < parent1.layers.length) {
        child.layers.push({ ...parent1.layers[i] });
      } else if (i < parent2.layers.length) {
        child.layers.push({ ...parent2.layers[i] });
      }
    }
    if (child.layers.length === 0) child.layers.push({ size: 16, activation: 'relu' });
    return child;
  };

  const evaluateFitness = (arch) => {
    // Simulate fitness based on architecture complexity
    const totalParams = arch.layers.reduce((sum, l, i) => {
      const inputDim = i === 0 ? config.inputSize : arch.layers[i - 1].size;
      return sum + inputDim * l.size + l.size;
    }, 0);
    const lastLayer = arch.layers[arch.layers.length - 1].size;
    const outputParams = lastLayer * config.outputSize;
    const complexity = totalParams + outputParams;
    
    // Sweet spot: not too simple, not too complex
    const optimalComplexity = 500;
    const complexityPenalty = Math.abs(Math.log(complexity / optimalComplexity)) * 0.1;
    const depthBonus = Math.min(arch.layers.length * 0.05, 0.15);
    const activationBonus = arch.layers.some(l => l.activation === 'relu') ? 0.05 : 0;
    
    const baseFitness = 0.6 + Math.random() * 0.3;
    return Math.min(0.99, Math.max(0.1, baseFitness - complexityPenalty + depthBonus + activationBonus));
  };

  const startNAS = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(true);
    setGeneration(0);
    setHistory([]);
    setGenTable([]);
    setBestArch(null);

    // Initialize population
    let pop = Array.from({ length: config.populationSize }, () => randomArch());
    pop = pop.map(arch => ({ ...arch, fitness: evaluateFitness(arch) }));
    pop.sort((a, b) => b.fitness - a.fitness);
    setPopulation(pop);

    let gen = 0;
    intervalRef.current = setInterval(() => {
      gen++;
      if (gen > config.generations) {
        clearInterval(intervalRef.current);
        setRunning(false);
        setBestArch(pop[0]);
        return;
      }
      setGeneration(gen);

      // Selection: top 50%
      const survivors = pop.slice(0, Math.floor(pop.length / 2));
      
      // Create next generation
      const nextGen = [...survivors];
      while (nextGen.length < config.populationSize) {
        if (Math.random() > 0.3) {
          // Crossover
          const p1 = survivors[Math.floor(Math.random() * survivors.length)];
          const p2 = survivors[Math.floor(Math.random() * survivors.length)];
          const child = crossover(p1, p2);
          child.fitness = evaluateFitness(child);
          nextGen.push(child);
        } else {
          // Mutation
          const parent = survivors[Math.floor(Math.random() * survivors.length)];
          const mutated = mutate(parent);
          mutated.fitness = evaluateFitness(mutated);
          nextGen.push(mutated);
        }
      }
      
      nextGen.sort((a, b) => b.fitness - a.fitness);
      pop = nextGen;
      setPopulation([...pop]);
      
      const bestFitness = pop[0].fitness;
      const avgFitness = pop.reduce((s, a) => s + a.fitness, 0) / pop.length;
      const worstFitness = pop[pop.length - 1].fitness;
      
      setHistory(prev => [...prev, { gen, best: Number(bestFitness.toFixed(4)), avg: Number(avgFitness.toFixed(4)), worst: Number(worstFitness.toFixed(4)) }]);
      setGenTable(prev => [...prev, { gen, bestId: pop[0].id, layers: pop[0].layers.length, fitness: bestFitness.toFixed(4) }]);
      setBestArch(pop[0]);
    }, 1000);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <HowToUse pageId="nas" steps={[
      'Select a dataset.',
      'Configure population size and generations.',
      'Click \'Start Evolution\' to begin architecture search.',
      'Watch fitness improve over generations.',
      'Select the best architecture for training.'
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Neural Architecture Search</h1>
        <p className="text-purple-300/50 mt-1">Evolutionary algorithm to discover optimal network architectures</p>
      </div>

      {/* Config */}
      <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-purple-300/50">Population Size</label>
            <input type="number" min={10} max={50} value={config.populationSize}
              onChange={e => setConfig(p => ({ ...p, populationSize: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Generations</label>
            <input type="number" min={5} max={20} value={config.generations}
              onChange={e => setConfig(p => ({ ...p, generations: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Input Size</label>
            <input type="number" min={1} max={100} value={config.inputSize}
              onChange={e => setConfig(p => ({ ...p, inputSize: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
          <div>
            <label className="text-xs text-purple-300/50">Output Size</label>
            <input type="number" min={1} max={50} value={config.outputSize}
              onChange={e => setConfig(p => ({ ...p, outputSize: +e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-dark-900 border border-purple-500/30 rounded-lg text-white" disabled={running} />
          </div>
        </div>
        <button onClick={startNAS} disabled={running}
          className="mt-4 px-6 py-2 bg-gradient-btn text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
          {running ? `Running... Gen ${generation}/${config.generations}` : 'Start NAS'}
        </button>
      </div>

      {/* Fitness Chart */}
      {history.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Fitness Over Generations</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="gen" stroke="#6b5b95" label={{ value: 'Generation', position: 'bottom', fill: '#6b5b95' }} />
              <YAxis stroke="#6b5b95" domain={[0, 1]} />
              <Tooltip contentStyle={{ background: '#1E1045', border: '1px solid #2d1b69', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="best" stroke="#06b6d4" strokeWidth={2} name="Best" dot={false} />
              <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={2} name="Average" dot={false} />
              <Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={1} name="Worst" dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Architecture */}
        {bestArch && (
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Best Architecture</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-purple-300/50">Fitness:</span>
              <span className="text-lg font-bold text-purple-400">{(bestArch.fitness * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400">
                Input ({config.inputSize})
              </div>
              <span className="text-purple-300/40">→</span>
              {bestArch.layers.map((layer, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-primary-500/20 border border-primary-500/30 rounded-lg text-xs text-purple-400">
                    Dense({layer.size}) · {layer.activation}
                  </div>
                  {i < bestArch.layers.length - 1 && <span className="text-purple-300/40">→</span>}
                </div>
              ))}
              <span className="text-purple-300/40">→</span>
              <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400">
                Output ({config.outputSize})
              </div>
            </div>
          </div>
        )}

        {/* Generation Table */}
        {genTable.length > 0 && (
          <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Generation History</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-purple-300/50 border-b border-purple-500/20">
                    <th className="text-left py-2">Gen</th>
                    <th className="text-left py-2">Best ID</th>
                    <th className="text-left py-2">Layers</th>
                    <th className="text-left py-2">Fitness</th>
                  </tr>
                </thead>
                <tbody>
                  {genTable.map((row, i) => (
                    <tr key={i} className="border-b border-purple-500/20/50">
                      <td className="py-2 text-white">{row.gen}</td>
                      <td className="py-2 text-purple-200/70 font-mono">{row.bestId}</td>
                      <td className="py-2 text-purple-200/70">{row.layers}</td>
                      <td className="py-2 text-purple-400">{row.fitness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Current Population */}
      {population.length > 0 && (
        <div className="bg-dark-800/40 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-200/70 uppercase mb-4">Current Population (Top 10)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {population.slice(0, 10).map((arch, i) => (
              <div key={arch.id} className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg">
                <span className="text-xs text-purple-300/40 w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    {arch.layers.map((l, j) => (
                      <span key={j} className="text-xs px-1.5 py-0.5 bg-purple-500/15 rounded text-purple-200/70">
                        {l.size}·{l.activation.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm font-mono text-purple-400">{(arch.fitness * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
