import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/**", ".verify/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        document: true,
        window: true,
        FormData: true,
        fetch: true,
        console: true,
      },
    },
  },
];
