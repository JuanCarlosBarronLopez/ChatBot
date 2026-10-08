/** Flat ESLint config. Next.js rules via eslint-config-next when available. */
import nextPlugin from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules/**", ".next/**", "coverage/**", "out/**"],
  },
  // eslint-config-next exports a legacy-style array; spread if compatible,
  // otherwise this file still passes as a minimal valid flat config.
  ...(Array.isArray(nextPlugin) ? nextPlugin : []),
];

export default config;
