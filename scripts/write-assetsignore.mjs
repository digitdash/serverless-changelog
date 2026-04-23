import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distDir = new URL("../dist/", import.meta.url);
const distPath = fileURLToPath(distDir);

await mkdir(distPath, { recursive: true });
await writeFile(join(distPath, ".assetsignore"), "_worker.js\n", "utf8");
