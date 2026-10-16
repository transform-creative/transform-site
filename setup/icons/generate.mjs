/******************************************
 * Regenerate app/presentation/elements/icons/IconSvg.ts.
 *
 * Run with `npm run icons` after adding a name to used-icons.txt.
 *
 * Why this exists: `@reacticons/ionicons` ships as a single 836KB CommonJS
 * file with every one of its ~1300 icons inlined into one object literal. It
 * has no per-icon entry points and no ESM build, so nothing can tree-shake it
 * — and because the header and footer are mounted on every page, the whole
 * 856KB chunk was fetched before any public page could render. Copying out
 * only the icons actually used takes that to a small fraction.
 *
 * The SVG strings are copied verbatim rather than redrawn, so the rendered
 * markup is byte-identical to what the package produced and no icon shifts by
 * a pixel.
 *
 * The package stays a devDependency purely so this script has something to
 * read; nothing at runtime imports it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

const PACKAGE_FILE = resolve(
  repoRoot,
  "node_modules/@reacticons/ionicons/lib/IonIcon.js",
);
const ALLOW_LIST = resolve(here, "used-icons.txt");
const OUTPUT = resolve(
  repoRoot,
  "app/presentation/elements/icons/IconSvg.ts",
);

/******************************************
 * Pull the icon map out of the bundled package.
 *
 * It is a plain object literal — `var i={accessibility:'<svg…>',"woman-sharp":'<svg…>'}`
 * — with keys quoted only where they aren't valid identifiers. Rather than
 * parse that by hand, the literal is sliced out and evaluated. It is a local
 * file from a pinned dependency, read at author time and never shipped.
 */
function readIconMap() {
  const source = readFileSync(PACKAGE_FILE, "utf8");

  const start = source.indexOf("var i={");
  const end = source.indexOf("};var u=", start);
  if (start === -1 || end === -1) {
    throw new Error(
      "Could not find the icon map in @reacticons/ionicons. The package layout " +
        "changed — check lib/IonIcon.js and update the markers in this script.",
    );
  }

  const literal = source.slice(
    start + "var i=".length,
    end + 1,
  );
  const map = new Function(
    `return ${literal}`,
  )();

  const count = Object.keys(map).length;
  if (count < 1000) {
    throw new Error(
      `Only extracted ${count} icons, expected ~1300. The slice is wrong.`,
    );
  }
  return map;
}

/** One icon name per line; blank lines and `#` comments ignored. */
function readAllowList() {
  return readFileSync(ALLOW_LIST, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line && !line.startsWith("#"),
    )
    .sort();
}

const icons = readIconMap();
const wanted = readAllowList();

const missing = wanted.filter(
  (name) => !icons[name],
);
if (missing.length) {
  throw new Error(
    `Not real ionicon names: ${missing.join(", ")}`,
  );
}

const duplicates = wanted.filter(
  (name, i) => wanted.indexOf(name) !== i,
);
if (duplicates.length) {
  throw new Error(
    `Duplicated in used-icons.txt: ${[...new Set(duplicates)].join(", ")}`,
  );
}

const entries = wanted
  .map(
    (name) =>
      `  ${JSON.stringify(name)}:\n    ${JSON.stringify(icons[name])},`,
  )
  .join("\n");

const output = `/******************************************
 * GENERATED FILE — do not edit by hand.
 *
 * Run \`npm run icons\` to regenerate. The icon names come from
 * setup/icons/used-icons.txt; the SVG bodies are copied verbatim out of
 * @reacticons/ionicons so the rendered markup is identical to what that
 * package produced.
 *
 * This holds only the icons the app actually uses. \`IoniconName\` is derived
 * from its keys, so referring to an icon that isn't here is a typecheck error
 * rather than a blank space at runtime — which is the whole safety net. If
 * typecheck names an icon, add it to used-icons.txt and regenerate.
 *
 * ${wanted.length} icons.
 */
export const ICON_SVG = {
${entries}
} as const;
`;

writeFileSync(OUTPUT, output, "utf8");
console.log(
  `Wrote ${wanted.length} icons to ${OUTPUT.replace(repoRoot, ".")}`,
);
