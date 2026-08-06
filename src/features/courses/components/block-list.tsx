"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatTime, weekdayName } from "@/lib/dates";
import { deleteBlock } from "../actions";
import { BlockForm, type BlockFormValues } from "./block-form";

export function BlockList({
  courseId,
  blocks,
}: {
  courseId: string;
  blocks: (BlockFormValues & { id: string })[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<(BlockFormValues & { id: string }) | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function remove(id: string) {
    start(async () => {
      await deleteBlock(id);
    });
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Horario</h2>
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Agregar clase
        </Button>
      </div>

      {warning && (
        <p className="mb-3 rounded-control border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] text-text">
          {warning}
        </p>
      )}

      {blocks.length === 0 ? (
        <EmptyState
          title="Esta materia no tiene horario"
          description="Es válido dejarla así, por ejemplo si es en línea."
          action={
            <Button variant="secondary" onClick={() => setCreating(true)}>
              Agregar clase
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {blocks.map((block) => (
            <li key={block.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">{weekdayName(block.weekday)}</p>
                <p className="text-[13px] text-text-secondary">
                  {formatTime(block.startTime)}–{formatTime(block.endTime)}
                  {block.room && ` · ${block.room}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(block)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                aria-label="Eliminar clase"
                disabled={pending}
                onClick={() => remove(block.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <BlockForm
          open
          courseId={courseId}
          onClose={() => setCreating(false)}
          onWarning={setWarning}
        />
      )}
      {editing && (
        <BlockForm
          open
          courseId={courseId}
          initial={editing}
          onClose={() => setEditing(null)}
          onWarning={setWarning}
        />
      )}
    </section>
  );
}
