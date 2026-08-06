import type { ReactNode } from "react";

/**
 * Una lista vacía nunca es una pantalla en blanco: explica qué va ahí y
 * ofrece el botón para empezar (docs/05).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border px-6 py-12 text-center">
      {icon && <div className="mb-3 text-text-subtle">{icon}</div>}
      <p className="text-[15px] font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
