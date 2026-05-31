export default function ServiceManualLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col md:-mx-6 md:-mt-6">
      {children}
    </div>
  )
}
