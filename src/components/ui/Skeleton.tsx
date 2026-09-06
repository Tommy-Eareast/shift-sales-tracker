type SkeletonProps = { rows?: number; height?: string; className?: string };

/**
 * Simple skeleton loader for consistent loading states.
 */
export function Skeleton({ rows = 3, height = 'h-10', className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse space-y-2 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={`${height} bg-stone-100 rounded-xl`} />
            ))}
        </div>
    );
}
