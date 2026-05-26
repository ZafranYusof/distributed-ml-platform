export const featuresAdvancedData = [
  {
    id: 'federated-learning',
    name: 'Federated Learning',
    category: 'Training',
    overview: 'Train models across distributed devices without centralizing raw data. Preserves privacy while enabling collaborative model improvement across organizations.',
    steps: [
      { title: 'Configure Federation', description: 'Set up federation topology, select aggregation strategy (FedAvg, FedProx), and define communication rounds.' },
      { title: 'Register Participants', description: 'Add worker nodes or organizations as federation participants with their local dataset configurations.' },
      { title: 'Define Privacy Budget', description: 'Set differential privacy parameters (epsilon, delta) and secure aggregation protocols.' },
      { title: 'Launch Training', description: 'Start federated rounds - each participant trains locally, then submits encrypted gradients for aggregation.' },
      { title: 'Evaluate Global Model', description: 'Review convergence metrics, per-participant contributions, and validate the aggregated model on held-out data.' }
    ],
    tips: [
      'Use FedProx for heterogeneous data distributions across participants.',
      'Set minimum participation thresholds to avoid biased aggregation rounds.',
      'Enable secure aggregation when working with sensitive healthcare or financial data.'
    ],
    troubleshooting: [
      { problem: 'Model diverges after several rounds', solution: 'Reduce local epochs per round or increase the proximal term (mu) in FedProx to keep local models closer to the global model.' },
      { problem: 'Participants timing out during aggregation', solution: 'Increase round timeout, enable async aggregation, or check network connectivity between nodes.' }
    ]
  },
  {
    id: 'active-learning',
    name: 'Active Learning',
    category: 'Data',
    overview: 'Intelligently select the most informative samples for labeling to maximize model performance with minimal annotation effort. Reduces labeling costs by up to 70% compared to random sampling.',
    steps: [
      { title: 'Upload Unlabeled Pool', description: 'Import your unlabeled dataset that the system will query from during active learning cycles.' },
      { title: 'Choose Query Strategy', description: 'Select from uncertainty sampling, query-by-committee, expected model change, or diversity sampling.' },
      { title: 'Configure Batch Size', description: 'Set how many samples to select per iteration and define stopping criteria (accuracy threshold or budget).' },
      { title: 'Label Selected Samples', description: 'Review and annotate the queried samples using the built-in labeling interface or export to external tools.' },
      { title: 'Retrain and Iterate', description: 'Retrain the model with newly labeled data and repeat until performance targets are met.' }
    ],
    tips: [
      'Start with uncertainty sampling for classification tasks - it\'s simple and effective.',
      'Combine diversity sampling with uncertainty to avoid redundant selections in clustered data.',
      'Set a validation holdout early to track genuine improvement across iterations.'
    ],
    troubleshooting: [
      { problem: 'Query strategy keeps selecting outliers', solution: 'Add a diversity constraint or filter samples with prediction entropy above a threshold to avoid noise.' },
      { problem: 'Model performance plateaus despite more labels', solution: 'Switch query strategy, check for label noise in annotations, or increase model capacity.' }
    ]
  },
  {
    id: 'gpu-cluster',
    name: 'GPU Cluster',
    category: 'Infrastructure',
    overview: 'Manage and orchestrate multi-GPU and multi-node training clusters from a single dashboard. Supports NVIDIA, AMD, and cloud GPU instances with automatic scaling.',
    steps: [
      { title: 'Register GPU Nodes', description: 'Add physical or cloud GPU nodes by installing the worker agent and providing connection credentials.' },
      { title: 'Configure Resource Pools', description: 'Group GPUs into pools by type, memory, or team allocation for efficient scheduling.' },
      { title: 'Set Scheduling Policy', description: 'Choose between FIFO, priority-based, or fair-share scheduling across teams and projects.' },
      { title: 'Monitor Utilization', description: 'Track GPU memory, compute utilization, temperature, and power draw in real-time dashboards.' }
    ],
    tips: [
      'Use mixed-precision training (FP16/BF16) to nearly double effective GPU memory.',
      'Enable NCCL topology detection for optimal multi-GPU communication paths.',
      'Set memory headroom alerts at 90% to prevent OOM crashes during training.'
    ],
    troubleshooting: [
      { problem: 'GPU nodes showing as offline', solution: 'Verify the worker agent is running, check firewall rules for port 8471, and ensure CUDA drivers are loaded.' },
      { problem: 'Multi-GPU training slower than single GPU', solution: 'Check inter-node bandwidth, enable gradient compression, or reduce communication frequency with gradient accumulation.' }
    ]
  },
  {
    id: 'orchestration',
    name: 'Orchestration',
    category: 'Infrastructure',
    overview: 'Define complex training pipelines as DAGs with automatic dependency resolution and fault tolerance. Chain preprocessing, training, evaluation, and deployment into reproducible workflows.',
    steps: [
      { title: 'Define Pipeline Steps', description: 'Create pipeline nodes for each stage - data prep, training, evaluation, model registration - with inputs/outputs.' },
      { title: 'Set Dependencies', description: 'Connect steps as a directed acyclic graph with conditional branching and parallel execution paths.' },
      { title: 'Configure Retry Policies', description: 'Set per-step retry counts, backoff strategies, and failure notifications for robust execution.' },
      { title: 'Schedule or Trigger', description: 'Run pipelines on-demand, on a cron schedule, or triggered by events like new data uploads.' },
      { title: 'Review Execution History', description: 'Inspect run logs, step durations, artifacts produced, and compare across pipeline versions.' }
    ],
    tips: [
      'Use pipeline templates for common patterns like train-evaluate-deploy to avoid rebuilding from scratch.',
      'Cache intermediate artifacts between steps to skip redundant computation on reruns.',
      'Set resource requests per step so lightweight preprocessing doesn\'t block GPU queues.'
    ],
    troubleshooting: [
      { problem: 'Pipeline stuck in pending state', solution: 'Check resource availability for the pending step, verify dependencies completed successfully, and review queue priority.' },
      { problem: 'Downstream steps using stale artifacts', solution: 'Clear the artifact cache for the pipeline run or enable content-hash validation between steps.' }
    ]
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    category: 'Operations',
    overview: 'Real-time observability for training jobs, model performance, and infrastructure health. Includes alerting, anomaly detection, and automated incident response.',
    steps: [
      { title: 'Connect Data Sources', description: 'Link training logs, system metrics, and model predictions to the monitoring backend.' },
      { title: 'Create Dashboards', description: 'Build custom dashboards with loss curves, GPU metrics, data drift indicators, and prediction distributions.' },
      { title: 'Configure Alerts', description: 'Set threshold and anomaly-based alerts for training loss spikes, GPU failures, or prediction drift.' },
      { title: 'Set Up Runbooks', description: 'Attach automated or manual runbooks to alerts for consistent incident response.' }
    ],
    tips: [
      'Track both training metrics (loss, accuracy) and system metrics (GPU util, memory) on the same timeline.',
      'Use rolling window comparisons to detect gradual model degradation before it impacts users.',
      'Export metrics to Prometheus/Grafana for integration with existing infrastructure monitoring.'
    ],
    troubleshooting: [
      { problem: 'Metrics not appearing in dashboard', solution: 'Verify the logging SDK is initialized before training starts and check that metric names match dashboard queries.' },
      { problem: 'Too many false-positive alerts', solution: 'Increase alert evaluation windows, add minimum occurrence thresholds, or switch to anomaly-based detection.' }
    ]
  },
  {
    id: 'mlops-cicd',
    name: 'MLOps CI/CD',
    category: 'Operations',
    overview: 'Automated pipelines for testing, validating, and deploying ML models with quality gates. Ensures only validated models reach production with full audit trails.',
    steps: [
      { title: 'Define Quality Gates', description: 'Set minimum accuracy, latency, fairness, and data validation thresholds that models must pass.' },
      { title: 'Configure Test Suites', description: 'Add unit tests for preprocessing, integration tests for pipelines, and performance benchmarks for models.' },
      { title: 'Set Up Deployment Targets', description: 'Register staging and production endpoints with rollback capabilities and traffic splitting.' },
      { title: 'Enable Automated Rollback', description: 'Configure canary analysis to automatically revert deployments if error rates exceed thresholds.' }
    ],
    tips: [
      'Always validate model inputs/outputs schema as a CI step to catch breaking changes early.',
      'Use shadow deployments to test new models against production traffic without serving predictions.',
      'Version your training data alongside model artifacts for full reproducibility.'
    ],
    troubleshooting: [
      { problem: 'CI pipeline passes but model fails in production', solution: 'Add production-like data samples to your test suite and validate serving infrastructure (latency, memory) in staging.' },
      { problem: 'Deployment rollback not triggering', solution: 'Check canary metric collection delay, verify rollback thresholds are realistic, and ensure monitoring agent is healthy.' }
    ]
  },
  {
    id: 'organizations',
    name: 'Organizations',
    category: 'Collaboration',
    overview: 'Multi-tenant workspace management with role-based access control, resource quotas, and team collaboration features. Isolate projects while enabling cross-team model sharing.',
    steps: [
      { title: 'Create Organization', description: 'Set up your org with billing, default resource quotas, and SSO/SAML configuration.' },
      { title: 'Define Teams and Roles', description: 'Create teams with granular permissions - admin, trainer, viewer - and assign members.' },
      { title: 'Set Resource Quotas', description: 'Allocate GPU hours, storage, and concurrent job limits per team to prevent resource contention.' },
      { title: 'Configure Shared Resources', description: 'Set up shared model registries, dataset catalogs, and experiment tracking across teams.' }
    ],
    tips: [
      'Use project-level isolation for sensitive work and org-level sharing for common utilities.',
      'Set up approval workflows for cross-team model promotions to production.',
      'Enable audit logging from day one - retroactive compliance is painful.'
    ],
    troubleshooting: [
      { problem: 'Team members cannot access shared datasets', solution: 'Check dataset visibility settings, verify team membership, and ensure the dataset owner granted cross-team read access.' },
      { problem: 'Resource quota exceeded but jobs still queued', solution: 'Queued jobs count against quota. Cancel stale jobs or request a temporary quota increase from org admin.' }
    ]
  },
  {
    id: 'ensemble',
    name: 'Ensemble Methods',
    category: 'Training',
    overview: 'Combine multiple models for superior prediction accuracy and robustness. Supports bagging, boosting, stacking, and custom voting strategies with automated hyperparameter search.',
    steps: [
      { title: 'Select Base Models', description: 'Choose 3-7 diverse models from your registry or train new ones with different architectures/hyperparameters.' },
      { title: 'Choose Ensemble Strategy', description: 'Pick from majority voting, weighted averaging, stacking with a meta-learner, or custom combination logic.' },
      { title: 'Train Meta-Learner', description: 'For stacking ensembles, train the second-level model on base model predictions using cross-validated outputs.' },
      { title: 'Evaluate Ensemble', description: 'Compare ensemble performance against individual models on holdout data across multiple metrics.' },
      { title: 'Deploy as Single Endpoint', description: 'Package the ensemble as a unified inference endpoint with automatic model routing.' }
    ],
    tips: [
      'Diversity matters more than individual model accuracy - combine different architectures.',
      'Use cross-validated predictions for stacking to avoid data leakage in the meta-learner.',
      'Monitor individual model contributions and prune underperformers to reduce inference cost.'
    ],
    troubleshooting: [
      { problem: 'Ensemble performs worse than best individual model', solution: 'Check for correlated errors across base models. Add more diverse architectures or use learned weights instead of uniform averaging.' },
      { problem: 'Inference latency too high for production', solution: 'Use parallel inference, distill the ensemble into a single model, or implement early-exit strategies.' }
    ]
  },
  {
    id: 'explainability',
    name: 'Explainability',
    category: 'Analysis',
    overview: 'Understand why your models make specific predictions with SHAP, LIME, attention visualization, and feature attribution. Essential for debugging, compliance, and stakeholder trust.',
    steps: [
      { title: 'Select Explanation Method', description: 'Choose from SHAP (global/local), LIME (local), integrated gradients, or attention maps based on model type.' },
      { title: 'Generate Explanations', description: 'Run the explainer on individual predictions or aggregate across the dataset for global feature importance.' },
      { title: 'Visualize Results', description: 'View force plots, waterfall charts, feature interaction maps, and attention heatmaps in the dashboard.' },
      { title: 'Export Reports', description: 'Generate PDF/HTML explanation reports for stakeholders, auditors, or regulatory compliance.' }
    ],
    tips: [
      'Use SHAP for global understanding and LIME for quick local explanations of individual predictions.',
      'Compare explanations across model versions to catch unexpected behavior changes.',
      'For text/image models, attention maps provide intuitive visual explanations for non-technical stakeholders.'
    ],
    troubleshooting: [
      { problem: 'SHAP computation too slow on large datasets', solution: 'Use SHAP sampling (shap.sample) or switch to TreeExplainer for tree-based models which is orders of magnitude faster.' },
      { problem: 'Explanations seem inconsistent across similar inputs', solution: 'Increase SHAP nsamples, check for model instability, or use smoothed explanations with input perturbation.' }
    ]
  },
  {
    id: 'debug-studio',
    name: 'Debug Studio',
    category: 'Analysis',
    overview: 'Interactive debugging environment for diagnosing training failures, data issues, and model behavior. Inspect gradients, activations, and data flow at any training step.',
    steps: [
      { title: 'Attach to Training Job', description: 'Connect the debugger to a running or completed training job to inspect its internal state.' },
      { title: 'Set Breakpoints', description: 'Add conditional breakpoints on loss spikes, gradient explosions, NaN values, or custom metric thresholds.' },
      { title: 'Inspect State', description: 'Examine layer activations, gradient distributions, weight histograms, and data batch contents at any step.' },
      { title: 'Run Diagnostics', description: 'Execute built-in checks for vanishing gradients, dead neurons, data leakage, and class imbalance.' }
    ],
    tips: [
      'Enable gradient histogram logging from the start - it costs minimal overhead but saves hours of debugging.',
      'Use the data inspector to verify augmentations are applied correctly before full training runs.',
      'Compare activation distributions between early and late training to spot representation collapse.'
    ],
    troubleshooting: [
      { problem: 'Debugger shows NaN gradients at specific layers', solution: 'Check for division by zero in custom layers, reduce learning rate, or add gradient clipping before the affected layer.' },
      { problem: 'Cannot attach to distributed training job', solution: 'Ensure debug port is exposed on the master node and that all workers have the debug agent installed.' }
    ]
  },
  {
    id: 'notebook',
    name: 'Notebook Environment',
    category: 'Development',
    overview: 'Integrated Jupyter-compatible notebooks with direct access to platform datasets, models, and GPU resources. Prototype experiments without leaving the platform.',
    steps: [
      { title: 'Launch Notebook Server', description: 'Start a notebook instance with your choice of GPU type, memory, and pre-installed environment (PyTorch, TensorFlow, JAX).' },
      { title: 'Connect to Platform Resources', description: 'Access datasets, model registry, and experiment tracking directly via the platform SDK - pre-authenticated.' },
      { title: 'Develop and Iterate', description: 'Write training code, visualize results inline, and use magic commands for experiment logging.' },
      { title: 'Convert to Pipeline', description: 'Promote notebook cells to production pipeline steps with one click, auto-generating proper modules.' }
    ],
    tips: [
      'Use the %%track_experiment magic to automatically log notebook outputs to experiment tracking.',
      'Pin your notebook environment version to avoid dependency drift between sessions.',
      'Clean up idle notebook instances - they consume GPU resources even when not executing code.'
    ],
    troubleshooting: [
      { problem: 'Notebook kernel keeps dying', solution: 'Check GPU memory usage - reduce batch size or switch to a larger instance. Review kernel logs for OOM messages.' },
      { problem: 'Platform SDK not found in notebook', solution: 'Run !pip install platform-sdk in a cell or select a base image that includes it. Restart kernel after install.' }
    ]
  },
  {
    id: 'ab-testing',
    name: 'A/B Testing',
    category: 'Deployment',
    overview: 'Run controlled experiments comparing model versions in production with statistical rigor. Measure real-world impact before full rollout with configurable traffic splits.',
    steps: [
      { title: 'Define Experiment', description: 'Set hypothesis, primary/secondary metrics, minimum detectable effect, and required sample size.' },
      { title: 'Configure Traffic Split', description: 'Allocate traffic percentages between control (current model) and treatment (new model) variants.' },
      { title: 'Launch Experiment', description: 'Start routing live traffic with consistent user assignment to ensure clean measurement.' },
      { title: 'Monitor Results', description: 'Track metric convergence, check for sample ratio mismatch, and review real-time confidence intervals.' },
      { title: 'Make Decision', description: 'Once statistical significance is reached, promote the winner or roll back with documented learnings.' }
    ],
    tips: [
      'Always run a pre-experiment A/A test to validate your measurement pipeline has no inherent bias.',
      'Use sequential testing methods to enable early stopping without inflating false positive rates.',
      'Segment results by user cohorts - aggregate wins can hide losses in important subgroups.'
    ],
    troubleshooting: [
      { problem: 'Experiment not reaching significance after expected time', solution: 'Check for low traffic volume, verify event tracking is firing correctly, or increase the minimum detectable effect threshold.' },
      { problem: 'Sample ratio mismatch detected', solution: 'Investigate the traffic splitting layer for bugs, check for bot traffic skewing one variant, or verify randomization seed consistency.' }
    ]
  }
];
