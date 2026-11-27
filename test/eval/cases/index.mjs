// Încărcare leneșă a seturilor etichetate (scrise de autor; nu sunt independente).
export const CASE_LANGS = ['ro', 'en', 'fr', 'es', 'pt'];
export async function loadCases(lang) {
  const m = await import(`./${lang}.mjs`);
  return m.default;
}
