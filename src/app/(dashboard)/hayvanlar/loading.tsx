import { Skeleton } from "@/components/ui/skeleton"

export default function HayvanlarLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>

      {/* Filter skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-[180px]" />
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-8 w-full max-w-sm" />

      {/* Table skeleton */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <div className="flex gap-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 border-b p-4 last:border-0">
            <Skeleton className="h-4 w-24 font-mono" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  )
}
