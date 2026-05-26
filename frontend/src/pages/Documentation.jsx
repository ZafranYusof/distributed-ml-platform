import { useState, useMemo } from 'react';
import { Book, Search, ChevronRight, Rocket, Layers, Brain, Database, Wrench, Server, FlaskConical, Link2, Shield, TrendingUp, HelpCircle } from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    content: [
      { subtitle: 'Register an Account', text: 'Navigate to /register and create your account with email and password. You will be redirected to the dashboard upon successful registration.' },
      { subtitle: 'Upload Your First Dataset', text: 'Go to the Datasets page, drag and drop a CSV file or click to browse. You can also select a sample dataset (Iris, Housing, Sine Wave) to get started quickly.' },
      { subtitle: 'Train Your First Model', text: 'From the Dashboard, click "Start Training" or navigate to any training page. Select your dataset, configure model architecture and hyperparameters, choose the number of workers, and click Start Training.' },
      { subtitle: 'View Results', text: 'Monitor training progress in real-time. Once complete, view results in History, run inference, or compare models side by side.' },
    ]
  },
  {
    id: 'training',
    title: 'Training & AutoML',
    icon: Brain,
    features: [
      { name: 'Dashboard', description: 'Central hub showing training overview, recent activity, and quick actions to navigate features.', steps: ['View your training overview and recent activity.', 'Click any card to navigate to that feature.', 'Use quick actions to start training or upload data.'] },
      { name: 'Training', description: 'Distributed model training with real-time progress monitoring across multiple workers.', steps: ['Upload a dataset or select a sample dataset.', 'Configure model architecture (Linear/NN/CNN/RNN).', 'Set hyperparameters (learning rate, epochs, batch size).', 'Choose number of workers for distributed training.', "Click 'Start Training' and watch real-time progress."] },
      { name: 'AutoML', description: 'Automatic hyperparameter optimization that searches for the best model configuration.', steps: ['Select a dataset and target column.', "Click 'Start Search' to begin hyperparameter optimization.", 'View results ranked by performance.', "Click 'Use Config' to apply the best configuration."] },
      { name: 'Compare', description: 'Train multiple model configurations simultaneously and compare results side by side.', steps: ['Configure 2-6 different model configurations.', 'Select the same dataset for fair comparison.', "Click 'Start Comparison' to train all simultaneously.", 'View loss/accuracy charts side by side.'] },
      { name: 'Transfer Learning', description: 'Fine-tune pre-trained models (MobileNet, etc.) on your own data with layer freezing control.', steps: ['Select a pre-trained model (MobileNet, etc).', 'Toggle layers to freeze/unfreeze.', 'Add custom head layers.', 'Upload your dataset and fine-tune.'] },
      { name: 'Custom Loss', description: 'Write and validate custom loss functions in JavaScript for specialized training objectives.', steps: ['Write a custom loss function in JavaScript.', "Click 'Validate' to check syntax.", 'Test with sample data.', 'Save to your library for use in training.'] },
      { name: 'GPU Acceleration', description: 'Leverage WebGPU for faster training with CPU/GPU benchmarking.', steps: ['Check if WebGPU is available on your device.', 'Toggle between CPU and GPU mode.', 'Run benchmark to compare speeds.', 'Use GPU mode for faster training.'] },
    ]
  },
  {
    id: 'data',
    title: 'Data Management',
    icon: Database,
    features: [
      { name: 'Datasets', description: 'Upload, organize, tag, and version control your datasets.', steps: ['Drag & drop a CSV file or click to browse.', 'Or select a sample dataset (Iris, Housing, Sine Wave).', 'Tag and organize datasets.', 'Use version control to track changes.'] },
      { name: 'Data Explorer', description: 'Explore column distributions, correlations, statistics, and identify outliers.', steps: ['Select a dataset to explore.', 'View column distributions, correlations, and statistics.', 'Identify outliers using IQR method.', 'Check for missing values.'] },
      { name: 'Data Catalog', description: 'Browse and search all datasets, models, and experiments in one place.', steps: ['Browse all datasets, models, and experiments.', 'Use search and filters to find items.', 'Click any item for details.', 'Quick actions: open, clone, or delete.'] },
      { name: 'Augmentation', description: 'Apply data augmentation techniques like noise injection, SMOTE, and rotation.', steps: ['Select a dataset.', 'Choose augmentation techniques (noise, SMOTE, rotation).', 'Preview augmented samples.', 'Apply to create new augmented dataset.'] },
      { name: 'Annotations', description: 'Label data with custom categories and track inter-annotator agreement.', steps: ['Upload raw data (CSV).', 'Define label categories.', 'Label rows one by one.', 'View inter-annotator agreement.', 'Export final labeled dataset.'] },
      { name: 'Synthetic Data', description: 'Generate synthetic datasets with configurable distributions and correlations.', steps: ['Configure number of rows and columns.', 'Set distribution per column (normal, uniform, etc).', 'Set correlations between columns.', 'Add anomalies if needed.', 'Preview and export as CSV.'] },
      { name: 'Auto Features', description: 'Automatic feature engineering with polynomial, interaction, and binning methods.', steps: ['Select a dataset and target column.', 'Choose feature generation methods (polynomial, interactions, binning).', 'View generated features ranked by correlation.', 'Select top K features to keep.'] },
    ]
  },
  {
    id: 'models',
    title: 'Models & Inference',
    icon: Layers,
    features: [
      { name: 'Inference', description: 'Run predictions on trained models with confidence scores.', steps: ['Load a trained model.', 'Input feature values.', "Click 'Predict' to get results.", 'View confidence scores.', 'Download model as JSON.'] },
      { name: 'Model Versions', description: 'Track, compare, and rollback model versions.', steps: ['View all versions of your models.', 'Compare versions side by side.', 'Rollback to a previous version if needed.'] },
      { name: 'Marketplace', description: 'Browse, download, and publish community models.', steps: ['Browse community models.', 'Search by name or tags.', "Click 'Download' to use a model.", 'Publish your own models for others.'] },
      { name: 'Ensemble', description: 'Combine multiple models using Bagging, Boosting, or Stacking methods.', steps: ['Select multiple trained models.', 'Choose ensemble method (Bagging/Boosting/Stacking).', 'Or use Auto-Ensemble to pick top N.', 'Compare ensemble vs individual performance.'] },
      { name: 'Compression', description: 'Reduce model size with quantization, pruning, or knowledge distillation.', steps: ['Load a trained model.', 'Choose technique: Quantization, Pruning, or Distillation.', 'Configure parameters (threshold, target size).', 'View size reduction and accuracy impact.'] },
      { name: 'Model Cards', description: 'Auto-generate model documentation with intended use and limitations.', steps: ['Select a trained model.', "Click 'Generate Card' to auto-create documentation.", 'Edit description, intended use, and limitations.', 'Export as markdown.'] },
      { name: 'A/B Testing', description: 'Deploy two models and compare performance with traffic splitting.', steps: ['Deploy two trained models.', 'Set traffic split ratio (e.g., 70/30).', 'Send test predictions.', 'Monitor which model performs better over time.'] },
      { name: 'Inference API', description: 'Deploy models as REST APIs with key management and rate limiting.', steps: ['Select a trained model to deploy.', 'Generate an API key.', 'Set rate limits.', 'Use the test panel to verify.', 'Monitor usage in the dashboard.'] },
    ]
  },
  {
    id: 'mlops',
    title: 'MLOps & Monitoring',
    icon: Server,
    features: [
      { name: 'Monitoring', description: 'Monitor deployed models for drift and performance degradation.', steps: ['Select a deployed model to monitor.', 'Log predictions and actual outcomes.', 'View drift detection alerts.', "Click 'Retrain' if performance degrades."] },
      { name: 'Data Lineage', description: 'Visualize data flow through your pipeline as a DAG.', steps: ['View the data lineage DAG.', 'Click nodes to see details.', 'Track how data flows through your pipeline.', 'Save lineage graphs.'] },
      { name: 'Feature Store', description: 'Define, version, and reuse feature transformations across experiments.', steps: ['Define feature transformations (code).', 'Run on a dataset to compute features.', 'Version and reuse across experiments.', 'Track feature lineage.'] },
      { name: 'MLOps CI/CD', description: 'Automated quality gates, deployment, and rollback for ML models.', steps: ['Set quality gates (accuracy thresholds).', 'Deploy models that pass gates.', 'Monitor deployed models.', 'Auto-rollback if performance drops.', 'View audit trail.'] },
      { name: 'Debug Studio', description: 'Step through predictions, inspect activations, and analyze errors.', steps: ['Load a trained model and test dataset.', 'Step through predictions one by one.', 'Inspect layer activations.', 'View confusion matrix and error analysis.'] },
      { name: 'Explainability', description: 'Understand model decisions with LIME, counterfactuals, and decision boundaries.', steps: ['Load a trained model.', 'Select a data point to explain.', 'View LIME feature contributions.', 'Explore counterfactual examples.', 'Visualize decision boundaries.'] },
    ]
  },
  {
    id: 'tools',
    title: 'Tools & Workflows',
    icon: Wrench,
    features: [
      { name: 'Pipeline Builder', description: 'Visual drag-and-drop pipeline construction with configurable nodes.', steps: ['Drag nodes from the palette onto the canvas.', 'Connect nodes to define data flow.', "Configure each node's parameters.", "Click 'Execute' to run the pipeline."] },
      { name: 'Notebook', description: 'Interactive JavaScript notebook with code and markdown cells.', steps: ['Add cells (code or markdown).', 'Write JavaScript in code cells.', "Click 'Run' to execute.", 'Reorder cells by dragging.', 'Save notebooks for later.'] },
      { name: 'History', description: 'Browse, filter, and compare past training sessions.', steps: ['Browse past training sessions.', 'Click any session to view details.', 'Select multiple sessions to compare.', 'Use filters to find specific runs.'] },
      { name: 'Orchestration', description: 'Build and execute pipeline DAGs with conditional branches and auto-retry.', steps: ['Build a pipeline DAG visually.', 'Add conditional branches and parallel steps.', "Click 'Run' to execute.", 'Monitor node status in real-time.', 'Failed steps auto-retry.'] },
    ]
  },
  {
    id: 'research',
    title: 'Research & Advanced',
    icon: FlaskConical,
    features: [
      { name: 'NAS (Neural Architecture Search)', description: 'Evolutionary architecture search to find optimal network topologies.', steps: ['Select a dataset.', 'Configure population size and generations.', "Click 'Start Evolution' to begin architecture search.", 'Watch fitness improve over generations.', 'Select the best architecture for training.'] },
      { name: 'Streaming ML', description: 'Online learning with concept drift detection and real-time adaptation.', steps: ['Configure data stream rate and window size.', "Click 'Start Stream' to begin online learning.", 'Inject concept drift to test adaptation.', 'Monitor accuracy and model updates in real-time.'] },
      { name: 'RL Playground', description: 'Train reinforcement learning agents in Grid World, Cart Pole, or Trading environments.', steps: ['Choose an environment (Grid World, Cart Pole, Trading).', 'Select algorithm (Q-Learning, DQN, REINFORCE).', 'Configure hyperparameters.', "Click 'Train' and watch the agent learn."] },
      { name: 'Federated Learning', description: 'Privacy-preserving distributed training across multiple simulated clients.', steps: ['Configure number of clients (2-10).', 'Set privacy options (differential privacy).', "Click 'Start' to begin federated training.", 'Watch per-client metrics and global convergence.'] },
      { name: 'Active Learning', description: 'Iteratively label the most informative samples to improve model efficiency.', steps: ['Upload a partially labeled dataset.', 'Train initial model.', 'Model identifies uncertain samples.', 'Label suggested samples.', 'Retrain and repeat.'] },
      { name: 'GPU Cluster', description: 'Simulate multi-machine distributed training with fault tolerance.', steps: ['Configure cluster (machines and workers per machine).', 'Start distributed training.', 'Simulate faults to test recovery.', 'Add/remove nodes elastically.'] },
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Link2,
    features: [
      { name: 'GitHub Integration', description: 'Link models to commits and enable auto-versioning on push.', steps: ['Enter your GitHub repo URL and personal access token.', 'View recent commits.', 'Enable auto-versioning on push.', 'Link models to commits.'] },
      { name: 'Webhooks', description: 'Send notifications to Slack, Discord, or custom URLs on platform events.', steps: ['Add a webhook URL (Slack/Discord/custom).', 'Select events to notify (training done, drift, deploy).', "Click 'Test' to verify.", 'Toggle active/inactive.'] },
    ]
  },
  {
    id: 'platform',
    title: 'Platform & Admin',
    icon: Shield,
    features: [
      { name: 'Organizations', description: 'Create teams, invite members, and manage roles and shared resources.', steps: ['Create an organization.', 'Invite team members by email.', 'Assign roles (Admin/Member/Viewer).', 'Share resources within the org.'] },
      { name: 'Admin Dashboard', description: 'Platform-wide statistics, user monitoring, and resource usage.', steps: ['View platform-wide statistics.', 'Monitor active users and training jobs.', 'Check resource usage.', 'View recent activity feed.'] },
      { name: 'Analytics', description: 'Personal usage stats, feature heatmaps, and experiment tracking.', steps: ['View your personal usage stats.', 'Check feature usage heatmap.', 'Identify peak usage hours.', 'Track experiments and training time.'] },
      { name: 'Live Sessions', description: 'See who is currently training and monitor platform activity.', steps: ["View who's currently training.", 'See real-time progress of other users.', 'Monitor platform activity.'] },
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: TrendingUp,
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register a new user account' },
      { method: 'POST', path: '/api/auth/login', description: 'Login and receive JWT token' },
      { method: 'GET', path: '/api/datasets', description: 'List all datasets for the authenticated user' },
      { method: 'POST', path: '/api/datasets', description: 'Upload a new dataset' },
      { method: 'GET', path: '/api/datasets/:id', description: 'Get dataset details and content' },
      { method: 'DELETE', path: '/api/datasets/:id', description: 'Delete a dataset' },
      { method: 'POST', path: '/api/training/start', description: 'Start a new training session' },
      { method: 'GET', path: '/api/training/:id/status', description: 'Get training session status and metrics' },
      { method: 'POST', path: '/api/training/:id/stop', description: 'Stop a running training session' },
      { method: 'GET', path: '/api/history', description: 'List all past training sessions' },
      { method: 'GET', path: '/api/history/:id', description: 'Get detailed history for a session' },
      { method: 'DELETE', path: '/api/history/:id', description: 'Delete a training session from history' },
      { method: 'GET', path: '/api/models', description: 'List all saved models' },
      { method: 'GET', path: '/api/models/:id', description: 'Get model details and weights' },
      { method: 'POST', path: '/api/models/:id/predict', description: 'Run inference on a model' },
      { method: 'GET', path: '/api/models/:id/versions', description: 'List model versions' },
      { method: 'POST', path: '/api/models/:id/deploy', description: 'Deploy model to inference API' },
      { method: 'GET', path: '/api/marketplace', description: 'Browse community models' },
      { method: 'POST', path: '/api/marketplace/publish', description: 'Publish a model to marketplace' },
      { method: 'GET', path: '/api/organizations', description: 'List user organizations' },
      { method: 'POST', path: '/api/organizations', description: 'Create a new organization' },
      { method: 'POST', path: '/api/organizations/:id/invite', description: 'Invite a member to organization' },
    ]
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    questions: [
      { q: 'What file formats are supported for datasets?', a: 'Currently, CSV files are supported. Drag and drop or browse to upload. Sample datasets are also available for quick experimentation.' },
      { q: 'How does distributed training work?', a: 'Training is split across multiple Web Workers that simulate distributed nodes. Each worker trains on a partition of the data and gradients are aggregated using federated averaging.' },
      { q: 'Can I use GPU acceleration?', a: 'Yes! If your browser supports WebGPU, you can toggle GPU mode on the GPU Acceleration page. Run the benchmark to see speed improvements.' },
      { q: 'How do I deploy a model as an API?', a: 'Go to Inference API, select a trained model, generate an API key, set rate limits, and your model is accessible via REST endpoint.' },
      { q: 'Is my data private?', a: 'All data stays in your browser and on the server you deploy to. No data is sent to third parties. Federated learning simulates privacy-preserving training locally.' },
      { q: 'Can I collaborate with my team?', a: 'Yes! Create an Organization, invite team members by email, assign roles (Admin/Member/Viewer), and share datasets and models within the org.' },
      { q: 'What model architectures are supported?', a: 'Linear regression, Neural Networks (fully connected), CNNs (convolutional), and RNNs (LSTM/GRU). You can also use Transfer Learning with pre-trained models or NAS to discover architectures.' },
      { q: 'How do I monitor model performance in production?', a: 'Use the Monitoring page to track predictions, detect data drift, and set up alerts. MLOps CI/CD provides automated quality gates and rollback.' },
      { q: 'Can I write custom loss functions?', a: 'Yes! The Custom Loss page lets you write JavaScript loss functions, validate syntax, test with sample data, and save to your library.' },
      { q: 'How do I compare different models?', a: 'Use the Compare page to train 2-6 configurations simultaneously on the same dataset and view loss/accuracy charts side by side.' },
    ]
  },
];

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(section => {
      if (section.title.toLowerCase().includes(q)) return true;
      if (section.content) return section.content.some(c => c.subtitle.toLowerCase().includes(q) || c.text.toLowerCase().includes(q));
      if (section.features) return section.features.some(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
      if (section.endpoints) return section.endpoints.some(e => e.path.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
      if (section.questions) return section.questions.some(faq => faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q));
      return false;
    });
  }, [searchQuery]);

  const activeData = sections.find(s => s.id === activeSection);

  return (
    <div className="flex gap-6 animate-fade-in min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-6 space-y-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-800/50 border border-purple-500/20 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <nav className="space-y-1" aria-label="Documentation sections">
            {filteredSections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {section.title}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Book className="w-8 h-8 text-purple-400" />
            Documentation
          </h1>
          <p className="text-purple-300/60 mt-1">Everything you need to know about the Distributed ML Training Platform</p>
        </div>

        {/* Mobile section selector */}
        <div className="lg:hidden mb-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-800/50 border border-purple-500/20 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-dark-800/50 border border-purple-500/20 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50"
          >
            {filteredSections.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {activeData && (
          <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-3 pb-4 border-b border-purple-500/20">
              {(() => { const Icon = activeData.icon; return <Icon className="w-6 h-6 text-purple-400" />; })()}
              <h2 className="text-2xl font-semibold text-white">{activeData.title}</h2>
            </div>

            {/* Getting Started content */}
            {activeData.content && (
              <div className="space-y-6">
                {activeData.content.map((item, i) => (
                  <div key={i} className="rounded-xl border border-purple-500/20 bg-purple-900/10 backdrop-blur-sm p-5">
                    <h3 className="text-lg font-medium text-purple-200 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-300 font-bold">{i + 1}</span>
                      {item.subtitle}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Features content */}
            {activeData.features && (
              <div className="space-y-4">
                {activeData.features.map((feature, i) => (
                  <details key={i} className="group rounded-xl border border-purple-500/20 bg-purple-900/10 backdrop-blur-sm overflow-hidden">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-purple-500/10 transition-colors">
                      <div>
                        <h3 className="text-base font-medium text-purple-200">{feature.name}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{feature.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-400 transition-transform group-open:rotate-90 shrink-0 ml-3" />
                    </summary>
                    <div className="px-5 pb-4 border-t border-purple-500/10 pt-3">
                      <h4 className="text-sm font-medium text-purple-300 mb-2">How to Use:</h4>
                      <ol className="space-y-1.5 text-sm text-gray-300 list-decimal list-inside">
                        {feature.steps.map((step, j) => (
                          <li key={j} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* API Reference */}
            {activeData.endpoints && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-500/20">
                        <th className="text-left px-5 py-3 text-purple-300 font-medium">Method</th>
                        <th className="text-left px-5 py-3 text-purple-300 font-medium">Endpoint</th>
                        <th className="text-left px-5 py-3 text-purple-300 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeData.endpoints.map((ep, i) => (
                        <tr key={i} className="border-b border-purple-500/10 last:border-0">
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              ep.method === 'GET' ? 'bg-green-500/20 text-green-300' :
                              ep.method === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                              ep.method === 'DELETE' ? 'bg-red-500/20 text-red-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>{ep.method}</span>
                          </td>
                          <td className="px-5 py-3 font-mono text-gray-300">{ep.path}</td>
                          <td className="px-5 py-3 text-gray-400">{ep.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FAQ */}
            {activeData.questions && (
              <div className="space-y-3">
                {activeData.questions.map((faq, i) => (
                  <details key={i} className="group rounded-xl border border-purple-500/20 bg-purple-900/10 backdrop-blur-sm overflow-hidden">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-purple-500/10 transition-colors">
                      <h3 className="text-sm font-medium text-purple-200 pr-4">{faq.q}</h3>
                      <ChevronRight className="w-4 h-4 text-purple-400 transition-transform group-open:rotate-90 shrink-0" />
                    </summary>
                    <div className="px-5 pb-4 border-t border-purple-500/10 pt-3">
                      <p className="text-sm text-gray-300 leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
