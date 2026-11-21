// Vice Cover Studio — Neon Harbor edition: the entry program.
// Node 22, standard library only. It hands the finished studio in: this
// repository's app/ and screenshots/ are copied into the output
// directory, and /output/dossier.json is written with the vendored
// make.fun library, so the gate and the judge read exactly what was
// built — nothing more, nothing fetched. Running it twice over the same
// tree produces a byte-identical dossier.json, which the hand-in relies
// on.
//
// Run it locally with MAKEFUN_OUTPUT_DIR set, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty (reference/gate.json), mirrored so a
// local run fails the same way the scorer would: dossier text capped at
// 160 KiB, at most 4 screenshots of at most 256 KiB each, app/ under 993
// files and 48 MiB, and no path under app/ longer than 1000 bytes.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierOptions));
console.log(`Vice Cover Studio (Neon Harbor edition) handed in to ${outputDir}`);
