import { cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
cpSync(join(projectRoot, "src", "views"), join(projectRoot, "dist", "src", "views"), { recursive: true });
