import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>

            {/* Content */}
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Media */}
            <Skeleton className="mt-3 h-48 w-full" />

            {/* Stats */}
            <div className="mt-3 flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="px-2 py-1 flex justify-around">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-8 w-20" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}