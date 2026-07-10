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
  {
    files: ["app/**/*.tsx", "components/decision/**/*.tsx"],
    rules: {
      "react/forbid-elements": [
        "error",
        {
          "forbid": [
            { "element": "div", "message": "Use <Container>, <Stack>, or <Card> primitives instead." },
            { "element": "p", "message": "Use <Text> primitive instead." },
            { "element": "button", "message": "Use <Button> primitive instead." }
          ]
        }
      ]
    }
  },
  {
    files: ["core/**/*.ts", "core/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "react",
              "message": "Pure core logic cannot import React"
            },
            {
              "name": "next",
              "message": "Pure core logic cannot import Next.js"
            }
          ],
          "patterns": [
            {
              "group": ["next/*"],
              "message": "Pure core logic cannot import Next.js submodules"
            }
          ]
        }
      ]
    }
  }
]);

export default eslintConfig;
