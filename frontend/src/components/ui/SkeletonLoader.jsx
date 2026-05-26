import { memo } from 'react';

function SkeletonPulse({ className = '' }) {
  return (
    <div className={`animate-shimmer bg-gradient-to-r from-purple-900/40 via-purple-700/30 to-purple-900/40 bg-[length:200%_100%] rounded ${className}`} />
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-dark-800/50 backdrop-blur-md border border-purple-500/20 rounded-xl p-6 space-y-3">
          <SkeletonPulse className="h-5 w-3/4" />
          <SkeletonPulse className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <SkeletonPulse className="h-6 w-16 rounded-full" />
            <SkeletonPulse className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonPulse className="h-4 w-full mt-2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-4 pb-3 border-b border-purple-500/20">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonPulse key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-purple-500/10">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonPulse key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-dark-800/50 backdrop-blur-md border border-purple-500/20 rounded-xl p-6">
      <SkeletonPulse className="h-5 w-48 mb-4" />
      <div className="h-64 flex items-end gap-2 pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonPulse
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

function SkeletonLoader({ variant = 'card', ...props }) {
  switch (variant) {
    case 'card': return <CardSkeleton {...props} />;
    case 'table': return <TableSkeleton {...props} />;
    case 'chart': return <ChartSkeleton {...props} />;
    case 'text': return <TextSkeleton {...props} />;
    default: return <CardSkeleton {...props} />;
  }
}

export default memo(SkeletonLoader);
