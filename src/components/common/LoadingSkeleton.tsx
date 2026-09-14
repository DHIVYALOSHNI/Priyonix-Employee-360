import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse bg-[#E7E3D8] rounded ${className}`} />
);

export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-[#E7E3D8] shadow-xs">
    <div className="flex items-center justify-between">
      <div className="space-y-2.5 w-2/3">
        <Skeleton className="h-3.5 w-28 bg-[#E7E3D8]" />
        <Skeleton className="h-8 w-20 bg-[#E7E3D8]" />
      </div>
      <div className="w-12 h-12 rounded-xl bg-[#E7E3D8]/60 flex items-center justify-center animate-pulse" />
    </div>
    <div className="mt-5 pt-3.5 border-t border-[#E7E3D8] flex items-center justify-between">
      <Skeleton className="h-3 w-32 bg-[#E7E3D8]" />
      <Skeleton className="h-3 w-16 bg-[#E7E3D8]" />
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#E7E3D8] p-6 shadow-xs space-y-4 ${className}`}>
    <div className="flex items-center space-x-3">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-[#E7E3D8]" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-36 bg-[#E7E3D8]" />
        <Skeleton className="h-3 w-24 bg-[#E7E3D8]" />
      </div>
    </div>
    <div className="space-y-2 pt-1">
      <Skeleton className="h-3 w-full bg-[#E7E3D8]" />
      <Skeleton className="h-3 w-5/6 bg-[#E7E3D8]" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-[#E7E3D8]">
      <Skeleton className="h-6 w-20 rounded-full bg-[#E7E3D8]" />
      <Skeleton className="h-8 w-24 rounded-lg bg-[#E7E3D8]" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 5 
}) => (
  <div className="bg-white rounded-2xl border border-[#E7E3D8] overflow-hidden shadow-xs">
    <div className="p-4 border-b border-[#E7E3D8] bg-[#F8F6F1] flex items-center justify-between">
      <Skeleton className="h-5 w-44 bg-[#E7E3D8]" />
      <Skeleton className="h-8 w-32 rounded-lg bg-[#E7E3D8]" />
    </div>
    <div className="divide-y divide-[#E7E3D8]">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton 
              key={cIdx} 
              className={`h-4 bg-[#E7E3D8] ${cIdx === 0 ? 'w-48' : cIdx === columns - 1 ? 'w-20' : 'w-28'}`} 
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
  <div className={`bg-white p-6 rounded-2xl border border-[#E7E3D8] shadow-xs flex flex-col justify-between ${height}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40 bg-[#E7E3D8]" />
        <Skeleton className="h-3 w-28 bg-[#E7E3D8]" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full bg-[#E7E3D8]" />
    </div>

    {type === 'donut' ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-8 border-[#E7E3D8]/70 border-t-[#047857] animate-pulse flex items-center justify-center">
          <Skeleton className="w-16 h-4 bg-[#E7E3D8]" />
        </div>
      </div>
    ) : (
      <div className="flex-1 flex items-end justify-between gap-3 pt-4 pb-2 border-b border-l border-[#E7E3D8]">
        {Array.from({ length: 7 }).map((_, idx) => {
          const heights = ['h-24', 'h-40', 'h-32', 'h-48', 'h-28', 'h-52', 'h-36'];
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className={`w-full max-w-[36px] bg-[#E7E3D8] rounded-t animate-pulse ${heights[idx % heights.length]}`} />
              <Skeleton className="h-2.5 w-6 bg-[#E7E3D8]" />
            </div>
          );
        })}
      </div>
    )}

    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#E7E3D8]">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#E7E3D8]" />
        <Skeleton className="h-3 w-16 bg-[#E7E3D8]" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#E7E3D8]" />
        <Skeleton className="h-3 w-16 bg-[#E7E3D8]" />
      </div>
    </div>
  </div>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="p-4 bg-white rounded-xl border border-[#E7E3D8] shadow-xs flex items-start gap-3">
    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0 bg-[#E7E3D8]" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-44 bg-[#E7E3D8]" />
        <Skeleton className="h-3 w-16 bg-[#E7E3D8]" />
      </div>
      <Skeleton className="h-3.5 w-full bg-[#E7E3D8]" />
      <Skeleton className="h-3 w-2/3 bg-[#E7E3D8]" />
    </div>
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#E7E3D8] overflow-hidden shadow-xs flex flex-col">
    <Skeleton className="h-48 w-full rounded-none bg-[#E7E3D8]" />
    <div className="p-5 flex-1 flex flex-col space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-20 bg-[#E7E3D8]" />
        <Skeleton className="h-3 w-14 bg-[#E7E3D8]" />
      </div>
      <Skeleton className="h-5 w-44 bg-[#E7E3D8]" />
      <Skeleton className="h-3 w-full bg-[#E7E3D8]" />
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#E7E3D8]">
        <Skeleton className="h-6 w-24 bg-[#E7E3D8]" />
        <Skeleton className="h-9 w-28 rounded-lg bg-[#E7E3D8]" />
      </div>
    </div>
  </div>
);
