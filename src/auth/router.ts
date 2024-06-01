import express from "express";
import passport from "passport";
import { signoutController, signupController } from "./controller.js";
import { absolutePath } from "../paths.js";

export const authRouter = express.Router();

authRouter.get("/", (req, res) => {
	console.log(req.query);
	if (!req.user) {
		const params = new URLSearchParams(req.query as Record<string, string>);
		return res.redirect(params ? `/login?${params}` : "/login");
	}
	res.sendFile(absolutePath("/views/index.html"));
});

authRouter.get("/login", (req, res) => {
	if (req.user) {
		return res.redirect("/");
	}
	res.sendFile(absolutePath("/views/login/login.html"));
});

authRouter.post("/login", (req, res, next) => {
	//@ts-expect-error
	passport.authenticate("local", (error, user, info) => {
		console.log(info);
		if (info?.message || !user || error) {
			return res.redirect(`/?error=${encodeURIComponent(info?.message || "something went wrong")}`);
		}
		req.logIn(user, (error) => {
			if (error) {
				return next(error);
			}
			return res.redirect("/");
		});
	})(req, res, next);
});

authRouter.post("/signup", signupController);

authRouter.post("/logout", signoutController);
