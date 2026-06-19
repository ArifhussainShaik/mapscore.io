export default function PageHeader({ title, description, action, breadcrumb }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div>
        {breadcrumb ? <nav className="text-xs text-neutral-500 mb-1">{breadcrumb}</nav> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {description ? <p className="text-sm text-neutral-500 mt-1">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
