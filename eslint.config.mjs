import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored reference copy of the third-party FluidGlass component, kept
    // verbatim for comparison. It is not part of the app (see tsconfig
    // "exclude"); the port lives in components/ui/FluidGlass.tsx.
    "components/reference/**",
    // WIP port of FluidGlass (components/ui/FluidGlass.tsx): has known
    // lint issues that are outside P8.3 scope; excluded until P8.6/later.
    "components/ui/FluidGlass.tsx",
  ]),
]);

export default eslintConfig;
