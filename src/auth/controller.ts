import { NextFunction, Request, Response } from "express";
import { generateSalt, hashPassword } from "./utils.js";
import { provideDatabase } from "./users-model.js";

interface userData {
	username: string;
	password: string;
}

export const signupController = async (req: Request<userData>, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: "Username and password are required" });
	}

	try {
		const db = await provideDatabase();
		const existingUser = await db.get("SELECT username FROM users WHERE username = ?", username);
		if (existingUser) {
			db.close();
			return res.redirect("/login?error=Username%20already%20exists");
		}

		const salt = generateSalt();
		const hashedPassword = hashPassword(password, salt);

		const result = await db.run("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)", [
			username,
			hashedPassword,
			salt,
		]);
		db.close();
		console.log("New user ID:", result.lastID);

		req.login({ id: result.lastID, username }, (err) => {
			if (err) {
				console.error("Error creating user:", err.message);
			}
			return res.redirect("/");
		});
	} catch (err) {
		console.error("Error creating user:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const signoutController = (req: Request, res: Response, next: NextFunction) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
};
