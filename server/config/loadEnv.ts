import { config } from "dotenv"; // 直接读取.env
import path from "node:path";
import { fileURLToPath } from "node:url";
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
if (process.env.NODE_ENV !== "production") {
  config({
    path: path.resolve(dirname, "../.env.local"),
  });
}
