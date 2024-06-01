import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { provideDatabase } from "./users-model.js";
import { hashPassword } from "./utils.js";

export const authMiddleware = async () => {
	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				const db = await provideDatabase();
				const row = await db.get("SELECT salt FROM users WHERE username = ?", username);
				if (!row) {
					db.close();
					return done(null, false, { message: "no user with that name" });
				}

				const hash = hashPassword(password, row.salt);
				const user = await db.get(
					"SELECT username, id FROM users WHERE username = ? AND password = ?",
					username,
					hash
				);
				db.close();
				if (!user) {
					return done(null, false, { message: "wrong password" });
				}

				return done(null, user);
			} catch (err) {
				return done(err);
			}
		})
	);

	passport.serializeUser((user, done) => {
		//@ts-expect-error
		console.log(`serializeUser ${user.id}`);
		//@ts-expect-error
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		try {
			const db = await provideDatabase();
			const user = await db.get("SELECT id, username FROM users WHERE id = ?", [id]);
			done(null, user);
		} catch (err) {
			done(err);
		}
	});
};
