export const glossary = [
  { term: "Epoch", definition: "One complete pass through the entire training dataset. More epochs = more learning opportunities but risk of overfitting." },
  { term: "Batch Size", definition: "Number of samples processed before the model updates its weights. Smaller batches = noisier updates but less memory." },
  { term: "Learning Rate", definition: "Controls how much model weights change per update. Too high = unstable training, too low = slow convergence." },
  { term: "Loss Function", definition: "Measures how wrong the model's predictions are. Training minimizes this value. Common choices: MSE, cross-entropy." },
  { term: "Overfitting", definition: "Model memorizes training data instead of learning patterns. Performs well on training set but poorly on new data." },
  { term: "Underfitting", definition: "Model is too simple to capture data patterns. Performs poorly on both training and test data." },
  { term: "Regularization", definition: "Techniques to prevent overfitting by penalizing model complexity. Includes L1 (sparsity), L2 (weight decay), and dropout." },
  { term: "Dropout", definition: "Randomly deactivates neurons during training to prevent co-adaptation. Typical rates: 0.1-0.5 depending on layer." },
  { term: "Activation Function", definition: "Non-linear function applied to neuron outputs. ReLU is default for hidden layers, softmax for classification output." },
  { term: "Gradient Descent", definition: "Optimization algorithm that iteratively adjusts weights in the direction that reduces loss. SGD, Adam, AdamW are variants." },
  { term: "Backpropagation", definition: "Algorithm for computing gradients by propagating error backwards through the network using the chain rule." },
  { term: "CNN", definition: "Convolutional Neural Network. Specialized for grid-like data (images, audio). Uses learned filters to detect spatial patterns." },
  { term: "RNN", definition: "Recurrent Neural Network. Processes sequential data by maintaining hidden state across time steps. Struggles with long sequences." },
  { term: "LSTM", definition: "Long Short-Term Memory. RNN variant with gating mechanisms that can learn long-range dependencies in sequences." },
  { term: "Transfer Learning", definition: "Using a pre-trained model as starting point for a new task. Dramatically reduces data and compute requirements." },
  { term: "Fine-tuning", definition: "Continuing training of a pre-trained model on task-specific data, usually with a lower learning rate." },
  { term: "Federated Learning", definition: "Training across decentralized devices without sharing raw data. Preserves privacy while enabling collaborative learning." },
  { term: "FedAvg", definition: "Federated Averaging. Default aggregation algorithm that averages model weights from participating nodes each round." },
  { term: "Differential Privacy", definition: "Mathematical framework guaranteeing individual data points cannot be identified from model outputs. Controlled by epsilon parameter." },
  { term: "AutoML", definition: "Automated machine learning. Searches for optimal model architecture, hyperparameters, and preprocessing without manual tuning." },
  { term: "NAS", definition: "Neural Architecture Search. Automatically discovers optimal network architectures using search algorithms like evolutionary or RL-based methods." },
  { term: "Hyperparameter", definition: "Configuration set before training (learning rate, layers, batch size). Not learned from data — must be tuned externally." },
  { term: "Validation Set", definition: "Data subset used to tune hyperparameters and monitor overfitting during training. Never used for final evaluation." },
  { term: "Cross-Validation", definition: "Technique that trains on multiple data splits to get robust performance estimates. K-fold is most common (k=5 or 10)." },
  { term: "Ensemble", definition: "Combining multiple models to produce better predictions than any single model. Reduces variance and improves robustness." },
  { term: "Bagging", definition: "Bootstrap Aggregating. Trains models on random data subsets and averages predictions. Random Forest is the classic example." },
  { term: "Boosting", definition: "Sequentially trains models where each focuses on errors of previous ones. XGBoost and LightGBM are popular implementations." },
  { term: "Feature Engineering", definition: "Creating informative input variables from raw data. Often more impactful than model choice for tabular data." },
  { term: "Data Augmentation", definition: "Artificially expanding training data through transformations (rotation, flip, noise). Critical for small datasets." },
  { term: "Normalization", definition: "Scaling features to similar ranges (0-1 or mean=0, std=1). Prevents features with large values from dominating training." },
  { term: "Confusion Matrix", definition: "Table showing true/false positives and negatives. Reveals where a classifier makes mistakes across classes." },
  { term: "Precision", definition: "Of all positive predictions, how many were correct. High precision = few false positives. Important when false alarms are costly." },
  { term: "Recall", definition: "Of all actual positives, how many were found. High recall = few missed cases. Important when missing positives is costly." },
  { term: "F1 Score", definition: "Harmonic mean of precision and recall. Balances both metrics into a single number. Ranges from 0 to 1." },
  { term: "LIME", definition: "Local Interpretable Model-agnostic Explanations. Explains individual predictions by fitting simple models to local perturbations." }
];

export const faq = [
  { question: "What browsers are supported?", answer: "Chrome 90+, Firefox 90+, Edge 90+, Safari 15+. For GPU acceleration, Chrome 113+ with WebGPU support is required." },
  { question: "How do I create an account?", answer: "Click Sign Up, enter your email and password, then verify via the confirmation email. Organization accounts require admin invitation." },
  { question: "Why is my training so slow?", answer: "Check GPU utilization in the monitoring tab. Common causes: small batch size underutilizing GPU, data loading bottleneck (enable prefetch), or network I/O for remote datasets." },
  { question: "How many workers can I use?", answer: "Depends on your plan. Free tier: 2 workers. Pro: 16 workers. Enterprise: unlimited. Workers scale automatically based on job requirements." },
  { question: "Which GPUs are available?", answer: "NVIDIA A100 (40/80GB), H100, RTX 4090, and T4 for inference. Availability varies by region. Check the cluster dashboard for real-time availability." },
  { question: "What data formats are supported?", answer: "CSV, Parquet, JSON, JSONL, TFRecord, HDF5, and image folders (PNG/JPEG). Max single file: 50GB. Use chunked upload for larger datasets." },
  { question: "Can I export my trained model?", answer: "Yes. Export to ONNX, TorchScript, SavedModel, or platform-native format. Models include metadata, metrics, and lineage information." },
  { question: "How do I deploy a model to production?", answer: "From the model registry, click Deploy. Choose between serverless (auto-scaling), dedicated (fixed resources), or edge deployment targets." },
  { question: "Can my team collaborate on experiments?", answer: "Yes. Create an organization, invite members, and share projects. All experiments, datasets, and models within a project are visible to team members." },
  { question: "How is my data secured?", answer: "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We support VPC peering, private endpoints, and customer-managed encryption keys on Enterprise plans." },
  { question: "Can I run training in Docker containers?", answer: "Yes. Provide a Dockerfile or use our base images. Custom containers must expose port 8080 for health checks and include the platform SDK." },
  { question: "What if my training job crashes?", answer: "Jobs auto-checkpoint every 30 minutes by default. Use the Resume button to restart from the last checkpoint. Check logs for crash cause." },
  { question: "How do I handle class imbalance?", answer: "Use weighted loss functions, SMOTE oversampling, or the platform's built-in class balancing in data loaders. Active learning also helps prioritize minority classes." },
  { question: "What's the maximum model size?", answer: "No hard limit. Models up to 70B parameters are supported with automatic model parallelism. Larger models require Enterprise plan for multi-node training." },
  { question: "Can I use my own pre-trained models?", answer: "Yes. Upload weights in PyTorch, TensorFlow, or ONNX format. Register them in the model registry for versioning and deployment." },
  { question: "How does billing work?", answer: "Pay per GPU-hour used plus storage. Training is billed per second. Idle notebooks are billed at reduced rate. View detailed usage in Settings > Billing." },
  { question: "Is there an API for automation?", answer: "Yes. Full REST API with Python and JavaScript SDKs. API keys are managed in Settings > API Keys. Rate limit: 1000 requests/minute." },
  { question: "How do I set up alerts?", answer: "Go to Monitoring > Alerts. Create rules based on metrics (loss, accuracy, GPU util) with email, Slack, or webhook notifications." },
  { question: "Can I schedule recurring training jobs?", answer: "Yes. Use the Scheduler to set cron-based triggers or event-based triggers (new data uploaded, model drift detected)." },
  { question: "What compliance certifications do you have?", answer: "SOC 2 Type II, GDPR compliant, HIPAA eligible (Enterprise), and ISO 27001 certified. Data residency options available for EU and APAC." }
];

export const apiReference = [
  { category: "Authentication", endpoints: [
    { method: "POST", path: "/api/auth/register", description: "Create new account", auth: false, body: "email, username, password", response: "{ token, user }" },
    { method: "POST", path: "/api/auth/login", description: "Login and get token", auth: false, body: "email, password", response: "{ token, user }" },
    { method: "GET", path: "/api/auth/me", description: "Get current user profile", auth: true, body: null, response: "{ user }" },
    { method: "POST", path: "/api/auth/refresh", description: "Refresh access token", auth: true, body: "refreshToken", response: "{ token }" }
  ]},
  { category: "Training", endpoints: [
    { method: "POST", path: "/api/training/jobs", description: "Create training job", auth: true, body: "config, datasetId, modelType", response: "{ jobId, status }" },
    { method: "GET", path: "/api/training/jobs/:id", description: "Get job status and metrics", auth: true, body: null, response: "{ job, metrics, logs }" },
    { method: "POST", path: "/api/training/jobs/:id/stop", description: "Stop a running job", auth: true, body: null, response: "{ status }" },
    { method: "GET", path: "/api/training/jobs/:id/checkpoints", description: "List job checkpoints", auth: true, body: null, response: "{ checkpoints[] }" }
  ]},
  { category: "Datasets", endpoints: [
    { method: "POST", path: "/api/datasets", description: "Create dataset entry", auth: true, body: "name, format, description", response: "{ datasetId, uploadUrl }" },
    { method: "GET", path: "/api/datasets", description: "List user datasets", auth: true, body: null, response: "{ datasets[], total }" },
    { method: "GET", path: "/api/datasets/:id", description: "Get dataset details", auth: true, body: null, response: "{ dataset, stats }" },
    { method: "DELETE", path: "/api/datasets/:id", description: "Delete dataset", auth: true, body: null, response: "{ success }" }
  ]},
  { category: "Experiments", endpoints: [
    { method: "POST", path: "/api/experiments", description: "Create experiment", auth: true, body: "name, projectId, description", response: "{ experimentId }" },
    { method: "GET", path: "/api/experiments/:id/runs", description: "List experiment runs", auth: true, body: null, response: "{ runs[], metrics }" },
    { method: "POST", path: "/api/experiments/:id/runs", description: "Log a new run", auth: true, body: "params, metrics, artifacts", response: "{ runId }" },
    { method: "GET", path: "/api/experiments/compare", description: "Compare multiple runs", auth: true, body: null, response: "{ comparison[] }" }
  ]},
  { category: "Models", endpoints: [
    { method: "POST", path: "/api/models", description: "Register model", auth: true, body: "name, framework, artifactUrl", response: "{ modelId, version }" },
    { method: "GET", path: "/api/models", description: "List registered models", auth: true, body: null, response: "{ models[], total }" },
    { method: "GET", path: "/api/models/:id/versions", description: "List model versions", auth: true, body: null, response: "{ versions[] }" },
    { method: "POST", path: "/api/models/:id/deploy", description: "Deploy model version", auth: true, body: "target, config", response: "{ deploymentId, endpoint }" }
  ]},
  { category: "Organizations", endpoints: [
    { method: "POST", path: "/api/orgs", description: "Create organization", auth: true, body: "name, plan", response: "{ orgId }" },
    { method: "GET", path: "/api/orgs/:id/members", description: "List org members", auth: true, body: null, response: "{ members[] }" },
    { method: "POST", path: "/api/orgs/:id/invite", description: "Invite member", auth: true, body: "email, role", response: "{ inviteId }" },
    { method: "PATCH", path: "/api/orgs/:id/quotas", description: "Update resource quotas", auth: true, body: "gpuHours, storage", response: "{ quotas }" }
  ]},
  { category: "Monitoring", endpoints: [
    { method: "GET", path: "/api/monitoring/metrics", description: "Query metrics", auth: true, body: null, response: "{ timeseries[] }" },
    { method: "POST", path: "/api/monitoring/alerts", description: "Create alert rule", auth: true, body: "metric, threshold, channel", response: "{ alertId }" },
    { method: "GET", path: "/api/monitoring/health", description: "Platform health status", auth: false, body: null, response: "{ status, services[] }" }
  ]},
  { category: "Marketplace", endpoints: [
    { method: "GET", path: "/api/marketplace/models", description: "Browse public models", auth: false, body: null, response: "{ models[], categories }" },
    { method: "POST", path: "/api/marketplace/publish", description: "Publish model to marketplace", auth: true, body: "modelId, pricing, description", response: "{ listingId }" },
    { method: "POST", path: "/api/marketplace/:id/fork", description: "Fork a public model", auth: true, body: null, response: "{ modelId }" }
  ]},
  { category: "Inference API", endpoints: [
    { method: "POST", path: "/api/inference/:deploymentId/predict", description: "Run prediction", auth: true, body: "input", response: "{ prediction, confidence }" },
    { method: "POST", path: "/api/inference/:deploymentId/batch", description: "Batch prediction", auth: true, body: "inputs[]", response: "{ predictions[] }" },
    { method: "GET", path: "/api/inference/:deploymentId/stats", description: "Get inference stats", auth: true, body: null, response: "{ latency, throughput, errors }" }
  ]},
  { category: "Webhooks", endpoints: [
    { method: "POST", path: "/api/webhooks", description: "Register webhook", auth: true, body: "url, events[], secret", response: "{ webhookId }" },
    { method: "GET", path: "/api/webhooks", description: "List webhooks", auth: true, body: null, response: "{ webhooks[] }" },
    { method: "DELETE", path: "/api/webhooks/:id", description: "Delete webhook", auth: true, body: null, response: "{ success }" }
  ]},
  { category: "Admin", endpoints: [
    { method: "GET", path: "/api/admin/users", description: "List all users (admin only)", auth: true, body: null, response: "{ users[], total }" },
    { method: "PATCH", path: "/api/admin/users/:id", description: "Update user role/status", auth: true, body: "role, status", response: "{ user }" },
    { method: "GET", path: "/api/admin/usage", description: "Platform usage report", auth: true, body: null, response: "{ compute, storage, users }" },
    { method: "POST", path: "/api/admin/maintenance", description: "Toggle maintenance mode", auth: true, body: "enabled, message", response: "{ status }" }
  ]}
];
