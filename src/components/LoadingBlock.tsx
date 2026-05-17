export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span />
      {label}
    </div>
  );
}
