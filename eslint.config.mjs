import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // Data-fetching effects synchronize React state with the external CRM API.
      // State is only updated after awaited network responses (never synchronously
      // during render), so the experimental set-state-in-effect rule is disabled
      // for this API-driven codebase; all other React hooks rules remain enabled.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
