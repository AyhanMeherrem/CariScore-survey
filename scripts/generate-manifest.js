import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "CaricatureImages");
const PEOPLE_DIR = path.join(ROOT, "People");
const OUTPUTS_DIR = path.join(ROOT, "InferenceOutputs");
// Written inside CaricatureImages/ itself, since that whole folder is the
// Vite publicDir and gets served at the site root (see vite.config.js).
const OUT_FILE = path.join(ROOT, "stimuli-manifest.json");

function slugify(f) {
  return f.replace(/\.(jpg|jpeg|png)$/i, "");
}

function main() {
  const people = fs
    .readdirSync(PEOPLE_DIR)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f) && !/caricature/i.test(f))
    .map((f) => ({ id: slugify(f), referenceImage: path.posix.join("People", f) }));

  const methods = fs
    .readdirSync(OUTPUTS_DIR)
    .filter((f) => fs.statSync(path.join(OUTPUTS_DIR, f)).isDirectory());

  const stimuli = [];
  const missing = [];
  const placeholders = [];

  people.forEach((person) => {
    methods.forEach((method) => {
      const dir = path.join(OUTPUTS_DIR, method, person.id);
      if (!fs.existsSync(dir)) {
        missing.push(`${method} / ${person.id} -> klasor bulunamadi`);
        return;
      }
      const files = fs
        .readdirSync(dir)
        .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
        .sort();
      if (files.length === 0) {
        missing.push(`${method} / ${person.id} -> gorsel yok`);
        return;
      }
      const isPlaceholder = fs.existsSync(path.join(dir, "PLACEHOLDER.txt"));
      if (isPlaceholder) {
        placeholders.push(`${method} / ${person.id}`);
      }
      // All available seed variants are kept here; the actual seed shown to
      // a given participant is picked at random client-side (see
      // src/survey-config.js) so it varies per participant, not per build.
      stimuli.push({
        referenceId: person.id,
        method,
        placeholder: isPlaceholder,
        variants: files.map((f) => ({
          variant: f,
          image: path.posix.join("InferenceOutputs", method, person.id, f),
        })),
      });
    });
  });

  const manifest = { generatedAt: new Date().toISOString(), references: people, methods, stimuli };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));

  console.log(`Manifest yazildi: ${stimuli.length} cift (${people.length} referans x ${methods.length} method)`);
  if (placeholders.length) {
    console.warn(`\nPlaceholder (siyah) gorsel kullanilan ciftler (${placeholders.length}) - gercek veriyle degistirin:`);
    placeholders.forEach((p) => console.warn(`   - ${p}`));
  }
  if (missing.length) {
    console.warn(`\nEksik ciftler (${missing.length}):`);
    missing.forEach((m) => console.warn(`   - ${m}`));
  }
}

main();
