import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getOmikujis, insertOmikujiDraw } from "./cruds";
import { decideOmikuji } from "./utils";

type Bindings = {
	DB: D1Database;
};

type Variables = {
	userId: string;
};

export const omikuji = new Hono<{
	Bindings: Bindings;
	Variables: Variables;
}>();

omikuji.post("/", async (c) => {
	const db = drizzle(c.env.DB);
	const { data, error, status } = await getOmikujis(db);
	if (error !== null) {
		throw new HTTPException(status, { message: error });
	}
	if (data === null) {
		throw new HTTPException(500, {
			message: "Internal Server Error: data is null in getOmikujis",
		});
	}
	const omikujiId = decideOmikuji(data);
	if (omikujiId === null) {
		throw new HTTPException(500, {
			message: "Internal Server Error: id is null in decideOmikuji",
		});
	}

	const result = await insertOmikujiDraw(db, c.var.userId, omikujiId);
	if (result.error !== null) {
		throw new HTTPException(result.status, { message: result.error });
	}
	if (result.data !== "success") {
		throw new HTTPException(500, {
			message: "Internal Server Error: data is null in insertOmikujiDraw",
		});
	}

	return c.json({ result: omikujiId }, 200);
});
