"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./button";

/**
 * Modal sobre el elemento `<dialog>` nativo.
 *
 * Se eligió lo nativo en vez de una librería: el navegador ya da el atrapado
 * de foco, el cierre con Escape, la capa de fondo y el rol de accesibilidad.
 * Menos dependencias y menos superficie de error.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // El equivalente con teclado es Escape, que `<dialog>` ya maneja nativamente.
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape cubre el caso de teclado.
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) cierra.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-0 text-text backdrop:bg-black/40"
    >
      {open && (
        <div className="flex flex-col">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Cerrar">
              <X className="size-4" />
            </Button>
          </header>
          <div className="px-5 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
