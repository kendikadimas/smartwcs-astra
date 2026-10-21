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
  // Pagar impor: kode di luar src/modules/equipment-adapter/pudu/ harus
  // bicara lewat kontrak (contract.ts) + registri (registry.ts), tidak
  // boleh mengimpor pudu/ langsung. adapters.ts dikecualikan karena itu
  // satu-satunya tempat pendaftaran adapter boleh terjadi. File di dalam
  // pudu/ sendiri (termasuk test-nya) otomatis tidak terkena aturan ini
  // karena di luar jangkauan `files` di bawah.
  {
    files: ["src/**/*.{ts,tsx}", "worker.ts"],
    ignores: [
      "src/modules/equipment-adapter/pudu/**",
      "src/modules/equipment-adapter/adapters.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/equipment-adapter/pudu",
                "@/modules/equipment-adapter/pudu/*",
                "**/equipment-adapter/pudu",
                "**/equipment-adapter/pudu/*",
              ],
              message:
                "Jangan mengimpor dari equipment-adapter/pudu langsung. Akses lewat kontrak (src/modules/equipment-adapter/contract.ts) dan registri (src/modules/equipment-adapter/registry.ts) -- pendaftaran adapter cuma boleh lewat adapters.ts.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
