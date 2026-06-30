import React from "react";

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-[4/5] bg-gray-900 shimmer-bg" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-800 rounded w-1/4" />
          <div className="h-3 bg-gray-800 rounded w-1/6" />
        </div>
        <div className="h-5 bg-gray-800 rounded w-3/4 mt-1" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
          <div className="h-6 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-1/5" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
