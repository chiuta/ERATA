// Utilitare comune pentru evaluare și teste adversariale (motor, corpusuri, editări).
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Erata } from '../../src/core/engine.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DICT_DIR = resolve(ROOT, 'dict');
export const CORPUS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'corpus');
export const HELDOUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'heldout');

export function createEngine() {
  return new Erata({
    loadDict: async (n) => (existsSync(`${DICT_DIR}/${n}.aff`) ? { aff: readFileSync(`${DICT_DIR}/${n}.aff`, 'utf8'), dic: readFileSync(`${DICT_DIR}/${n}.dic`, 'utf8') } : null),
  });
}

export const NNBSP = ' ';
export const NBSP = ' ';

/** Corpusul francez este stocat cu spații simple; aici aplicăm spațierea tipografică franceză. */
export function frenchTypography(t) {
  return t
    .replace(/ ([;!?])/g, `${NNBSP}$1`)
    .replace(/ :/g, `${NBSP}:`)
    .replace(/« /g, `«${NNBSP}`)
    .replace(/ »/g, `${NNBSP}»`);
}

/** Citește corpusul unei limbi: { categorie: text }. */
export function loadCorpus(lang, dir = CORPUS_DIR) {
  const raw = readFileSync(`${dir}/${lang}.txt`, 'utf8');
  const out = {};
  let cur = null;
  for (const line of raw.split('\n')) {
    const m = line.match(/^=== (\w+) ===$/);
    if (m) {
      cur = m[1];
      out[cur] = [];
    } else if (cur) out[cur].push(line);
  }
  for (const k of Object.keys(out)) {
    let t = out[k].join('\n').trim();
    if (lang === 'fr') t = frenchTypography(t);
    out[k] = t;
  }
  return out;
}

export const countWords = (t) => (t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;

/** Aplică editări {offset,length,replacement} (nesuprapuse) unui text. */
export function applyEdits(text, edits) {
  let out = text;
  for (const e of [...edits].sort((a, b) => b.offset - a.offset)) out = out.slice(0, e.offset) + e.replacement + out.slice(e.offset + e.length);
  return out;
}

/** Generator pseudo-aleator determinist (LCG). */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
