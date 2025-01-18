import { rm } from "node:fs/promises";
import { $ } from "bun";
import { type BuildOptions, build } from "esbuild";

await rm("dist", { recursive: true, force: true });

const timeLabel = "Build time";
console.time(timeLabel);
console.log("Building...");

const esmOptions = {
  outdir: "dist/",
  format: "esm",
  mainFields: ["module", "main"],
  target: "es2019",
  sourcemap: true,
  conditions: ["import", "default", "require"],
  resolveExtensions: [".mjs", ".js", ".ts"],
} as const satisfies BuildOptions;

const cjsOptions = {
  outdir: "dist/",
  format: "cjs",
  mainFields: ["main", "module"],
  target: "es2019",
  sourcemap: true,
  conditions: ["require", "default", "import"],
  resolveExtensions: [".cjs", ".js", ".ts"],
  outExtension: { ".js": ".cjs" },
} as const satisfies BuildOptions;

await Promise.all([
  build({
    ...esmOptions,
    entryPoints: ["src/index.ts"],
  }),
  build({
    ...cjsOptions,
    entryPoints: ["src/index.ts"],
  }),
  build({
    ...esmOptions,
    entryPoints: ["src/ponyfill.ts"],
    format: "esm",
    bundle: true,
  }),
  build({
    ...cjsOptions,
    entryPoints: ["src/ponyfill.ts"],
    bundle: true,
  }),
  $`bun tsc --outDir dist/esm`,
  $`bun tsc --outDir dist/cjs --module commonjs --moduleResolution node10`,
]);

console.log("Built successfully!");
console.timeEnd(timeLabel);
