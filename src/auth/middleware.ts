import { MiddlewareHandler } from "hono";
import { verify } from "../libs/jwt";

export const jwt = (secret: string): MiddlewareHandler => {
	return async (c, next) => {
		const token = c.req.header("Authorization");
		if (token === undefined) {
			return c.json({ error: "No token" }, 401);
		}
		const payload: { id: string; email: string } = await verify(token, secret);
		c.set("userId", payload.id);
		c.set("email", payload.email);

		return next();
	};
};
