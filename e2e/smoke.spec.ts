import { expect, test } from "@playwright/test";

/**
 * Caminos críticos, de punta a punta.
 *
 * Usan el acceso de desarrollo (DEV_LOGIN) porque OAuth de Google no se puede
 * automatizar sin credenciales reales. Todo lo que ocurre después del login
 * es exactamente el mismo código que en producción.
 */

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: /modo desarrollo/i }).click();
  await page.waitForURL("/");
}

test.describe("sin sesión", () => {
  test("la app está cerrada con llave", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("las páginas internas también", async ({ page }) => {
    for (const path of ["/horario", "/tareas", "/entrenamiento", "/ajustes"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/entrar/);
    }
  });
});

test.describe("con sesión", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("el dashboard abre en Hoy", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Hoy", level: 1 })).toBeVisible();
  });

  test("se puede navegar por todos los módulos", async ({ page }) => {
    const routes: [string, string][] = [
      ["/horario", "Horario"],
      ["/materias", "Materias"],
      ["/asistencia", "Asistencia"],
      ["/tareas", "Tareas"],
      ["/pendientes", "Pendientes"],
      ["/entrenamiento", "Entrenamiento"],
      ["/ajustes", "Ajustes"],
    ];

    for (const [path, heading] of routes) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    }
  });

  test("crear una materia y verla en la lista", async ({ page }) => {
    const name = `Materia E2E ${Date.now()}`;

    await page.goto("/materias");
    await page.getByRole("button", { name: /nueva materia/i }).click();
    await page.getByLabel("Nombre").fill(name);
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test("crear un pendiente personal y completarlo", async ({ page }) => {
    const title = `Pendiente E2E ${Date.now()}`;

    await page.goto("/pendientes");
    await page.getByRole("button", { name: /nuevo pendiente/i }).click();
    await page.getByLabel("Título").fill(title);
    await page.getByRole("button", { name: "Guardar" }).click();

    const row = page.getByRole("listitem").filter({ hasText: title });
    await expect(row).toBeVisible();

    await row.getByRole("checkbox").check();
    // Al completarse sale de la lista de pendientes.
    await expect(page.getByRole("listitem").filter({ hasText: title })).toBeHidden({
      timeout: 10_000,
    });
  });

  test("los pendientes personales no aparecen en Tareas", async ({ page }) => {
    const title = `Solo personal ${Date.now()}`;

    await page.goto("/pendientes");
    await page.getByRole("button", { name: /nuevo pendiente/i }).click();
    await page.getByLabel("Título").fill(title);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(title)).toBeVisible();

    // Es la prueba que protege la decisión de una sola tabla (ADR-004).
    await page.goto("/tareas");
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("cambiar de unidad se refleja en la app", async ({ page }) => {
    await page.goto("/ajustes");
    await page.getByLabel("Unidad de peso").selectOption("lb");
    await page.getByRole("button", { name: /guardar cambios/i }).click();
    await expect(page.getByText("Guardado")).toBeVisible();

    await page.goto("/entrenamiento");
    await expect(page.getByText(/lb|—/).first()).toBeVisible();

    // Se deja como estaba para no ensuciar el siguiente run.
    await page.goto("/ajustes");
    await page.getByLabel("Unidad de peso").selectOption("kg");
    await page.getByRole("button", { name: /guardar cambios/i }).click();
  });

  test("no hay desplazamiento horizontal en móvil ni en escritorio", async ({ page }) => {
    for (const path of ["/", "/horario", "/tareas", "/entrenamiento"]) {
      await page.goto(path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflows, `${path} se desborda horizontalmente`).toBe(false);
    }
  });
});
