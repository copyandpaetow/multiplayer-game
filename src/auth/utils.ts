import crypto from "node:crypto";

export const hashPassword = (password: string, salt: string) => {
	const hash = crypto.createHash("sha256");
	hash.update(password);
	hash.update(salt);
	return hash.digest("hex");
};

export const generateSalt = () => {
	return crypto.randomBytes(16).toString("hex");
};
