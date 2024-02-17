import { trace } from "@opentelemetry/api";
import { asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { omikuji } from "../../scripts/schema";
import { MAX_PROBABILITY } from "./const";
import { getOmikujis } from "./cruds";
import { decideOmikuji } from "./utils";

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{
	Bindings: Bindings;
}>();

app.post("/draw", async (c) => {
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
	console.log(omikujiId);
	return c.json({ result: omikujiId }, 200);
});

export default app;
