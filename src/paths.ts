import { dirname, join } from "node:path";
import url from "node:url";

//*dirname results in the utils folder, so we need to move one up
export const __dirname = dirname(url.fileURLToPath(import.meta.url));

export const absolutePath = (relativePath: string) => join(__dirname, relativePath);
