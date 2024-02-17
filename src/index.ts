import { sentry } from "@hono/sentry";
import { instrument } from "@microlabs/otel-cf-workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { jwt } from "./auth/middleware";
import { balance } from "./balance";
import { omikuji } from "./omikuji";
import { config } from "./otel";

type Env = {
	JWT_SECRET: string;
	SENTRY_DNS: string;
};

const app = new Hono<{ Bindings: Env }>();
app.use(
	"*",
	cors({
		origin: "*",
	}),
);
app.route("/", auth);
app.use("*", async (c, next) => {
	const sentryMiddleware = sentry({
		dsn: c.env.SENTRY_DNS,
		tracesSampleRate: 1.0,
	});
	return await sentryMiddleware(c, next);
});

const api = app.route("/api");
api.use("*", (c, next) => {
	const middleware = jwt(c.env.JWT_SECRET);
	return middleware(c, next);
});

api.route("/balance", balance);
api.route("/omikuji", omikuji);

export default instrument(app, config);

type Bindings = {
	KV: KVNamespace;
	DB: D1Database;
};

type Variables = {
	userId: string;
};
