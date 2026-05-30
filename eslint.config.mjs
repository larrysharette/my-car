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
  ]),
  // TanStack Form's Field component uses `children` as an explicit render-prop prop.
  {
    files: ["components/**/*.tsx"],
    rules: {
      "react/no-children-prop": "off",
    },
  },
]);

export default eslintConfig;
