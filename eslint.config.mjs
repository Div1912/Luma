import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

const config = tseslint.config(
  {
    ignores: [
      "eslint.config.mjs",
      "src/managed/**",
      "managed/**",
      "bboard/**",
      "ghost-contract/**",
      "dist/**",
      ".next/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "src-vite-old/**",
      "tests/**",
      "*.config.*",
      "*.cjs",
      "*.mjs",
      "*.js"
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactPlugin.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      "managed/**",
      "bboard/**",
      "dist/**",
      ".next/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "src-vite-old/**",
      "tests/**"
    ],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": "off",
      "react/no-unescaped-entities": "off",
      "react/jsx-no-comment-textnodes": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "prettier/prettier": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-misused-promises": "off", // https://github.com/typescript-eslint/typescript-eslint/issues/5807
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/promise-function-async": "off",
      "@typescript-eslint/no-redeclare": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);

export default config;
