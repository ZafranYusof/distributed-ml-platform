export const featuresData = [
  {
    id: 'training',
    name: 'Training',
    category: 'Model Development',
    overview: 'Launch and manage distributed model training jobs across your cluster. Supports multi-GPU, multi-node configurations with automatic checkpointing and fault tolerance.',
    steps: [
      { title: 'Select a model architecture', description: 'Choose from pre-built architectures or upload your own model definition file.' },
      { title: 'Configure training parameters', description: 'Set hyperparameters like learning rate, batch size, epochs, and optimizer. The platform validates configurations before submission.' },
      { title: 'Assign compute resources', description: 'Select GPU type, number of nodes, and memory allocation. The scheduler will find available slots automatically.' },
      { title: 'Launch the training job', description: 'Submit your job to the queue. You can monitor progress in real-time via the dashboard or subscribe to notifications.' },
      { title: 'Review results and artifacts', description: 'Once complete, view loss curves, metrics, and download model checkpoints from the artifacts panel.' }
    ],
    tips: [
      'Enable mixed-precision training (FP16) to nearly double throughput on supported GPUs.',
      'Use gradient accumulation if your batch size exceeds GPU memory — it simulates larger batches without OOM errors.',
      'Set up checkpoint intervals at 10-15% of total steps so you can resume without losing significant progress.'
    ],
    troubleshooting: [
      { problem: 'Job stuck in PENDING state for over 10 minutes', solution: 'Check cluster resource availability in the Admin panel. Your requested GPU type may be fully allocated — try a different node pool or reduce resource requirements.' },
      { problem: 'Training loss is NaN after a few steps', solution: 'Lower your learning rate by 10x and ensure input data has no missing values. Also verify that your model weights are properly initialized.' }
    ]
  },
  {
    id: 'automl',
    name: 'AutoML',
    category: 'Model Development',
    overview: 'Automatically search for optimal model architectures and hyperparameters. Runs parallel experiments using Bayesian optimization and early stopping to find the best configuration efficiently.',
    steps: [
      { title: 'Define the search space', description: 'Specify which hyperparameters to tune and their ranges. Supports continuous, discrete, and categorical parameters.' },
      { title: 'Set the optimization objective', description: 'Choose your target metric (accuracy, F1, RMSE, etc.) and whether to minimize or maximize it.' },
      { title: 'Configure budget and constraints', description: 'Set maximum number of trials, time limit, and resource caps per trial.' },
      { title: 'Launch the AutoML sweep', description: 'The system spawns parallel trials, prunes underperforming ones early, and converges on top candidates.' },
      { title: 'Export the best model', description: 'Review the leaderboard, compare top trials, and export the winning configuration as a reproducible training job.' }
    ],
    tips: [
      'Start with a broad search space and narrow it after the first 20-30 trials to avoid missing good regions.',
      'Enable early stopping with patience of 3-5 epochs to save compute on clearly underperforming trials.',
      'Use warm-starting from a known-good configuration to give the optimizer a head start.'
    ],
    troubleshooting: [
      { problem: 'All trials converge to the same suboptimal result', solution: 'Increase exploration by raising the exploration factor in Bayesian settings, or switch to random search for the first batch of trials.' },
      { problem: 'Trials failing with OOM errors', solution: 'Add memory as a constraint in your search space config, or set a maximum batch size ceiling that fits within your GPU memory.' }
    ]
  },
  {
    id: 'compare',
    name: 'Compare',
    category: 'Analysis',
    overview: 'Side-by-side comparison of model runs, metrics, and configurations. Quickly identify what changed between experiments and which modifications led to improvements.',
    steps: [
      { title: 'Select runs to compare', description: 'Pick 2-5 runs from your experiment history using checkboxes or search filters.' },
      { title: 'Choose comparison axes', description: 'Select which metrics, hyperparameters, and artifacts to display in the comparison view.' },
      { title: 'Analyze metric differences', description: 'View overlaid training curves, metric deltas, and statistical significance indicators.' },
      { title: 'Inspect configuration diffs', description: 'See a highlighted diff of hyperparameters and code changes between selected runs.' }
    ],
    tips: [
      'Tag your runs with meaningful labels before comparing — it makes the comparison table much easier to read.',
      'Use the "pin baseline" feature to always show your best run as a reference point.',
      'Export comparison tables as CSV for inclusion in reports or papers.'
    ],
    troubleshooting: [
      { problem: 'Metrics not showing up in comparison view', solution: 'Ensure all selected runs logged the same metric keys. Runs with different logging schemas will show blank cells for missing metrics.' },
      { problem: 'Training curves look misaligned on the x-axis', solution: 'Switch the x-axis from wall-clock time to step count. Different hardware speeds can make time-based comparisons misleading.' }
    ]
  },
  {
    id: 'nas',
    name: 'NAS',
    category: 'Model Development',
    overview: 'Neural Architecture Search discovers optimal network topologies automatically. Uses evolutionary algorithms and weight-sharing to explore architectures far beyond manual design.',
    steps: [
      { title: 'Define the search space', description: 'Specify allowed operations (convolutions, attention, skip connections) and connectivity constraints for the architecture cells.' },
      { title: 'Set evaluation criteria', description: 'Define target metrics and hardware constraints like latency budget or parameter count limits.' },
      { title: 'Run the search', description: 'The NAS controller generates candidate architectures, trains proxy models, and evolves the population over generations.' },
      { title: 'Evaluate top candidates', description: 'The best architectures are fully trained and validated to confirm their performance beyond proxy estimates.' },
      { title: 'Export and deploy', description: 'Download the discovered architecture as a model definition file ready for full-scale training or deployment.' }
    ],
    tips: [
      'Use weight-sharing (supernet) mode for 10-100x faster search compared to training each candidate from scratch.',
      'Constrain your search space to operations relevant to your domain — smaller spaces converge faster.',
      'Run NAS on a smaller proxy dataset first, then validate winners on the full dataset to save compute.'
    ],
    troubleshooting: [
      { problem: 'Search not converging after many generations', solution: 'Your search space may be too large. Reduce the number of allowed operations or cell depth, and increase population size for better coverage.' },
      { problem: 'Discovered architecture performs worse when fully trained', solution: 'This is a proxy-gap issue. Increase proxy training epochs or switch to a more representative subset of your data for evaluation.' }
    ]
  },
  {
    id: 'streaming-ml',
    name: 'Streaming ML',
    category: 'Real-time',
    overview: 'Train and update models on continuous data streams in real-time. Supports online learning, concept drift detection, and adaptive model updates without full retraining.',
    steps: [
      { title: 'Connect a data source', description: 'Link a Kafka topic, WebSocket endpoint, or any streaming source to the ingestion pipeline.' },
      { title: 'Configure the streaming model', description: 'Select an online-learning algorithm and set update frequency, window size, and drift detection sensitivity.' },
      { title: 'Set drift detection rules', description: 'Define thresholds for distribution shift alerts. The system monitors input features and prediction confidence continuously.' },
      { title: 'Deploy the streaming pipeline', description: 'Launch the pipeline. The model processes incoming data, updates weights incrementally, and serves predictions simultaneously.' },
      { title: 'Monitor and intervene', description: 'Watch real-time metrics on the dashboard. Set up automatic rollback triggers if performance degrades beyond acceptable bounds.' }
    ],
    tips: [
      'Set a warm-up period of at least 1000 samples before enabling drift detection to avoid false alarms on initial data.',
      'Use a sliding window for metrics calculation rather than cumulative — it surfaces recent degradation faster.',
      'Keep a shadow batch-trained model running in parallel as a fallback if the streaming model drifts too far.'
    ],
    troubleshooting: [
      { problem: 'Model performance oscillating wildly', solution: 'Your learning rate is likely too high for the stream velocity. Reduce it or enable adaptive learning rate that scales with data variance.' },
      { problem: 'Drift alerts firing constantly', solution: 'Increase the drift detection window size and raise the significance threshold. Some natural variation is expected — tune sensitivity to your domain.' }
    ]
  },
  {
    id: 'datasets',
    name: 'Datasets',
    category: 'Data Management',
    overview: 'Version, manage, and share datasets across your team. Supports large-scale datasets with deduplication, lineage tracking, and automatic format conversion.',
    steps: [
      { title: 'Upload or register a dataset', description: 'Upload files directly or register an existing storage path (S3, GCS, local). The system indexes metadata automatically.' },
      { title: 'Add schema and labels', description: 'Define column types, add descriptions, and tag the dataset with relevant labels for discoverability.' },
      { title: 'Version the dataset', description: 'Create a versioned snapshot. Changes are tracked as diffs so you can roll back or compare versions efficiently.' },
      { title: 'Share with your team', description: 'Set access permissions and publish the dataset to your organization catalog for others to discover and use.' }
    ],
    tips: [
      'Always version your dataset before starting a training run — it ensures full reproducibility of results.',
      'Use dataset profiles (auto-generated statistics) to catch data quality issues before they affect training.',
      'Enable deduplication on upload to avoid inflating your dataset with repeated samples.'
    ],
    troubleshooting: [
      { problem: 'Upload failing for large files (>5GB)', solution: 'Switch to multipart upload mode in settings, or use the CLI tool which handles chunking automatically. Check that your storage quota is not exceeded.' },
      { problem: 'Dataset version diff showing unexpected changes', solution: 'Ensure consistent row ordering before versioning. Random shuffles between versions will show every row as changed even if content is identical.' }
    ]
  },
  {
    id: 'data-explorer',
    name: 'Data Explorer',
    category: 'Data Management',
    overview: 'Visually explore and analyze your datasets with interactive charts and statistics. Identify patterns, outliers, and quality issues before they impact model performance.',
    steps: [
      { title: 'Load a dataset', description: 'Select any registered dataset from the catalog. Large datasets are sampled intelligently for responsive exploration.' },
      { title: 'Browse and filter', description: 'Use column filters, search, and sort to navigate your data. Apply SQL-like queries for complex filtering.' },
      { title: 'Generate visualizations', description: 'Create histograms, scatter plots, correlation matrices, and distribution charts with one click on any column.' },
      { title: 'Run quality checks', description: 'Execute automated data quality reports that flag missing values, outliers, class imbalance, and feature correlations.' },
      { title: 'Export insights', description: 'Save filtered subsets, export charts, or create a data quality report to share with your team.' }
    ],
    tips: [
      'Use the correlation matrix view early to identify redundant features that can be dropped to speed up training.',
      'Enable the outlier detection overlay on scatter plots to visually spot data points that may need cleaning.',
      'Bookmark commonly used filter combinations for quick access during iterative data cleaning.'
    ],
    troubleshooting: [
      { problem: 'Explorer is slow or unresponsive with large datasets', solution: 'Reduce the sample size in explorer settings. The default 10K sample is usually sufficient for pattern discovery — increase only if needed.' },
      { problem: 'Charts showing unexpected empty categories', solution: 'Check for whitespace or encoding issues in categorical columns. Use the trim/normalize transform in the data cleaning panel.' }
    ]
  },
  {
    id: 'inference',
    name: 'Inference',
    category: 'Deployment',
    overview: 'Deploy trained models as scalable API endpoints with automatic batching and load balancing. Supports real-time and batch inference with built-in monitoring.',
    steps: [
      { title: 'Select a model checkpoint', description: 'Choose a trained model from your artifacts. The system auto-detects framework and required dependencies.' },
      { title: 'Configure the endpoint', description: 'Set instance type, scaling rules (min/max replicas), batching parameters, and timeout thresholds.' },
      { title: 'Deploy the endpoint', description: 'Launch the inference service. The platform handles containerization, health checks, and rolling updates automatically.' },
      { title: 'Test with sample requests', description: 'Use the built-in playground to send test payloads and verify responses before routing production traffic.' },
      { title: 'Monitor in production', description: 'Track latency, throughput, error rates, and model drift through the inference dashboard.' }
    ],
    tips: [
      'Enable dynamic batching to group incoming requests — it can improve throughput by 3-5x with minimal latency increase.',
      'Set up a canary deployment when updating models to catch regressions before they affect all traffic.',
      'Use model warmup requests on startup to avoid cold-start latency spikes for the first real users.'
    ],
    troubleshooting: [
      { problem: 'High latency on first requests after deployment', solution: 'Enable model warmup in endpoint config. The system will send synthetic requests during startup to pre-load model weights into GPU memory.' },
      { problem: 'Endpoint returning 503 errors under load', solution: 'Increase max replicas in autoscaling config and lower the scale-up threshold. Also check if your batch timeout is too high, causing request queuing.' }
    ]
  },
  {
    id: 'pipeline-builder',
    name: 'Pipeline Builder',
    category: 'Orchestration',
    overview: 'Visually design end-to-end ML pipelines from data ingestion to deployment. Drag-and-drop nodes with automatic dependency resolution and scheduled execution.',
    steps: [
      { title: 'Create a new pipeline', description: 'Open the visual editor and start with a blank canvas or choose from pipeline templates for common workflows.' },
      { title: 'Add and connect nodes', description: 'Drag processing nodes (data load, transform, train, evaluate, deploy) onto the canvas and connect them to define data flow.' },
      { title: 'Configure each node', description: 'Click any node to set its parameters — input sources, transformations, model configs, or deployment targets.' },
      { title: 'Set triggers and schedule', description: 'Configure when the pipeline runs: on a cron schedule, on data arrival, on model drift detection, or manually.' },
      { title: 'Run and monitor', description: 'Execute the pipeline and watch each node complete in sequence. Failed nodes show detailed logs and can be retried individually.' }
    ],
    tips: [
      'Use conditional branches to skip expensive retraining when evaluation metrics show no degradation.',
      'Add notification nodes at critical points to alert your team on failures or significant metric changes.',
      'Version your pipelines alongside your code — the export-as-YAML feature makes them git-friendly.'
    ],
    troubleshooting: [
      { problem: 'Pipeline fails at a node but error message is vague', solution: 'Click the failed node and check the full execution logs tab. Most failures include a stack trace in the detailed view that the summary hides.' },
      { problem: 'Pipeline runs taking much longer than expected', solution: 'Check for data skew in parallel nodes — one partition may be much larger than others. Also verify that upstream nodes are not re-downloading cached data.' }
    ]
  },
  {
    id: 'rl-playground',
    name: 'RL Playground',
    category: 'Experimentation',
    overview: 'Interactive environment for reinforcement learning experimentation. Visualize agent behavior in real-time, tweak reward functions, and iterate on policies with instant feedback.',
    steps: [
      { title: 'Choose an environment', description: 'Select from built-in environments (CartPole, Atari, custom grids) or upload your own Gym-compatible environment.' },
      { title: 'Configure the agent', description: 'Pick an RL algorithm (PPO, DQN, SAC, A3C) and set its hyperparameters including network architecture and reward shaping.' },
      { title: 'Run training episodes', description: 'Start training and watch the agent learn in real-time through the visual renderer. Pause anytime to inspect state.' },
      { title: 'Analyze behavior', description: 'Review episode replays, reward curves, and action distribution heatmaps to understand what the agent learned.' },
      { title: 'Iterate on reward design', description: 'Modify the reward function using the visual editor, then retrain to see how behavior changes.' }
    ],
    tips: [
      'Start with a simple reward function and add complexity gradually — complex rewards often lead to unexpected exploits.',
      'Use the frame-by-frame replay to identify exactly where the agent makes poor decisions.',
      'Save policy checkpoints at regular intervals so you can compare behavior evolution over training.'
    ],
    troubleshooting: [
      { problem: 'Agent not learning (flat reward curve)', solution: 'Check that your reward signal is not too sparse. Add intermediate rewards for partial progress, or increase exploration (epsilon/entropy coefficient).' },
      { problem: 'Agent found an exploit instead of solving the task', solution: 'This means your reward function has a loophole. Review the replay to identify the exploit, then add a penalty term or constraint to close it.' }
    ]
  }
];
