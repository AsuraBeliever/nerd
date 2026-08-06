// @vitest-environment node

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getCourse, getSchedule, listBlocks, listCourses } from "@/features/courses/queries";
import { getTask, listTasks } from "@/features/tasks/queries";
import { getRoutine, listRoutines } from "@/features/training/queries";
import * as schema from "./schema";

/**
 * Aislamiento entre usuarios: el riesgo número uno de una app multiusuario.
 *
 * Estas pruebas crean dos usuarios con datos propios y verifican que ninguno
 * alcanza los del otro. No se borran nunca (docs/08-seguridad.md).
 *
 * Necesitan una base de datos real; sin DATABASE_URL se saltan, para que CI
 * no falle por algo que no tiene.
 */
const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run("aislamiento entre usuarios", () => {
  const sql = postgres(url ?? "", { max: 1 });
  const db = drizzle(sql, { schema });

  const ids = { ana: "", beto: "" };
  const data = { anaCourse: "", betoCourse: "", anaTask: "", betoTask: "", anaRoutine: "" };

  beforeAll(async () => {
    const [ana] = await db
      .insert(schema.users)
      .values({ email: `ana-${crypto.randomUUID()}@test.local`, name: "Ana" })
      .returning();
    const [beto] = await db
      .insert(schema.users)
      .values({ email: `beto-${crypto.randomUUID()}@test.local`, name: "Beto" })
      .returning();

    if (!ana || !beto) throw new Error("No se pudieron crear los usuarios de prueba");
    ids.ana = ana.id;
    ids.beto = beto.id;

    for (const [key, userId] of [
      ["ana", ana.id],
      ["beto", beto.id],
    ] as const) {
      const [term] = await db
        .insert(schema.terms)
        .values({ userId, name: `Semestre de ${key}`, isActive: true })
        .returning();
      if (!term) throw new Error("No se pudo crear el semestre");

      const [course] = await db
        .insert(schema.courses)
        .values({ userId, termId: term.id, name: `Materia de ${key}` })
        .returning();
      if (!course) throw new Error("No se pudo crear la materia");

      await db.insert(schema.courseBlocks).values({
        userId,
        courseId: course.id,
        weekday: 1,
        startTime: "07:00",
        endTime: "09:00",
      });

      const [task] = await db
        .insert(schema.tasks)
        .values({ userId, courseId: course.id, title: `Tarea de ${key}` })
        .returning();
      if (!task) throw new Error("No se pudo crear la tarea");

      if (key === "ana") {
        data.anaCourse = course.id;
        data.anaTask = task.id;
        const [routine] = await db
          .insert(schema.routines)
          .values({ userId, name: "Rutina de ana" })
          .returning();
        data.anaRoutine = routine?.id ?? "";
      } else {
        data.betoCourse = course.id;
        data.betoTask = task.id;
      }
    }
  });

  afterAll(async () => {
    // En cascada se lleva todo lo que colgaba de cada usuario.
    if (ids.ana) await db.delete(schema.users).where(eq(schema.users.id, ids.ana));
    if (ids.beto) await db.delete(schema.users).where(eq(schema.users.id, ids.beto));
    await sql.end();
  });

  it("cada quien ve solo sus materias", async () => {
    const anaCourses = await listCourses(ids.ana);
    const betoCourses = await listCourses(ids.beto);

    expect(anaCourses.map((c) => c.name)).toEqual(["Materia de ana"]);
    expect(betoCourses.map((c) => c.name)).toEqual(["Materia de beto"]);
  });

  it("pedir la materia de otro devuelve nada, no un error revelador", async () => {
    // La capa de datos devuelve null; la página lo convierte en 404, nunca en
    // 403, porque un 403 confirmaría que el recurso existe.
    expect(await getCourse(ids.beto, data.anaCourse)).toBeNull();
    expect(await getCourse(ids.ana, data.betoCourse)).toBeNull();
  });

  it("la materia propia sí se encuentra", async () => {
    expect((await getCourse(ids.ana, data.anaCourse))?.name).toBe("Materia de ana");
  });

  it("el horario no mezcla bloques de otro usuario", async () => {
    const anaSchedule = await getSchedule(ids.ana);
    expect(anaSchedule).toHaveLength(1);
    expect(anaSchedule[0]?.course.name).toBe("Materia de ana");

    const anaBlocks = await listBlocks(ids.ana);
    expect(anaBlocks.every((b) => b.userId === ids.ana)).toBe(true);
  });

  it("las tareas no se filtran entre cuentas", async () => {
    const anaTasks = await listTasks(ids.ana);
    expect(anaTasks.map((t) => t.title)).toEqual(["Tarea de ana"]);

    expect(await getTask(ids.beto, data.anaTask)).toBeNull();
    expect((await getTask(ids.ana, data.anaTask))?.title).toBe("Tarea de ana");
  });

  it("las rutinas de entrenamiento tampoco", async () => {
    expect(await getRoutine(ids.beto, data.anaRoutine)).toBeNull();
    expect((await getRoutine(ids.ana, data.anaRoutine))?.name).toBe("Rutina de ana");
    expect(await listRoutines(ids.beto)).toHaveLength(0);
  });

  it("borrar la cuenta se lleva todo en cascada", async () => {
    const [temp] = await db
      .insert(schema.users)
      .values({ email: `temp-${crypto.randomUUID()}@test.local` })
      .returning();
    if (!temp) throw new Error("No se pudo crear el usuario temporal");

    const [term] = await db
      .insert(schema.terms)
      .values({ userId: temp.id, name: "Temporal" })
      .returning();
    if (!term) throw new Error("No se pudo crear el semestre temporal");

    await db.insert(schema.courses).values({ userId: temp.id, termId: term.id, name: "Temporal" });

    await db.delete(schema.users).where(eq(schema.users.id, temp.id));

    const leftovers = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.userId, temp.id));
    expect(leftovers).toHaveLength(0);
  });
});
