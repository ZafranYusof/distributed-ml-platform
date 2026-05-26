# 🧠 Distributed ML Training Platform

**Train machine learning models directly in your browser — no server-side GPUs required.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://distributed-ml-platform.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)

---

## 📖 Overview

Distributed ML Training Platform is a full-stack web application that brings enterprise-grade machine learning capabilities to the browser. By leveraging **Web Workers** and **TensorFlow.js**, it enables distributed model training without requiring expensive server-side GPU infrastructure — making ML accessible to everyone.

The platform supports the complete ML lifecycle: from data ingestion and exploration, through model architecture design (CNN, RNN, Neural Networks), to training, evaluation, deployment, and monitoring. Features like AutoML, Neural Architecture Search, and Transfer Learning automate complex workflows, while real-time collaboration via Socket.io enables teams to work together seamlessly.

Whether you're a researcher prototyping new architectures, a team building production ML pipelines, or a student learning the fundamentals — this platform provides the tools you need with a modern, intuitive interface.

---

## 🚀 Live Demo

**👉 [distributed-ml-platform.vercel.app](https://distributed-ml-platform.vercel.app)**

---

## ✨ Key Features

### 🏋️ Training
- **Distributed Training** — Parallel model training using Web Workers
- **AutoML** — Automated model selection and hyperparameter tuning
- **Neural Architecture Search (NAS)** — Discover optimal architectures automatically
- **Streaming ML** — Train on streaming/real-time data
- **CNN / RNN / NN Support** — Build and train various architectures
- **Real-time Visualization** — Live training metrics and loss curves

### 📊 Data
- **Dataset Management** — Upload, organize, and version datasets
- **Data Explorer** — Interactive data visualization and statistics
- **Augmentation** — Built-in data augmentation pipelines
- **Auto Feature Engineering** — Automated feature extraction and selection
- **Synthetic Data Generator** — Generate training data programmatically
- **Annotations** — Label and annotate datasets collaboratively

### 🤖 Models
- **Inference API** — Deploy models with REST endpoints
- **Model Versioning** — Track and compare model versions
- **Marketplace** — Share and discover pre-trained models
- **Transfer Learning** — Fine-tune pre-trained models on custom data
- **Ensemble Methods** — Combine multiple models for better performance
- **Model Compression** — Quantization and pruning for deployment
- **Custom Loss Functions** — Define custom training objectives
- **Model Cards** — Standardized model documentation

### ⚙️ MLOps
- **Monitoring & Drift Detection** — Track model performance in production
- **Feature Store** — Centralized feature management
- **Pipeline Orchestration** — Visual pipeline builder with DAG support
- **CI/CD Integration** — Automated training and deployment pipelines
- **Scheduled Training** — Cron-based retraining schedules
- **A/B Testing** — Compare model variants in production

### 👥 Collaboration
- **Real-time Collaboration** — Live sessions via Socket.io
- **Organizations** — Team management and access control
- **Federated Learning** — Train across distributed data sources
- **Active Learning** — Human-in-the-loop labeling workflows
- **Notebooks** — Interactive computational notebooks

### 🔬 Research
- **RL Playground** — Reinforcement learning experimentation
- **Explainability (LIME)** — Model interpretability and explanations
- **Debug Studio** — Inspect model internals and gradients
- **GPU Acceleration** — WebGL-accelerated computation
- **Multi-Modal Learning** — Train on text, image, and tabular data

### 🏗️ Platform
- **Docker Support** — Containerized deployment
- **Redis Caching** — High-performance caching layer
- **Swagger API Docs** — Interactive API documentation
- **GitHub Integration** — Import/export models and datasets
- **Webhook Support** — Event-driven automation
- **Admin Dashboard** — Platform management and user analytics

### 🎨 User Experience
- **Dark / Light Theme** — System-aware theme switching
- **Command Palette** — Quick actions with keyboard shortcuts
- **Keyboard Shortcuts** — Power-user navigation
- **Onboarding Tour** — Guided first-time experience
- **Mobile Responsive** — Works on all screen sizes
- **Full Documentation** — In-app docs and guides

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 6, TailwindCSS 3, Recharts, Framer Motion, TensorFlow.js, @xyflow/react, lucide-react |
| **Backend** | Express 4, MongoDB (Mongoose 8), Socket.io, Redis (ioredis), JWT Auth |
| **ML Engine** | TensorFlow.js, Web Workers, WebGL |
| **DevOps** | Docker, Docker Compose, Vercel, Swagger |
| **Real-time** | Socket.io with Redis adapter |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **MongoDB** 6+
- **Redis** (optional, for caching and real-time scaling)
- **Docker** (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/ZafranYusof/distributed-ml-platform.git
cd distributed-ml-platform

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ml-platform
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### Run Development Server

```bash
# Start both frontend and backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build
```

---

## 📁 Project Structure

```
distributed-ml-platform/
├── frontend/
│   ├── src/
│   │   ├── pages/            # 50+ feature pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Training.jsx
│   │   │   ├── AutoML.jsx
│   │   │   ├── Datasets.jsx
│   │   │   ├── Monitoring.jsx
│   │   │   └── ...
│   │   ├── components/       # Shared UI components
│   │   │   ├── ui/           # Base UI primitives
│   │   │   ├── Layout.jsx
│   │   │   ├── CommandPalette.jsx
│   │   │   ├── OnboardingTour.jsx
│   │   │   └── ...
│   │   └── data/             # Static data and configs
│   └── package.json
├── backend/
│   └── src/
│       ├── routes/           # API route handlers
│       ├── models/           # MongoDB schemas
│       ├── middleware/       # Auth, validation, etc.
│       ├── utils/            # Helper functions
│       └── index.js          # Server entry point
├── docker-compose.yml
├── render.yaml
└── package.json
```

---

## 📸 Screenshots

> Screenshots coming soon. Visit the [live demo](https://distributed-ml-platform.vercel.app) to explore the platform.

---

## 📚 API Documentation

- **Swagger UI** — Available at `/api-docs` when running the backend
- **In-app Documentation** — Comprehensive guides at `/docs` within the application

The API follows RESTful conventions with JWT authentication. All endpoints are documented with request/response schemas.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
- Add tests for new features when applicable
- Update documentation for any API changes

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Zafran Yusof**

- GitHub: [@ZafranYusof](https://github.com/ZafranYusof)

---

<p align="center">
  Built with ❤️ using React, TensorFlow.js, and Web Workers
</p>
