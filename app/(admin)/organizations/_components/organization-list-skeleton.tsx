"use client"

export default function OrganizationListSkeleton({
  className
}: {
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-md bg-gray-200"
        ></div>
      ))}
    </div>
  )
}
