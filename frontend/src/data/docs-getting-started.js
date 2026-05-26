export const gettingStarted = {
  systemRequirements: {
    title: "System Requirements",
    content: [
      { label: "Browser", value: "Chrome 90+, Firefox 90+, Edge 90+, Safari 15+" },
      { label: "WebGPU (optional)", value: "Chrome 113+ for GPU acceleration" },
      { label: "Node.js", value: "18.0 or higher" },
      { label: "MongoDB", value: "6.0 or higher" },
      { label: "Redis (optional)", value: "7.0+ for caching and WebSocket scaling" },
      { label: "Docker (optional)", value: "24.0+ with Docker Compose v2" }
    ]
  },
  installation: {
    title: "Local Installation",
    steps: [
      { title: "Clone the repository", description: "git clone https://github.com/ZafranYusof/distributed-ml-platform.git && cd distributed-ml-platform" },
      { title: "Install backend dependencies", description: "cd backend && npm install" },
      { title: "Install frontend dependencies", description: "cd frontend && npm install" },
      { title: "Start MongoDB", description: "Make sure MongoDB is running on localhost:27017. On Windows: net start MongoDB. On Mac: brew services start mongodb-community." },
      { title: "Configure environment", description: "Create backend/.env with: PORT=5005, MONGODB_URI=mongodb://127.0.0.1:27017/distml, JWT_SECRET=your-secret-key" },
      { title: "Start the platform", description: "From root directory: npm run dev. This starts both backend (port 5005) and frontend (port 5173) concurrently." },
      { title: "Open in browser", description: "Navigate to http://localhost:5173. Register an account to get started." }
    ]
  },
  dockerSetup: {
    title: "Docker Setup",
    steps: [
      { title: "Prerequisites", description: "Install Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)." },
      { title: "Build and start", description: "docker-compose up -d. This starts 4 services: frontend (nginx on port 80), backend (node on port 5005), MongoDB, and Redis." },
      { title: "Access", description: "Open http://localhost in your browser. The platform is ready to use." },
      { title: "Stop", description: "docker-compose down. Add -v flag to also remove data volumes." }
    ]
  },
  quickStart: {
    title: "Quick Start Tutorial",
    steps: [
      { title: "Create an account", description: "Click 'Register' on the login page. Enter your email, username, and password (minimum 6 characters). You'll be automatically logged in after registration." },
      { title: "Upload your first dataset", description: "From the Dashboard, click 'Upload Dataset' or navigate to the Datasets page. You can drag & drop a CSV file, or click 'Iris' or 'Housing' to use a sample dataset. The platform accepts any CSV with numeric columns." },
      { title: "Configure your model", description: "On the Training page, select your dataset. Choose an architecture: Linear Regression for simple problems, Neural Network for complex patterns. For Neural Network, configure layers (start with [64, 32] for beginners), learning rate (0.01 is a safe default), and epochs (50-100 for initial experiments)." },
      { title: "Set up distributed training", description: "Choose the number of workers (2-8). Each worker trains on a portion of your data simultaneously using Web Workers. More workers = faster training but more memory usage. Start with 3-4 workers." },
      { title: "Start training", description: "Click 'Start Training'. Watch the real-time loss curve update as each epoch completes. The progress bars show each worker's status. Training speed (samples/sec) is displayed in the metrics panel." },
      { title: "View results", description: "Once training completes, the final model metrics are displayed: loss, accuracy (for classification), and training time. The federated averaging step combines all worker models into one final model." },
      { title: "Run inference", description: "Navigate to the Inference page. Your trained model is automatically loaded. Enter feature values and click 'Predict' to get results with confidence scores. You can also download the model as JSON for external use." }
    ]
  }
};

export const architecture = {
  techStack: {
    title: "Technology Stack",
    layers: [
      { name: "Frontend", technologies: ["React 19", "Vite 6", "TailwindCSS 3", "Recharts", "Framer Motion", "Socket.io Client", "TensorFlow.js", "@xyflow/react", "lucide-react"] },
      { name: "Backend", technologies: ["Node.js 18+", "Express 5", "MongoDB (Mongoose 8)", "Socket.io", "Redis (ioredis)", "JWT (jsonwebtoken)", "node-cron", "Swagger"] },
      { name: "ML Engine", technologies: ["TensorFlow.js (Web Workers)", "Custom training loops", "Federated Averaging", "WebGPU backend (optional)"] },
      { name: "Infrastructure", technologies: ["Docker + Docker Compose", "Nginx (frontend serving)", "Redis (caching + pub/sub)", "MongoDB Atlas (production)"] }
    ]
  },
  distributedTraining: {
    title: "How Distributed Training Works",
    sections: [
      { subtitle: "Web Worker Architecture", content: "Each 'worker' is a Web Worker running in a separate browser thread. Workers receive a portion of the training data and a copy of the model architecture. They train independently and report progress back to the main thread via postMessage." },
      { subtitle: "Data Partitioning", content: "The dataset is split evenly across workers. With 4 workers and 1000 samples, each worker gets 250 samples. This is data parallelism — same model, different data." },
      { subtitle: "Progress Reporting", content: "Workers send progress updates after each epoch: current loss, accuracy, epoch number, and training speed. The main thread aggregates these into the real-time visualization." },
      { subtitle: "Federated Averaging (FedAvg)", content: "After all workers complete training, their model weights are collected. FedAvg computes the element-wise average of all weight tensors. This produces a single model that has 'learned' from all data partitions without any single worker seeing the full dataset." },
      { subtitle: "Fault Tolerance", content: "In GPU Cluster mode, if a worker fails mid-training, the system detects the failure, reassigns the work to a new worker, and resumes from the last checkpoint." }
    ]
  },
  authFlow: {
    title: "Authentication Flow",
    steps: [
      "User registers with email/password → password hashed with bcrypt → stored in MongoDB",
      "User logs in → server verifies credentials → issues JWT token (24h expiry)",
      "Frontend stores token in AuthContext → sends as Bearer token in Authorization header",
      "Backend auth middleware verifies JWT → extracts userId → attaches to req.userId",
      "Protected routes check req.userId exists before processing"
    ]
  },
  realtime: {
    title: "Real-time Features (Socket.io)",
    events: [
      { event: "user:join", description: "Emitted when a user connects. Broadcasts online user count to all clients." },
      { event: "user:leave", description: "Emitted on disconnect. Updates online count." },
      { event: "training:start", description: "Broadcast when any user starts training. Shows in Live Sessions." },
      { event: "training:progress", description: "Periodic updates during training (loss, epoch, speed)." },
      { event: "training:complete", description: "Broadcast when training finishes. Includes final metrics." },
      { event: "notification", description: "Server-to-client notification push (drift alerts, deploy events)." }
    ]
  }
};

export const changelog = [
  {
    version: "1.7.0",
    date: "May 2026",
    title: "Documentation & Polish",
    changes: [
      "Neural network theme (deep purple + electric blue + neon green)",
      "Professional lucide-react icons across all 44+ pages",
      "How-to-Use collapsible guides on every feature page",
      "Full documentation page with search, API reference, glossary",
      "Onboarding tour for new users",
      "Dark/Light theme toggle with localStorage persistence",
      "Keyboard shortcuts (Ctrl+K command palette, Ctrl+N, Ctrl+R)",
      "Notification center with bell icon and unread badge",
      "Command palette with fuzzy search across all pages",
      "Mobile responsive layout with hamburger menu"
    ]
  },
  {
    version: "1.6.0",
    date: "May 2026",
    title: "Infrastructure & Integrations",
    changes: [
      "Docker containerization (frontend nginx + backend node + MongoDB + Redis)",
      "Redis caching for inference predictions and rate limiting",
      "WebSocket scaling with Redis adapter for multi-instance",
      "Swagger API documentation at /api-docs",
      "GitHub integration (connect repo, view commits, auto-version)",
      "Slack/Discord webhook notifications",
      "Kaggle dataset import (simulated)",
      "HuggingFace model export",
      "Admin dashboard with platform-wide statistics",
      "Usage analytics with feature heatmap"
    ]
  },
  {
    version: "1.5.0",
    date: "May 2026",
    title: "Enterprise & Research Features",
    changes: [
      "Multi-tenant organizations with role-based access",
      "GPU cluster simulation with fault tolerance and elastic scaling",
      "ML pipeline orchestration engine (visual DAG, conditional branches, retry)",
      "Neural Architecture Search (evolutionary algorithm)",
      "Real-time streaming ML with online learning and drift detection",
      "Model debugging studio (activation inspection, confusion matrix)",
      "Synthetic data generator with distribution control",
      "Multi-modal learning (tabular + text + image fusion)",
      "Reinforcement learning playground (Grid World, Cart Pole, Trading)",
      "MLOps CI/CD pipeline (quality gates, auto-deploy, rollback)"
    ]
  },
  {
    version: "1.4.0",
    date: "May 2026",
    title: "MLOps & Advanced ML",
    changes: [
      "Model monitoring with drift detection (KL divergence)",
      "Centralized feature store with versioning",
      "Hyperparameter visualization (parallel coordinates)",
      "Ensemble methods (bagging, boosting, stacking)",
      "Explainable AI dashboard (LIME, counterfactuals, decision boundaries)",
      "Data lineage DAG visualization",
      "Auto-generated model cards",
      "Real federated learning with differential privacy",
      "Active learning with uncertainty sampling",
      "Automatic feature engineering (polynomial, interactions, binning)"
    ]
  },
  {
    version: "1.3.0",
    date: "May 2026",
    title: "Collaboration & Tools",
    changes: [
      "Real-time collaboration via Socket.io (live sessions)",
      "AutoML hyperparameter grid search",
      "Data explorer (distributions, correlations, outliers)",
      "Model interpretability (feature importance, partial dependence)",
      "GPU acceleration toggle (WebGPU detection)",
      "Visual pipeline builder with drag & drop",
      "Model marketplace (publish, browse, download)",
      "Scheduled training with cron jobs",
      "A/B testing for model comparison",
      "Jupyter-like notebook mode"
    ]
  },
  {
    version: "1.2.0",
    date: "May 2026",
    title: "Auth & Model Expansion",
    changes: [
      "JWT authentication (login, register, protected routes)",
      "MongoDB integration for persistent storage",
      "CNN architecture support (Conv1D for tabular/image)",
      "RNN architecture support (LSTM, GRU, SimpleRNN)",
      "Dataset preprocessing (normalization, train/test split, feature selection)",
      "Multiple export formats (JSON, Binary, ONNX-like)",
      "Side-by-side comparison mode (2-6 configs)",
      "Training history with session replay"
    ]
  },
  {
    version: "1.1.0",
    date: "May 2026",
    title: "Bug Fixes & Stability",
    changes: [
      "Fixed auth token consistency across all pages",
      "Fixed interval/timeout memory leaks in 6 components",
      "Fixed federated averaging crash on empty layers",
      "Fixed Cohen's kappa calculation in annotations",
      "Fixed pipeline builder cycle detection",
      "Fixed streaming ML stale closure bug",
      "Improved error handling across all backend routes"
    ]
  },
  {
    version: "1.0.0",
    date: "May 2026",
    title: "Initial Release",
    changes: [
      "Distributed training with Web Workers",
      "Dashboard with real-time metrics",
      "Model configuration (Linear Regression, Neural Network)",
      "Real-time loss curve and progress visualization",
      "Per-worker progress bars and training speed",
      "Federated averaging for model aggregation",
      "Inference page with predictions and confidence scores",
      "Model download as JSON",
      "Sample datasets (Iris, Housing)"
    ]
  }
];
