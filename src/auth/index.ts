import { zValidator } from "@hono/zod-validator";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { checkPassword, decode, hashPassword, sign, verify } from "../libs/jwt";
import { TOKEN_EXPIRATION } from "./constant";
import { createUser, getUser } from "./cruds";
import { CreateUserInput, LoginUserInput } from "./model";

export type AuthBinding = {
	Bindings: { DB: D1Database; JWT_SECRET: string };
};
const app = new Hono<AuthBinding>();

app.post("/signup", zValidator("json", CreateUserInput), async (c) => {
	const req = c.req.valid("json");

	const db = drizzle(c.env.DB);

	const res = await createUser({
		user: {
			...req,
			password_hash: await hashPassword(req.password),
		},
		db,
	});
	if (res.error === null) {
		return c.json({ id: res.data }, res.status);
	}
	return c.json({ error: res.error }, res.status);
});

app.post("/signin", zValidator("json", LoginUserInput), async (c) => {
	const req = c.req.valid("json");
	const db = drizzle(c.env.DB);

	const res = await getUser({
		user: {
			...req,
			password: await hashPassword(req.password),
		},
		db,
	});
	if (res.error !== null || res.data === null) {
		return c.json({ data: null }, res.status);
	}
	if (!(await checkPassword(req.password, res.data.password_hash))) {
		return c.json({ error: "Invalid password" }, 400);
	}
	const payload = {
		id: res.data.id,
		exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION,
	};
	const token = await sign(payload, c.env.JWT_SECRET);
	return c.json({ jwt: token, user: res.data }, res.status);
});

app.get("/decode", (c) => {
	const token = c.req.header("Authorization");
	if (token === undefined) {
		return c.json({ error: "No token" }, 400);
	}
	const decoded = decode(token);
	return c.json({ data: decoded }, 200);
});

app.get("/verify", async (c) => {
	const token = c.req.header("Authorization");
	if (token === undefined) {
		return c.json({ error: "No token" }, 400);
	}
	const decoded = await verify(token, c.env.JWT_SECRET);
	return c.json({ data: decoded }, 200);
});

export default app;
