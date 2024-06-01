import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import passport from "passport";

//@ts-expect-error
import { config } from "../config.ts";
import { authRouter } from "./auth/router.js";
import { __dirname } from "./paths.js";
import { authMiddleware } from "./auth/middleware.js";

const app = express();
const port = config.port;

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

await authMiddleware();

app.use("/", authRouter);

//@ts-expect-error
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(err.status || 500);
	res.render("error", { message: err.message, error: err });
});

app.listen(port, () => {
	return console.log(`Express is listening at http://localhost:${port}`);
});
