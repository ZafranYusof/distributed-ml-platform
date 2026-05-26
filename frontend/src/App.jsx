import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ui';
import { CardSkeleton } from './components/ui/SkeletonLoader';
import CommandPalette from './components/CommandPalette';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import OnboardingTour from './components/OnboardingTour';

// Lazy load all pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Training = lazy(() => import('./pages/Training'));
const Inference = lazy(() => import('./pages/Inference'));
const History = lazy(() => import('./pages/History'));
const Compare = lazy(() => import('./pages/Compare'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const LiveSessions = lazy(() => import('./pages/LiveSessions'));
const AutoML = lazy(() => import('./pages/AutoML'));
const DataExplorer = lazy(() => import('./pages/DataExplorer'));
const GPUAcceleration = lazy(() => import('./pages/GPUAcceleration'));
const PipelineBuilder = lazy(() => import('./pages/PipelineBuilder'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Schedules = lazy(() => import('./pages/Schedules'));
const ABTesting = lazy(() => import('./pages/ABTesting'));
const Notebook = lazy(() => import('./pages/Notebook'));
const ModelVersions = lazy(() => import('./pages/ModelVersions'));
const Datasets = lazy(() => import('./pages/Datasets'));
const DistributedInference = lazy(() => import('./pages/DistributedInference'));
const Experiments = lazy(() => import('./pages/Experiments'));
const CustomLoss = lazy(() => import('./pages/CustomLoss'));
const TransferLearning = lazy(() => import('./pages/TransferLearning'));
const Augmentation = lazy(() => import('./pages/Augmentation'));
const Compression = lazy(() => import('./pages/Compression'));
const InferenceAPI = lazy(() => import('./pages/InferenceAPI'));
const Annotations = lazy(() => import('./pages/Annotations'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const FeatureStore = lazy(() => import('./pages/FeatureStore'));
const HyperparamViz = lazy(() => import('./pages/HyperparamViz'));
const Ensemble = lazy(() => import('./pages/Ensemble'));
const Explainability = lazy(() => import('./pages/Explainability'));
const Lineage = lazy(() => import('./pages/Lineage'));
const ModelCards = lazy(() => import('./pages/ModelCards'));
const Federated = lazy(() => import('./pages/Federated'));
const ActiveLearning = lazy(() => import('./pages/ActiveLearning'));
const AutoFeatures = lazy(() => import('./pages/AutoFeatures'));
const Organizations = lazy(() => import('./pages/Organizations'));
const GPUClusterSim = lazy(() => import('./pages/GPUClusterSim'));
const Orchestration = lazy(() => import('./pages/Orchestration'));
const NAS = lazy(() => import('./pages/NAS'));
const StreamingML = lazy(() => import('./pages/StreamingML'));
const DebugStudio = lazy(() => import('./pages/DebugStudio'));
const SyntheticData = lazy(() => import('./pages/SyntheticData'));
const MultiModal = lazy(() => import('./pages/MultiModal'));
const RLPlayground = lazy(() => import('./pages/RLPlayground'));
const MLOpsCICD = lazy(() => import('./pages/MLOpsCICD'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const DataCatalog = lazy(() => import('./pages/DataCatalog'));
const GitHubIntegration = lazy(() => import('./pages/GitHubIntegration'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const Documentation = lazy(() => import('./pages/Documentation'));
const Themes = lazy(() => import('./pages/Themes'));

function PageFallback() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="animate-shimmer bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 bg-[length:200%_100%] rounded h-7 w-48" />
        <div className="animate-shimmer bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 bg-[length:200%_100%] rounded h-4 w-72" />
      </div>
      <CardSkeleton count={3} />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/experiments');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        navigate('/live');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [navigate]);

  return (
    <>
      <CommandPalette />
      <KeyboardShortcuts />
      <OnboardingTour />
      <Routes>
        <Route path="/login" element={
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Login />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/register" element={
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Register />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/" element={<Layout />}>
          <Route index element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Dashboard /></Suspense></ErrorBoundary>} />
          <Route path="training/:sessionId" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Training /></Suspense></ErrorBoundary>} />
          <Route path="inference" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Inference /></Suspense></ErrorBoundary>} />
          <Route path="history" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><History /></Suspense></ErrorBoundary>} />
          <Route path="compare" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Compare /></Suspense></ErrorBoundary>} />
          <Route path="live" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LiveSessions /></Suspense></ErrorBoundary>} />
          <Route path="automl" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AutoML /></Suspense></ErrorBoundary>} />
          <Route path="data-explorer" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><DataExplorer /></Suspense></ErrorBoundary>} />
          <Route path="gpu" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><GPUAcceleration /></Suspense></ErrorBoundary>} />
          <Route path="pipeline" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><PipelineBuilder /></Suspense></ErrorBoundary>} />
          <Route path="marketplace" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Marketplace /></Suspense></ErrorBoundary>} />
          <Route path="schedules" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Schedules /></Suspense></ErrorBoundary>} />
          <Route path="ab-testing" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ABTesting /></Suspense></ErrorBoundary>} />
          <Route path="notebook" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Notebook /></Suspense></ErrorBoundary>} />
          <Route path="model-versions" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ModelVersions /></Suspense></ErrorBoundary>} />
          <Route path="datasets" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Datasets /></Suspense></ErrorBoundary>} />
          <Route path="distributed-inference" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><DistributedInference /></Suspense></ErrorBoundary>} />
          <Route path="experiments" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Experiments /></Suspense></ErrorBoundary>} />
          <Route path="custom-loss" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><CustomLoss /></Suspense></ErrorBoundary>} />
          <Route path="transfer-learning" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><TransferLearning /></Suspense></ErrorBoundary>} />
          <Route path="augmentation" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Augmentation /></Suspense></ErrorBoundary>} />
          <Route path="compression" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Compression /></Suspense></ErrorBoundary>} />
          <Route path="inference-api" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><InferenceAPI /></Suspense></ErrorBoundary>} />
          <Route path="annotations" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Annotations /></Suspense></ErrorBoundary>} />
          <Route path="monitoring" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Monitoring /></Suspense></ErrorBoundary>} />
          <Route path="feature-store" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><FeatureStore /></Suspense></ErrorBoundary>} />
          <Route path="hyperparam-viz" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><HyperparamViz /></Suspense></ErrorBoundary>} />
          <Route path="ensemble" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Ensemble /></Suspense></ErrorBoundary>} />
          <Route path="explainability" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Explainability /></Suspense></ErrorBoundary>} />
          <Route path="lineage" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Lineage /></Suspense></ErrorBoundary>} />
          <Route path="model-cards" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ModelCards /></Suspense></ErrorBoundary>} />
          <Route path="federated" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Federated /></Suspense></ErrorBoundary>} />
          <Route path="active-learning" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ActiveLearning /></Suspense></ErrorBoundary>} />
          <Route path="auto-features" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AutoFeatures /></Suspense></ErrorBoundary>} />
          <Route path="organizations" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Organizations /></Suspense></ErrorBoundary>} />
          <Route path="cluster" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><GPUClusterSim /></Suspense></ErrorBoundary>} />
          <Route path="orchestration" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Orchestration /></Suspense></ErrorBoundary>} />
          <Route path="nas" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><NAS /></Suspense></ErrorBoundary>} />
          <Route path="streaming" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><StreamingML /></Suspense></ErrorBoundary>} />
          <Route path="debug-studio" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><DebugStudio /></Suspense></ErrorBoundary>} />
          <Route path="synthetic-data" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><SyntheticData /></Suspense></ErrorBoundary>} />
          <Route path="multimodal" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><MultiModal /></Suspense></ErrorBoundary>} />
          <Route path="rl-playground" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><RLPlayground /></Suspense></ErrorBoundary>} />
          <Route path="mlops-cicd" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><MLOpsCICD /></Suspense></ErrorBoundary>} />
          <Route path="admin" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense></ErrorBoundary>} />
          <Route path="analytics" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Analytics /></Suspense></ErrorBoundary>} />
          <Route path="data-catalog" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><DataCatalog /></Suspense></ErrorBoundary>} />
          <Route path="integrations/github" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><GitHubIntegration /></Suspense></ErrorBoundary>} />
          <Route path="integrations/webhooks" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Webhooks /></Suspense></ErrorBoundary>} />
          <Route path="docs" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Documentation /></Suspense></ErrorBoundary>} />
          <Route path="themes" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Themes /></Suspense></ErrorBoundary>} />
        </Route>
      </Routes>
    </>
  );
}
