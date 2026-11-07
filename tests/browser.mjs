import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.BASE_URL || "http://localhost:5173");
await page
  .getByRole("button", { name: "Klusje toevoegen", exact: true })
  .click();
await page.getByRole("combobox", { name: "Naam" }).fill("Stof");
await page.getByRole("option", { name: "Stofzuigen", exact: true }).click();
await page.locator("select").last().selectOption("daily");
await page.getByRole("button", { name: "Opslaan", exact: true }).click();
await page.getByRole("checkbox", { name: "Stofzuigen afronden" }).click();
await page.getByRole("checkbox", { name: "Stofzuigen heropenen" }).waitFor();
await page.getByRole("button", { name: "Volgende", exact: true }).click();
await page.getByRole("checkbox", { name: "Stofzuigen afronden" }).waitFor();
await page.getByRole("button", { name: "Stofzuigen bewerken" }).click();
await page.getByRole("combobox", { name: "Naam" }).fill("Alleen vandaag");
await page.getByRole("button", { name: "Opslaan", exact: true }).click();
await page.getByRole("checkbox", { name: "Alleen vandaag afronden" }).waitFor();
await page.getByRole("button", { name: "Volgende", exact: true }).click();
await page.getByRole("checkbox", { name: "Stofzuigen afronden" }).waitFor();
await page.getByRole("button", { name: "Stofzuigen bewerken" }).click();
await page.locator("select").first().selectOption("future");
await page.getByRole("combobox", { name: "Naam" }).fill("Nieuwe reeks");
await page.getByRole("button", { name: "Opslaan", exact: true }).click();
await page.getByRole("button", { name: "Volgende", exact: true }).click();
await page.getByRole("checkbox", { name: "Nieuwe reeks afronden" }).waitFor();
await page.reload();
await page.getByRole("button", { name: "Vandaag", exact: true }).click();
await page.getByRole("checkbox", { name: "Stofzuigen heropenen" }).waitFor();
for (const name of [
  "Badkamer schoonmaken",
  "Was ophangen",
  "Planten water geven",
]) {
  await page
    .getByRole("button", { name: "Klusje toevoegen", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Naam" }).fill(name);
  await page.getByRole("button", { name: "Opslaan", exact: true }).click();
}
await page.getByRole("checkbox", { name: "Was ophangen afronden" }).click();
await page.getByRole("checkbox", { name: "Stofzuigen heropenen" }).click();
await page
  .getByRole("checkbox", { name: "Planten water geven afronden" })
  .click();
await page.screenshot({ path: "mobile-preview.png", fullPage: true });
if (
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
)
  throw Error("Mobile overflow");
await page.getByRole("button", { name: "Week", exact: true }).click();
await page.getByRole("button", { name: "Dag", exact: true }).click();
await page.getByRole("button", { name: "Alle klusjes", exact: true }).click();
await page.getByRole("textbox", { name: "Klusjes zoeken" }).fill("Badkamer");
await page.getByRole("button", { name: /Badkamer schoonmaken/ }).waitFor();
await page.getByRole("button", { name: "Instellingen", exact: true }).click();
await page.getByRole("heading", { name: "Lokale modus" }).waitFor();
await page.getByRole("button", { name: "Kalender", exact: true }).click();
await page.setViewportSize({ width: 1280, height: 900 });
await page.screenshot({ path: "desktop-preview.png", fullPage: true });
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "PASS: create, autocomplete, completion, independent recurrence, single/future edits, persistence, navigation, search, mobile overflow, desktop.",
);
await browser.close();
