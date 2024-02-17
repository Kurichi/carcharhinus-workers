import { Hono } from "hono";
import { balance } from "./balance";

const api = new Hono();
api.use("*", (c, next) => {
	return next();
});
api.route("/balance", balance);

export default api;
