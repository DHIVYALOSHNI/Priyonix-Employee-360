import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse bg-[#DDD7CA]/70 rounded ${className}`} />
);

export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-[#EFEAE0] p-6 rounded-2xl border border-[#DDD7CA] shadow-sm">
    <div className="flex items-center justify-between">
      <div className="space-y-2.5 w-2/3">
        <Skeleton className="h-3.5 w-28 bg-[#DDD7CA]" />
        <Skeleton className="h-8 w-20 bg-[#DDD7CA]" />
      </div>
      <div className="w-12 h-12 rounded-xl bg-[#DDD7CA]/60 flex items-center justify-center animate-pulse" />
    </div>
    <div className="mt-5 pt-3.5 border-t border-[#DDD7CA]/60 flex items-center justify-between">
      <Skeleton className="h-3 w-32 bg-[#DDD7CA]" />
      <Skeleton className="h-3 w-16 bg-[#DDD7CA]" />
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-[#EFEAE0] rounded-2xl border border-[#DDD7CA] p-6 shadow-sm space-y-4 ${className}`}>
    <div className="flex items-center space-x-3">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-[#DDD7CA]" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-36 bg-[#DDD7CA]" />
        <Skeleton className="h-3 w-24 bg-[#DDD7CA]" />
      </div>
    </div>
    <div className="space-y-2 pt-1">
      <Skeleton className="h-3 w-full bg-[#DDD7CA]" />
      <Skeleton className="h-3 w-5/6 bg-[#DDD7CA]" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-[#DDD7CA]/60">
      <Skeleton className="h-6 w-20 rounded-full bg-[#DDD7CA]" />
      <Skeleton className="h-8 w-24 rounded-lg bg-[#DDD7CA]" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 5 
}) => (
  <div className="bg-[#EFEAE0] rounded-2xl border border-[#DDD7CA] overflow-hidden shadow-sm">
    <div className="p-4 border-b border-[#DDD7CA] bg-[#E5E0D5]/50 flex items-center justify-between">
      <Skeleton className="h-5 w-44 bg-[#DDD7CA]" />
      <Skeleton className="h-8 w-32 rounded-lg bg-[#DDD7CA]" />
    </div>
    <div className="divide-y divide-[#DDD7CA]/50">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton 
              key={cIdx} 
              className={`h-4 bg-[#DDD7CA] ${cIdx === 0 ? 'w-48' : cIdx === columns - 1 ? 'w-20' : 'w-28'}`} 
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string; type?: 'bar' | 'donut' | 'line' }> = ({ 
  height = 'h-72',
  type = 'bar'
}) => (
  <div className={`bg-[#EFEAE0] p-6 rounded-2xl border border-[#DDD7CA] shadow-sm flex flex-col justify-between ${height}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40 bg-[#DDD7CA]" />
        <Skeleton className="h-3 w-28 bg-[#DDD7CA]" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full bg-[#DDD7CA]" />
    </div>

    {type === 'donut' ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-8 border-[#DDD7CA]/70 border-t-[#DDD7CA] animate-pulse flex items-center justify-center">
          <Skeleton className="w-16 h-4 bg-[#DDD7CA]" />
        </div>
      </div>
    ) : (
      <div className="flex-1 flex items-end justify-between gap-3 pt-4 pb-2 border-b border-l border-[#DDD7CA]">
        {Array.from({ length: 7 }).map((_, idx) => {
          const heights = ['h-24', 'h-40', 'h-32', 'h-48', 'h-28', 'h-52', 'h-36'];
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className={`w-full max-w-[36px] bg-[#DDD7CA]/70 rounded-t animate-pulse ${heights[idx % heights.length]}`} />
              <Skeleton className="h-2.5 w-6 bg-[#DDD7CA]" />
            </div>
          );
        })}
      </div>
    )}

    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#DDD7CA]/60">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#DDD7CA]" />
        <Skeleton className="h-3 w-16 bg-[#DDD7CA]" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#DDD7CA]" />
        <Skeleton className="h-3 w-16 bg-[#DDD7CA]" />
      </div>
    </div>
  </div>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="p-4 bg-[#EFEAE0] rounded-xl border border-[#DDD7CA] shadow-sm flex items-start gap-3">
    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0 bg-[#DDD7CA]" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-44 bg-[#DDD7CA]" />
        <Skeleton className="h-3 w-16 bg-[#DDD7CA]" />
      </div>
      <Skeleton className="h-3.5 w-full bg-[#DDD7CA]" />
      <Skeleton className="h-3 w-2/3 bg-[#DDD7CA]" />
    </div>
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-[#EFEAE0] rounded-2xl border border-[#DDD7CA] overflow-hidden shadow-sm flex flex-col">
    <Skeleton className="h-48 w-full rounded-none bg-[#DDD7CA]" />
    <div className="p-5 flex-1 flex flex-col space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-20 bg-[#DDD7CA]" />
        <Skeleton className="h-3 w-14 bg-[#DDD7CA]" />
      </div>
      <Skeleton className="h-5 w-44 bg-[#DDD7CA]" />
      <Skeleton className="h-3 w-full bg-[#DDD7CA]" />
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#DDD7CA]/60">
        <Skeleton className="h-6 w-24 bg-[#DDD7CA]" />
        <Skeleton className="h-9 w-28 rounded-lg bg-[#DDD7CA]" />
      </div>
    </div>
  </div>
);
