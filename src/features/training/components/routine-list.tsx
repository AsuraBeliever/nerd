"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createRoutine } from "../actions";

export function RoutineList({
  routines,
}: {
  routines: { id: string; name: string; description: string | null; exerciseCount: number }[];
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function create(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await createRoutine({
        name: formData.get("name"),
        description: ((formData.get("description") as string) || "").trim() || null,
      });
      if (result.ok) setCreating(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nueva rutina
        </Button>
      </div>

      {routines.length === 0 ? (
        <EmptyState
          title="Todavía no tienes rutinas"
          description="Una rutina es tu lista de ejercicios con series y repeticiones objetivo. Puedes tener varias."
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              Crear rutina
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {routines.map((routine) => (
            <li key={routine.id} className="px-4 py-3">
              <Link href={`/entrenamiento/rutinas/${routine.id}`} className="block hover:underline">
                <span className="text-[15px]">{routine.name}</span>
              </Link>
              <p className="text-[13px] text-text-subtle">
                {routine.exerciseCount} {routine.exerciseCount === 1 ? "ejercicio" : "ejercicios"}
                {routine.description && ` · ${routine.description}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva rutina">
        <form action={create} className="space-y-4">
          <Field label="Nombre" htmlFor="name">
            <Input id="name" name="name" required maxLength={80} placeholder="Torso en casa" />
          </Field>
          <Field label="Descripción" htmlFor="description" hint="Opcional">
            <Textarea id="description" name="description" maxLength={500} />
          </Field>
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
