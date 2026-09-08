import React from 'react';

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass-panel p-5 space-y-3 ${className}`}>
      <div className="h-4 skeleton rounded w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={`h-3 skeleton rounded ${i === lines - 2 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-surface-dim border border-white/5">
          <div className="w-5 h-5 rounded skeleton shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 skeleton rounded w-3/4" />
            <div className="h-2 skeleton rounded w-1/3" />
          </div>
          <div className="w-16 h-5 skeleton rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={4} />
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 3 }) {
  return (
    <div className={`grid grid-cols-${count} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-4 text-center space-y-2">
          <div className="h-8 skeleton rounded w-16 mx-auto" />
          <div className="h-2 skeleton rounded w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-start gap-6 mb-6">
        <div className="w-20 h-20 rounded-2xl skeleton shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 skeleton rounded w-1/2" />
          <div className="h-3 skeleton rounded w-1/3" />
          <div className="h-3 skeleton rounded w-3/4" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-surface-dim rounded-xl p-3 text-center space-y-1">
            <div className="h-6 skeleton rounded w-12 mx-auto" />
            <div className="h-2 skeleton rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
