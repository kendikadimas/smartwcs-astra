// Satu-satunya file di luar folder adapter masing-masing yang boleh
// mengimpor vendor tertentu (lihat eslint.config.mjs, no-restricted-imports
// mengecualikan file ini). Modul lain minta adapter lewat registry.ts.
import { registerAdapter } from "./registry";
import { puduAdapter } from "./pudu";

registerAdapter(puduAdapter);

export {};
