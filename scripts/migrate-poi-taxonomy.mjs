/**
 * Migration ponctuelle : `subcategory` (texte libre) -> `specialty`,
 * et ajout de `subcategory` typé issu de la taxonomie unifiée.
 *
 * Usage : node scripts/migrate-poi-taxonomy.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Compile la taxonomie TS en CJS pour réutiliser `classifySubcategory` sans duplication. */
function loadTaxonomy() {
  const outDir = mkdtempSync(join(tmpdir(), 'taxonomy-'));
  const outFile = join(outDir, 'taxonomy.cjs');
  execFileSync(
    'npx',
    [
      'esbuild',
      join(ROOT, 'shared/src/data/taxonomy.ts'),
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--outfile=${outFile}`,
      '--log-level=error',
    ],
    { cwd: ROOT, stdio: 'inherit' },
  );
  return require(outFile);
}

const require_ = (await import('node:module')).createRequire(import.meta.url);
globalThis.require = require_;
const { classifySubcategory } = loadTaxonomy();

const FILES = [
  {
    path: join(ROOT, 'shared/src/data/chartronsPois.ts'),
    // Clés non quotées, valeurs en apostrophes simples.
    pattern: /(\n(\s*)category: '([^']*)',\n\s*)subcategory: '([^']*)',/g,
    render: (indent, category, specialty) => {
      const unified = classifySubcategory(specialty, category);
      return `subcategory: '${unified}',\n${indent}specialty: '${specialty}',`;
    },
  },
  {
    path: join(ROOT, 'shared/src/data/osmChartronsPois.ts'),
    // Clés et valeurs en guillemets doubles (fichier généré).
    pattern: /(\n(\s*)"category": "([^"]*)",\n\s*)"subcategory": "([^"]*)",/g,
    render: (indent, category, specialty) => {
      const unified = classifySubcategory(specialty, category);
      return `"subcategory": "${unified}",\n${indent}"specialty": "${specialty}",`;
    },
  },
];

let totalRewritten = 0;
const distribution = new Map();

for (const file of FILES) {
  const source = readFileSync(file.path, 'utf8');
  let count = 0;
  const output = source.replace(file.pattern, (_match, prefix, indent, category, specialty) => {
    count += 1;
    const unified = classifySubcategory(specialty, category);
    distribution.set(unified, (distribution.get(unified) ?? 0) + 1);
    return prefix + file.render(indent, category, specialty);
  });
  writeFileSync(file.path, output);
  totalRewritten += count;
  console.log(`${file.path.replace(`${ROOT}/`, '')}: ${count} POI migrés`);
}

console.log(`\nTotal : ${totalRewritten} POI migrés`);
console.log('Répartition par sous-catégorie unifiée :');
for (const [key, value] of [...distribution.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(value).padStart(4)}  ${key}`);
}
