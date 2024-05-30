import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { dirname, join } from "node:path";
import fs from "node:fs/promises";
import { absolutePath } from "../utils.js";

export const provideDatabase = async () => {
	const dbPath = absolutePath("./database/users.db");
	console.log(dbPath);
	try {
		// Ensure the directory exists
		await fs.mkdir(dirname(dbPath), { recursive: true });

		const db = await open({
			filename: dbPath,
			driver: sqlite3.Database,
			mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
		});

		// Create the users table
		await db.exec(`
				CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					username TEXT NOT NULL UNIQUE,
					password TEXT NOT NULL,
					salt TEXT NOT NULL
				)
			`);

		console.log("Database initialized successfully.");
		return db;
	} catch (err) {
		console.error("Error initializing the database:", err.message);
		throw err; // Rethrow the error after logging it
	}
};
