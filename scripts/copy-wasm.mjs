import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
const dstDir = path.join(process.cwd(), "public");
const dst = path.join(dstDir, "sql-wasm.wasm");

try {
  fs.mkdirSync(dstDir, { recursive: true });
  fs.copyFileSync(src, dst);
  console.log(`✅ Copied sql-wasm.wasm -> public/sql-wasm.wasm`);
} catch (e) {
  console.warn("⚠️  Could not copy sql-wasm.wasm. Run `node scripts/copy-wasm.mjs` after install.");
  console.warn(String(e));
}
