import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['Ctrl', 'N'], description: 'New experiment' },
  { keys: ['Ctrl', 'R'], description: 'Run training' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[9988]" onClick={() => setOpen(false)} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[9989]">
        <div className="bg-dark-800/40 border border-dark-600 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
            <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-purple-300/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3">
            {SHORTCUTS.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-purple-200/70">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, j) => (
                    <span key={j}>
                      <kbd className="px-2 py-1 text-xs bg-dark-700 text-dark-200 rounded border border-dark-600 font-mono">
                        {key}
                      </kbd>
                      {j < shortcut.keys.length - 1 && <span className="text-purple-300/40 mx-0.5">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-purple-500/20">
            <p className="text-xs text-purple-300/40 text-center">Press ESC or Ctrl+/ to close</p>
          </div>
        </div>
      </div>
    </>
  );
}
