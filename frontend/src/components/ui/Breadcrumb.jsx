import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const routeLabels = {
  '/': 'Dashboard',
  '/training': 'Training',
  '/inference': 'Inference',
  '/history': 'History',
  '/compare': 'Compare',
  '/live': 'Live Sessions',
  '/automl': 'AutoML',
  '/data-explorer': 'Data Explorer',
  '/gpu': 'GPU Acceleration',
  '/pipeline': 'Pipeline Builder',
  '/marketplace': 'Marketplace',
  '/schedules': 'Schedules',
  '/ab-testing': 'A/B Testing',
  '/notebook': 'Notebook',
  '/model-versions': 'Model Versions',
  '/datasets': 'Datasets',
  '/distributed-inference': 'Distributed Inference',
  '/experiments': 'Experiments',
  '/custom-loss': 'Custom Loss',
  '/transfer-learning': 'Transfer Learning',
  '/augmentation': 'Augmentation',
  '/compression': 'Compression',
  '/inference-api': 'Inference API',
  '/annotations': 'Annotations',
  '/monitoring': 'Monitoring',
  '/feature-store': 'Feature Store',
  '/hyperparam-viz': 'Hyperparam Viz',
  '/ensemble': 'Ensemble',
  '/explainability': 'Explainability',
  '/lineage': 'Data Lineage',
  '/model-cards': 'Model Cards',
  '/federated': 'Federated',
  '/active-learning': 'Active Learning',
  '/auto-features': 'Auto Features',
  '/organizations': 'Organizations',
  '/cluster': 'GPU Cluster',
  '/orchestration': 'Orchestration',
  '/nas': 'NAS',
  '/streaming': 'Streaming ML',
  '/debug-studio': 'Debug Studio',
  '/synthetic-data': 'Synthetic Data',
  '/multimodal': 'Multi-Modal',
  '/rl-playground': 'RL Playground',
  '/mlops-cicd': 'MLOps CI/CD',
  '/admin': 'Admin Dashboard',
  '/analytics': 'Analytics',
  '/data-catalog': 'Data Catalog',
  '/integrations/github': 'GitHub',
  '/integrations/webhooks': 'Webhooks',
};

function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ path: '/', label: 'Home' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    crumbs.push({ path: currentPath, label });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-purple-300/50">
        {crumbs.map((crumb, idx) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            {idx > 0 && (
              <svg className="w-3.5 h-3.5 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {idx === crumbs.length - 1 ? (
              <span className="text-dark-200 font-medium" aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-purple-400 transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default memo(Breadcrumb);
