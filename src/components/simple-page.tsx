export function SimplePage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="prose-content mt-6 space-y-4 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </div>
  );
}
