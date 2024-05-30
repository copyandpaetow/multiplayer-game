import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

//@ts-expect-error
import { config } from "../config.ts";
import { provideDatabase } from "./database/database.js";
import { hashPassword, generateSalt, absolutePath, __dirname } from "./utils.js";

const app = express();
const port = config.port;

console.log(process.env.PORT);

const sessionMiddleware = session({
	secret: config.secret,
	resave: true,
	saveUninitialized: true,
});

app.use("/styles", express.static(__dirname + "/assets/css"));
app.use("/scripts", express.static(__dirname + "/assets/js"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

try {
	const db = await provideDatabase();

	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				const row = await db.get("SELECT salt FROM users WHERE username = ?", username);
				if (!row) return done(null, false);

				const hash = hashPassword(password, row.salt);
				const user = await db.get(
					"SELECT username, id FROM users WHERE username = ? AND password = ?",
					username,
					hash
				);
				if (!user) return done(null, false);

				return done(null, user);
			} catch (err) {
				return done(err);
			}
		})
	);

	passport.serializeUser((user, cb) => {
		console.log(`serializeUser ${user.id}`);
		cb(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		try {
			console.log("Deserializing user with id:", id); // Debug log

			const user = await db.get("SELECT id, username FROM users WHERE id = ?", [id]); // Pass id as an array element
			if (!user) {
				console.log("User not found"); // Debug log
				return done(null, false);
			}

			console.log("User found:", user); // Debug log
			return done(null, user);
		} catch (err) {
			console.error("Error deserializing user:", err); // Debug log
			return done(err);
		}
	});

	app.get("/", (req, res) => {
		if (!req.user) {
			return res.redirect("/login");
		}
		res.sendFile(absolutePath("/views/index.html"));
	});

	app.get("/login", (req, res) => {
		if (req.user) {
			return res.redirect("/");
		}
		res.sendFile(absolutePath("/views/login/login.html"));
	});

	app.post(
		"/login",
		passport.authenticate("local", {
			successRedirect: "/",
			failureRedirect: "/",
		})
	);

	app.post("/signup", async (req, res) => {
		const { username, password } = req.body;
		console.log(req.body);

		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}

		try {
			const existingUser = await db.get("SELECT username FROM users WHERE username = ?", username);
			if (existingUser) {
				return res.redirect("/login?error=Username%20already%20exists");
			}

			const salt = generateSalt();
			const hashedPassword = hashPassword(password, salt);

			const result = await db.run("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)", [
				username,
				hashedPassword,
				salt,
			]);

			console.log("New user ID:", result.lastID);

			req.login({ id: result.lastID, username }, (err) => {
				if (err) {
					console.error("Error creating user:", err.message);
				}
				return res.redirect("/");
			});
		} catch (err) {
			console.error("Error creating user:", err.message);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	app.post("/logout", (req, res, next) => {
		req.logout((err) => {
			if (err) {
				return next(err);
			}
			res.redirect("/");
		});
	});

	app.listen(port, () => {
		return console.log(`Express is listening at http://localhost:${port}`);
	});
} catch (error) {
	console.log(error);
}
