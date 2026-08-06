import { expect, test } from "@playwright/test";

test("la página carga y muestra el nombre del proyecto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "nerd", level: 1 })).toBeVisible();
});

test("no hay desplazamiento horizontal", async ({ page }) => {
  await page.goto("/");
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
