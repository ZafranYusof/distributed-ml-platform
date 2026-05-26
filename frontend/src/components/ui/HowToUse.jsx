import { useState, useEffect, useRef } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function HowToUse({ pageId, steps }) {
  const storageKey = `howToUse_collapsed_${pageId}`;
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored === null ? true : stored === 'true';
  });
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    localStorage.setItem(storageKey, String(collapsed));
  }, [collapsed, storageKey]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [steps]);

  return (
    <div className="mb-6 rounded-xl border border-purple-500/20 bg-purple-900/10 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-purple-500/10 transition-colors duration-200"
        aria-expanded={!collapsed}
        aria-controls={`howto-content-${pageId}`}
      >
        <span className="flex items-center gap-2 text-purple-300 font-medium">
          <HelpCircle className="w-4 h-4" />
          How to Use
        </span>
        <ChevronDown
          className={`w-4 h-4 text-purple-400 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
      <div
        id={`howto-content-${pageId}`}
        ref={contentRef}
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: collapsed ? '0px' : `${contentHeight}px`, opacity: collapsed ? 0 : 1 }}
      >
        <ol className="px-5 pb-4 pt-1 space-y-1.5 text-sm text-gray-300 list-decimal list-inside">
          {steps.map((step, i) => (
            <li key={i} className="leading-relaxed">{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
