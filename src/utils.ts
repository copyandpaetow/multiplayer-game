import crypto from "node:crypto";
import { dirname, join } from "node:path";
import url from "node:url";

export const hashPassword = (password: string, salt: string) => {
	const hash = crypto.createHash("sha256");
	hash.update(password);
	hash.update(salt);
	return hash.digest("hex");
};

export const generateSalt = () => {
	return crypto.randomBytes(16).toString("hex");
};

export const __dirname = dirname(url.fileURLToPath(import.meta.url));
export const absolutePath = (relativePath: string) => join(__dirname, relativePath);
