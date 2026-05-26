import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Database, Package, History, Store,
  Tag, BookOpen, Rocket, Inbox
} from 'lucide-react';

const icons = {
  experiments: FlaskConical,
  datasets: Database,
  models: Package,
  history: History,
  marketplace: Store,
  annotations: Tag,
  notebooks: BookOpen,
  training: Rocket,
  default: Inbox,
};

function EmptyState({ icon, title, description, actionLabel, actionPath, onAction }) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  // icon can be a string key, a lucide component, or undefined
  let IconComponent = null;
  if (typeof icon === 'string') {
    IconComponent = icons[icon] || icons.default;
  } else if (typeof icon === 'function' || typeof icon === 'object') {
    IconComponent = icon;
  } else {
    IconComponent = icons.default;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 text-purple-300/40" role="img" aria-hidden="true">
        <IconComponent className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-semibold text-dark-200 mb-2">{title}</h3>
      <p className="text-purple-300/50 text-sm max-w-sm mb-6">{description}</p>
      {(actionLabel && (actionPath || onAction)) && (
        <button
          onClick={handleAction}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default memo(EmptyState);
