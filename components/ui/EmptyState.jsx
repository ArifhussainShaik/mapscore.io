export default function EmptyState({ title, description, action, secondary }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-16 px-6 text-center">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      <div className="mt-5 flex items-center gap-3">{action}{secondary}</div>
    </div>
  );
}
