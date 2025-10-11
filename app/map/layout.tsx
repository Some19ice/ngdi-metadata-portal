"use server"

export default async function MapLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-[calc(100vh-var(--banner-height)-var(--header-height))] max-h-[calc(100vh-var(--banner-height)-var(--header-height))] w-full overflow-hidden">
      {children}
    </div>
  )
}
