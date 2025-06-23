"use server"

export default async function MapLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-ml-2 md:-ml-3 -mb-4 md:-mb-6 pt-1 pr-4 md:pr-6 min-h-[calc(100vh-var(--banner-height)-var(--header-height)-0.25rem)] w-[calc(100%+0.5rem)] md:w-[calc(100%+0.75rem)]">
      {children}
    </div>
  )
}
