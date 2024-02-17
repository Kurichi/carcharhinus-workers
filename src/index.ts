import { instrument } from "@microlabs/otel-cf-workers";
import { Hono } from "hono";
import { auth } from "./auth";
import { jwt } from "./auth/middleware";
import { balance } from "./balance";
import { omikuji } from "./omikuji";
import { config } from "./otel";

type Env = {
	JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();
app.route("/", auth);

const api = app.route("/api");
api.use("*", (c, next) => {
	const middleware = jwt(c.env.JWT_SECRET);
	return middleware(c, next);
});

api.route("/balance", balance);
api.route("/omikuji", omikuji);

export default instrument(app, config);
