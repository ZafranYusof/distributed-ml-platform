# Distributed ML Training Platform

A web-based distributed machine learning training platform using TensorFlow.js and Web Workers for in-browser model training with federated averaging.

## Features

- **Drag & drop CSV upload** or use preloaded sample datasets (Iris, Housing)
- **Model architecture selection** — Linear Regression or Neural Network with configurable layers
- **Distributed training** via Web Workers simulating multiple compute nodes
- **Real-time visualization** — live loss curves, per-worker progress bars, training speed
- **Federated averaging** — aggregates model weights from all workers
- **Model download** — export trained model as JSON
- **Inference page** — make predictions with trained models

## Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS + Recharts
- **Backend:** Node.js Express (coordinator/API)
- **ML:** TensorFlow.js (in-browser training via Web Workers)
- **Storage:** In-memory (no database needed)

## Getting Started

### Prerequisites

- Node.js 18+

### Install

```bash
# Install root deps (concurrently)
npm install

# Install backend deps
cd backend && npm install

# Install frontend deps
cd frontend && npm install
```

### Run Development

```bash
# From root - starts both backend (port 5005) and frontend (port 5173)
npm run dev

# Or separately:
cd backend && npm run dev    # http://localhost:5005
cd frontend && npm run dev   # http://localhost:5173
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
distributed-ml-platform/
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, shared UI
│   │   ├── pages/         # Dashboard, Training, Inference
│   │   ├── workers/       # Web Worker for TensorFlow.js training
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   └── index.js       # Express server with API routes
│   └── package.json
├── package.json            # Root with dev scripts
└── README.md
```

## How It Works

1. **Upload** a CSV dataset or select a sample
2. **Configure** model type, layers, learning rate, epochs, and number of workers
3. **Train** — data is split across Web Workers, each training independently
4. **Monitor** — watch live loss curves and per-worker progress
5. **Aggregate** — federated averaging combines worker weights into final model
6. **Predict** — use the trained model for inference on new data
