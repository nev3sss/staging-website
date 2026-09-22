import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/**", ".verify/**", "scripts/*.py"],
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
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
      "eqeqeq": ["error", "always"],
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
    },
  },
];
