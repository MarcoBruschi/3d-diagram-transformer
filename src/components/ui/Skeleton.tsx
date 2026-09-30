'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'pulse' | 'shimmer';
}

export function Skeleton({
  className = '',
  variant = 'shimmer',
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-md bg-[#101520]/80 dark:bg-[#101520]/80 border border-[#1E273A]/60 ${
        variant === 'shimmer'
          ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#38BDF8]/10 before:to-transparent"
          : 'animate-pulse'
      } ${className}`}
      {...props}
    />
  );
}

export function DiagramCardSkeleton() {
  return (
    <div className="flex flex-col p-4 rounded-lg bg-[#0B0E14] border border-[#1E273A] space-y-3">
      {/* Thumbnail area */}
      <Skeleton className="h-36 w-full rounded" />
      {/* Title */}
      <Skeleton className="h-5 w-3/4 rounded" />
      {/* Description lines */}
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-4/5 rounded" />
      </div>
      {/* Metadata footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1E273A]/50">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}

export function MetricsHudSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-[#0B0E14] border border-[#1E273A] space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 w-full rounded" />
        <Skeleton className="h-16 w-full rounded" />
        <Skeleton className="h-16 w-full rounded" />
      </div>
      <Skeleton className="h-28 w-full rounded" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-[#1E273A]/40 px-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded ${i === 0 ? 'w-1/3' : 'flex-1'}`}
        />
      ))}
    </div>
  );
}
