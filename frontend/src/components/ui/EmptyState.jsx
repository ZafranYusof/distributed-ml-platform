import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

const icons = {
  experiments: '🧪',
  datasets: '📁',
  models: '📦',
  history: '📜',
  marketplace: '🏪',
  annotations: '🏷',
  notebooks: '📓',
  training: '🚀',
  default: '📭',
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

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4" role="img" aria-hidden="true">
        {icon || icons.default}
      </div>
      <h3 className="text-lg font-semibold text-dark-200 mb-2">{title}</h3>
      <p className="text-dark-400 text-sm max-w-sm mb-6">{description}</p>
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
